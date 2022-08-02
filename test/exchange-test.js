const { expect } = require("chai");
const { loadFixture } = require("ethereum-waffle");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("Exchange", function () {
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

    await usdt.transfer(addr1.address, amount1);

    return { exchange, sdgi, usdt, owner, admin, addr1, addr2 }
  }

  it("Cant swap when exchange has no enough balance", async function () {
    const { exchange, usdt, addr1 } = await loadFixture(deployFixture);

    await usdt.connect(addr1).approve(exchange.address, amount1);
    await expect(exchange.connect(addr1).usdt2sdgi(amount1)).to.be.reverted;
  });

  it("Can swap from USDT to SDGI", async function () {
    const { exchange, sdgi, addr1 } = await loadFixture(deployFixture);

    await sdgi.transfer(exchange.address, 10000 * deci);
    expect(await sdgi.balanceOf(addr1.address)).to.equal(0);
    await exchange.connect(addr1).usdt2sdgi(amount1);
    expect(await sdgi.balanceOf(addr1.address)).to.equal(amount2);
  });

  it("Can swap from SDGI to USDT and charge fee", async function () {
    const { exchange, sdgi, usdt, addr1 } = await loadFixture(deployFixture);

    await sdgi.transfer(addr1.address, amount2);
    await expect(exchange.connect(addr1).sdgi2usdt(amount2 * 2)).to.be.reverted;
    await sdgi.connect(addr1).approve(exchange.address, amount2);
    await exchange.connect(addr1).sdgi2usdt(amount2);
    expect(await usdt.balanceOf(addr1.address)).to.equal(amount1 - amount1 / 100);
    console.log(await usdt.balanceOf(exchange.address));
  });

  it("Can withdraw asset by admin", async function () {
    const { exchange, sdgi, admin, addr2 } = await loadFixture(deployFixture);

    await expect(exchange.withdraw(addr2.address, sdgi.address, amount2)).to.be.revertedWith("Admin only");
    await exchange.connect(admin).withdraw(addr2.address, sdgi.address, amount2);
    expect(await sdgi.balanceOf(addr2.address)).to.equal(amount2);
  })
});
