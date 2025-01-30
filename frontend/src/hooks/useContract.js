import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import { ethers } from "ethers";

import {
  TOKEN_CONTRACT_ADDRESS,
  PRESALE_CONTRACT_ADDRESS,
  USDT_CONTRACT_ADDRESS,
  USDC_CONTRACT_ADDRESS,
  TOKEN_ABI,
  PRESALE_ABI,
} from "../contracts/contracts";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";

// Define the two networks (BSC and Matic)
const NETWORKS = {
  56: {
    // Binance Smart Chain (BSC) Mainnet
    PRESALE_CONTRACT_ADDRESS: "0x9C29D024c6CdFae7eA5df76068A3B63b904dC3b9",
    USDT_CONTRACT_ADDRESS: "0x55d398326f99059fF775485246999027B3197955",
    USDC_CONTRACT_ADDRESS: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    TOKEN_CONTRACT_ADDRESS: "0x6cbF13A8cDb39B13746906c32F3E1eCB089a1989",
    decimals: 18,
  },
  137: {
    // Polygon (Matic) Mainnet
    PRESALE_CONTRACT_ADDRESS: "0xb821B7fb4a82443Ff6D8480408F9558Db409FE2F",
    USDT_CONTRACT_ADDRESS: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    USDC_CONTRACT_ADDRESS: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    TOKEN_CONTRACT_ADDRESS: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals: 6,
  },
  8453: {
    // Base Network
    PRESALE_CONTRACT_ADDRESS: "0x9C29D024c6CdFae7eA5df76068A3B63b904dC3b9",
    USDT_CONTRACT_ADDRESS: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    USDC_CONTRACT_ADDRESS: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    TOKEN_CONTRACT_ADDRESS: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
  },
  1: {
    // Ethereum Mainnet
    PRESALE_CONTRACT_ADDRESS: "0x07D2AF0Dd0D5678C74f2C0d7adF34166dD37ae22",
    USDT_CONTRACT_ADDRESS: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    USDC_CONTRACT_ADDRESS: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    TOKEN_CONTRACT_ADDRESS: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    decimals: 6,
  },
};

