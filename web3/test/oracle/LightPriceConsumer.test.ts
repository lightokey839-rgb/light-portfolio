import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

const DECIMALS = 8;
const INITIAL_PRICE = 300_000_000_000n; // $3,000.00000000 at 8 decimals

describe("LightPriceConsumer", () => {
  async function deployFixture() {
    const Mock = await ethers.getContractFactory("MockV3Aggregator");
    const mock = await Mock.deploy(DECIMALS, INITIAL_PRICE);

    const Consumer = await ethers.getContractFactory("LightPriceConsumer");
    const consumer = await Consumer.deploy(await mock.getAddress());

    return { mock, consumer };
  }

  it("returns the current price, decimals, and round from the feed", async () => {
    const { consumer } = await loadFixture(deployFixture);
    const result = await consumer.getValidatedPrice();
    expect(result.price).to.equal(INITIAL_PRICE);
    expect(result.decimals).to.equal(DECIMALS);
    expect(result.roundId).to.equal(1);
  });

  it("reflects an updated price after the underlying feed updates", async () => {
    const { mock, consumer } = await loadFixture(deployFixture);
    await mock.updateAnswer(310_000_000_000n);
    const result = await consumer.getValidatedPrice();
    expect(result.price).to.equal(310_000_000_000n);
  });

  it("reverts with InvalidPrice on a zero or negative answer", async () => {
    const { mock, consumer } = await loadFixture(deployFixture);
    await mock.updateAnswer(0);
    await expect(consumer.getValidatedPrice()).to.be.revertedWithCustomError(consumer, "InvalidPrice");

    await mock.updateAnswer(-1);
    await expect(consumer.getValidatedPrice()).to.be.revertedWithCustomError(consumer, "InvalidPrice");
  });

  it("reverts with StalePrice once the price is older than MAX_STALENESS", async () => {
    const { mock, consumer } = await loadFixture(deployFixture);
    const maxStaleness = await consumer.MAX_STALENESS();

    // Fine right at the boundary.
    await time.increase(Number(maxStaleness) - 10);
    await expect(consumer.getValidatedPrice()).to.not.be.reverted;

    // Stale once we're past it.
    await time.increase(20);
    await expect(consumer.getValidatedPrice()).to.be.revertedWithCustomError(consumer, "StalePrice");
  });

  it("reverts with IncompleteRound when answeredInRound is behind the current round", async () => {
    const { mock, consumer } = await loadFixture(deployFixture);
    await mock.updateAnswer(305_000_000_000n); // roundId now 2
    await mock.setAnsweredInRound(1); // simulate a carried-over/incomplete round
    await expect(consumer.getValidatedPrice()).to.be.revertedWithCustomError(consumer, "IncompleteRound");
  });

  it("a fresh update resets staleness even after a long gap", async () => {
    const { mock, consumer } = await loadFixture(deployFixture);
    const maxStaleness = await consumer.MAX_STALENESS();
    await time.increase(Number(maxStaleness) + 100);
    await expect(consumer.getValidatedPrice()).to.be.revertedWithCustomError(consumer, "StalePrice");

    await mock.updateAnswer(305_000_000_000n); // fresh update
    await expect(consumer.getValidatedPrice()).to.not.be.reverted;
  });

  it("exposes decimals() and description() passthroughs", async () => {
    const { consumer } = await loadFixture(deployFixture);
    expect(await consumer.decimals()).to.equal(DECIMALS);
    expect(await consumer.description()).to.be.a("string");
  });
});
