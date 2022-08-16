import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const dotenv = require("dotenv");
dotenv.config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const DEPLOY_PRIVATE_KEY = process.env.DEPLOY_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
  networks: {
    rinkeby: {
      chainId: 4,
      accounts: [`${DEPLOY_PRIVATE_KEY}`],
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY,
  },
};
export default config;
