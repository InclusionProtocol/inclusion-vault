require("@nomicfoundation/hardhat-toolbox");


const dotenv = require('dotenv');
dotenv.config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const DEPLOY_PRIVATE_KEY = process.env.DEPLOY_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    rinkeby: {
      chainId: 4,
      accounts: [`${DEPLOY_PRIVATE_KEY}`],
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY}`
    }
  },
};
