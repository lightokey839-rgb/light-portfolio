// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title LightNFTMarketplace
/// @notice A minimal, security-conscious NFT marketplace: list an
/// ERC-721 you own, cancel a listing, or buy a listed token. Payment uses
/// the pull-over-push pattern (proceeds accrue per seller and must be
/// withdrawn separately) rather than pushing ETH to the seller inside
/// `buyItem` — the standard mitigation for a malicious/broken seller
/// contract being able to block sales or reenter.
/// @dev Portfolio / demonstration implementation — see SECURITY.md and
/// web3/README.md for the full threat model and known limitations. Works
/// with any standards-compliant ERC-721, not just LightNFT.
contract LightNFTMarketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        uint256 price;
    }

    // nftContract => tokenId => Listing. price == 0 means "not listed".
    mapping(address => mapping(uint256 => Listing)) private _listings;
    // seller => withdrawable ETH balance from completed sales.
    mapping(address => uint256) private _proceeds;

    event ItemListed(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event ItemCanceled(address indexed seller, address indexed nftContract, uint256 indexed tokenId);
    event ItemBought(address indexed buyer, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event ProceedsWithdrawn(address indexed seller, uint256 amount);

    error PriceMustBeAboveZero();
    error NotTokenOwner();
    error AlreadyListed();
    error NotListed();
    error MarketplaceNotApproved();
    error PriceNotMet(uint256 required, uint256 sent);
    error ListingStale();
    error NoProceeds();
    error WithdrawalFailed();

    /// @notice List an ERC-721 you own for a fixed ETH price. Requires
    /// you to have already approved this contract (`approve` or
    /// `setApprovalForAll`) — the marketplace never takes custody of the
    /// token until it's actually sold, so a listed token can still be
    /// used/transferred elsewhere, at the cost of the listing going stale
    /// (see buyItem).
    function listItem(address nftContract, uint256 tokenId, uint256 price) external {
        if (price == 0) revert PriceMustBeAboveZero();
        IERC721 nft = IERC721(nftContract);
        if (nft.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (_listings[nftContract][tokenId].price > 0) revert AlreadyListed();
        if (nft.getApproved(tokenId) != address(this) && !nft.isApprovedForAll(msg.sender, address(this))) {
            revert MarketplaceNotApproved();
        }

        _listings[nftContract][tokenId] = Listing({seller: msg.sender, price: price});
        emit ItemListed(msg.sender, nftContract, tokenId, price);
    }

    /// @notice Cancel your own listing. No-op for anyone else's listing —
    /// reverts rather than silently doing nothing.
    function cancelListing(address nftContract, uint256 tokenId) external {
        Listing memory listing = _listings[nftContract][tokenId];
        if (listing.price == 0) revert NotListed();
        if (listing.seller != msg.sender) revert NotTokenOwner();

        delete _listings[nftContract][tokenId];
        emit ItemCanceled(msg.sender, nftContract, tokenId);
    }

    /// @notice Buy a listed token at its listed price. Excess ETH sent is
    /// NOT refunded — the frontend is responsible for sending the exact
    /// listed price (surfaced clearly in the UI); reverting on overpay
    /// would be more surprising than requiring exact payment for a fixed-
    /// price listing.
    function buyItem(address nftContract, uint256 tokenId) external payable nonReentrant {
        Listing memory listing = _listings[nftContract][tokenId];
        if (listing.price == 0) revert NotListed();
        if (msg.value < listing.price) revert PriceNotMet(listing.price, msg.value);

        // Defensive re-check: the seller could have transferred the token
        // away, or revoked approval, without cancelling the listing. Catch
        // that here with a clear error instead of letting safeTransferFrom
        // fail deep in the call with a generic ERC-721 revert.
        if (IERC721(nftContract).ownerOf(tokenId) != listing.seller) revert ListingStale();

        // Effects before interactions: clear the listing and credit
        // proceeds before making any external call.
        delete _listings[nftContract][tokenId];
        _proceeds[listing.seller] += listing.price;

        IERC721(nftContract).safeTransferFrom(listing.seller, msg.sender, tokenId);

        emit ItemBought(msg.sender, nftContract, tokenId, listing.price);
    }

    /// @notice Withdraw your accumulated sale proceeds. Separated from
    /// `buyItem` specifically so a seller who can't receive ETH (or who
    /// reverts on receipt) can never block a sale.
    function withdrawProceeds() external nonReentrant {
        uint256 amount = _proceeds[msg.sender];
        if (amount == 0) revert NoProceeds();

        _proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert WithdrawalFailed();

        emit ProceedsWithdrawn(msg.sender, amount);
    }

    function getListing(address nftContract, uint256 tokenId) external view returns (Listing memory) {
        return _listings[nftContract][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return _proceeds[seller];
    }
}
