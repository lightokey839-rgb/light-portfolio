import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("LightSwapFactory", () => {
  async function deployFixture() {
    const [owner, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("LightTestToken");
    const tokenA = await Token.deploy("Token A", "TKA", ethers.parseEther("1000"));
    const tokenB = await Token.deploy("Token B", "TKB", ethers.parseEther("1000"));

    const Factory = await ethers.getContractFactory("LightSwapFactory");
    const factory = await Factory.deploy(owner.address);

    return { factory, tokenA, tokenB, owner, other };
  }

  it("starts with zero pairs", async () => {
    const { factory } = await loadFixture(deployFixture);
    expect(await factory.allPairsLength()).to.equal(0);
  });

  it("creates a pair and indexes it in both token directions", async () => {
    const { factory, tokenA, tokenB } = await loadFixture(deployFixture);
    const tokenAAddr = await tokenA.getAddress();
    const tokenBAddr = await tokenB.getAddress();

    await expect(factory.createPair(tokenAAddr, tokenBAddr)).to.emit(factory, "PairCreated");

    const pairFromAB = await factory.getPair(tokenAAddr, tokenBAddr);
    const pairFromBA = await factory.getPair(tokenBAddr, tokenAAddr);
    expect(pairFromAB).to.equal(pairFromBA);
    expect(pairFromAB).to.not.equal(ethers.ZeroAddress);
    expect(await factory.allPairsLength()).to.equal(1);
  });

  it("reverts when creating a pair that already exists, in either order", async () => {
    const { factory, tokenA, tokenB } = await loadFixture(deployFixture);
    const tokenAAddr = await tokenA.getAddress();
    const tokenBAddr = await tokenB.getAddress();

    await factory.createPair(tokenAAddr, tokenBAddr);
    await expect(factory.createPair(tokenAAddr, tokenBAddr)).to.be.revertedWithCustomError(
      factory,
      "PairExists"
    );
    await expect(factory.createPair(tokenBAddr, tokenAAddr)).to.be.revertedWithCustomError(
      factory,
      "PairExists"
    );
  });

  it("reverts when the two tokens are identical", async () => {
    const { factory, tokenA } = await loadFixture(deployFixture);
    const tokenAAddr = await tokenA.getAddress();
    await expect(factory.createPair(tokenAAddr, tokenAAddr)).to.be.revertedWithCustomError(
      factory,
      "IdenticalAddresses"
    );
  });

  it("reverts when one token is the zero address", async () => {
    const { factory, tokenA } = await loadFixture(deployFixture);
    await expect(
      factory.createPair(await tokenA.getAddress(), ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(factory, "ZeroAddress");
  });

  it("restricts setFeeTo and setFeeToSetter to the current feeToSetter", async () => {
    const { factory, other } = await loadFixture(deployFixture);
    await expect(factory.connect(other).setFeeTo(other.address)).to.be.revertedWithCustomError(
      factory,
      "Forbidden"
    );
    await expect(
      factory.connect(other).setFeeToSetter(other.address)
    ).to.be.revertedWithCustomError(factory, "Forbidden");
  });

  it("allows the current feeToSetter to hand off the role", async () => {
    const { factory, owner, other } = await loadFixture(deployFixture);
    await factory.connect(owner).setFeeToSetter(other.address);
    expect(await factory.feeToSetter()).to.equal(other.address);
    // old feeToSetter can no longer act
    await expect(factory.connect(owner).setFeeTo(owner.address)).to.be.revertedWithCustomError(
      factory,
      "Forbidden"
    );
  });
});
