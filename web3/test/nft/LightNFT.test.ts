import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("LightNFT", () => {
  async function deployFixture() {
    const [owner, minter, other] = await ethers.getSigners();
    const LightNFT = await ethers.getContractFactory("LightNFT");
    const nft = await LightNFT.deploy();
    return { nft, owner, minter, other };
  }

  it("mints sequential token IDs starting at 1", async () => {
    const { nft, minter } = await loadFixture(deployFixture);
    await expect(nft.connect(minter).mint()).to.not.be.reverted;
    expect(await nft.ownerOf(1)).to.equal(minter.address);
    await nft.connect(minter).mint();
    expect(await nft.ownerOf(2)).to.equal(minter.address);
    expect(await nft.totalSupply()).to.equal(2);
  });

  it("enforces MAX_PER_WALLET", async () => {
    const { nft, minter } = await loadFixture(deployFixture);
    const max = await nft.MAX_PER_WALLET();
    for (let i = 0; i < Number(max); i++) {
      await nft.connect(minter).mint();
    }
    await expect(nft.connect(minter).mint()).to.be.revertedWithCustomError(nft, "MaxPerWalletReached");
  });

  it("tracks mintedByWallet independently per address", async () => {
    const { nft, minter, other } = await loadFixture(deployFixture);
    await nft.connect(minter).mint();
    await nft.connect(minter).mint();
    await nft.connect(other).mint();
    expect(await nft.mintedByWallet(minter.address)).to.equal(2);
    expect(await nft.mintedByWallet(other.address)).to.equal(1);
  });

  it("reverts tokenURI for a token that doesn't exist", async () => {
    const { nft } = await loadFixture(deployFixture);
    await expect(nft.tokenURI(999)).to.be.reverted;
  });

  it("returns a valid base64 data URI containing an embedded SVG image", async () => {
    const { nft, minter } = await loadFixture(deployFixture);
    await nft.connect(minter).mint();
    const uri = await nft.tokenURI(1);
    expect(uri.startsWith("data:application/json;base64,")).to.equal(true);

    const json = Buffer.from(uri.split(",")[1], "base64").toString("utf-8");
    const metadata = JSON.parse(json);
    expect(metadata.name).to.equal("Light Demo #1");
    expect(metadata.image.startsWith("data:image/svg+xml;base64,")).to.equal(true);

    const svg = Buffer.from(metadata.image.split(",")[1], "base64").toString("utf-8");
    expect(svg.startsWith("<svg")).to.equal(true);
  });

  it("generates different images for different token IDs (deterministic, not identical)", async () => {
    const { nft, minter } = await loadFixture(deployFixture);
    await nft.connect(minter).mint();
    await nft.connect(minter).mint();
    const uri1 = await nft.tokenURI(1);
    const uri2 = await nft.tokenURI(2);
    expect(uri1).to.not.equal(uri2);
  });

  it("supports the standard ERC-721 transfer flow", async () => {
    const { nft, minter, other } = await loadFixture(deployFixture);
    await nft.connect(minter).mint();
    await nft.connect(minter).transferFrom(minter.address, other.address, 1);
    expect(await nft.ownerOf(1)).to.equal(other.address);
  });
});
