// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/// @title MockV3Aggregator
/// @notice A minimal, test-only stand-in for a real Chainlink aggregator.
/// Used exclusively by the Hardhat test suite (test/oracle/), since a
/// local/CI test network has no way to reach Chainlink's real
/// decentralized oracle network. NEVER deployed to Sepolia or any real
/// network — LightPriceConsumer and LightPriceSnapshotter are deployed
/// against Chainlink's own live feed address there (see
/// scripts/deploy-oracle.ts), not this mock.
contract MockV3Aggregator is AggregatorV3Interface {
    uint8 private immutable _decimals;
    int256 private _answer;
    uint256 private _updatedAt;
    uint80 private _roundId;
    uint80 private _answeredInRound;

    constructor(uint8 decimals_, int256 initialAnswer) {
        _decimals = decimals_;
        _roundId = 1;
        _answeredInRound = 1;
        _answer = initialAnswer;
        _updatedAt = block.timestamp;
    }

    /// @notice Simulates a new oracle update, as Chainlink nodes would report on-chain.
    function updateAnswer(int256 newAnswer) external {
        _roundId++;
        _answeredInRound = _roundId;
        _answer = newAnswer;
        _updatedAt = block.timestamp;
    }

    /// @notice Lets tests simulate a stale price without needing to wait real time.
    function setUpdatedAt(uint256 updatedAt_) external {
        _updatedAt = updatedAt_;
    }

    /// @notice Lets tests simulate an incomplete/carried-over round —
    /// `answeredInRound` behind the current `roundId` — a scenario the
    /// real Chainlink network can produce but that a straightforward
    /// mock wouldn't otherwise reproduce.
    function setAnsweredInRound(uint80 answeredInRound_) external {
        _answeredInRound = answeredInRound_;
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function description() external pure override returns (string memory) {
        return "Mock Aggregator (test only — never deployed to a real network)";
    }

    function version() external pure override returns (uint256) {
        return 4;
    }

    function getRoundData(uint80 roundId_)
        external
        view
        override
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        return (roundId_, _answer, _updatedAt, _updatedAt, _answeredInRound);
    }

    function latestRoundData()
        external
        view
        override
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        return (_roundId, _answer, _updatedAt, _updatedAt, _answeredInRound);
    }
}