function useContract() {
  const { walletProvider } = useAppKitProvider("eip155");
  const { address, isConnected } = useAppKitAccount();

  const getProvider = () => {
    return new BrowserProvider(walletProvider);
  };

  const getSigner = async (provider) => {
    return provider.getSigner();
  };

  const getNetworkConfig = async () => {
    const provider = getProvider();
    const network = await provider.getNetwork();
    const { chainId } = network;

    if (NETWORKS[chainId]) {
      const {
        PRESALE_CONTRACT_ADDRESS,
        USDT_CONTRACT_ADDRESS,
        USDC_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ADDRESS, // Include TOKEN_CONTRACT_ADDRESS here
      } = NETWORKS[chainId];

      return {
        chainId,
        PRESALE_CONTRACT_ADDRESS,
        USDT_CONTRACT_ADDRESS,
        USDC_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ADDRESS, // Return TOKEN_CONTRACT_ADDRESS
      };
    } else {
      throw new Error("Unsupported network.");
    }
  };

  const getContract = async (address, abi, signer) => {
    const contract = new Contract(address, abi, signer);
    return contract;
  };

  const buy = async (paymentType, amount) => {
    try {
      const provider = getProvider();
      const signer = await getSigner(provider);

      // Fetch the correct contract addresses based on the network
      const {
        PRESALE_CONTRACT_ADDRESS,
        USDT_CONTRACT_ADDRESS,
        USDC_CONTRACT_ADDRESS,
        decimals,
      } = await getNetworkConfig();

      // Initialize the presale contract
      const contract = await getContract(
        PRESALE_CONTRACT_ADDRESS,
        PRESALE_ABI,
        signer
      );

      if (
        paymentType === "ETH" ||
        paymentType === "BNB" ||
        paymentType === "POL"
      ) {
        // Handle ETH or BNB payment
        const transaction = await contract.buyFromNative({
          value: parseUnits(amount.toString(), 18), // Assuming ETH and BNB use 18 decimals
        });
        const receipt = await transaction.wait();
        return receipt;
      } else if (paymentType === "USDT") {
        // Handle USDT payment
        const usdt = await getContract(
          USDT_CONTRACT_ADDRESS,
          TOKEN_ABI,
          signer
        );
        const approveTx = await usdt.approve(
          PRESALE_CONTRACT_ADDRESS,
          parseUnits(amount.toString(), decimals)
        );
        await approveTx.wait();

        const buyTx = await contract.buyFromToken(
          1,
          parseUnits(amount.toString(), decimals)
        ); // '1' represents USDT
        const receipt = await buyTx.wait();
        return receipt;
      } else if (paymentType === "USDC") {
        // Handle USDC payment
        const usdc = await getContract(
          USDC_CONTRACT_ADDRESS,
          TOKEN_ABI,
          signer
        );
        const approveTx = await usdc.approve(
          PRESALE_CONTRACT_ADDRESS,
          parseUnits(amount.toString(), decimals)
        );
        await approveTx.wait();

        const buyTx = await contract.buyFromToken(
          2,
          parseUnits(amount.toString(), decimals)
        ); // '2' represents USDC
        const receipt = await buyTx.wait();
        return receipt;
      } else {
        throw new Error("Unsupported payment type");
      }
    } catch (error) {
      console.error("Error during purchase:", error);
      throw error;
    }
  };

  const claimTokens = async () => {
    const provider = getProvider();
    const signer = await getSigner(provider);
    const { PRESALE_CONTRACT_ADDRESS } = await getNetworkConfig();
    const contract = await getContract(
      PRESALE_CONTRACT_ADDRESS,
      PRESALE_ABI,
      signer
    );
    const transaction = await contract.claimTokens();
    const receipt = await transaction.wait();
    return receipt;
  };

  const getTotalUsers = async () => {
    try {
      const provider = getProviders1();
      const { PRESALE_CONTRACT_ADDRESS } = await getNetworkConfig();
      const contract = new Contract(
        PRESALE_CONTRACT_ADDRESS,
        PRESALE_ABI,
        provider
      );
      const totalUsers = await contract.totalUsers();
      return totalUsers.toNumber();
    } catch (error) {
      console.error("Error fetching total users:", error.message);
      throw error;
    }
  };

  const getProviders1 = () => {
    if (walletProvider) {
      return new BrowserProvider(walletProvider);
    } else {
      return new ethers.JsonRpcProvider("https://rpc.ankr.com/base");
    }
  };

  const getClaimableTokens = async () => {
    try {
      // Ensure the wallet is connected
      if (!isConnected) {
        throw new Error("Wallet is not connected.");
      }

      // Get the provider and network information
      const provider = getProvider();
      const network = await provider.getNetwork();
      const { chainId } = network;

      // Ensure we're connected to the correct network
      const { chain_id } = await getNetworkConfig(); // Get the correct chainId from network config
      if (chainId !== chain_id) {
        throw new Error("Connected to the wrong network.");
      }

      // Get the signer for contract interactions
      const signer = await getSigner(provider);

      // Fetch the correct presale contract address
      const { PRESALE_CONTRACT_ADDRESS } = await getNetworkConfig();

      // Get the contract instance
      const contract = await getContract(
        PRESALE_CONTRACT_ADDRESS,
        PRESALE_ABI,
        signer
      );

      // Fetch allocation and claims for the user's address
      const allocation = await contract.presaleAllocations(address);
      const claims = await contract.presaleClaims(address);

      // Format values to the appropriate units (18 decimals)
      const allocationInEth = formatUnits(allocation, 18);
      const claimsInEth = formatUnits(claims, 18);

      // Calculate the claimable tokens
      const claimable = parseFloat(allocationInEth) - parseFloat(claimsInEth);

      // Return the claimable amount in the appropriate format
      return claimable;
    } catch (error) {
      // Log and throw error if something goes wrong
      console.error("Error fetching claimable tokens:", error.message || error);
      throw error;
    }
  };

  const getPresaleAllocation = async () => {
    if (!isConnected || !walletProvider) {
      return 0;
    }

    try {
      // Get the provider and network information
      const provider = getProvider();
      const network = await provider.getNetwork();
      const { chainId } = network;

      // Ensure we're connected to the correct network
      const networkConfig = NETWORKS[chainId];
      if (!networkConfig) {
        throw new Error("Unsupported network.");
      }

      const { PRESALE_CONTRACT_ADDRESS } = networkConfig; // Get the contract address for the current network

      // Get the signer for the contract transactions
      const signer = await getSigner(provider);

      // Get the contract instance
      const contract = await getContract(
        PRESALE_CONTRACT_ADDRESS,
        PRESALE_ABI,
        signer
      );

      // Fetch the unclaimed tokens for the user
      const unclaimedTokens = await contract.getPresaleUnclaimed(address);
      const formattedUnclaimedTokens = formatUnits(unclaimedTokens, 18); // Format the tokens

      return formattedUnclaimedTokens;
    } catch (error) {
      // Handle any errors that may occur during the process
      console.error(
        "Error fetching presale allocation:",
        error.message || error
      );
      return "Error fetching allocation"; // Return an error message if something goes wrong
    }
  };

  const getData = async () => {
    // Check if the wallet is connected
    if (!isConnected) {
      return { balanceInEth: 0, contractBalance: 0 }; // Return default values if not connected
    }

    try {
      // Get the provider and network information
      const provider = getProvider();
      const network = await provider.getNetwork();
      const { chainId } = network;

      // Ensure we're connected to the correct network
      const { chain_id } = await getNetworkConfig(); // Get the correct chainId from the network config
      if (chainId !== chain_id) {
        throw new Error("Connected to the wrong network.");
      }

      // Get the signer for the contract transactions
      const signer = await getSigner(provider);

      // Fetch the appropriate contract address based on the network
      const {
        PRESALE_CONTRACT_ADDRESS,
        USDT_CONTRACT_ADDRESS,
        USDC_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ADDRESS,
      } = await getNetworkConfig();

      // Get the token contract instance
      const token = await getContract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_ABI,
        signer
      );

      // Fetch the user's token balance
      const balance = await token.balanceOf(address);
      const balanceInEth = formatUnits(balance, 18); // Format the user's balance

      // Fetch the contract's token balance
      const contractBalanceInEth = await token.balanceOf(
        PRESALE_CONTRACT_ADDRESS
      );
      const contractBalance = formatUnits(contractBalanceInEth, 18); // Format the contract's balance

      return {
        balanceInEth,
        contractBalance,
      };
    } catch (error) {
      // Handle any errors that may occur during the process
      console.error("Error fetching data:", error.message || error);
      return { balanceInEth: 0, contractBalance: 0 }; // Return default values on error
    }
  };

  // Get user's token balance
  const myTokenBalance = async () => {
    if (!isConnected) return 0;

    const provider = getProvider();
    const signer = await getSigner(provider);
    const {
      PRESALE_CONTRACT_ADDRESS,
      USDT_CONTRACT_ADDRESS,
      USDC_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ADDRESS,
    } = await getNetworkConfig();

    const token = await getContract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, signer);
    const balance = await token.balanceOf(address);

    return formatUnits(balance, 18);
  };

  const maxBalances = async () => {
    try {
      if (!isConnected)
        return { usdt: "0.0000", usdc: "0.0000", eth: "0.0000", bnb: "0.0000" };

      const provider = getProvider();
      const signer = await getSigner(provider);
      const address = await signer.getAddress(); // Get user's wallet address

      // Fetch the current network configuration
      const networkConfig = await getNetworkConfig();
      const { USDT_CONTRACT_ADDRESS, USDC_CONTRACT_ADDRESS } = networkConfig;

      if (!USDT_CONTRACT_ADDRESS || !USDC_CONTRACT_ADDRESS) {
        throw new Error(
          "USDT or USDC contract address not found for this network."
        );
      }

      // Get contract instances
      const usdt = await getContract(USDT_CONTRACT_ADDRESS, TOKEN_ABI, signer);
      const usdc = await getContract(USDC_CONTRACT_ADDRESS, TOKEN_ABI, signer);

      // Fetch balances
      const [usdtBalance, usdcBalance, ethBalance, bnbBalance] =
        await Promise.all([
          usdt.balanceOf(address),
          usdc.balanceOf(address),
          provider.getBalance(address), // ETH balance
          provider.getBalance(address), // BNB balance (same method)
        ]);

      // Return formatted balances
      return {
        usdt: formatUnits(usdtBalance, 6), // USDT typically has 6 decimals
        usdc: formatUnits(usdcBalance, 6), // USDC typically has 6 decimals
        eth: formatUnits(ethBalance, 18), // ETH typically has 18 decimals
        bnb: formatUnits(bnbBalance, 18), // BNB also has 18 decimals
      };
    } catch (error) {
      console.error("Error fetching balances:", error);
      return { usdt: "0.0000", usdc: "0.0000", eth: "0.0000", bnb: "0.0000" };
    }
  };

  const getPrice = async () => {
    // Check if the wallet is connected
    if (!isConnected) {
      throw new Error("Wallet is not connected.");
    }

    try {
      // Get the provider and network information
      const provider = getProvider();
      const network = await provider.getNetwork();
      const { chainId } = network;

      // Ensure we're connected to the correct network
      const networkConfig = NETWORKS[chainId]; // Get network config based on chainId
      if (!networkConfig) {
        throw new Error("Unsupported network.");
      }

      const { PRESALE_CONTRACT_ADDRESS } = networkConfig; // Get the contract address for the current network

      // Get the signer for the contract transactions
      const signer = await getSigner(provider);

      // Get the contract instance
      const contract = await getContract(
        PRESALE_CONTRACT_ADDRESS,
        PRESALE_ABI,
        signer
      );

      // Fetch the price per dollar and format it
      const price = await contract.perDollarPrice();
      return Number(formatUnits(price, 18)).toFixed(4); // Convert price and format to 4 decimal places
    } catch (error) {
      // Handle any errors that may occur during the process
      console.error("Error fetching price:", error.message || error);
      return "Error fetching price"; // Return an error message if something goes wrong
    }
  };

  const getTotalTokensSoldAcrossNetworks = async () => {
    try {
      let totalTokens = 0;

      for (const networkId of Object.keys(NETWORKS)) {
        const provider = new ethers.JsonRpcProvider(
          "https://rpc.ankr.com/base"
        ); // Replace with relevant RPC URL
        const { PRESALE_CONTRACT_ADDRESS } = NETWORKS[networkId];
        const contract = new Contract(
          PRESALE_CONTRACT_ADDRESS,
          PRESALE_ABI,
          provider
        );
        const tokensSold = await contract.totalTokensSold();
        totalTokens += parseFloat(ethers.formatUnits(tokensSold, 18)); // Convert to decimal
      }

      return totalTokens.toFixed(2); // Return formatted value
    } catch (error) {
      console.error("Error fetching total tokens sold:", error);
      return "Error";
    }
  };

  return {
    buy,
    getData,
    myTokenBalance,
    maxBalances,
    getPrice,
    claimTokens,
    getPresaleAllocation,
    getTotalUsers,
    getProvider,
    getTotalTokensSoldAcrossNetworks,
  };
}

export default useContract;
