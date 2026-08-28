// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title LightTestToken
/// @notice A plain ERC-20 with a public, rate-limited faucet, used as the
/// two demo assets (e.g. "Light USD" / "Light DAI") for the LightSwap DEX
/// on testnet. Explicitly NOT meant to represent real value — see the
/// `DEMONSTRATION TOKEN` note surfaced in the frontend wherever balances of
/// this token are shown.
/// @dev The faucet is intentionally simple (fixed amount, fixed cooldown,
/// no allowlist) since the only thing at stake on a testnet is free faucet
/// ETH gas from whoever calls it — there's no real value to protect.
contract LightTestToken is ERC20 {
    uint256 public immutable faucetAmount;
    uint256 public constant FAUCET_COOLDOWN = 1 hours;

    mapping(address => uint256) public lastFaucetClaim;

    error FaucetCooldownActive(uint256 availableAt);

    constructor(string memory name_, string memory symbol_, uint256 faucetAmount_) ERC20(name_, symbol_) {
        faucetAmount = faucetAmount_;
        // Seed the deployer so local/test scripts have liquidity to work with
        // immediately, without needing a separate faucet call.
        _mint(msg.sender, faucetAmount_ * 1000);
    }

    /// @notice Mint `faucetAmount` tokens to the caller, at most once per
    /// FAUCET_COOLDOWN. This is what lets a portfolio visitor try the DEX on
    /// Sepolia without already holding the demo tokens.
    function faucet() external {
        uint256 availableAt = lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN;
        if (block.timestamp < availableAt) revert FaucetCooldownActive(availableAt);
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, faucetAmount);
    }
}
