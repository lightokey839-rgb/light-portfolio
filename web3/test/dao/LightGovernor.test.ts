import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, mine, time } from "@nomicfoundation/hardhat-network-helpers";

const MIN_TIMELOCK_DELAY = 60; // seconds, matches deploy-dao.ts

describe("LightGovernor + TimelockController", () => {
  async function deployFixture() {
    const [deployer, voterA, voterB, voterC, recipient] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("LightGovernanceToken");
    const token = await Token.deploy();

    const Timelock = await ethers.getContractFactory("TimelockController");
    const timelock = await Timelock.deploy(MIN_TIMELOCK_DELAY, [], [], deployer.address);

    const Governor = await ethers.getContractFactory("LightGovernor");
    const governor = await Governor.deploy(await token.getAddress(), await timelock.getAddress());

    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
    const ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();

    await timelock.grantRole(PROPOSER_ROLE, await governor.getAddress());
    await timelock.grantRole(CANCELLER_ROLE, await governor.getAddress());
    await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress); // open execution
    await timelock.revokeRole(ADMIN_ROLE, deployer.address); // renounce admin — no more privileged control

    // Fund the treasury (the timelock itself) so an executed proposal has
    // real ETH to move.
    await deployer.sendTransaction({ to: await timelock.getAddress(), value: ethers.parseEther("1") });

    // Distribute voting tokens. Deployer starts with the full 1,000,000
    // supply from the constructor mint.
    await token.transfer(voterA.address, ethers.parseEther("100000")); // 10%
    await token.transfer(voterB.address, ethers.parseEther("50000")); // 5%
    await token.transfer(voterC.address, ethers.parseEther("1000")); // 0.1% — below quorum alone

    return { token, timelock, governor, deployer, voterA, voterB, voterC, recipient, PROPOSER_ROLE, EXECUTOR_ROLE, ADMIN_ROLE };
  }

  async function proposalArgs(timelockAddress: string, recipient: string, amount: bigint, description: string) {
    return {
      targets: [recipient],
      values: [amount],
      calldatas: ["0x"],
      description,
    };
  }

  it("governance token requires an explicit delegate() call before a balance counts as voting power", async () => {
    const { token, voterA } = await loadFixture(deployFixture);
    expect(await token.getVotes(voterA.address)).to.equal(0);
    await token.connect(voterA).delegate(voterA.address);
    expect(await token.getVotes(voterA.address)).to.equal(await token.balanceOf(voterA.address));
  });

  it("takes a proposal through Pending -> Active -> Succeeded -> Queued -> Executed, moving treasury ETH", async () => {
    const { token, timelock, governor, voterA, voterB, recipient } = await loadFixture(deployFixture);
    await token.connect(voterA).delegate(voterA.address); // 10% of supply
    await token.connect(voterB).delegate(voterB.address); // 5% of supply — together, well above 4% quorum

    const amount = ethers.parseEther("0.25");
    const { targets, values, calldatas, description } = await proposalArgs(
      await timelock.getAddress(),
      recipient.address,
      amount,
      "Send 0.25 ETH from the treasury to the recipient"
    );

    const proposeTx = await governor.connect(voterA).propose(targets, values, calldatas, description);
    const proposeReceipt = await proposeTx.wait();
    const proposalId = await governor.hashProposal(targets, values, calldatas, ethers.id(description));

    expect(await governor.state(proposalId)).to.equal(0); // Pending

    await mine(2); // pass votingDelay (1 block)
    expect(await governor.state(proposalId)).to.equal(1); // Active

    await governor.connect(voterA).castVote(proposalId, 1); // For
    await governor.connect(voterB).castVote(proposalId, 1); // For

    await mine(301); // pass votingPeriod (300 blocks)
    expect(await governor.state(proposalId)).to.equal(4); // Succeeded

    await governor.queue(targets, values, calldatas, ethers.id(description));
    expect(await governor.state(proposalId)).to.equal(5); // Queued

    await time.increase(MIN_TIMELOCK_DELAY + 1);

    const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
    await governor.execute(targets, values, calldatas, ethers.id(description));
    expect(await governor.state(proposalId)).to.equal(7); // Executed

    const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
    expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(amount);
  });

  it("reaches Defeated when quorum isn't met even if all cast votes are 'For'", async () => {
    const { token, timelock, governor, voterC, recipient } = await loadFixture(deployFixture);
    await token.connect(voterC).delegate(voterC.address); // 0.1% of supply — well under 4% quorum

    const { targets, values, calldatas, description } = await proposalArgs(
      await timelock.getAddress(),
      recipient.address,
      ethers.parseEther("0.1"),
      "Small-holder-only proposal"
    );

    await governor.connect(voterC).propose(targets, values, calldatas, description);
    const proposalId = await governor.hashProposal(targets, values, calldatas, ethers.id(description));

    await mine(2);
    await governor.connect(voterC).castVote(proposalId, 1);
    await mine(301);

    expect(await governor.state(proposalId)).to.equal(3); // Defeated (quorum not reached)
  });

  it("reverts casting a second vote from the same account on the same proposal", async () => {
    const { token, timelock, governor, voterA, recipient } = await loadFixture(deployFixture);
    await token.connect(voterA).delegate(voterA.address);

    const { targets, values, calldatas, description } = await proposalArgs(
      await timelock.getAddress(),
      recipient.address,
      ethers.parseEther("0.1"),
      "Double-vote check"
    );
    await governor.connect(voterA).propose(targets, values, calldatas, description);
    const proposalId = await governor.hashProposal(targets, values, calldatas, ethers.id(description));

    await mine(2);
    await governor.connect(voterA).castVote(proposalId, 1);
    await expect(governor.connect(voterA).castVote(proposalId, 1)).to.be.reverted;
  });

  it("reverts execution attempted before the timelock delay has elapsed", async () => {
    const { token, timelock, governor, voterA, voterB, recipient } = await loadFixture(deployFixture);
    await token.connect(voterA).delegate(voterA.address);
    await token.connect(voterB).delegate(voterB.address);

    const { targets, values, calldatas, description } = await proposalArgs(
      await timelock.getAddress(),
      recipient.address,
      ethers.parseEther("0.1"),
      "Early execution attempt"
    );
    await governor.connect(voterA).propose(targets, values, calldatas, description);
    const proposalId = await governor.hashProposal(targets, values, calldatas, ethers.id(description));

    await mine(2);
    await governor.connect(voterA).castVote(proposalId, 1);
    await governor.connect(voterB).castVote(proposalId, 1);
    await mine(301);

    await governor.queue(targets, values, calldatas, ethers.id(description));
    // Do NOT advance time past MIN_TIMELOCK_DELAY.
    await expect(governor.execute(targets, values, calldatas, ethers.id(description))).to.be.reverted;
  });

  it("reverts a direct (non-governor) call trying to schedule an operation on the timelock", async () => {
    const { timelock, voterA, recipient } = await loadFixture(deployFixture);
    await expect(
      timelock.connect(voterA).schedule(recipient.address, ethers.parseEther("0.1"), "0x", ethers.ZeroHash, ethers.ZeroHash, MIN_TIMELOCK_DELAY)
    ).to.be.reverted; // voterA doesn't hold PROPOSER_ROLE — only the governor does
  });

  it("confirms the deployer's timelock admin role was renounced during deployment setup", async () => {
    const { timelock, deployer, ADMIN_ROLE } = await loadFixture(deployFixture);
    expect(await timelock.hasRole(ADMIN_ROLE, deployer.address)).to.equal(false);
  });

  it("weights votes by voting power, not by number of voters", async () => {
    const { token, timelock, governor, voterA, voterC, recipient } = await loadFixture(deployFixture);
    // voterA (10%) votes For, voterC (0.1%) votes Against — For should win
    // despite being one vote against one vote, because power is weighted.
    await token.connect(voterA).delegate(voterA.address);
    await token.connect(voterC).delegate(voterC.address);

    const { targets, values, calldatas, description } = await proposalArgs(
      await timelock.getAddress(),
      recipient.address,
      ethers.parseEther("0.1"),
      "Weighted voting check"
    );
    await governor.connect(voterA).propose(targets, values, calldatas, description);
    const proposalId = await governor.hashProposal(targets, values, calldatas, ethers.id(description));

    await mine(2);
    await governor.connect(voterA).castVote(proposalId, 1); // For
    await governor.connect(voterC).castVote(proposalId, 0); // Against
    await mine(301);

    const votes = await governor.proposalVotes(proposalId);
    expect(votes.forVotes).to.be.greaterThan(votes.againstVotes);
    expect(await governor.state(proposalId)).to.equal(4); // Succeeded — 10% clears 4% quorum
  });
});
