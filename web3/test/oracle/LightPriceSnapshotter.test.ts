import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

const DECIMALS = 8;
const INITIAL_PRICE = 300_000_000_000n;
const INTERVAL = 3600; // 1 hour

describe("LightPriceSnapshotter", () => {
  async function deployFixture() {
    const Mock = await ethers.getContractFactory("MockV3Aggregator");
    const mock = await Mock.deploy(DECIMALS, INITIAL_PRICE);

    const Snapshotter = await ethers.getContractFactory("LightPriceSnapshotter");
    const snapshotter = await Snapshotter.deploy(await mock.getAddress(), INTERVAL);

    return { mock, snapshotter };
  }

  it("checkUpkeep is eligible immediately after deployment (lastSnapshotAt defaults to 0)", async () => {
    const { snapshotter } = await loadFixture(deployFixture);
    const [upkeepNeeded] = await snapshotter.checkUpkeep("0x");
    expect(upkeepNeeded).to.equal(true);
  });

  it("performUpkeep records a snapshot and emits SnapshotTaken", async () => {
    const { snapshotter } = await loadFixture(deployFixture);
    await expect(snapshotter.performUpkeep("0x")).to.emit(snapshotter, "SnapshotTaken");
    expect(await snapshotter.historyLength()).to.equal(1);
    const latest = await snapshotter.latestSnapshot();
    expect(latest.price).to.equal(INITIAL_PRICE);
  });

  it("reverts performUpkeep called again before the interval has elapsed", async () => {
    const { snapshotter } = await loadFixture(deployFixture);
    await snapshotter.performUpkeep("0x");
    await expect(snapshotter.performUpkeep("0x")).to.be.revertedWithCustomError(snapshotter, "TooEarly");
  });

  it("checkUpkeep flips to false right after a snapshot, then true again after the interval", async () => {
    const { snapshotter } = await loadFixture(deployFixture);
    await snapshotter.performUpkeep("0x");
    let [upkeepNeeded] = await snapshotter.checkUpkeep("0x");
    expect(upkeepNeeded).to.equal(false);

    await time.increase(INTERVAL + 1);
    [upkeepNeeded] = await snapshotter.checkUpkeep("0x");
    expect(upkeepNeeded).to.equal(true);
  });

  it("reverts performUpkeep on an invalid (non-positive) price", async () => {
    const { mock, snapshotter } = await loadFixture(deployFixture);
    await mock.updateAnswer(0);
    await expect(snapshotter.performUpkeep("0x")).to.be.revertedWithCustomError(snapshotter, "InvalidPrice");
  });

  it("reverts performUpkeep on a stale price", async () => {
    const { snapshotter } = await loadFixture(deployFixture);
    const maxStaleness = await snapshotter.MAX_STALENESS();
    await time.increase(Number(maxStaleness) + 100);
    await expect(snapshotter.performUpkeep("0x")).to.be.revertedWithCustomError(snapshotter, "StalePrice");
  });

  it("caps history at MAX_HISTORY, dropping the oldest entry", async () => {
    const { mock, snapshotter } = await loadFixture(deployFixture);
    const maxHistory = await snapshotter.MAX_HISTORY();

    for (let i = 0; i < Number(maxHistory) + 5; i++) {
      await mock.updateAnswer(INITIAL_PRICE + BigInt(i));
      await snapshotter.performUpkeep("0x");
      await time.increase(INTERVAL + 1);
    }

    expect(await snapshotter.historyLength()).to.equal(maxHistory);
    // The most recent snapshot should reflect the last update, not an
    // early one that should have been evicted.
    const latest = await snapshotter.latestSnapshot();
    expect(latest.price).to.equal(INITIAL_PRICE + BigInt(Number(maxHistory) + 4));
  });
});
