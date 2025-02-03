import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PER_USDT_TO_BNB } from "../contracts/contracts";
import useContract from "../hooks/useContract";
import { FaAngleDown } from "react-icons/fa";
import CopyToClipboardButton from "./CoppyBtn";
import {
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
} from "@reown/appkit/react";
import { PRESALE_ABI } from "../contracts/contracts";
import { ethers } from "ethers";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useCustomTonWallet } from "../context/TonWalletContext";
import AccordianGroup from "./AccordianGroup";
import ProgressBar from "./ProgressBar";
import CircularChat from "./CircularChat";
import "../responsive.css";
import Spinner from "./Spinner";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { base, bsc, polygon, mainnet, solana } from "@reown/appkit/networks";
import { FaTelegram, FaTwitter, FaYoutube, FaFacebook } from "react-icons/fa";
import {
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import { appkitModal } from "../App";
import bigInt from "big-integer";

const MainPage = () => {
  const [paymenType, setPaymentType] = useState("ETH");
  const [paymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const [amount, setAmount] = useState();
  const [receiveable, setReceiveable] = useState();
  const [totalTokensSold, setTotalTokensSold] = useState(null);
  const [balance, setBalance] = useState(0);
  const [maxBalance, setMaxBalance] = useState(null);
  const [price, setPrice] = useState(0);
  const [totalUsers, setTotalUsers] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalUsdRaised, setTotalUsdRaised] = useState(null);
  const [tonTransactionLink, setTonTransactionLink] = useState(null);
  const [totalAllocations, setTotalAllocations] = useState(null); // Initialize state for total allocations
  const { t } = useTranslation();
  const {
    buy,
    myTokenBalance,
    maxBalances,
    getPrice,
    claimTokens,
    getProvider,
  } = useContract();
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork, chainId } = useAppKitNetwork();
  const [tonConnectUI] = useTonConnectUI();
  const { isTonWalletConnected, friendlyAddress, tonBalance, sendTon } =
    useCustomTonWallet();
  const currentYear = new Date().getFullYear();
  const { connection } = useAppKitConnection();
  const { walletProvider } = useAppKitProvider("solana");
  const [bscWallet, setBscWallet] = useState(""); // Store BSC Wallet
  const [isBscModalOpen, setIsBscModalOpen] = useState(false); // Modal state

  const NETWORKS = [
    {
      rpcUrl: "https://rpc.ankr.com/base",
      contractAddress: "0x9C29D024c6CdFae7eA5df76068A3B63b904dC3b9",
    },
    {
      rpcUrl: "https://rpc.ankr.com/eth",
      contractAddress: "0x07D2AF0Dd0D5678C74f2C0d7adF34166dD37ae22",
    },
    {
      rpcUrl: "https://rpc.ankr.com/polygon",
      contractAddress: "0xb821B7fb4a82443Ff6D8480408F9558Db409FE2F",
    },
    {
      rpcUrl: "https://rpc.ankr.com/bsc",
      contractAddress: "0x9C29D024c6CdFae7eA5df76068A3B63b904dC3b9",
    },
  ];

  // Handle change or other events
  const handlePaymentTypechange = async (newPaymentType, isBase) => {
    if (isConnected) {
      setPaymentType(newPaymentType);
      setAmount("");
      setReceiveable("");

      // Define network IDs for Ethereum and Binance Smart Chain
      const networks = {
        ETH: { id: 1, name: "Ethereum Mainnet" },
        BNB: { id: 56, name: "Binance Smart Chain" },
        POL: { id: 137, name: "Polygon" },
        BASE: { id: 8453, name: "Base" },
      };
      try {
        if (newPaymentType === "SOL" && isConnected) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          appkitModal.open({ view: "Networks" });
          toast.info("Please switch your current network into Solana");
          appkitModal.switchNetwork(solana);
        } else {
          // Check if the new payment type requires a network switch
          if (isBase) {
            switchNetwork(base);
          } else {
            if (
              (newPaymentType === "BNB" || newPaymentType === "TON") &&
              chainId !== networks.BNB.id
            ) {
              switchNetwork(bsc); // This will trigger a wallet popup
            } else if (
              newPaymentType === "ETH" &&
              chainId !== networks.ETH.id
            ) {
              switchNetwork(mainnet); // This will trigger a wallet popup
            } else if (
              newPaymentType === "POL" &&
              chainId !== networks.POL.id
            ) {
              switchNetwork(polygon); // This will trigger a wallet popup
            }
          }
        }
      } catch (error) {
        console.error("Network switch failed:", error);
        toast.error(
          "Failed to switch network. Please change it manually in your wallet."
        );
      }
    }
  };

  const handleTonConnect = () => {
    if (!isTonWalletConnected) {
      if (!isConnected) {
        toast.error("Please connect with your ETH wallet first");
        return;
      }
      tonConnectUI.openModal();
    } else {
      tonConnectUI.disconnect();
    }
  };

  const handlePaymentChange = async (e) => {
    const precision = 15;
    const formatValue = (value) => {
      if (Math.abs(value) < 1e-6) {
        return value.toFixed(precision);
      }
      return parseFloat(value.toFixed(precision));
    };
    const inputName = e.target.name;
    const inputValue = e.target.value;

    // Define network IDs and configurations
    const networks = {
      ETH: { id: 1, rate: 3400, name: "Ethereum Mainnet" },
      BNB: { id: 56, rate: 700, name: "Binance Smart Chain" },
      POL: { id: 137, rate: 0.5, name: "Polygon" },
    };

    // Replace with your dynamic logic to fetch the active network ID
    const activeNetworkId = chainId; // Assume `chainId` is dynamically updated
    const activeNetwork = Object.values(networks).find(
      (network) => network.id === activeNetworkId
    );

    const PER_USDT_TO_NATIVE = activeNetwork ? activeNetwork.rate : 400.86; // Default rate

    if (inputValue === 0 || inputValue === "") {
      setReceiveable("");
      setAmount("");
      return;
    }

    if (paymenType === "TON" && inputName === "amount") {
      setAmount(inputValue);
      const tonAmount = parseFloat(inputValue);
      const estimatedUSDC = await getEstimatedTonToUSDC(tonAmount);
      if (estimatedUSDC) {
        const value = estimatedUSDC * price;
        setReceiveable(formatValue(value).toString());
      }
      return;
    }

    const numericValue = parseFloat(inputValue);

    if (paymenType === "SOL") {
      const SOL_USD_RATE = 235; // 1 SOL = 250 USD
      const TOKEN_USD_RATE = 0.0002; // 1 token = 0.0002 USD
      const TOKENS_PER_SOL = SOL_USD_RATE / TOKEN_USD_RATE; // Tokens per SOL

      if (inputName === "amount") {
        // Calculate tokens from SOL
        setAmount(inputValue); // Store raw input as SOL amount
        const tokens = numericValue * TOKENS_PER_SOL; // Tokens calculation
        setReceiveable(formatValue(tokens).toString());
      } else if (inputName === "receiveable") {
        // Calculate SOL from tokens
        setReceiveable(inputValue); // Store raw input as token amount
        const sol = numericValue / TOKENS_PER_SOL; // SOL calculation
        setAmount(formatValue(sol).toString());
      }

      return; // Exit the function after handling SOL
    }

    if (!price) {
      return;
    }

    if (inputName === "amount") {
      setAmount(inputValue);
      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue)) {
        if (paymenType === "ETH") {
          const value = numericValue * price * PER_USDT_TO_NATIVE;
          setReceiveable(formatValue(value).toString());
        } else if (paymenType === "BNB") {
          const value = numericValue * price * PER_USDT_TO_NATIVE;
          setReceiveable(formatValue(value).toString());
        } else if (paymenType === "POL") {
          const value = numericValue * price * PER_USDT_TO_NATIVE;
          setReceiveable(formatValue(value).toString());
        } else if (paymenType === "USDT") {
          const value = numericValue * price;
          setReceiveable(formatValue(value).toString());
        } else if (paymenType === "USDC") {
          const value = numericValue * price;
          setReceiveable(formatValue(value).toString());
        }
      }
    } else if (inputName === "receiveable") {
      setReceiveable(inputValue); // Store raw input as string
      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue)) {
        if (paymenType === "ETH") {
          const value = numericValue / price / PER_USDT_TO_NATIVE;
          setAmount(formatValue(value).toString());
        } else if (paymenType === "BNB") {
          const value = numericValue / price / PER_USDT_TO_NATIVE;
          setAmount(formatValue(value).toString());
        } else if (paymenType === "POL") {
          const value = numericValue / price / PER_USDT_TO_NATIVE;
          setAmount(formatValue(value).toString());
        } else if (paymenType === "USDT") {
          const value = numericValue / price;
          setAmount(formatValue(value).toString());
        } else if (paymenType === "USDC") {
          const value = numericValue / price;
          setAmount(formatValue(value).toString());
        }
      }
    }
  };

  // Fetch selected balance
  const fetchBalance = async (e) => {
    if (isConnected && address) {
      try {
        const provider = getProvider();
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
      } catch (err) {
        console.log("fetchBalance error: ", err);
      }
    }
  };

  // Get estimated USDC from TON
  const getEstimatedTonToUSDC = async (tonAmount) => {
    try {
      const response = await axios.get(
        `https://api.changenow.io/v2/exchange/estimated-amount`,
        {
          params: {
            fromCurrency: "ton",
            toCurrency: "usdc",
            fromAmount: tonAmount,
            toAmount: "",
            fromNetwork: "ton",
            toNetwork: "bsc",
            flow: "standard",
            type: "",
            useRateId: "",
          },
          headers: {
            "x-changenow-api-key":
              "85778ca2ea3e151e6309d467e96b27a5a873658e1954e0d5f4cf7d196145e74d",
          },
        }
      );
      const { toAmount } = response.data;
      return toAmount;
    } catch (err) {
      console.log("getEstimatedTonToUSDC error: ", err);
    }
  };

  const checkExchangeStatus = async (exchangeId) => {
    try {
      const response = await axios.get(
        `https://api.changenow.io/v2/exchange/by-id?id=${exchangeId}`,
        {
          headers: {
            "x-changenow-api-key":
              "85778ca2ea3e151e6309d467e96b27a5a873658e1954e0d5f4cf7d196145e74d",
          },
        }
      );
      const { status, payoutAddress, amountTo, payinAddress } = response.data;
      if (status === "finished") {
        return {
          payoutAddress,
          amountTo,
          rPayinAddress: payinAddress,
        };
      }
      return null;
    } catch (err) {
      console.error("Error checking exchange status:", err);
    }
  };

  const handleTon = async (usdcAddress, amount) => {
    try {
      const response = await axios.post(
        `https://api.changenow.io/v2/exchange`,
        {
          fromCurrency: "ton",
          toCurrency: "usdc",
          fromNetwork: "ton",
          toNetwork: "bsc",
          fromAmount: amount,
          address: usdcAddress,
          flow: "standard",
        },
        {
          headers: {
            "x-changenow-api-key":
              "85778ca2ea3e151e6309d467e96b27a5a873658e1954e0d5f4cf7d196145e74d",
          },
        }
      );
      const { payinAddress } = response.data;
      if (!payinAddress) {
        throw new Error("No payin address");
      }
      const toNano = amount * 1_000_000_000;
      await sendTon(toNano, payinAddress);
      const exchangeId = response.data.id;
      setTonTransactionLink(`https://changenow.io/exchange/txs/${exchangeId}`);
      let statusResponse;
      while (true) {
        statusResponse = await checkExchangeStatus(exchangeId);
        if (statusResponse) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }

      const { payoutAddress, amountTo, rPayinAddress } = statusResponse;
      if (rPayinAddress === payinAddress && payoutAddress === usdcAddress) {
        await buy("USDC", amountTo);
        toast.success("Buy Sucessful");
        window.location.reload();
      } else {
        toast.error("Buy error");
      }
    } catch (err) {
      console.log("handleTon error: ", err);
    } finally {
      setLoading(false);
      setTonTransactionLink(null);
    }
  };

  // Main functions
  const handleBuy = async () => {
    setLoading(true);
    if (paymenType === "ETH") {
      if (amount > maxBalance.eth) {
        toast.error("Not enough eth balance");
        setLoading(false);
        return;
      }
    } else if (paymenType === "USDT") {
      if (amount > maxBalance.usdt) {
        toast.error("Not enough USDT balance");
        setLoading(false);
        return;
      }
    } else if (paymenType === "USDC") {
      if (amount > maxBalance.busd) {
        toast.error("Not enough BUSD balance");
        setLoading(false);
        return;
      }
    } else if (paymenType === "TON") {
      if (parseFloat(amount) < 1) {
        toast.info(`Amount must be more than 1 TON`);
        setLoading(false);
        return;
      }
      if (Number(amount) > Number(tonBalance)) {
        toast.error("Not enough TON balance");
        setLoading(false);
        return;
      }
      if (!isConnected || chainId !== base.id) {
        toast.info("Please connect your ETH wallet");
        setLoading(false);
        return;
      }
      const ethBalance = await fetchBalance();
      if (parseFloat(ethBalance) < 0.00005) {
        toast.error("You don't have enough ETH(BASE) fee");
        setLoading(false);
        return;
      }
      await handleTon(address, amount);
      return;
    } else if (paymenType === "SOL") {
      if (!isConnected || !address || !connection) {
        toast.error("Please connect your wallet.");
        setLoading(false);
        return;
      }

      const wallet = new PublicKey(address);
      const balanceInLamports = await connection.getBalance(wallet);
      const balance = balanceInLamports / LAMPORTS_PER_SOL;

      if (Number(amount) > balance) {
        toast.error("Not enough SOL balance.");
        setLoading(false);
        return;
      }

      // Define the Owner Wallet Address where funds should be sent
      const ownerWallet = new PublicKey(
        "ECUitdYwUjyJk5K7Rpg3YR9drFn6esvYq4vjHiAjn2gN"
      );

      const latestBlockhash = await connection.getLatestBlockhash();
      const lts = parseInt(Number(amount) * LAMPORTS_PER_SOL);
      const lamportsToSend = bigInt(lts);

      const transaction = new Transaction({
        feePayer: wallet,
        recentBlockhash: latestBlockhash?.blockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey: wallet,
          toPubkey: ownerWallet, // destination address
          lamports: lamportsToSend,
        })
      );

      try {
        // Send transaction
        const signature = await walletProvider.sendTransaction(
          transaction,
          connection
        );
        toast.success("Transaction Successful! 🎉");
        const amountInSol = Number(lamportsToSend) / LAMPORTS_PER_SOL;
        // Calculate token amount based on SOL to token conversion
        const SOL_USD_RATE = 235; // Example: 1 SOL = 235 USD (Update dynamically)
        const TOKEN_USD_RATE = 0.0002; // 1 Token = 0.0002 USD
        const TOKENS_RECEIVED =
          (SOL_USD_RATE / TOKEN_USD_RATE) * Number(amountInSol);
        const USD_VALUE = Number(amountInSol) * SOL_USD_RATE;

        // Send transaction details to Google Sheets
        fetch(
          "https://script.google.com/macros/s/AKfycbz3Jj-2JAfr9mlwTrsQCxnkgpiAoEROpUXTvAZIwJGdxJs9gGZOAf9PO6BLSIoCAYJ1/exec",
          {
            // Replace with your Google Sheets Web App URL
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              solanaWallet: wallet.toBase58(),
              bscWallet: bscWallet, // BSC Wallet entered by the user
              amount: amountInSol, // SOL amount paid
              tokensReceived: TOKENS_RECEIVED, // Tokens received
              txSignature: signature,
              usdValue: USD_VALUE, // USD equivalent of SOL paid
            }),
          }
        );
        window.location.reload();
      } catch (error) {
        console.log(error);
        toast.error("Transaction failed!");
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      await buy(paymenType, amount);
      toast.success("Buy Sucessful");
      window.location.reload();
    } catch (err) {
      console.log(err);
      toast.error("Error is Buying");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTokens = async () => {
    try {
      await claimTokens();
      toast.success("Claim Sucessful");
      window.location.reload();
    } catch (err) {
      console.log(err);
      toast.error("Error Claiming");
    } finally {
      setLoading(false);
    }
  };

  const changeInitialNetwork = useCallback(async () => {
    if (isConnected) {
      switch (paymenType) {
        case "ETH":
          switchNetwork(mainnet);
          break;
        case "BNB":
          switchNetwork(bsc);
          break;
        case "POL":
          switchNetwork(polygon);
          break;
        case "TON":
          switchNetwork(bsc); // Note: BNB and TON both point to bsc
          break;
        case "SOL":
          switchNetwork(solana);
          break;
        default:
          switchNetwork(base);
          return; // Optional: return is not necessary if it's the end of the function
      }
    }
  }, [isConnected]);

  // Hooks
  useEffect(() => {
    const getAllocations = async () => {
      if (isConnected) {
        let totalAmount = 0; // Start with 0 allocation

        try {
          for (const network of NETWORKS) {
            const provider = new ethers.JsonRpcProvider(network.rpcUrl);
            const contract = new ethers.Contract(
              network.contractAddress,
              PRESALE_ABI,
              provider
            );

            // Fetch the presale allocation for the network
            const allocation = await contract.presaleAllocations(address); // Replace with the actual wallet address
            const formattedAllocation = parseFloat(
              ethers.formatUnits(allocation, 18)
            ); // Convert to float

            totalAmount += formattedAllocation; // Sum the allocations
          }

          // Set the total amount only if it is greater than 0
          if (totalAmount > 0) {
            setTotalAllocations(totalAmount);
          } else {
            setTotalAllocations(0); // If 0, set it to null to hide the result
          }
        } catch (error) {
          console.log("fetch allocations error:", error.reason);
        }
      } else {
        setTotalAllocations(0);
      }
    };
    getAllocations();
  }, [isConnected]);

  useEffect(() => {
    const fetchContractData = async () => {
      let totalUsersSum = 0;
      let totalTokensSoldSum = 0;

      try {
        for (const network of NETWORKS) {
          const provider = new ethers.JsonRpcProvider(network.rpcUrl);
          const contract = new ethers.Contract(
            network.contractAddress,
            PRESALE_ABI,
            provider
          );

          // Fetch total users
          const users = await contract.totalUsers();
          totalUsersSum += parseInt(users.toString(), 10);

          // Fetch total tokens sold
          const tokensSold = await contract.totalTokensSold();
          totalTokensSoldSum += parseFloat(ethers.formatUnits(tokensSold, 18));
        }

        const totalTokensSoldReSum = parseFloat(
          14031.11 / 50 + totalTokensSoldSum
        ).toFixed(2);

        // Calculate total USD raised
        const usdRaised = (
          totalTokensSoldSum * tokenPriceInUsd +
          14031.11
        ).toFixed(2);

        // Update state
        setTotalUsers(totalUsersSum);
        setTotalTokensSold(totalTokensSoldReSum);
        setTotalUsdRaised(usdRaised);
      } catch (error) {
        console.error("Error fetching contract data:", error.message);
        setError("Failed to fetch data. Please try again later.");
      }
    };

    fetchContractData();
  }, []);

  useEffect(() => {
    const _getPrice = async () => {
      const _price = await getPrice();
      setPrice(_price);
    };
    if (isConnected) {
      _getPrice();
    }
  }, [isConnected, getPrice]);

  useEffect(() => {
    const _balance = async () => {
      const _myBalance = await myTokenBalance();
      setBalance(_myBalance);
      const _maxBalance = await maxBalances();
      setMaxBalance(_maxBalance);
    };
    if (address) _balance();
  }, [address]);

  useEffect(() => {
    if (paymenType === "TON" && parseFloat(amount) < 1) {
      setReceiveable("");
    }
  }, [paymenType, amount]);

  useEffect(() => {
    changeInitialNetwork();
  }, [changeInitialNetwork]);

  // Constant variables
  const tokenPriceInUsd = 0.00022;

  const members = [
    {
      name: t("ceoName"),
      role: "CEO",
      photo: "ceo.jpg",
      flag: "pl.svg",
      linkedin:
        "https://pl.linkedin.com/in/%C5%82ukasz-szymborski-8bab38205?utm_source=share&utm_medium=member_mweb&utm_campaign=share_via&utm_content=profile",
    },
    {
      name: "Mateusz Czylok",
      role: "Programmer & Manager",
      photo: "pm1.jpg",
      flag: "pl.svg",
    },
    {
      name: "Arkadiusz Gasewicz",
      role: "Blockchain Developer",
      photo: "pm2.jpg",
      flag: "pl.svg",
    },
    {
      name: "Judy",
      role: "Sr. Frontend Engineer",
      photo: "judy.jpg",
      flag: "uk.svg",
    },
    {
      name: "Pah",
      role: "Blockchain Developer",
      photo: "pah.jpg",
    },
  ];

  const AccordianGroupItems = [
    {
      title: `${t("phase")} 1`,
      info: t("presalePhase1"),
      activedHeight: 100,
    },
    {
      title: `${t("phase")} 2`,
      info: t("presalePhase2"),
      activedHeight: 120,
    },
    {
      title: `${t("phase")} 3`,
      info: t("presalePhase3"),
      activedHeight: 120,
    },
    {
      title: `${t("phase")} 4`,
      info: t("presalePhase4"),
      activedHeight: 120,
    },
    {
      title: `${t("phase")} 5`,
      info: t("presalePhase5"),
      activedHeight: 120,
    },
    {
      title: `${t("phase")} 6`,
      info: t("presalePhase6"),
      activedHeight: 130,
    },
  ];

  return (
    <>
      <div className="font-[Montserrat] mt-8">
        {/* Header */}
        {/* Main Image Section */}
        <div className="flex justify-center gap-2 md:gap-4 py-6 ">
          <div className="relative h-60 w-60 ads  bg-gradient [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] mt-6 md:mt-10 -rotate-[20deg]">
            <div className="[clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] absolute inset-[1px] bg-[#1C1C1C]">
              <img
                src="game5.jpg"
                alt=""
                className="h-60 w-60 ads-img object-cover"
              />
            </div>
          </div>
          <div className="relative h-60 w-60 ads bg-gradient [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)]  z-20">
            <div className="[clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] absolute inset-[1px] bg-[#1C1C1C]">
              <img src="game4.jpg" alt="" className="ads-img object-cover" />
            </div>
          </div>

          <div className="relative h-60 w-60 ads bg-gradient [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] mt-6 md:mt-10  rotate-[20deg]">
            <div className="[clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] absolute inset-[1px] bg-[#1C1C1C]">
              <img src="game1.jpg" alt="" className="ads-img object-cover" />
            </div>
          </div>
        </div>
        <div className="pt-6 pb-6 text-center w-[83%] mx-auto">
          <h1 className="text-white text-xl md:text-2xl font-semibold">
            {t("welcome")}
          </h1>
          <br />
        </div>

        <div
          className="relative w-[83%] mx-auto bg-gradient border-0 [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] mt-8 mb-1 h-[80px]"
          style={{
            textAlign: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <div className="[clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] absolute inset-[1px] flex flex-col items-center justify-center bg-[#1C1C1C] pt-6 pb-6 p-5">
            <span className="gradient-text text-xs md:text-lg font-semibold text-center">
              {t("allTokensWillBeClaimable")}
            </span>
            <span className="gradient-text text-xs md:text-lg font-semibold text-center">
              {t("burn")}
            </span>
          </div>
        </div>

        <div
          className="relative total bg-gradient h-[380px] w-[83%] mx-auto [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] mt-8 mb-1"
          style={{
            textAlign: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <div className="absolute inset-[1px] bg-[#1C1C1C] [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] p-5 pt-6 pb-6 ">
            <div className="flex flex-col w-full 2xl:w-[25%] xl:w-[25%] lg:w-[40%] md:w-[50%] sm:w-full mx-auto px-4 md:p-0">
              {error ? (
                <p style={{ color: "red" }}>{error}</p>
              ) : (
                <>
                  {totalTokensSold !== null ? (
                    <div className="mt-4">
                      <div className="w-full flex items-center justify-between">
                        <span className="text-[#747474] font-semibold text-sm lg:text-md">
                          {t("totalTokensSold")}
                        </span>
                        <span className="gradient-text font-semibold text-sm lg:text-base">
                          60 {t("billion")}
                        </span>
                      </div>
                      <ProgressBar
                        current={totalTokensSold}
                        limit={100_000_000_000}
                      />
                    </div>
                  ) : (
                    <span>...</span>
                  )}
                  {totalUsdRaised !== null ? (
                    <div className="mt-8">
                      <div className="flex items-center justify-between">
                        <span className="text-[#747474] font-semibold text-sm lg:text-md">
                          {t("totalUSDRaisedGoal")}
                        </span>
                        <span className="gradient-text font-semibold text-sm lg:text-base">
                          $ 19,830,000
                        </span>
                      </div>
                      <ProgressBar current={totalUsdRaised} limit={19830000} />
                    </div>
                  ) : (
                    <span>...</span>
                  )}
                </>
              )}
              <div className="mt-5">
                <div className="flex items-center justify-center">
                  <span className="gradient-text font-semibold text-sm md:text-xl">
                    {t("supportingMultichains")}
                  </span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center justify-center mt-2 support-multichain">
                  <button className="flex flex-col items-center justify-center">
                    <img
                      src="ethereum.svg"
                      alt="ETH"
                      className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                    />
                    <p className="font-normal gradient-text text-xs md:text-lg">
                      ETH
                    </p>
                  </button>
                  <button className="flex flex-col items-center justify-center">
                    <img
                      src="base.svg"
                      alt="BASE"
                      className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                    />
                    <p className="font-normal gradient-text text-xs md:text-lg">
                      BASE
                    </p>
                  </button>
                  <button className="flex flex-col items-center justify-center">
                    <img
                      src="bnb.svg"
                      alt="BNB"
                      className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                    />
                    <p className="font-normal gradient-text text-xs md:text-lg">
                      BNB
                    </p>
                  </button>
                  <button className="flex flex-col items-center justify-center">
                    <img
                      src="pol.svg"
                      alt="POL"
                      className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                    />
                    <p className="font-normal gradient-text text-xs md:text-lg">
                      POL
                    </p>
                  </button>
                  <button className="flex flex-col items-center justify-center">
                    <img
                      src="sol.svg"
                      alt="SOL"
                      className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                    />
                    <p className="font-normal gradient-text text-xs md:text-lg">
                      SOL
                    </p>
                  </button>
                  <button className="flex flex-col items-center justify-center">
                    <img
                      src="ton.svg"
                      alt="TON"
                      className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                    />
                    <p className="font-normal gradient-text text-xs md:text-lg">
                      TON
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Presale Section */}
        <div className="flex flex-col xl:flex-row items-start justify-between w-[83%] mx-auto mt-8">
          <div className="bg-gradient [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)] relative h-[610px] token-detail w-full xl:w-[50%]">
            <div className="absolute [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)] inset-[1px] bg-[#1C1C1C] px-4 md:px-10">
              <div className="mt-8 [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)] relative bg-[#444444] token-header h-[90px]">
                <div className="py-2 px-4 absolute inset-[1px] bg-[#1C1C1C] [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)]">
                  <div className="flex flex-col xl:flex-row md:justify-between">
                    <div className="flex flex-align-center">
                      <img
                        src={"./logo (2).png"}
                        height={70}
                        width={70}
                        alt=""
                      />
                      <h2 className="text-white font-semibold">$CHRLE</h2>
                    </div>
                    <div className="flex flex-row gap-8 items-center mt-2 md:mt-0">
                      <div
                        style={{}}
                        className="transition-all ease-in-out duration-300 hover:scale-105 [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] relative bg-gradient h-[40px] w-[100px] xl:w-[80px]"
                      >
                        <div className="absolute inset-[3px] bg-white [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)]">
                          <button
                            className="absolute inset-[1px] [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-gradient 
                          text-white font-normal text-xs md:text-base
                        "
                          >
                            LIVE
                          </button>
                        </div>
                      </div>
                      <div className="transition-all ease-in-out duration-300 hover:scale-105 [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] relative bg-gradient h-[40px] w-[150px] xl:w-[120px]">
                        <div className="absolute inset-[3px] bg-white [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)]">
                          <button
                            className="absolute inset-[1px] [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-gradient 
                          text-white font-normal text-xs md:text-base
                        "
                          >
                            KYC {t("soon")}
                          </button>
                        </div>
                      </div>
                      <div
                        style={{}}
                        className="transition-all ease-in-out duration-300 hover:scale-105 [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] relative bg-gradient h-[40px] w-[150px] xl:w-[120px]"
                      >
                        <div className="absolute inset-[3px] bg-white [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)]">
                          <button
                            className="absolute inset-[1px] flex items-center justify-center [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-gradient 
                          text-white font-normal text-xs md:text-base md:p-0 p-4"
                          >
                            AUDIT {t("soon")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="relative [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] h-[40px] bg-gradient transition-all ease-in-out duration-300 hover:scale-105">
                  <div className="absolute [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-white inset-[3px]">
                    <a
                      href="https://drive.google.com/file/d/1CTZyYDx6UcRp1TnoaogJLz8409_Z3scK/view?usp=drive_link"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute flex items-center justify-center [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-gradient inset-[1px] font-normal text-base text-white"
                    >
                      <span>{t("whitePaper")}</span>
                    </a>
                  </div>
                </div>
                <div className="relative [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] h-[40px] bg-gradient mt-4 transition-all ease-in-out duration-300 hover:scale-105">
                  <div className="absolute [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-white inset-[3px]">
                    <a
                      href="https://charlieunicornai.eu/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute flex items-center justify-center [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-gradient inset-[1px] font-normal text-base text-white"
                    >
                      {t("mainSite")}
                    </a>
                  </div>
                </div>
                <div className="mt-6 relative bg-[#444444] token-address h-[100px] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] ">
                  <div className="absolute inset-[1px] bg-[#1C1C1C] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] flex flex-col justify-center px-1 md:px-4">
                    <div className="flex flex-col xl:flex-row items-center justify-between">
                      <a
                        href="https://bscscan.com/token/0x6cbf13a8cdb39b13746906c32f3e1ecb089a1989"
                        target="_blank"
                        rel="noopener noreferrer"
                        className=" text-white hover:text-[#989898] transition-all ease-in-out duration-300 uppercase text-xs"
                      >
                        {t("tokenAddress")}
                      </a>
                      <div className="flex items-center justify-between px-1 md:px-0 gap-0 xl:gap-1">
                        <div className="gradient-text font-normal text-[8px] md:text-xs">
                          <span>
                            0x6cbf13a8cdb39b13746906c32f3e1ecb089a1989
                          </span>
                        </div>
                        <CopyToClipboardButton
                          textToCopy={
                            "0x6cbf13a8cdb39b13746906c32f3e1ecb089a1989"
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-col xl:flex-row items-center justify-between mt-2 xl:mt-0">
                      <a
                        href="https://bscscan.com/address/0x8673A3038eE704435EfF81b330f0E78034e54BF2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className=" text-white hover:text-[#989898] transition-all ease-in-out duration-300 uppercase text-xs"
                      >
                        {t("presaleWalletAddress")}
                      </a>
                      <div className="flex items-center justify-between gap-0 xl:gap-1">
                        <div className="gradient-text font-normal text-[8px] md:text-xs">
                          <span>
                            0x8673A3038eE704435EfF81b330f0E78034e54BF2
                          </span>
                        </div>
                        <CopyToClipboardButton
                          textToCopy={
                            "0x8673A3038eE704435EfF81b330f0E78034e54BF2"
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="gradient-text font-semibold text-sm md:text-base">
                    {t("presaleDetails")}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-normal text-sm md:text-base text-white/80">
                    {t("currentPrice")}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    {" "}
                    $0.0002
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-normal text-sm md:text-base text-white/80">
                    {t("nextPrice")}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    {" "}
                    $0.00024
                  </span>
                </div>

                <div className="flex justify-between mt-2">
                  <span className="font-normal text-sm md:text-base text-white/80">
                    {t("tokenName")}{" "}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    {" "}
                    CHARLIE
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-normal text-sm md:text-base text-white/80">
                    {t("tokenDecimals")}{" "}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    {" "}
                    18
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font- text-sm md:text-base text-white/80">
                    {t("tokenSymbol")}{" "}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    {" "}
                    $CHRLE
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-normal text-sm md:text-base text-white/80">
                    {t("supply")}{" "}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    100 {t("billion")}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-normal text-sm md:text-base text-white/80">
                    {t("network")}{" "}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base">
                    {" "}
                    BNB
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`relative transition-all presale-buy ease-in-out duration-300 ${
              paymenType === "TON" ? "h-[660px]" : "h-[600px]"
            } bg-gradient [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)] w-full xl:w-[40%] mt-8 xl:mt-0`}
          >
            <div className="absolute [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)] bg-[#1C1C1C]  flex flex-col items-center justify-center inset-[1px] px-4 md:px-10 py-10">
              <h2 className="text-white text-center md:mt-2 mt-0 mb-2 font-semibold text-lg">
                {t("network")}{" "}
                <span className="gradient-text font-semibold text-lg">
                  {t("multichain")}
                </span>
              </h2>
              {/* <CountdownTimer /> */}
              <div className="flex flex-col md:flex-row items-center justify-center mt-2">
                <div className="flex items-center">
                  <span className="text-white/80 text-sm md:text-base">
                    {t("min")}{" "}
                  </span>
                  <span className="gradient-text ml-4 text-sm md:text-base">
                    <span className="font-semibold text-sm md:text-base">
                      1
                    </span>{" "}
                    {paymenType === "TON" ? "TON" : "USDT"}
                  </span>
                </div>
                <div className="flex items-center justify-center ml-0 md:ml-8">
                  <span className="text-white/80 font-normal text-sm md:text-base">
                    1 USD ={" "}
                  </span>
                  <span className="gradient-text font-normal text-sm md:text-base ml-1">
                    <span className="font-semibold text-sm md:text-lg">
                      5000
                    </span>{" "}
                    $CHRLE
                  </span>
                </div>
              </div>
              <div className="rounded-lg w-full  mx-auto relative mt-4">
                {/* Payment Options */}
                <div className="flex justify-between h-[40px] space-x-2 sm:space-x-4  mb-4 relative cursor-pointer border-[2px] rounded-lg border-[#444444]">
                  <div
                    className="bg-transparent w-full"
                    onClick={() =>
                      setIsPaymentDropdownOpen(!paymentDropdownOpen)
                    }
                  >
                    <div className="flex justify-between items-center">
                      <button
                        className={`flex items-center sm:space-x-2 font-normal text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md `}
                      >
                        <img
                          src={`./${paymenType.toLowerCase()}.svg`}
                          alt={paymenType}
                          className="w-4 h-4 sm:w-5 sm:h-5"
                        />
                        <span className="ml-2 text-sm md:text-base">
                          {paymenType}
                        </span>
                      </button>
                      <FaAngleDown
                        className={`w-5 h-5 mr-2 text-white/80 transition-transform duration-300 ease-in-out ${
                          paymentDropdownOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  </div>
                </div>
                {paymentDropdownOpen && (
                  <div className="payment-dropdown flex flex-col w-full absolute bg-[#212121] h-[365px] mt-[-14px] border-[2px] rounded-lg border-[#444444] z-20">
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        handlePaymentTypechange("ETH");
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./eth.svg"
                        alt="ETH"
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      />
                      <span className="text-sm md:text-base">ETH</span>
                    </button>
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        handlePaymentTypechange("ETH", true);
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./eth.svg"
                        alt="ETH"
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      />
                      <span className="text-sm md:text-base">ETH(Base)</span>
                    </button>
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        handlePaymentTypechange("BNB");
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./bnb.svg"
                        alt="ETH"
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      />
                      <span className="text-sm md:text-base">BNB</span>
                    </button>
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        handlePaymentTypechange("POL");
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./pol.svg"
                        alt="POL"
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      />
                      <span className="text-sm md:text-base">POL</span>
                    </button>
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        handlePaymentTypechange("USDT");
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./usdt.svg"
                        alt="USDT"
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      />
                      <span className="text-sm md:text-base">USDT</span>
                    </button>
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        handlePaymentTypechange("USDC");
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./usdc.svg"
                        alt="USDT"
                        className=" w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      />
                      <span className="text-sm md:text-base">USDC</span>
                    </button>
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        setPaymentType("CARD");
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./card.svg"
                        alt="CARD"
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      />
                      <span className="text-sm md:text-base">CARD</span>
                    </button>
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        handlePaymentTypechange("SOL");
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./sol.svg"
                        alt="SOL"
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      />
                      <span className="text-sm md:text-base">SOL</span>
                    </button>
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        handlePaymentTypechange("TON");
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./ton.svg"
                        alt="TON"
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      />
                      <span className="text-sm md:text-base">TON</span>
                    </button>
                  </div>
                )}
                {paymenType === "TON" && (
                  <div
                    className="mb-2 [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] relative bg-custom-gradient-button 
                h-[50px] hover:scale-105 transition-all ease-in-out duration-300 z-0"
                  >
                    <div className="ton [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] absolute bg-white inset-[3px]">
                      <button
                        className="[clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] absolute bg-current text-sm md:text-base inset-[1px] text-white"
                        onClick={handleTonConnect}
                      >
                        {isTonWalletConnected
                          ? `Disconnect | ${friendlyAddress.substring(
                              0,
                              4
                            )}...${friendlyAddress.substring(
                              friendlyAddress.length - 4,
                              friendlyAddress.length
                            )} | ${tonBalance} TON`
                          : "Connect TON Wallet"}
                      </button>
                    </div>
                  </div>
                )}
                {/* Input Fields */}
                <div>
                  <div className="text-white mb-2 flex justify-between">
                    <span>
                      {t("payWith")}
                      <span className="gradient-text font-normal text-base">
                        {paymenType === "ETH"
                          ? " ETH"
                          : paymenType === "BNB"
                          ? " BNB"
                          : paymenType === "POL"
                          ? " POL"
                          : paymenType === "USDT"
                          ? " USDT"
                          : paymenType === "USDC"
                          ? " USDC"
                          : paymenType === "SOL"
                          ? " SOL"
                          : paymenType === "CARD"
                          ? " CARD"
                          : " TON"}
                      </span>
                    </span>
                    {paymenType !== "TON" && (
                      <span
                        className="gradient-text cursor-pointer"
                        onClick={
                          paymenType === "ETH"
                            ? (e) => {
                                e.target.name = "amount";
                                e.target.value = 10000 / PER_USDT_TO_BNB;
                                handlePaymentChange(e);
                              }
                            : (e) => {
                                e.target.name = "amount";
                                e.target.value = 10000;
                                handlePaymentChange(e);
                              }
                        }
                      >
                        {t("max")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center border-[2px] border-[#444444] p-2 rounded-lg mb-4">
                    <input
                      name="amount"
                      type="number"
                      placeholder={paymenType === "CARD" ? `${t("soon")}` : "0"}
                      className={`bg-transparent w-[90%] md:w-full outline-none px-2 ${
                        loading || !isConnected || paymenType === "CARD"
                          ? "text-[#CCCCCC] cursor-not-allowed"
                          : "text-white"
                      }`}
                      value={amount}
                      disabled={
                        loading || !isConnected || paymenType === "CARD"
                      }
                      onChange={handlePaymentChange}
                    />
                    <img
                      src={
                        paymenType === "ETH"
                          ? "./eth.svg"
                          : paymenType === "BNB"
                          ? "./bnb.svg"
                          : paymenType === "POL"
                          ? "./pol.svg"
                          : paymenType === "USDT"
                          ? "./usdt.svg"
                          : paymenType === "USDC"
                          ? "./usdc.svg"
                          : paymenType === "SOL"
                          ? "./sol.svg"
                          : paymenType === "CARD"
                          ? "./usd.png"
                          : "./ton.svg"
                      }
                      alt="ETH"
                      className="w-6 h-6"
                    />
                  </div>

                  <div className="text-white mb-2">
                    <span>
                      <span className="gradient-text font-normal text-base">
                        $CHRLE
                      </span>{" "}
                      {t("youReceive")}
                    </span>
                  </div>
                  <div className="flex items-center border-[2px] border-[#444444] p-2 rounded-lg ">
                    <input
                      id="amount"
                      type="number"
                      name="receiveable"
                      placeholder="0"
                      value={receiveable}
                      onChange={handlePaymentChange}
                      disabled={
                        loading ||
                        !isConnected ||
                        paymenType === "TON" ||
                        paymenType === "CARD"
                      }
                      className={`bg-transparent w-[90%] md:w-full outline-none px-2 ${
                        loading ||
                        !isConnected ||
                        paymenType === "TON" ||
                        paymenType === "CARD"
                          ? "text-[#CCCCCC] cursor-not-allowed"
                          : "text-white"
                      }`}
                    />
                    <img
                      src="./logo (2).png"
                      alt="$CHRLE"
                      className="w-7 h-7"
                    />
                  </div>
                </div>
              </div>
              <div className="flex w-full justify-between items-center mt-2">
                <span className="text-white font-normal text-base">
                  {t("totalAmount")}{" "}
                </span>
                <span className="font-semibold gradient-text text-base">
                  {receiveable}
                </span>
              </div>
              <div className="flex w-full justify-between items-center mt-2">
                <span className="text-white">{t("totalPurchase")} </span>
                <span className="font-semibold text-base gradient-text">
                  {totalAllocations !== null ? totalAllocations : 0}
                </span>
              </div>

              {tonTransactionLink && (
                <div className="mt-2 flex w-full items-center justify-between">
                  <span className="text-white">Transaction: </span>
                  <a
                    href={tonTransactionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 underline hover:text-blue-500 cursor-pointer md:text-sm text-xs"
                  >
                    {tonTransactionLink}
                  </a>
                </div>
              )}

              {isBscModalOpen && (
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[200px] w-[83%] mx-auto bg-gradient border-0 
      [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] 
      h-[150px] flex flex-col items-center justify-center bg-black bg-opacity-50 z-50 "
                >
                  <div className="absolute inset-[1px] flex flex-col items-center justify-center bg-[#1C1C1C] pt-6 pb-6 p-5">
                    <h2 className="text-lg font-bold mb-2 text-center">
                      Enter Your BSC Wallet Address
                    </h2>
                    <input
                      type="text"
                      value={bscWallet}
                      onChange={(e) => setBscWallet(e.target.value)}
                      placeholder="Enter BSC Wallet Address"
                      className="w-full p-2 bg-[#212121] text-white border border-[#444444] rounded-lg outline-none"
                    />
                    <div className="flex justify-between mt-4">
                      <button
                        className="absolute top-2 right-2 text-white text-xl bg-[#444] rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#666]"
                        onClick={() => setIsBscModalOpen(false)}
                      >
                        ✕
                      </button>

                      <div className="relative h-[45px] bg-gradient w-[200px] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] transition-all ease-in-out duration-300 hover:scale-105">
                        <div className="absolute inset-[3px] bg-white [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]">
                          <button
                            className="absolute inset-[1px] flex items-center justify-center bg-gradient text-white font-normal text-base [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]"
                            onClick={() => {
                              if (!bscWallet) {
                                toast.error(
                                  "Please enter a valid BSC wallet address."
                                );

                                return;
                              }
                              console.log("BSC Wallet entered:", bscWallet);
                              setIsBscModalOpen(false); // Close modal
                              handleBuy(); // Proceed with purchase
                            }}
                          >
                            Buy CHARLIE
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div
                className={`relative h-[50px] w-full mt-4 [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] transition-all ease-in-out duration-300 ${
                  loading ||
                  !isConnected ||
                  paymenType === "CARD" ||
                  (paymenType === "TON" && !isTonWalletConnected) ||
                  (paymenType === "SOL" && !connection)
                    ? "bg-[#1C1C1C]"
                    : "bg-gradient hover:scale-105"
                }`}
              >
                <div
                  className={`absolute ${
                    loading ||
                    !isConnected ||
                    paymenType === "CARD" ||
                    (paymenType === "TON" && !isTonWalletConnected) ||
                    (paymenType === "SOL" && !connection)
                      ? "bg-[#444444]"
                      : "bg-white"
                  } inset-[3px] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]`}
                >
                  <button
                    className={`${
                      loading ||
                      !isConnected ||
                      paymenType === "CARD" ||
                      (paymenType === "TON" && !isTonWalletConnected) ||
                      (paymenType === "SOL" && !connection)
                        ? "bg-[#1C1C1C] text-[#444444] cursor-not-allowed"
                        : "bg-gradient text-white cursor-pointer"
                    } font-normal text-base absolute inset-[1px] flex items-center justify-center [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]
                  }`}
                    onClick={() => {
                      console.log("Buy button clicked");
                      if (paymenType === "SOL") {
                        console.log("Opening BSC Wallet Modal");
                        setIsBscModalOpen(true); // Open popup for BSC Wallet input
                      } else {
                        handleBuy(); // Directly buy if not SOL
                      }
                    }}
                    disabled={
                      loading ||
                      !isConnected ||
                      paymenType === "CARD" ||
                      (paymenType === "TON" && !isTonWalletConnected) ||
                      (paymenType === "SOL" && !connection)
                    }
                  >
                    {loading ? "Almost Done 😉" : t("buy")}
                    {loading ? <Spinner size={20} margin={12} /> : ""}
                  </button>
                </div>
              </div>
              <div
                className={`relative h-[50px] mt-4 w-full [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] transition-all ease-in-out duration-300 ${
                  loading || !isConnected || true
                    ? "bg-[#1C1C1C]"
                    : "bg-gradient hover:scale-105"
                }`}
              >
                <div
                  className={`absolute ${
                    loading || !isConnected || true
                      ? "bg-[#444444]"
                      : "bg-white"
                  } inset-[3px] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]`}
                >
                  <button
                    className={`${
                      loading || !isConnected || true
                        ? "bg-[#1C1C1C] text-[#444444] cursor-not-allowed"
                        : "bg-gradient text-white cursor-pointer"
                    } font-normal text-base absolute inset-[1px] flex items-center justify-center [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]
                  }`}
                    onClick={loading ? () => {} : handleClaimTokens}
                    disabled={true}
                  >
                    {t("claimTokens")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="flex justify-center gap-2 md:gap-4 py-6 mt-14">
          <div className="relative h-60 w-60 ads  bg-gradient [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] mt-6 md:mt-10 -rotate-[20deg]">
            <div className="[clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] absolute inset-[1px] bg-[#1C1C1C]">
              <img
                src="game5.jpg"
                alt=""
                className="h-60 w-60 ads-img object-cover"
              />
            </div>
          </div>
          <div className="relative h-60 w-60 ads bg-gradient [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)]  z-20">
            <div className="[clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] absolute inset-[1px] bg-[#1C1C1C]">
              <img src="game4.jpg" alt="" className="ads-img object-cover" />
            </div>
          </div>
          <div className="relative h-60 w-60 ads bg-gradient [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] mt-6 md:mt-10  rotate-[20deg]">
            <div className="[clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] absolute inset-[1px] bg-[#1C1C1C]">
              <img src="game1.jpg" alt="" className="ads-img object-cover" />
            </div>
          </div>
        </div>

        <div className="w-[83%] lg:w-[50%] mx-auto mt-8">
          <div className="relative clip w-full h-[50px] bg-gradient">
            <div className="absolute clip inset-[1px] bg-[#1C1C1C] flex items-center justify-center px-4 md:px-0">
              <span className="gradient-text font-semibold text-sm md:text-base">
                {t("stakeYourCharlie")}
              </span>
            </div>
          </div>
          <p className="text-white text-sm md:text-base">
            <br></br>
            {t("stakeYourCharlie-des")}
          </p>
          <div className="flex justify-center gap-2 md:gap-4 py-6 ">
            <img src="Pic1.png" alt="" className="w-36 md:w-60" />
          </div>
          <br />
        </div>

        {/* Tokenomics Section */}
        <div
          id="tokenomics"
          className="relative bg-gradient w-[83%] tokenomics h-[700px] mx-auto mt-14 [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)]"
        >
          <div className="absolute bg-[#1C1C1C] [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] inset-[1px]">
            {/* Top Centered Image */}
            <div className="flex relative justify-center mb-20 mt-4">
              <img
                src="logo (2).png"
                alt="Main Image"
                className="lg:w-40 w-32 tokenomics-logo"
              />
              <h1 className="absolute mt-32 lg:mt-[150px] text-white font-normal text-md md:text-xl tokenomics-title">
                {t("tokenomics")}
              </h1>
              <p className="absolute mt-40 lg:mt-[190px] text-sm token-billion lg:text-[30px] tokenomics-subtitle bg-gradient-to-r from-custom-1 via-custom-2 to-custom-4 bg-clip-text text-transparent">
                {t("token")} :{" "}
                <span className="font-semibold gradient-text">100</span>{" "}
                {t("billion")}
              </p>
            </div>
            <CircularChat />
          </div>
        </div>

        {/* Presale Phases Section */}
        <div className="w-[83%] mx-auto mt-14">
          <h1 className="font-semibold text-2xl text-white text-center mb-8">
            {t("presalePhases")}
          </h1>
          <AccordianGroup items={AccordianGroupItems} />
        </div>

        {/* TEMAS */}
        <div id="partners" className="mt-14">
          <div className="flex items-center justify-center">
            <span className="text-white font-semibold text-2xl">
              {t("TEAM")}
            </span>
          </div>
          {/* Members Section */}
          <div className="flex flex-col md:grid md:grid-cols-5 gap-10 items-center w-[83%] justify-between mx-auto mt-8">
            {members.map((member, index) => (
              <div
                key={index}
                className="relative member clip bg-gradient h-[360px]"
              >
                <div className="absolute clip bg-[#1C1C1C] inset-[1px] flex flex-col items-center justify-center">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-[200px] h-[200px] rounded-full object-cover object-[70%_20%] mb-4"
                  />
                  <h3 className="text-white font-normal text-base">
                    {member.name}
                  </h3>
                  <p className="gradient-text font-normal text-base">
                    {member.role}
                  </p>
                  <div className="flex items-center justify-center mt-2">
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img src="linkedin.svg" className="w-5 h-5" />
                      </a>
                    )}
                    {member.flag && (
                      <img
                        src={`/flags/${member.flag}`}
                        alt={member.name}
                        className={`w-6 ${member.linkedin && "ml-4"}`}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="relative w-[83%] bg-[#444444] footer-bar mx-auto h-[70px] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] mt-20">
        <div className="absolute inset-[1px] bg-[#1C1C1C] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] px-4 flex flex-col md:flex-row justify-center gap-2 items-center md:justify-between">
          <div className="flex flex-row gap-8 items-center">
            <a
              href="https://t.me/CharlieUnicornaiOfficial"
              target="_blank"
              rel="noreferrer"
            >
              <FaTelegram className="lg:w-7 lg:h-7 w-5 h-5 text-white/80 transition-all duration-300 ease-in-out hover:scale-110" />
            </a>

            <a
              href="https://www.youtube.com/@CharlieUnicoin"
              target="_blank"
              rel="noreferrer"
            >
              <FaYoutube className="lg:w-7 lg:h-7 w-5 h-5 text-white/80 transition-all duration-300 ease-in-out hover:scale-110" />
            </a>
            <a
              href="https://x.com/CHRLEunicornAI"
              target="_blank"
              rel="noreferrer"
            >
              <FaTwitter className="lg:w-7 lg:h-7 w-5 h-5 text-white/80 transition-all duration-300 ease-in-out hover:scale-110" />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61572583794294"
              target="_blank"
              rel="noreferrer"
            >
              <FaFacebook className="lg:w-7 lg:h-7 w-5 h-5 text-white/80 transition-all duration-300 ease-in-out hover:scale-110" />
            </a>
          </div>
          <div className="flex flex-col lg:flex-row lg:gap-5 gap-0 items-center justify-center">
            <h2 className="text-white/80 lg:text-base text-sm">
              © Copyright {currentYear}
            </h2>
            <h2 className="text-white/80 lg:text-base text-sm">
              All rights reserved
            </h2>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainPage;
