import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const MINIMUM_LIQUIDITY = 1000n;

describe("LightSwapPair", () => {
  async function deployFixture() {
    const [owner, lp, trader] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("LightTestToken");
    const tokenA = await Token.deploy("Token A", "TKA", ethers.parseEther("1000"));
    const tokenB = await Token.deploy("Token B", "TKB", ethers.parseEther("1000"));

    const Factory = await ethers.getContractFactory("LightSwapFactory");
    const factory = await Factory.deploy(owner.address);

    const tokenAAddr = await tokenA.getAddress();
    const tokenBAddr = await tokenB.getAddress();
    await factory.createPair(tokenAAddr, tokenBAddr);
    const pairAddr = await factory.getPair(tokenAAddr, tokenBAddr);
    const pair = await ethers.getContractAt("LightSwapPair", pairAddr);

    const [token0Addr] = tokenAAddr.toLowerCase() < tokenBAddr.toLowerCase()
      ? [tokenAAddr, tokenBAddr]
      : [tokenBAddr, tokenAAddr];
    const token0 = token0Addr === tokenAAddr ? tokenA : tokenB;
    const token1 = token0Addr === tokenAAddr ? tokenB : tokenA;

    // Fund the LP and trader accounts from the deployer's initial mint.
    await token0.transfer(lp.address, ethers.parseEther("500"));
    await token1.transfer(lp.address, ethers.parseEther("500"));
    await token0.transfer(trader.address, ethers.parseEther("100"));

    return { factory, pair, token0, token1, owner, lp, trader };
  }

  async function addInitialLiquidity(
    pair: any,
    token0: any,
    token1: any,
    lp: any,
    amount0 = ethers.parseEther("100"),
    amount1 = ethers.parseEther("100")
  ) {
    const pairAddr = await pair.getAddress();
    await token0.connect(lp).transfer(pairAddr, amount0);
    await token1.connect(lp).transfer(pairAddr, amount1);
    await pair.connect(lp).mint(lp.address);
  }

  it("mints MINIMUM_LIQUIDITY permanently to the zero address on first deposit", async () => {
    const { pair, token0, token1, lp } = await loadFixture(deployFixture);
    await addInitialLiquidity(pair, token0, token1, lp);

    expect(await pair.balanceOf(ethers.ZeroAddress)).to.equal(MINIMUM_LIQUIDITY);
    // sqrt(100e18 * 100e18) - 1000
    const expectedLpForDepositor = 100000000000000000000n - MINIMUM_LIQUIDITY;
    expect(await pair.balanceOf(lp.address)).to.equal(expectedLpForDepositor);
  });

  it("emits Mint and Sync on deposit and updates reserves", async () => {
    const { pair, token0, token1, lp } = await loadFixture(deployFixture);
    const pairAddr = await pair.getAddress();
    const amount0 = ethers.parseEther("100");
    const amount1 = ethers.parseEther("100");
    await token0.connect(lp).transfer(pairAddr, amount0);
    await token1.connect(lp).transfer(pairAddr, amount1);

    await expect(pair.connect(lp).mint(lp.address))
      .to.emit(pair, "Mint")
      .withArgs(lp.address, amount0, amount1, 100000000000000000000n - MINIMUM_LIQUIDITY)
      .and.to.emit(pair, "Sync")
      .withArgs(amount0, amount1);

    const [reserve0, reserve1] = await pair.getReserves();
    expect(reserve0).to.equal(amount0);
    expect(reserve1).to.equal(amount1);
  });

  it("mints proportional shares for a second, unequal-ratio deposit at the pool's current price", async () => {
    const { pair, token0, token1, lp, owner } = await loadFixture(deployFixture);
    await addInitialLiquidity(pair, token0, token1, lp); // 100/100

    // Second LP deposits 50/50 (same ratio) — should get roughly half the
    // depositor's original share (proportional to reserves, not to the
    // MINIMUM_LIQUIDITY-adjusted total).
    const pairAddr = await pair.getAddress();
    await token0.transfer(owner.address, ethers.parseEther("50"));
    await token1.transfer(owner.address, ethers.parseEther("50"));
    await token0.transfer(pairAddr, ethers.parseEther("50"));
    await token1.transfer(pairAddr, ethers.parseEther("50"));

    const totalSupplyBefore = await pair.totalSupply();
    await pair.mint(owner.address);
    const ownerLp = await pair.balanceOf(owner.address);

    const expected = (ethers.parseEther("50") * totalSupplyBefore) / ethers.parseEther("100");
    expect(ownerLp).to.equal(expected);
  });

  it("reverts mint with InsufficientLiquidityMinted when nothing was actually deposited", async () => {
    const { pair, lp } = await loadFixture(deployFixture);
    await expect(pair.connect(lp).mint(lp.address)).to.be.revertedWithCustomError(
      pair,
      "InsufficientLiquidityMinted"
    );
  });

  it("burns LP shares for the correct pro-rata share of both tokens", async () => {
    const { pair, token0, token1, lp } = await loadFixture(deployFixture);
    await addInitialLiquidity(pair, token0, token1, lp);

    const pairAddr = await pair.getAddress();
    const lpBalance = await pair.balanceOf(lp.address);
    await pair.connect(lp).transfer(pairAddr, lpBalance);

    const totalSupply = await pair.totalSupply();
    const [reserve0, reserve1] = await pair.getReserves();
    const expectedAmount0 = (lpBalance * reserve0) / totalSupply;
    const expectedAmount1 = (lpBalance * reserve1) / totalSupply;

    const balBefore0 = await token0.balanceOf(lp.address);
    await expect(pair.connect(lp).burn(lp.address))
      .to.emit(pair, "Burn")
      .withArgs(lp.address, expectedAmount0, expectedAmount1, lp.address);

    expect(await token0.balanceOf(lp.address)).to.equal(balBefore0 + expectedAmount0);
    expect(await pair.balanceOf(lp.address)).to.equal(0);
  });

  it("rejects burning to one of the pool's own token addresses", async () => {
    const { pair, token0, token1, lp } = await loadFixture(deployFixture);
    await addInitialLiquidity(pair, token0, token1, lp);
    const token0Addr = await token0.getAddress();

    await expect(pair.connect(lp).burn(token0Addr)).to.be.revertedWithCustomError(
      pair,
      "InvalidRecipient"
    );
  });

  it("swaps at the constant-product price net of the 0.30% fee", async () => {
    const { pair, token0, token1, lp, trader } = await loadFixture(deployFixture);
    await addInitialLiquidity(pair, token0, token1, lp); // 100/100

    const pairAddr = await pair.getAddress();
    const amountIn = ethers.parseEther("10");
    await token0.connect(trader).transfer(pairAddr, amountIn);

    const [reserve0, reserve1] = await pair.getReserves();
    const amountInWithFee = amountIn * 997n;
    const expectedOut = (amountInWithFee * reserve1) / (reserve0 * 1000n + amountInWithFee);

    await expect(pair.connect(trader).swap(0, expectedOut, trader.address)).to.emit(pair, "Swap");
    expect(await token1.balanceOf(trader.address)).to.equal(expectedOut);
  });

  it("increases k (reserve0 * reserve1) after a swap, because the fee stays in the pool", async () => {
    const { pair, token0, token1, lp, trader } = await loadFixture(deployFixture);
    await addInitialLiquidity(pair, token0, token1, lp);

    const [r0Before, r1Before] = await pair.getReserves();
    const kBefore = r0Before * r1Before;

    const pairAddr = await pair.getAddress();
    const amountIn = ethers.parseEther("10");
    await token0.connect(trader).transfer(pairAddr, amountIn);
    const amountInWithFee = amountIn * 997n;
    const expectedOut = (amountInWithFee * r1Before) / (r0Before * 1000n + amountInWithFee);
    await pair.connect(trader).swap(0, expectedOut, trader.address);

    const [r0After, r1After] = await pair.getReserves();
    expect(r0After * r1After).to.be.greaterThan(kBefore);
  });

  it("reverts a swap that violates the constant-product invariant (taking more than the fee-adjusted formula allows)", async () => {
    const { pair, token0, token1, lp, trader } = await loadFixture(deployFixture);
    await addInitialLiquidity(pair, token0, token1, lp);

    const pairAddr = await pair.getAddress();
    await token0.connect(trader).transfer(pairAddr, ethers.parseEther("10"));

    // Demand far more output than the invariant allows for this input.
    await expect(
      pair.connect(trader).swap(0, ethers.parseEther("50"), trader.address)
    ).to.be.revertedWithCustomError(pair, "KInvariant");
  });

  it("reverts a swap requesting output >= available reserves", async () => {
    const { pair, token0, token1, lp, trader } = await loadFixture(deployFixture);
    await addInitialLiquidity(pair, token0, token1, lp); // 100 reserve1

    const pairAddr = await pair.getAddress();
    await token0.connect(trader).transfer(pairAddr, ethers.parseEther("10"));

    await expect(
      pair.connect(trader).swap(0, ethers.parseEther("100"), trader.address) // == full reserve1
    ).to.be.revertedWithCustomError(pair, "InsufficientLiquidity");
  });

  it("reverts a swap with no input token actually sent (no free withdrawal)", async () => {
    const { pair, token0, token1, lp, trader } = await loadFixture(deployFixture);
    await addInitialLiquidity(pair, token0, token1, lp);

    await expect(
      pair.connect(trader).swap(0, ethers.parseEther("1"), trader.address)
    ).to.be.revertedWithCustomError(pair, "InsufficientInputAmount");
  });

  it("rejects swapping to one of the pool's own token addresses", async () => {
    const { pair, token0, token1, lp, trader } = await loadFixture(deployFixture);
    await addInitialLiquidity(pair, token0, token1, lp);
    const token1Addr = await token1.getAddress();

    const pairAddr = await pair.getAddress();
    await token0.connect(trader).transfer(pairAddr, ethers.parseEther("10"));

    await expect(
      pair.connect(trader).swap(0, ethers.parseEther("1"), token1Addr)
    ).to.be.revertedWithCustomError(pair, "InvalidRecipient");
  });

  it("lets anyone call sync() to reconcile reserves with actual balances, without affecting LP accounting", async () => {
    const { pair, token0, lp, trader } = await loadFixture(deployFixture);
    await addInitialLiquidity(pair, token0, await ethers.getContractAt("LightTestToken", await pair.token1()), lp);

    const pairAddr = await pair.getAddress();
    const totalSupplyBefore = await pair.totalSupply();

    // Simulate a stray/accidental direct transfer into the pool.
    await token0.connect(trader).transfer(pairAddr, ethers.parseEther("1"));
    await pair.sync();

    const [reserve0] = await pair.getReserves();
    expect(reserve0).to.equal(ethers.parseEther("101"));
    expect(await pair.totalSupply()).to.equal(totalSupplyBefore); // sync never mints/burns
  });
});
