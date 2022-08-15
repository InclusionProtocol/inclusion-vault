const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("SwapAndDeposit", function () {
  const deci = 1_000_000;
  const amount1 = 72 * deci;
  const amount2 = 100 * deci;

  async function deployFixture() {
    const [owner, admin, addr1, addr2] = await ethers.getSigners();

    const SDGI = await ethers.getContractFactory("SDGI");
    const sdgi = await SDGI.deploy(100_000 * deci);
    await sdgi.deployed();

    const USDT = await ethers.getContractFactory("USDT");
    const usdt = await USDT.deploy(100_000 * deci);
    await usdt.deployed();

    const SDG2USD = await ethers.getContractFactory("SDG2USD");
    const sdg2usd = await SDG2USD.deploy();
    await sdg2usd.deployed();

    const Exchange = await ethers.getContractFactory("Exchange");
    const exchange = await Exchange.deploy(usdt.address, sdgi.address, admin.address, sdg2usd.address);
    await exchange.deployed();

    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy("SDGI", sdgi.address, admin.address);
    await vault.deployed();

    const SwapAndDeposit = await ethers.getContractFactory("SwapAndDeposit");
    const swapanddeposit = await SwapAndDeposit.deploy(usdt.address, sdgi.address, exchange.address, vault.address);
    await swapanddeposit.deployed();

    await usdt.transfer(addr1.address, amount1);
    await usdt.transfer(swapanddeposit.address, amount1);
    await sdgi.transfer(exchange.address, amount2 * 10);

    return { usdt, exchange, vault, swapanddeposit, addr1 }
  }

  it("Should swap then deposit", async function () {
    const { usdt, vault, swapanddeposit, addr1 } = await loadFixture(deployFixture);

    expect(await usdt.balanceOf(addr1.address)).to.equal(amount1);
    await usdt.connect(addr1).approve(swapanddeposit.address, amount1);
    await swapanddeposit.authorizeExchangeNVault();
    await swapanddeposit.connect(addr1).swapNDeposit(amount1);
    const ret = await vault.getAddrInfo(addr1.address);
    expect(ret[0]).to.equal(amount2);
  });
});
