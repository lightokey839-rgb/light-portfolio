// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Math
/// @notice Minimal math helpers used by the AMM. Isolated in its own library
/// so it can be unit-tested independently of pair state.
library Math {
    /// @notice Returns the smaller of two numbers.
    function min(uint256 x, uint256 y) internal pure returns (uint256) {
        return x < y ? x : y;
    }

    /// @notice Integer square root via the Babylonian method.
    /// @dev Used to derive the initial LP token supply as
    /// sqrt(amount0 * amount1), the standard constant-product approach
    /// (Uniswap V2) that makes the value of an LP share independent of the
    /// arbitrary ratio the first liquidity provider chose.
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
        // else z = 0 (default)
    }
}
