import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("LightNFTMarketplace", () => {
  async function deployFixture() {
    const [seller, buyer, stranger] = await ethers.getSigners();

    const LightNFT = await ethers.getContractFactory("LightNFT");
    const nft = await LightNFT.deploy();
    const nftAddr = await nft.getAddress();

    const Marketplace = await ethers.getContractFactory("LightNFTMarketplace");
    const marketplace = await Marketplace.deploy();
    const marketplaceAddr = await marketplace.getAddress();

    await nft.connect(seller).mint(); // tokenId 1, owned by seller

    return { nft, nftAddr, marketplace, marketplaceAddr, seller, buyer, stranger };
  }

  async function listedFixture() {
    const base = await deployFixture();
    const { nft, marketplace, marketplaceAddr, seller } = base;
    await nft.connect(seller).approve(marketplaceAddr, 1);
    const price = ethers.parseEther("0.05");
    await marketplace.connect(seller).listItem(await nft.getAddress(), 1, price);
    return { ...base, price };
  }

  describe("listItem", () => {
    it("reverts if price is zero", async () => {
      const { nft, nftAddr, marketplace, seller } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(await marketplace.getAddress(), 1);
      await expect(marketplace.connect(seller).listItem(nftAddr, 1, 0)).to.be.revertedWithCustomError(
        marketplace,
        "PriceMustBeAboveZero"
      );
    });

    it("reverts if caller doesn't own the token", async () => {
      const { nftAddr, marketplace, stranger } = await loadFixture(deployFixture);
      await expect(
        marketplace.connect(stranger).listItem(nftAddr, 1, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(marketplace, "NotTokenOwner");
    });

    it("reverts if the marketplace hasn't been approved", async () => {
      const { nftAddr, marketplace, seller } = await loadFixture(deployFixture);
      await expect(
        marketplace.connect(seller).listItem(nftAddr, 1, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(marketplace, "MarketplaceNotApproved");
    });

    it("reverts on a duplicate listing", async () => {
      const { nft, nftAddr, marketplace, marketplaceAddr, seller, price } = await loadFixture(listedFixture);
      await expect(marketplace.connect(seller).listItem(nftAddr, 1, price)).to.be.revertedWithCustomError(
        marketplace,
        "AlreadyListed"
      );
    });

    it("emits ItemListed and stores seller + price", async () => {
      const { nft, nftAddr, marketplace, marketplaceAddr, seller } = await loadFixture(deployFixture);
      await nft.connect(seller).approve(marketplaceAddr, 1);
      const price = ethers.parseEther("0.1");
      await expect(marketplace.connect(seller).listItem(nftAddr, 1, price))
        .to.emit(marketplace, "ItemListed")
        .withArgs(seller.address, nftAddr, 1, price);

      const listing = await marketplace.getListing(nftAddr, 1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(price);
    });

    it("also accepts setApprovalForAll instead of a per-token approve", async () => {
      const { nft, nftAddr, marketplace, marketplaceAddr, seller } = await loadFixture(deployFixture);
      await nft.connect(seller).setApprovalForAll(marketplaceAddr, true);
      await expect(marketplace.connect(seller).listItem(nftAddr, 1, ethers.parseEther("1"))).to.not.be.reverted;
    });
  });

  describe("cancelListing", () => {
    it("removes the listing and emits ItemCanceled", async () => {
      const { nftAddr, marketplace, seller } = await loadFixture(listedFixture);
      await expect(marketplace.connect(seller).cancelListing(nftAddr, 1))
        .to.emit(marketplace, "ItemCanceled")
        .withArgs(seller.address, nftAddr, 1);

      const listing = await marketplace.getListing(nftAddr, 1);
      expect(listing.price).to.equal(0);
    });

    it("reverts if called by someone other than the seller", async () => {
      const { nftAddr, marketplace, stranger } = await loadFixture(listedFixture);
      await expect(marketplace.connect(stranger).cancelListing(nftAddr, 1)).to.be.revertedWithCustomError(
        marketplace,
        "NotTokenOwner"
      );
    });

    it("reverts if the token isn't listed", async () => {
      const { nftAddr, marketplace, seller } = await loadFixture(deployFixture);
      await expect(marketplace.connect(seller).cancelListing(nftAddr, 1)).to.be.revertedWithCustomError(
        marketplace,
        "NotListed"
      );
    });
  });

  describe("buyItem", () => {
    it("transfers the NFT, credits seller proceeds, and emits ItemBought", async () => {
      const { nft, nftAddr, marketplace, buyer, seller, price } = await loadFixture(listedFixture);

      await expect(marketplace.connect(buyer).buyItem(nftAddr, 1, { value: price }))
        .to.emit(marketplace, "ItemBought")
        .withArgs(buyer.address, nftAddr, 1, price);

      expect(await nft.ownerOf(1)).to.equal(buyer.address);
      expect(await marketplace.getProceeds(seller.address)).to.equal(price);

      const listing = await marketplace.getListing(nftAddr, 1);
      expect(listing.price).to.equal(0); // listing cleared after sale
    });

    it("reverts if the token isn't listed", async () => {
      const { nftAddr, marketplace, buyer } = await loadFixture(deployFixture);
      await expect(
        marketplace.connect(buyer).buyItem(nftAddr, 1, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(marketplace, "NotListed");
    });

    it("reverts if payment is below the listed price", async () => {
      const { nftAddr, marketplace, buyer, price } = await loadFixture(listedFixture);
      await expect(
        marketplace.connect(buyer).buyItem(nftAddr, 1, { value: price - 1n })
      ).to.be.revertedWithCustomError(marketplace, "PriceNotMet");
    });

    it("accepts overpayment without refunding (exact-price UI responsibility)", async () => {
      const { nft, nftAddr, marketplace, buyer, price } = await loadFixture(listedFixture);
      await marketplace.connect(buyer).buyItem(nftAddr, 1, { value: price + ethers.parseEther("0.01") });
      expect(await nft.ownerOf(1)).to.equal(buyer.address);
    });

    it("reverts a stale listing where the seller transferred the token away without cancelling", async () => {
      const { nft, nftAddr, marketplace, seller, buyer, stranger, price } = await loadFixture(listedFixture);

      // Seller still owns approval-wise but transfers the NFT directly,
      // bypassing the marketplace, without cancelling the listing first.
      await nft.connect(seller).transferFrom(seller.address, stranger.address, 1);

      await expect(
        marketplace.connect(buyer).buyItem(nftAddr, 1, { value: price })
      ).to.be.revertedWithCustomError(marketplace, "ListingStale");
    });
  });

  describe("withdrawProceeds", () => {
    it("pays out the seller's accumulated proceeds and zeroes the balance", async () => {
      const { nftAddr, marketplace, seller, buyer, price } = await loadFixture(listedFixture);
      await marketplace.connect(buyer).buyItem(nftAddr, 1, { value: price });

      const balanceBefore = await ethers.provider.getBalance(seller.address);
      const tx = await marketplace.connect(seller).withdrawProceeds();
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(seller.address);
      expect(balanceAfter).to.equal(balanceBefore + price - gasCost);
      expect(await marketplace.getProceeds(seller.address)).to.equal(0);
    });

    it("reverts if the caller has no proceeds", async () => {
      const { marketplace, stranger } = await loadFixture(deployFixture);
      await expect(marketplace.connect(stranger).withdrawProceeds()).to.be.revertedWithCustomError(
        marketplace,
        "NoProceeds"
      );
    });

    it("emits ProceedsWithdrawn", async () => {
      const { nftAddr, marketplace, seller, buyer, price } = await loadFixture(listedFixture);
      await marketplace.connect(buyer).buyItem(nftAddr, 1, { value: price });
      await expect(marketplace.connect(seller).withdrawProceeds())
        .to.emit(marketplace, "ProceedsWithdrawn")
        .withArgs(seller.address, price);
    });
  });
});
