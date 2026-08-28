// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/// @title LightPriceConsumer
/// @notice Reads a real, already-live Chainlink Data Feed and applies the
/// validation a production consumer needs before trusting the result —
/// this contract does not deploy or operate an oracle; it consumes one
/// that already exists on Sepolia, and never substitutes a mock or
/// hardcoded price while presenting it as oracle data.
/// @dev Constructor takes the feed address as a parameter rather than
/// hardcoding it, so the same contract works for any Chainlink feed
/// (ETH/USD, BTC/USD, etc.) — the deploy script passes Chainlink's real
/// Sepolia ETH/USD feed address (0x694AA1769357215DE4FAC081bf1f309aDC325306,
/// per https://docs.chain.link/data-feeds/price-feeds/addresses).
contract LightPriceConsumer {
    AggregatorV3Interface public immutable priceFeed;

    /// @notice Maximum age (seconds) a price is trusted before this
    /// contract treats it as stale and reverts. A deliberately
    /// conservative, fixed value for a demo consumer — see "Known
    /// limitations" in web3/README.md: a production consumer should look
    /// up the specific feed's actual heartbeat (shown per-feed on
    /// Chainlink's Price Feed Addresses page) rather than use one fixed
    /// threshold for every feed.
    uint256 public constant MAX_STALENESS = 24 hours;

    struct ValidatedPrice {
        int256 price;
        uint8 decimals;
        uint256 updatedAt;
        uint80 roundId;
    }

    error InvalidPrice(int256 answer);
    error IncompleteRound(uint80 roundId, uint80 answeredInRound);
    error StalePrice(uint256 updatedAt, uint256 nowTimestamp);

    constructor(address feedAddress) {
        priceFeed = AggregatorV3Interface(feedAddress);
    }

    /// @notice Returns the latest price only after it passes every check
    /// below — reverts rather than silently returning data a caller
    /// might trust without realizing it failed validation.
    /// @dev Validation order matters: invalid-answer and incomplete-round
    /// checks run before the staleness check, since a negative/incomplete
    /// answer is wrong regardless of how fresh it is.
    function getValidatedPrice() external view returns (ValidatedPrice memory) {
        (uint80 roundId, int256 answer,, uint256 updatedAt, uint80 answeredInRound) = priceFeed.latestRoundData();

        // A Chainlink price feed should never return <= 0 for a real
        // asset price; treat it as corrupt data rather than propagate it.
        if (answer <= 0) revert InvalidPrice(answer);

        // answeredInRound < roundId indicates the round is still being
        // carried over from a previous round — Chainlink's own guidance
        // notes this check has known limitations as a staleness signal on
        // its own (see "Known limitations" in web3/README.md), so it's
        // used here as a secondary sanity check, not the primary defense.
        if (answeredInRound < roundId) revert IncompleteRound(roundId, answeredInRound);

        // Primary staleness defense: compare against wall-clock time
        // rather than subtracting (block.timestamp - updatedAt), which
        // would underflow if updatedAt were ever in the future.
        if (block.timestamp > updatedAt + MAX_STALENESS) revert StalePrice(updatedAt, block.timestamp);

        return ValidatedPrice({price: answer, decimals: priceFeed.decimals(), updatedAt: updatedAt, roundId: roundId});
    }

    function decimals() external view returns (uint8) {
        return priceFeed.decimals();
    }

    function description() external view returns (string memory) {
        return priceFeed.description();
    }
}
