// import "@nomicfoundation/hardhat-toolbox";

import "hardhat-deploy";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";

require("dotenv").config();

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  namedAccounts: {
    deployer: 0,
    user1: 1,
    user2: 2,
  },
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.18",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          }
        }
      },
    ],
    contractSizer: {
      alphaSort: true,
      disambiguatePaths: false,
      runOnCompile: true,
      // strict: true,
      // only: [':ERC20$'],
    },  
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    bsc: {
      url: "https://rpc.ankr.com/bsc",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    goerli: {
      url: GOERLI_RPC_URL,
      chainId: 5,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEY],
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      chainId: 11155111,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    // apiKey: BSCSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    // outDir: "../frontend/types",
    outDir: "./typechain-types",
  },
};
