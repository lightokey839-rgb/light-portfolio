import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, mine, time } from "@nomicfoundation/hardhat-network-helpers";

describe("LightGovernanceToken", () => {
  async function deployFixture() {
    const [deployer, claimant] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("LightGovernanceToken");
    const token = await Token.deploy();
    return { token, deployer, claimant };
  }

  it("mints the full initial supply to the deployer", async () => {
    const { token, deployer } = await loadFixture(deployFixture);
    expect(await token.balanceOf(deployer.address)).to.equal(ethers.parseEther("1000000"));
  });

  it("faucet mints FAUCET_AMOUNT and enforces the cooldown", async () => {
    const { token, claimant } = await loadFixture(deployFixture);
    await token.connect(claimant).faucet();
    expect(await token.balanceOf(claimant.address)).to.equal(await token.FAUCET_AMOUNT());

    await expect(token.connect(claimant).faucet()).to.be.revertedWithCustomError(token, "FaucetCooldownActive");

    await time.increase(await token.FAUCET_COOLDOWN());
    await expect(token.connect(claimant).faucet()).to.not.be.reverted;
  });

  it("requires delegate() before a balance counts as voting power (ERC20Votes behavior)", async () => {
    const { token, claimant } = await loadFixture(deployFixture);
    await token.connect(claimant).faucet();
    expect(await token.getVotes(claimant.address)).to.equal(0);
    await token.connect(claimant).delegate(claimant.address);
    expect(await token.getVotes(claimant.address)).to.equal(await token.balanceOf(claimant.address));
  });

  it("snapshots past voting power via checkpoints — a later transfer doesn't change an earlier block's tally", async () => {
    const { token, deployer, claimant } = await loadFixture(deployFixture);
    await token.connect(deployer).delegate(deployer.address);
    await mine(1);
    const pastBlock = (await ethers.provider.getBlockNumber()) - 1;

    // Transfer away tokens *after* the snapshot block.
    await token.transfer(claimant.address, ethers.parseEther("1000"));
    await mine(1);

    const votingPowerAtPastBlock = await token.getPastVotes(deployer.address, pastBlock);
    expect(votingPowerAtPastBlock).to.equal(ethers.parseEther("1000000")); // unaffected by the later transfer
  });
});
