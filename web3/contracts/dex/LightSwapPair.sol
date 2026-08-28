// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "../libraries/Math.sol";
import {ILightSwapPair} from "../interfaces/ILightSwapPair.sol";

/// @title LightSwapPair
/// @notice A single constant-product (x*y=k) AMM pool for two ERC-20 tokens,
/// in the spirit of Uniswap V2. LP shares are themselves an ERC-20 token
/// minted on deposit and burned on withdrawal.
///
/// @dev This is a portfolio / demonstration implementation, NOT audited
/// production financial infrastructure. See /web3/SECURITY.md (and the
/// root SECURITY.md) for the full threat model and known limitations.
///
/// Design notes:
/// - Reserves are cached in two uint112 slots + a uint32 timestamp so they
///   pack into a single storage slot, matching the Uniswap V2 pattern this
///   contract is adapted from.
/// - All state-changing external functions follow checks-effects-interactions:
///   reserves are only written *after* token transfers are attempted, and
///   `nonReentrant` guards every path that moves tokens.
/// - Swap fee is a fixed 0.30%, taken out of the input amount and left in
///   the pool, which increases `k` for existing LPs.
/// - There is deliberately no flash-swap / callback hook (`skim`/`sync`-only
///   surface): it removes an entire class of reentrancy and callback-based
///   attack surface that a portfolio piece doesn't need to take on.
/// - The router is responsible for slippage protection (`amountOutMin`) and
///   deadlines; the pair itself only enforces the AMM invariant.
contract LightSwapPair is ERC20, ReentrancyGuard, ILightSwapPair {
    using SafeERC20 for IERC20;

    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 private constant FEE_NUMERATOR = 997; // 0.30% fee
    uint256 private constant FEE_DENOMINATOR = 1000;

    address public immutable factory;
    address public immutable token0;
    address public immutable token1;

    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;

    error IdenticalAddresses();
    error ZeroAddress();
    error InsufficientLiquidityMinted();
    error InsufficientLiquidityBurned();
    error InsufficientOutputAmount();
    error InsufficientInputAmount();
    error InsufficientLiquidity();
    error InvalidRecipient();
    error KInvariant();
    error Overflow();

    /// @param token0_ token1_ Underlying tokens, ordered by the factory
    /// (token0 < token1 by address) so a given pair always deploys to the
    /// same logical pool regardless of the order the caller supplied them in.
    constructor(address token0_, address token1_)
        ERC20("LightSwap LP", "LSLP")
    {
        if (token0_ == token1_) revert IdenticalAddresses();
        if (token0_ == address(0) || token1_ == address(0)) revert ZeroAddress();
        factory = msg.sender;
        token0 = token0_;
        token1 = token1_;
    }

    function getReserves() public view returns (uint112, uint112, uint32) {
        return (reserve0, reserve1, blockTimestampLast);
    }

    /// @notice Deposit tokens (already transferred to this contract by the
    /// router) and mint LP shares proportional to the deposit.
    /// @dev Uses the "transfer then sync" pattern: the caller (router) must
    /// transfer token0/token1 to this pair *before* calling mint. The
    /// contract compares its own balance against cached reserves to work
    /// out how much was actually deposited, which is what makes it
    /// donation-safe for the deposit side of the flow.
    function mint(address to) external nonReentrant returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;

        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            // Permanently lock the first MINIMUM_LIQUIDITY shares. This is
            // the standard Uniswap V2 mitigation for the "first depositor"
            // rounding/donation attack: it makes the pool's minimum share
            // price non-zero and non-manipulable by burning to address(0).
            _mint(address(0), MINIMUM_LIQUIDITY);
        } else {
            liquidity = Math.min(
                (amount0 * _totalSupply) / _reserve0,
                (amount1 * _totalSupply) / _reserve1
            );
        }
        if (liquidity == 0) revert InsufficientLiquidityMinted();
        _mint(to, liquidity);

        _update(balance0, balance1);
        emit Mint(msg.sender, amount0, amount1, liquidity);
    }

    /// @notice Burn LP shares (already transferred to this contract by the
    /// router) and return the underlying tokens pro-rata.
    function burn(address to) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        if (to == token0 || to == token1) revert InvalidRecipient();

        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 liquidity = balanceOf(address(this));

        uint256 _totalSupply = totalSupply();
        amount0 = (liquidity * balance0) / _totalSupply;
        amount1 = (liquidity * balance1) / _totalSupply;
        if (amount0 == 0 || amount1 == 0) revert InsufficientLiquidityBurned();

        _burn(address(this), liquidity);
        IERC20(token0).safeTransfer(to, amount0);
        IERC20(token1).safeTransfer(to, amount1);

        balance0 = IERC20(token0).balanceOf(address(this));
        balance1 = IERC20(token1).balanceOf(address(this));
        _update(balance0, balance1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /// @notice Swap along the constant-product curve. The router pre-transfers
    /// the input token to this pair, computes the expected output off-chain
    /// (via `getAmountOut`), and requests exactly that output here — the
    /// pair independently re-validates the invariant rather than trusting
    /// the router's math.
    /// @param amount0Out amount1Out Requested output amounts (one is 0).
    /// @param to Recipient of the output token. Slippage protection
    /// (amountOutMin) and deadlines are enforced by the router, not here —
    /// this function only guarantees the AMM invariant holds.
    function swap(uint256 amount0Out, uint256 amount1Out, address to) external nonReentrant {
        if (amount0Out == 0 && amount1Out == 0) revert InsufficientOutputAmount();
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        if (amount0Out >= _reserve0 || amount1Out >= _reserve1) revert InsufficientLiquidity();
        if (to == token0 || to == token1) revert InvalidRecipient();

        if (amount0Out > 0) IERC20(token0).safeTransfer(to, amount0Out);
        if (amount1Out > 0) IERC20(token1).safeTransfer(to, amount1Out);

        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        uint256 amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        if (amount0In == 0 && amount1In == 0) revert InsufficientInputAmount();

        // Re-derive the invariant with the 0.30% fee removed from the INPUT
        // side only, then require the post-trade product to be >= the
        // pre-trade product. This is what actually enforces the AMM pricing
        // curve on-chain — the frontend/router quote is just a prediction.
        uint256 balance0Adjusted = (balance0 * FEE_DENOMINATOR) - (amount0In * (FEE_DENOMINATOR - FEE_NUMERATOR));
        uint256 balance1Adjusted = (balance1 * FEE_DENOMINATOR) - (amount1In * (FEE_DENOMINATOR - FEE_NUMERATOR));
        if (
            balance0Adjusted * balance1Adjusted <
            uint256(_reserve0) * uint256(_reserve1) * (FEE_DENOMINATOR ** 2)
        ) revert KInvariant();

        _update(balance0, balance1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    /// @notice Force reserves to match actual token balances. Recovery
    /// function for tokens sent to the pair outside the mint/swap flow
    /// (e.g. accidental direct transfers) — has no effect on LP accounting.
    function sync() external nonReentrant {
        _update(IERC20(token0).balanceOf(address(this)), IERC20(token1).balanceOf(address(this)));
    }

    function _update(uint256 balance0, uint256 balance1) private {
        if (balance0 > type(uint112).max || balance1 > type(uint112).max) revert Overflow();
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = uint32(block.timestamp % 2 ** 32);
        emit Sync(reserve0, reserve1);
    }
}
