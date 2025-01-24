require("@nomiclabs/hardhat-waffle");
require("hardhat-spdx-license-identifier");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

const secret = require("./secret"); // Ensure your secret file has Base network details

// Sample Hardhat task to list accounts
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,  // Enable the IR pipeline
    },
  },
  networks: {
    baseMainnet: {
      url: secret.baseMainnetUrl, // RPC URL for Base mainnet
      accounts: [secret.key],
      chainId: 8453,  // Base mainnet chain ID
    },

  },
  etherscan: {
    apiKey: "", // Replace with your Etherscan API key or Base API key
    customChains: [
      {
        network: "baseMainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api", // Base mainnet block explorer API
          browserURL: "https://basescan.org",       // Base mainnet block explorer
        },
      },

    ],
  },
  spdxLicenseIdentifier: {
    overwrite: true,
    runOnCompile: true,
  },
};