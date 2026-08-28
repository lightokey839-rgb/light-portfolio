// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title LightNFT
/// @notice A demonstration ERC-721 collection for the NFT marketplace
/// project. Every token's metadata — image included — is generated fully
/// on-chain as a base64 data URI, deterministically from its token ID.
/// @dev This is a deliberate design choice, not a shortcut: it means the
/// NFT is fully self-contained and verifiable on-chain with no dependency
/// on an off-chain metadata host or IPFS pin staying available — which
/// this project has no way to set up or guarantee from this environment.
/// Explicitly a demonstration collection with no real value.
contract LightNFT is ERC721 {
    uint256 public constant MAX_SUPPLY = 500;
    uint256 public constant MAX_PER_WALLET = 5;

    uint256 private _nextTokenId = 1;
    mapping(address => uint256) public mintedByWallet;

    error MaxSupplyReached();
    error MaxPerWalletReached();
    error NonexistentToken();

    constructor() ERC721("Light Demo Collection", "LIGHTNFT") {}

    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /// @notice Mints one token to the caller. Public and free (no ETH
    /// required) — this collection exists to demonstrate marketplace
    /// mechanics, not to be a real sale.
    function mint() external returns (uint256 tokenId) {
        if (_nextTokenId > MAX_SUPPLY) revert MaxSupplyReached();
        if (mintedByWallet[msg.sender] >= MAX_PER_WALLET) revert MaxPerWalletReached();

        tokenId = _nextTokenId++;
        mintedByWallet[msg.sender]++;
        _safeMint(msg.sender, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory svg = _generateSVG(tokenId);
        string memory json = string(
            abi.encodePacked(
                '{"name":"Light Demo #',
                Strings.toString(tokenId),
                '","description":"A demonstration NFT from the Light portfolio\'s marketplace project. ',
                "Generated fully on-chain; no real value.\",",
                '"attributes":[{"trait_type":"Seed","value":"',
                Strings.toString(tokenId),
                '"}],',
                '"image":"data:image/svg+xml;base64,',
                Base64.encode(bytes(svg)),
                '"}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    /// @dev Deterministic, gas-cheap generative art: a few overlapping
    /// circles whose position/hue derive from `keccak256(tokenId)`. Not
    /// meant to be visually sophisticated — meant to prove the metadata
    /// pipeline is real and on-chain, end to end.
    function _generateSVG(uint256 tokenId) private pure returns (string memory) {
        bytes32 seed = keccak256(abi.encodePacked(tokenId));
        uint256 hue = uint256(uint8(seed[0])) * 360 / 255;
        uint256 cx = 60 + (uint256(uint8(seed[1])) % 180);
        uint256 cy = 60 + (uint256(uint8(seed[2])) % 180);
        uint256 r = 40 + (uint256(uint8(seed[3])) % 60);

        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">',
                '<rect width="300" height="300" fill="hsl(',
                Strings.toString(hue),
                ',20%,8%)"/>',
                '<circle cx="',
                Strings.toString(cx),
                '" cy="',
                Strings.toString(cy),
                '" r="',
                Strings.toString(r),
                '" fill="hsl(',
                Strings.toString(hue),
                ',70%,55%)" opacity="0.85"/>',
                '<circle cx="',
                Strings.toString(300 - cx),
                '" cy="',
                Strings.toString(300 - cy),
                '" r="',
                Strings.toString(r / 2),
                '" fill="hsl(',
                Strings.toString((hue + 40) % 360),
                ',70%,65%)" opacity="0.7"/>',
                "</svg>"
            )
        );
    }
}
