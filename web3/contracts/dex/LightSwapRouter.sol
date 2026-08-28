// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILightSwapFactory} from "../interfaces/ILightSwapFactory.sol";
import {ILightSwapPair} from "../interfaces/ILightSwapPair.sol";

/// @title LightSwapRouter
/// @notice The contract the frontend actually calls. Wraps pair-level
/// mint/burn/swap with the user-facing safety features that individual
/// pairs deliberately don't implement themselves: slippage protection
/// (amountMin), transaction deadlines, optimal liquidity-ratio math, and
/// multi-hop swap routing.
/// @dev The router never custodies funds between calls — every function
/// pulls tokens from msg.sender with transferFrom (requires prior ERC-20
/// `approve`) and pushes results straight to `to`. There is nothing for a
/// reentrant call to steal because the router holds no persistent balance.
contract LightSwapRouter {
    using SafeERC20 for IERC20;

    ILightSwapFactory public immutable factory;

    error Expired();
    error InsufficientAAmount();
    error InsufficientBAmount();
    error InsufficientOutputAmount();
    error ExcessiveInputAmount();
    error InvalidPath();
    error InsufficientAmount();
    error InsufficientLiquidity();
    error PairNotFound();

    modifier ensure(uint256 deadline) {
        if (block.timestamp > deadline) revert Expired();
        _;
    }

    constructor(address factory_) {
        factory = ILightSwapFactory(factory_);
    }

    // ---------------------------------------------------------------------
    // Liquidity
    // ---------------------------------------------------------------------

    /// @notice Add liquidity to the tokenA/tokenB pool, creating it first if
    /// it doesn't exist yet. Deposits at the pool's current ratio (or, for a
    /// fresh pool, at exactly the desired amounts) and refunds nothing —
    /// callers should compute *Min values with their own slippage tolerance
    /// applied off-chain before calling.
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        address pair = factory.getPair(tokenA, tokenB);
        if (pair == address(0)) {
            pair = factory.createPair(tokenA, tokenB);
        }

        (amountA, amountB) = _computeLiquidityAmounts(
            pair, tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin
        );

        IERC20(tokenA).safeTransferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, pair, amountB);
        liquidity = ILightSwapPair(pair).mint(to);
    }

    /// @notice Burn LP shares and withdraw the underlying tokens.
    /// @dev Requires the caller to have approved the router to pull
    /// `liquidity` LP tokens beforehand (the pair is itself an ERC-20).
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        address pair = factory.getPair(tokenA, tokenB);
        if (pair == address(0)) revert PairNotFound();

        IERC20(pair).safeTransferFrom(msg.sender, pair, liquidity);
        (uint256 amount0, uint256 amount1) = ILightSwapPair(pair).burn(to);
        (address token0,) = _sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);

        if (amountA < amountAMin) revert InsufficientAAmount();
        if (amountB < amountBMin) revert InsufficientBAmount();
    }

    // ---------------------------------------------------------------------
    // Swaps
    // ---------------------------------------------------------------------

    /// @notice Swap an exact input amount for as much output as the path
    /// allows, reverting if the final output is below `amountOutMin`. This
    /// is the router-level slippage guard — the pair contract itself has no
    /// concept of a minimum acceptable output.
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = getAmountsOut(amountIn, path);
        if (amounts[amounts.length - 1] < amountOutMin) revert InsufficientOutputAmount();

        IERC20(path[0]).safeTransferFrom(msg.sender, factory.getPair(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    /// @notice Swap as little input as possible for an exact output amount,
    /// reverting if that would require more than `amountInMax`.
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = getAmountsIn(amountOut, path);
        if (amounts[0] > amountInMax) revert ExcessiveInputAmount();

        IERC20(path[0]).safeTransferFrom(msg.sender, factory.getPair(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    function _swap(uint256[] memory amounts, address[] memory path, address _to) private {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = _sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) =
                input == token0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
            address to = i < path.length - 2 ? factory.getPair(output, path[i + 2]) : _to;
            ILightSwapPair(factory.getPair(input, output)).swap(amount0Out, amount1Out, to);
        }
    }

    // ---------------------------------------------------------------------
    // Pricing (pure math, mirrored off-chain by the frontend for quotes)
    // ---------------------------------------------------------------------

    /// @notice Given an input amount and a pair's reserves, returns the
    /// equivalent output amount net of the 0.30% pool fee. This is the same
    /// formula LightSwapPair.swap enforces on-chain; the frontend calls the
    /// view version of this to preview a trade before the user signs.
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        public
        pure
        returns (uint256 amountOut)
    {
        if (amountIn == 0) revert InsufficientAmount();
        if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /// @notice Inverse of getAmountOut: the input required to receive an
    /// exact output amount.
    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut)
        public
        pure
        returns (uint256 amountIn)
    {
        if (amountOut == 0) revert InsufficientAmount();
        if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();
        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        amountIn = (numerator / denominator) + 1;
    }

    function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts) {
        if (path.length < 2) revert InvalidPath();
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = _getReserves(path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    function getAmountsIn(uint256 amountOut, address[] memory path) public view returns (uint256[] memory amounts) {
        if (path.length < 2) revert InvalidPath();
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint256 i = path.length - 1; i > 0; i--) {
            (uint256 reserveIn, uint256 reserveOut) = _getReserves(path[i - 1], path[i]);
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }

    /// @dev Computes the amounts to actually deposit for addLiquidity: on a
    /// fresh (empty) pool, exactly the desired amounts; on an existing pool,
    /// whichever side needs scaling down to match the pool's current ratio,
    /// bounded by the caller's *Min slippage tolerance.
    function _computeLiquidityAmounts(
        address pair,
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) private view returns (uint256 amountA, uint256 amountB) {
        (uint256 reserveA, uint256 reserveB) = _getReservesForPair(pair, tokenA, tokenB);

        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
            if (amountBOptimal <= amountBDesired) {
                if (amountBOptimal < amountBMin) revert InsufficientBAmount();
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = (amountBDesired * reserveA) / reserveB;
                // amountAOptimal <= amountADesired is guaranteed by the branch above
                if (amountAOptimal < amountAMin) revert InsufficientAAmount();
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function _getReserves(address tokenA, address tokenB) private view returns (uint256 reserveA, uint256 reserveB) {
        address pair = factory.getPair(tokenA, tokenB);
        if (pair == address(0)) revert PairNotFound();
        return _getReservesForPair(pair, tokenA, tokenB);
    }

    function _getReservesForPair(address pair, address tokenA, address tokenB)
        private
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        if (pair == address(0)) return (0, 0);
        (address token0,) = _sortTokens(tokenA, tokenB);
        (uint112 reserve0, uint112 reserve1,) = ILightSwapPair(pair).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (uint256(reserve0), uint256(reserve1)) : (uint256(reserve1), uint256(reserve0));
    }

    function _sortTokens(address tokenA, address tokenB) private pure returns (address token0, address token1) {
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }
}
