// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

/// @title LightPriceSnapshotter
/// @notice Demonstrates Chainlink Automation alongside Data Feeds: a
/// contract implementing checkUpkeep/performUpkeep so the Chainlink
/// Automation network can call it on a schedule to record validated
/// price snapshots on-chain, with no human needing to remember to.
/// @dev Implements AutomationCompatibleInterface correctly and can be
/// registered with Chainlink Automation (at automation.chain.link, funded
/// with LINK) once deployed — that registration is an external step this
/// environment cannot perform, the same category as needing a funded
/// deployer key for a deployment. Until registered, `performUpkeep` is
/// still a plain external function anyone can call manually; the only
/// thing Automation registration adds is *automatic, scheduled* calls.
contract LightPriceSnapshotter is AutomationCompatibleInterface {
    AggregatorV3Interface public immutable priceFeed;
    uint256 public immutable interval;
    uint256 public constant MAX_STALENESS = 24 hours;
    uint256 public constant MAX_HISTORY = 50;

    struct Snapshot {
        int256 price;
        uint256 timestamp;
    }

    Snapshot[] private _history;
    uint256 public lastSnapshotAt;

    error TooEarly();
    error InvalidPrice(int256 answer);
    error StalePrice(uint256 updatedAt, uint256 nowTimestamp);

    event SnapshotTaken(int256 price, uint256 timestamp);

    constructor(address feedAddress, uint256 interval_) {
        priceFeed = AggregatorV3Interface(feedAddress);
        interval = interval_;
    }

    /// @notice Called off-chain by the Chainlink Automation network
    /// (simulated, not a real transaction) on every block to decide
    /// whether performUpkeep should run. Kept intentionally cheap — the
    /// actual price validation happens in performUpkeep, not here.
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = block.timestamp >= lastSnapshotAt + interval;
        performData = "";
    }

    /// @notice Records a new validated price snapshot. Re-checks the
    /// interval and re-validates the price itself rather than trusting
    /// checkUpkeep's result — performUpkeep must never assume checkUpkeep
    /// was actually called, since anyone can call performUpkeep directly.
    function performUpkeep(bytes calldata) external override {
        if (block.timestamp < lastSnapshotAt + interval) revert TooEarly();

        (, int256 answer,, uint256 updatedAt,) = priceFeed.latestRoundData();
        if (answer <= 0) revert InvalidPrice(answer);
        if (block.timestamp > updatedAt + MAX_STALENESS) revert StalePrice(updatedAt, block.timestamp);

        if (_history.length >= MAX_HISTORY) {
            // Bounded storage: shift out the oldest entry instead of
            // growing forever, so reads/writes never get progressively
            // more expensive the longer this contract runs.
            for (uint256 i = 0; i < _history.length - 1; i++) {
                _history[i] = _history[i + 1];
            }
            _history.pop();
        }
        _history.push(Snapshot({price: answer, timestamp: block.timestamp}));
        lastSnapshotAt = block.timestamp;

        emit SnapshotTaken(answer, block.timestamp);
    }

    function historyLength() external view returns (uint256) {
        return _history.length;
    }

    function snapshotAt(uint256 index) external view returns (Snapshot memory) {
        return _history[index];
    }

    function latestSnapshot() external view returns (Snapshot memory) {
        require(_history.length > 0, "no snapshots yet");
        return _history[_history.length - 1];
    }
}
