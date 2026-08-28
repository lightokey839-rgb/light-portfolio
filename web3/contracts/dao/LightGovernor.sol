// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/// @title LightGovernor
/// @notice Standard OpenZeppelin Governor composition: token-weighted
/// voting (GovernorVotes), simple for/against/abstain counting
/// (GovernorCountingSimple), a percentage-of-supply quorum
/// (GovernorVotesQuorumFraction), and timelock-controlled execution
/// (GovernorTimelockControl) — no custom voting or counting logic of my
/// own. Governance is exactly the domain where "established primitive
/// over bespoke implementation" matters most: this composition is the
/// same one OpenZeppelin's own Governor wizard produces, audited as part
/// of the OpenZeppelin Contracts library.
/// @dev All the parameters below (voting delay/period, quorum fraction,
/// proposal threshold, timelock delay set at deployment) are demo-scaled
/// for a testnet portfolio piece meant to be walked through in one
/// sitting — see "Known limitations" in web3/README.md for the specific
/// production-vs-demo tradeoffs each one represents.
contract LightGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(IVotes token, TimelockController timelock)
        Governor("LightGovernor")
        GovernorSettings(
            1, /* votingDelay: blocks before voting opens */
            300, /* votingPeriod: blocks voting stays open (~1 hour on Sepolia) */
            0 /* proposalThreshold: min voting power to propose — 0 for demo accessibility */
        )
        GovernorVotes(token)
        GovernorVotesQuorumFraction(4) // 4% of total supply must vote for a proposal to be valid
        GovernorTimelockControl(timelock)
    {}

    // --- The following are boilerplate overrides Solidity requires when a
    // contract inherits the same function from multiple parents. None of
    // them contain custom logic — each just resolves to the correct
    // parent implementation via `super`. ---

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (bool) {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
}
