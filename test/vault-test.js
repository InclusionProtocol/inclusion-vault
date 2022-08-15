const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Vault", function () {
  const deci = 1_000_000;
  const amount1 = 300 * deci;
  const amount2 = 200 * deci;

  async function deployFixture() {
    const [owner, admin, operator, addr1, addr2] = await ethers.getSigners();

    const SDGI = await ethers.getContractFactory("SDGI");
    const sdgi = await SDGI.deploy(100_000 * deci);
    await sdgi.deployed();

    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy("SDGI", sdgi.address, admin.address);
    await vault.deployed();

    const depositLimit = await vault.depositLimit();
    await sdgi.transfer(addr1.address, 3 * depositLimit);
    await sdgi.transfer(addr2.address, 3 * depositLimit);

    return { vault, sdgi, owner, admin, operator, addr1, addr2, depositLimit }
  }

  it("Can deposit", async function () {
    const { vault, sdgi, addr1, addr2 } = await loadFixture(deployFixture);

    await sdgi.connect(addr1).approve(vault.address, amount1);
    await vault.connect(addr1).deposit(amount1);
    expect(await sdgi.balanceOf(vault.address)).to.equal(amount1);

    await sdgi.connect(addr2).approve(vault.address, amount2);
    await vault.connect(addr2).deposit(amount2);
    expect(await sdgi.balanceOf(vault.address)).to.equal(amount1 + amount2);
  });

  it("Cant deposit exceeding limit", async function() {
    const { vault, sdgi, addr1, depositLimit } = await loadFixture(deployFixture);

    await sdgi.connect(addr1).approve(vault.address, 2 * depositLimit);
    await expect(vault.connect(addr1).deposit(2 * depositLimit)).to.be.revertedWith("Exceeds deposit limit");
  });

  it("Can set operator and it works", async function () {
    const { vault, admin, operator, addr1 } = await loadFixture(deployFixture);

    await expect(vault.connect(operator).setWithdrawable(addr1.address, amount2)).to.be.revertedWith("Operator only");
    await expect(vault.setOperator(operator.address)).to.be.revertedWith("Admin only");
    await vault.connect(admin).setOperator(operator.address);
    await vault.connect(operator).setWithdrawable(addr1.address, amount2);
    await vault.connect(operator).setWithdrawable(addr1.address, amount2);
  });

  it("Can transfer asset", async function () {
    const { vault, sdgi, admin, addr1 } = await loadFixture(deployFixture);

    expect(await sdgi.balanceOf(vault.address)).to.equal(amount1 + amount2);
    await expect(vault.transferAsset(addr1.address, amount1)).to.be.revertedWith("Admin only");
    await vault.connect(admin).transferAsset(addr1.address, amount2 / 2);
  });

  it("Cant set withdrawable exceeding total deposit", async function () {
    const { vault, operator, addr1 } = await loadFixture(deployFixture);

    await expect(vault.connect(operator).setWithdrawable(addr1.address, amount1 + amount2)).to.be.revertedWith("Exceeds total deposit");
  });

  it("Cant set withdrawable exceeding withdraw limit", async function () {
    const { vault, sdgi, operator, addr1, depositLimit } = await loadFixture(deployFixture);

    await sdgi.connect(addr1).approve(vault.address, 2 * depositLimit);
    await vault.connect(addr1).deposit(depositLimit);
    await vault.connect(addr1).deposit(depositLimit);
    await expect(vault.connect(operator).setWithdrawable(addr1.address, 2 * depositLimit)).to.be.revertedWith("Exceeds withdraw limit");
  });

  it("Can withdraw", async function () {
    const { vault, operator, addr1 } = await loadFixture(deployFixture);

    await vault.connect(operator).setWithdrawable(addr1.address, amount2);
    await expect(vault.connect(addr1).withdraw(amount1)).to.be.revertedWith("Exceeds withrawable");
    await vault.connect(addr1).withdraw(amount2);
    await expect(vault.connect(addr1).withdraw(1)).to.be.revertedWith("Exceeds withrawable");
  });

  it("Cant withdraw within time gap", async function () {
    const { vault, operator, addr1 } = await loadFixture(deployFixture);

    await vault.connect(operator).setWithdrawable(addr1.address, amount2);
    await expect(vault.connect(addr1).withdraw(amount2)).to.be.revertedWith("Not within withdraw time gap");
  });

  it("Can be paused", async function () {
    const { vault, owner, admin, addr2 } = await loadFixture(deployFixture);

    await expect(vault.setPause(true)).to.be.revertedWith("Pauser only");
    await vault.connect(admin).addPauser(owner.address, true);
    await vault.setPause(true);
    expect(await vault.paused()).to.be.true;
    await expect(vault.connect(addr2).withdraw(1)).to.be.reverted;
  });
});
