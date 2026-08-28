// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/// @title LightGovernanceToken
/// @notice The voting token for LightGovernor. Built on OpenZeppelin's
/// ERC20Votes, which checkpoints balances so voting power at a past block
/// can be read without letting anyone increase their power retroactively
/// (the standard flash-loan-voting mitigation — see SECURITY.md).
/// @dev Voting power is NOT automatic on receiving tokens — ERC20Votes
/// requires an explicit `delegate()` call (typically to yourself) before
/// a balance counts as voting power. This is intentional upstream
/// behavior, not a bug; the frontend surfaces a "delegate to activate
/// voting power" step for exactly this reason.
contract LightGovernanceToken is ERC20, ERC20Permit, ERC20Votes {
    uint256 public constant FAUCET_AMOUNT = 100 ether;
    uint256 public constant FAUCET_COOLDOWN = 1 hours;

    mapping(address => uint256) public lastFaucetClaim;

    error FaucetCooldownActive(uint256 availableAt);

    constructor() ERC20("Light Governance", "LGOV") ERC20Permit("Light Governance") {
        _mint(msg.sender, 1_000_000 ether);
    }

    /// @notice Mint FAUCET_AMOUNT to the caller, rate-limited. Note this
    /// means total supply — and therefore the quorum threshold, which is
    /// a percentage of total supply — grows as people use the faucet. A
    /// deliberate, documented demo quirk (see "Known limitations" in
    /// web3/README.md): production governance tokens typically have a
    /// fixed or separately-governed supply.
    function faucet() external {
        uint256 availableAt = lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN;
        if (block.timestamp < availableAt) revert FaucetCooldownActive(availableAt);
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    // --- Required overrides for multiple inheritance (OpenZeppelin v5 pattern) ---

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
