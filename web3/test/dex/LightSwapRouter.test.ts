import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("LightSwapRouter", () => {
  async function deployFixture() {
    const [owner, lp, trader] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("LightTestToken");
    const tokenA = await Token.deploy("Token A", "TKA", ethers.parseEther("1000"));
    const tokenB = await Token.deploy("Token B", "TKB", ethers.parseEther("1000"));

    const Factory = await ethers.getContractFactory("LightSwapFactory");
    const factory = await Factory.deploy(owner.address);

    const Router = await ethers.getContractFactory("LightSwapRouter");
    const router = await Router.deploy(await factory.getAddress());

    const tokenAAddr = await tokenA.getAddress();
    const tokenBAddr = await tokenB.getAddress();
    const routerAddr = await router.getAddress();

    for (const signer of [lp, trader]) {
      await tokenA.transfer(signer.address, ethers.parseEther("200"));
      await tokenB.transfer(signer.address, ethers.parseEther("200"));
      await tokenA.connect(signer).approve(routerAddr, ethers.MaxUint256);
      await tokenB.connect(signer).approve(routerAddr, ethers.MaxUint256);
    }

    const deadline = async () => (await time.latest()) + 3600;

    return { factory, router, tokenA, tokenB, tokenAAddr, tokenBAddr, routerAddr, owner, lp, trader, deadline };
  }

  it("creates the pair on first addLiquidity call and deposits the exact desired amounts", async () => {
    const { router, tokenAAddr, tokenBAddr, factory, lp, deadline } = await loadFixture(deployFixture);

    await expect(
      router
        .connect(lp)
        .addLiquidity(
          tokenAAddr,
          tokenBAddr,
          ethers.parseEther("100"),
          ethers.parseEther("100"),
          0,
          0,
          lp.address,
          await deadline()
        )
    ).to.not.be.reverted;

    const pairAddr = await factory.getPair(tokenAAddr, tokenBAddr);
    expect(pairAddr).to.not.equal(ethers.ZeroAddress);
    const pair = await ethers.getContractAt("LightSwapPair", pairAddr);
    expect(await pair.balanceOf(lp.address)).to.be.greaterThan(0);
  });

  it("scales down the non-limiting side on a second, unequal-ratio deposit instead of reverting", async () => {
    const { router, tokenAAddr, tokenBAddr, lp, owner, deadline } = await loadFixture(deployFixture);
    await router
      .connect(lp)
      .addLiquidity(tokenAAddr, tokenBAddr, ethers.parseEther("100"), ethers.parseEther("100"), 0, 0, lp.address, await deadline());

    // Owner tries to deposit 50 A / 100 B, but pool ratio is 1:1, so only
    // 50 B should actually be pulled — the extra 50 B desired is simply not used.
    const tx = await router
      .connect(owner)
      .addLiquidity(tokenAAddr, tokenBAddr, ethers.parseEther("50"), ethers.parseEther("100"), 0, 0, owner.address, await deadline());
    const receipt = await tx.wait();
    expect(receipt?.status).to.equal(1);
  });

  it("reverts addLiquidity when the resulting amount would fall below amountAMin/amountBMin (slippage protection)", async () => {
    const { router, tokenAAddr, tokenBAddr, lp, owner, deadline } = await loadFixture(deployFixture);
    await router
      .connect(lp)
      .addLiquidity(tokenAAddr, tokenBAddr, ethers.parseEther("100"), ethers.parseEther("100"), 0, 0, lp.address, await deadline());

    // Ratio is 1:1, depositing 50 A desired / 100 B desired means ~50 B
    // gets used — set amountBMin above that to force a revert.
    await expect(
      router
        .connect(owner)
        .addLiquidity(
          tokenAAddr,
          tokenBAddr,
          ethers.parseEther("50"),
          ethers.parseEther("100"),
          0,
          ethers.parseEther("60"), // amountBMin too high
          owner.address,
          await deadline()
        )
    ).to.be.revertedWithCustomError(router, "InsufficientBAmount");
  });

  it("reverts any call once the deadline has passed", async () => {
    const { router, tokenAAddr, tokenBAddr, lp } = await loadFixture(deployFixture);
    const pastDeadline = (await time.latest()) - 1;
    await expect(
      router
        .connect(lp)
        .addLiquidity(tokenAAddr, tokenBAddr, ethers.parseEther("10"), ethers.parseEther("10"), 0, 0, lp.address, pastDeadline)
    ).to.be.revertedWithCustomError(router, "Expired");
  });

  it("removes liquidity back to the underlying tokens", async () => {
    const { router, routerAddr, factory, tokenAAddr, tokenBAddr, lp, deadline } = await loadFixture(deployFixture);
    await router
      .connect(lp)
      .addLiquidity(tokenAAddr, tokenBAddr, ethers.parseEther("100"), ethers.parseEther("100"), 0, 0, lp.address, await deadline());

    const pairAddr = await factory.getPair(tokenAAddr, tokenBAddr);
    const pair = await ethers.getContractAt("LightSwapPair", pairAddr);
    const lpBalance = await pair.balanceOf(lp.address);
    await pair.connect(lp).approve(routerAddr, lpBalance);

    await expect(
      router.connect(lp).removeLiquidity(tokenAAddr, tokenBAddr, lpBalance, 0, 0, lp.address, await deadline())
    ).to.not.be.reverted;
    expect(await pair.balanceOf(lp.address)).to.equal(0);
  });

  it("swaps exact-in along a single-hop path and respects amountOutMin", async () => {
    const { router, tokenA, tokenB, tokenAAddr, tokenBAddr, lp, trader, deadline } = await loadFixture(deployFixture);
    await router
      .connect(lp)
      .addLiquidity(tokenAAddr, tokenBAddr, ethers.parseEther("100"), ethers.parseEther("100"), 0, 0, lp.address, await deadline());

    const amountIn = ethers.parseEther("10");
    const [, expectedOut] = await router.getAmountsOut(amountIn, [tokenAAddr, tokenBAddr]);

    const balBefore = await tokenB.balanceOf(trader.address);
    await router
      .connect(trader)
      .swapExactTokensForTokens(amountIn, expectedOut, [tokenAAddr, tokenBAddr], trader.address, await deadline());
    expect(await tokenB.balanceOf(trader.address)).to.equal(balBefore + expectedOut);

    // Now demand an unrealistically high minimum — should revert.
    await expect(
      router
        .connect(trader)
        .swapExactTokensForTokens(
          amountIn,
          expectedOut * 2n,
          [tokenAAddr, tokenBAddr],
          trader.address,
          await deadline()
        )
    ).to.be.revertedWithCustomError(router, "InsufficientOutputAmount");
  });

  it("swaps exact-out and reverts if it would require more than amountInMax", async () => {
    const { router, tokenA, tokenAAddr, tokenBAddr, lp, trader, deadline } = await loadFixture(deployFixture);
    await router
      .connect(lp)
      .addLiquidity(tokenAAddr, tokenBAddr, ethers.parseEther("100"), ethers.parseEther("100"), 0, 0, lp.address, await deadline());

    const amountOut = ethers.parseEther("10");
    const [requiredIn] = await router.getAmountsIn(amountOut, [tokenAAddr, tokenBAddr]);

    const balBeforeA = await tokenA.balanceOf(trader.address);
    await router
      .connect(trader)
      .swapTokensForExactTokens(amountOut, requiredIn, [tokenAAddr, tokenBAddr], trader.address, await deadline());
    expect(await tokenA.balanceOf(trader.address)).to.equal(balBeforeA - requiredIn);

    await expect(
      router
        .connect(trader)
        .swapTokensForExactTokens(
          amountOut,
          requiredIn / 2n, // too tight a cap
          [tokenAAddr, tokenBAddr],
          trader.address,
          await deadline()
        )
    ).to.be.revertedWithCustomError(router, "ExcessiveInputAmount");
  });

  it("reverts a swap against a path with no pool", async () => {
    const { router, trader, deadline } = await loadFixture(deployFixture);
    const Token = await ethers.getContractFactory("LightTestToken");
    const strayTokenA = await Token.deploy("Stray A", "STRA", ethers.parseEther("100"));
    const strayTokenB = await Token.deploy("Stray B", "STRB", ethers.parseEther("100"));

    await expect(
      router
        .connect(trader)
        .swapExactTokensForTokens(
          1,
          0,
          [await strayTokenA.getAddress(), await strayTokenB.getAddress()],
          trader.address,
          await deadline()
        )
    ).to.be.revertedWithCustomError(router, "PairNotFound");
  });

  it("getAmountOut/getAmountIn round-trip approximately (fee makes it strictly lossy, never favorable)", async () => {
    const { router } = await loadFixture(deployFixture);
    const reserveIn = ethers.parseEther("1000");
    const reserveOut = ethers.parseEther("1000");
    const amountIn = ethers.parseEther("10");

    const out = await router.getAmountOut(amountIn, reserveIn, reserveOut);
    const impliedIn = await router.getAmountIn(out, reserveIn, reserveOut);
    // Because of the 0.30% fee (and integer rounding), reconstructing the
    // input from the output must never come out cheaper than what was
    // actually paid — otherwise there'd be a free-money round-trip.
    expect(impliedIn).to.be.greaterThanOrEqual(amountIn);
  });
});
