// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LightSwapPair} from "./LightSwapPair.sol";
import {ILightSwapFactory} from "../interfaces/ILightSwapFactory.sol";

/// @title LightSwapFactory
/// @notice Deploys and indexes LightSwapPair pools, one per unique token pair.
/// @dev Pairs are deployed with plain `new` (not CREATE2). That trades away
/// counterfactual/deterministic pair addresses — a router optimization
/// Uniswap V2 uses to compute pair addresses off-chain without a call — for
/// simplicity and a smaller audit surface. `getPair` is the source of truth
/// here; nothing in this system relies on address prediction.
contract LightSwapFactory is ILightSwapFactory {
    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    error IdenticalAddresses();
    error ZeroAddress();
    error PairExists();
    error Forbidden();

    constructor(address feeToSetter_) {
        if (feeToSetter_ == address(0)) revert ZeroAddress();
        feeToSetter = feeToSetter_;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    /// @notice Create a pool for `tokenA`/`tokenB` if one doesn't exist yet.
    /// Tokens are sorted internally so createPair(A,B) and createPair(B,A)
    /// always resolve to the same pool.
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        if (tokenA == tokenB) revert IdenticalAddresses();
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        if (token0 == address(0)) revert ZeroAddress();
        if (getPair[token0][token1] != address(0)) revert PairExists();

        pair = address(new LightSwapPair(token0, token1));

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate both directions for O(1) lookup either way
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    /// @notice Designates an address to receive the protocol fee share, once
    /// a protocol fee switch is activated. Currently unused by
    /// LightSwapPair — see "Known limitations" in web3/README.md.
    function setFeeTo(address feeTo_) external {
        if (msg.sender != feeToSetter) revert Forbidden();
        feeTo = feeTo_;
    }

    function setFeeToSetter(address feeToSetter_) external {
        if (msg.sender != feeToSetter) revert Forbidden();
        if (feeToSetter_ == address(0)) revert ZeroAddress();
        feeToSetter = feeToSetter_;
    }
}
