// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const dotenv = require('dotenv');

const result = {}
async function main() {
  dotenv.config();

  const deci = 1_000_000;
  const admin = process.env.ADMIN_ADDRESS;

  const USDT = await ethers.getContractFactory("USDT");
  const usdt = await USDT.deploy(1_000_000 * deci);
  await usdt.deployed();
  console.log("USDT deployed to:", usdt.address);
  result.USDT = usdt.address

  const SDGI = await ethers.getContractFactory("SDGI");
  const sdgi = await SDGI.deploy(1_000_000 * deci);
  await sdgi.deployed();
  console.log("SDGI deployed to:", sdgi.address);
  result.SDGI = sdgi.address

  const SDG2USD = await ethers.getContractFactory("SDG2USD");
  const sdg2usd = await SDG2USD.deploy();
  await sdg2usd.deployed();
  console.log("SDG2USD ratio oracle deployed to:", sdg2usd.address);
  result.SDG2USD = sdg2usd.address

  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = await Exchange.deploy(usdt.address, sdgi.address, admin, sdg2usd.address);
  await exchange.deployed();
  console.log("Exchange deployed to:", exchange.address);
  result.Exchange = exchange.address

  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy("SDGI", sdgi.address, admin);
  await vault.deployed();
  console.log("Vault deployed to:", vault.address);
  result.Vault = vault.address

  const SwapAndDeposit = await ethers.getContractFactory("SwapAndDeposit");
  const swapanddeposit = await SwapAndDeposit.deploy(usdt.address, sdgi.address, exchange.address, vault.address);
  await swapanddeposit.deployed();
  console.log("SwapAndDeposit deployed to:", swapanddeposit.address);
  result.SwapAndDeposit = swapanddeposit.address

  console.log('\n\nresult => \n', JSON.stringify(result, null, 2))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
