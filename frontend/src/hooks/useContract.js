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

const chain_id = 8453;

function useContract() {
  const { walletProvider } = useAppKitProvider("eip155");
  const { address, isConnected } = useAppKitAccount();

  const getProvider = () => {
    return new BrowserProvider(walletProvider);
  };
  const getSigner = async (provider) => {
    return provider.getSigner();
  };

  const getContract = async (address, abi, signer) => {
    const contract = new Contract(address, abi, signer);
    return contract;
  };

  const buy = async (paymentType, amount) => {
    const provider = getProvider();
    const signer = await getSigner(provider);
    // print singer address
    const contract = await getContract(
      PRESALE_CONTRACT_ADDRESS,
      PRESALE_ABI,
      signer
    );

    if (paymentType === "ETH") {
      const transaction = await contract.buyFromNative({
        value: parseUnits(amount.toString(), 18),
      });
      const receipt = await transaction.wait();
      return receipt;
    } else if (paymentType === "USDT") {
      const usdt = await getContract(USDT_CONTRACT_ADDRESS, TOKEN_ABI, signer); // usdt contract
      const transaction = await usdt.approve(
        // approving usdt contract
        PRESALE_CONTRACT_ADDRESS,
        parseUnits(amount.toString(), 6)
      );
      await transaction.wait();

      const trx1 = await contract.buyFromToken(
        // buying from token
        1,
        parseUnits(amount.toString(), 6)
      );

      return await trx1.wait();
    } else if (paymentType === "USDC") {
      const usdc = await getContract(USDC_CONTRACT_ADDRESS, TOKEN_ABI, signer);
      const transaction = await usdc.approve(
        PRESALE_CONTRACT_ADDRESS,
        parseUnits(amount.toString(), 6)
      );
      await transaction.wait();

      const trx2 = await contract.buyFromToken(
        // buying from token
        2,

        parseUnits(amount.toString(), 6)
      );
      await trx2.wait();
    }
  };

  const claimTokens = async () => {
    const provider = getProvider();
    const signer = await getSigner(provider);
    // print singer address
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
      const provider = getProviders1(); // Use a provider without a wallet connection
      const contract = new Contract(
        PRESALE_CONTRACT_ADDRESS,
        PRESALE_ABI,
        provider
      );
      const totalUsers = await contract.totalUsers();
      return totalUsers.toNumber(); // Convert BigNumber to regular number
    } catch (error) {
      console.error("Error fetching total users:", error.message);
      throw error;
    }
  };

  const getProviders1 = () => {
    if (walletProvider) {
      return new BrowserProvider(walletProvider);
    } else {
      // Use a public provider for read-only operations
      return new ethers.JsonRpcProvider(
        "https://rpc.ankr.com/base"
      );
    }
  };

  const getClaimableTokens = async () => {
    try {
      if (!isConnected) {
        throw new Error("Wallet is not connected.");
      }

      const provider = getProvider();
      const chainId = await provider.getNetwork();

      if (chainId.chainId !== chain_id) {
        throw new Error("Connected to the wrong network.");
      }

      const signer = await getSigner(provider);
      const contract = await getContract(
        PRESALE_CONTRACT_ADDRESS,
        PRESALE_ABI,
        signer
      );

      const allocation = await contract.presaleAllocations(address); // Fetch user's allocated tokens
      const claims = await contract.presaleClaims(address); // Fetch user's claimed tokens

      const claimable = allocation - claims; // Calculate claimable tokens

      return claimable;
    } catch (error) {
      console.error("Error fetching claimable tokens:", error.message || error);
      throw error;
    }
  };

  const getPresaleAllocation = async () => {
    if (!isConnected || !walletProvider) {
      return 0;
    } else {
      const provider = getProvider();
      // check chain id and throw error if not correct
      const chainId = await provider.getNetwork();
      // base chain id
      if (chainId.chainId != chain_id) {
        return;
      }

      const signer = await getSigner(provider);
      const contract = await getContract(
        PRESALE_CONTRACT_ADDRESS,
        PRESALE_ABI,
        signer
      );

      // Call the getPresaleUnclaimed function
      const unclaimedTokens = await contract.getPresaleUnclaimed(address);

      // Format the tokens using ethers.js formatUnits for 18 decimals
      const formattedUnclaimedTokens = formatUnits(unclaimedTokens, 18);

      return formattedUnclaimedTokens;
    }
  };

  const getData = async () => {
    let token;
    if (!isConnected) {
      return;
    } else {
      const provider = getProvider();
      // check chain id and throw error if not correct
      const chainId = await provider.getNetwork();
      // base chain id
      if (chainId.chainId != chain_id) {
        return;
      }

      const signer = await getSigner(provider);
      token = await getContract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, signer);
    }

    const balance = await token.balanceOf(address);
    const balanceInEth = formatUnits(balance, 18);

    // contract token balance
    const contractBalanceInEth = await token.balanceOf(
      PRESALE_CONTRACT_ADDRESS
    );
    const contractBalance = formatUnits(contractBalanceInEth, 18);

    return {
      balanceInEth,
      contractBalance,
    };
  };

  const myTokenBalance = async () => {
    let token;
    if (!isConnected) {
      return 0;
    } else {
      const provider = getProvider();
      // check chain id and throw error if not correct
      const chainId = await provider.getNetwork();
      // base chain id
      if (chainId.chainId != chain_id) {
        return;
      }

      const signer = await getSigner(provider);
      token = await getContract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, signer);
      const balance = await token.balanceOf(address);
      const balanceInEth = formatUnits(balance, 18);
      return balanceInEth;
    }
  };

  const maxBalances = async () => {
    let token;
    let token2;
    let usdcBalance;
    let usdtBalance;
    let ethbalance;
    if (!isConnected) {
      return {
        usdt: 0,
        busd: 0,
        eth: 0,
      };
    } else {
      const provider = getProvider();
      // check chain id and throw error if not correct
      const chainId = await provider.getNetwork();
      // base chain id
      if (chainId.chainId != chain_id) {
        return;
      }

      const signer = await getSigner(provider);
      token = await getContract(USDT_CONTRACT_ADDRESS, TOKEN_ABI, signer);
      token2 = await getContract(USDC_CONTRACT_ADDRESS, TOKEN_ABI, signer);

      usdtBalance = await token.balanceOf(address);

      usdcBalance = await token2.balanceOf(address);

      // eth balance
      ethbalance = await provider.getBalance(address);
    }

    return {
      usdt: Number(formatUnits(usdtBalance, 6)).toFixed(4),
      busd: Number(formatUnits(usdcBalance, 6)).toFixed(4),
      eth: Number(formatUnits(ethbalance, 18)).toFixed(4),
    };
  };

  const getPrice = async () => {
    let contract;
    let price;
    if (!isConnected) {
    } else {
      const provider = getProvider();
      // check chain id and throw error if not correct
      const chainId = await provider.getNetwork();

      // base chain id
      if (chainId.chainId != chain_id) {
        return;
      }

      const signer = await getSigner(provider);
      contract = await getContract(
        PRESALE_CONTRACT_ADDRESS,
        PRESALE_ABI,
        signer
      );
      price = await contract.perDollarPrice();
    }

    return Number(formatUnits(price, 18)).toFixed(4);
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
  };
}

export default useContract;
