import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PER_USDT_TO_BNB } from "../contracts/contracts";
import useContract from "../hooks/useContract";
import { FaAngleDown } from "react-icons/fa";
import CopyToClipboardButton from "./CoppyBtn";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { PRESALE_CONTRACT_ADDRESS, PRESALE_ABI } from "../contracts/contracts";
import { ethers } from "ethers";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useCustomTonWallet } from "../context/TonWalletContext";
import { base } from "@reown/appkit/networks";
import { Link } from "react-router-dom";
import AccordianGroup from "./AccordianGroup";
import ProgressBar from "./ProgressBar";
import CircularChat from "./CircularChat";
import "../responsive.css";
import Spinner from "./Spinner";
import { useTranslation } from "react-i18next";
import axios from "axios";

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
  const [unclaimedTokens, setUnclaimedTokens] = useState(null);
  const [tonTransactionLink, setTonTransactionLink] = useState(null);
  const { t } = useTranslation();
  const {
    buy,
    myTokenBalance,
    maxBalances,
    getPrice,
    claimTokens,
    getPresaleAllocation,
    getProvider,
  } = useContract();
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork, chainId } = useAppKitNetwork();
  const [tonConnectUI] = useTonConnectUI();
  const { isTonWalletConnected, friendlyAddress, tonBalance, sendTon } =
    useCustomTonWallet();

  // Handle change or other events
  const handlePaymentTypechange = async (type) => {
    setPaymentType(type);
    setAmount(0);
    setReceiveable(0);
  };

  const handleTonConnect = () => {
    if (!isTonWalletConnected) {
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

    if (!price) {
      return;
    }

    if (inputName === "amount") {
      setAmount(inputValue);
      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue)) {
        if (paymenType === "ETH") {
          const value = numericValue * price * PER_USDT_TO_BNB;
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
      setReceiveable(inputValue);
      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue)) {
        if (paymenType === "ETH") {
          const value = numericValue / price / PER_USDT_TO_BNB;
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
            toNetwork: "base",
            flow: "fixed-rate",
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
      if (toAmount) {
        return toAmount;
      }
      return null;
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
          toNetwork: "base",
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
      if (Number(amount) > Number(tonBalance)) {
        toast.error("Not enough TON balance");
        setLoading(false);
        return;
      }
      if (parseFloat(amount) < 2.1) {
        toast.info("Amount must be more than 2.1 TON");
        setLoading(false);
        return;
      }
      if (!isConnected || chainId !== base.id) {
        toast.info("Please connect your ETH wallet");
        setLoading(false);
        return;
      }
      const ethBalance = await fetchBalance();
      if (parseFloat(ethBalance) < 0.0001) {
        toast.error("You don't have enough ETH fee");
        setLoading(false);
        return;
      }
      await handleTon(address, amount);
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

  // Hooks
  useEffect(() => {
    const _getPrice = async () => {
      const _price = await getPrice();
      setPrice(_price);
    };
    if (isConnected) _getPrice();
  }, [isConnected]);

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
    if (isConnected && chainId !== base.id) {
      switchNetwork(base);
    }
  }, [isConnected, chainId]);

  useEffect(() => {
    const fetchUnclaimedTokens = async () => {
      try {
        const allocation = await getPresaleAllocation();
        setUnclaimedTokens(allocation);
      } catch (error) {
        console.error(
          "Error fetching unclaimed tokens:",
          error.message || error
        );
        setError(error.message || "Failed to fetch unclaimed tokens.");
      }
    };

    fetchUnclaimedTokens();
  }, [getPresaleAllocation]);

  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        // Connect to the Ethereum network using a public RPC provider
        const provider = new ethers.JsonRpcProvider(
          "https://rpc.ankr.com/base"
        );

        // Create a contract instance
        const contract = new ethers.Contract(
          PRESALE_CONTRACT_ADDRESS,
          PRESALE_ABI,
          provider
        );

        // Call the `totalUsers` function
        const users = await contract.totalUsers();
        setTotalUsers(users.toString()); // Convert BigNumber to string
      } catch (error) {
        console.error("Error fetching total users:", error.message);
        setError("Failed to fetch total users. Please try again later.");
      }
    };

    fetchTotalUsers();
  }, []);

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        // Connect to the Ethereum network using a public RPC provider
        const provider = new ethers.JsonRpcProvider(
          "https://rpc.ankr.com/base"
        );

        // Create a contract instance
        const contract = new ethers.Contract(
          PRESALE_CONTRACT_ADDRESS,
          PRESALE_ABI,
          provider
        );

        // Fetch `totalUsers` from the contract
        const users = await contract.totalUsers();
        setTotalUsers(users.toString()); // Convert BigNumber to string

        // Fetch `totalTokensSold` from the contract
        const tokensSold = await contract.totalTokensSold();
        const formattedTokensSold = parseFloat(
          ethers.formatUnits(tokensSold, 18)
        ).toFixed(2); // Format to two decimals
        setTotalTokensSold(formattedTokensSold);
      } catch (error) {
        console.error("Error fetching contract data:", error.message);
        setError("Failed to fetch data. Please try again later.");
      }
    };

    fetchContractData();
  }, []);

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        // Connect to the Ethereum network using a public RPC provider
        const provider = new ethers.JsonRpcProvider(
          "https://rpc.ankr.com/base"
        );

        // Create a contract instance
        const contract = new ethers.Contract(
          PRESALE_CONTRACT_ADDRESS,
          PRESALE_ABI,
          provider
        );

        // Fetch `totalUsers` from the contract
        const users = await contract.totalUsers();
        setTotalUsers(users.toString()); // Convert BigNumber to string

        // Fetch `totalTokensSold` from the contract
        const tokensSold = await contract.totalTokensSold();
        const formattedTokensSold = parseFloat(
          ethers.formatUnits(tokensSold, 18)
        ).toFixed(2); // Format to two decimals
        setTotalTokensSold(formattedTokensSold);

        // Calculate total USD raised
        const usdRaised = (formattedTokensSold * tokenPriceInUsd).toFixed(2); // Multiply tokens sold by price
        setTotalUsdRaised(usdRaised);
      } catch (error) {
        console.error("Error fetching contract data:", error.message);
        setError("Failed to fetch data. Please try again later.");
      }
    };

    fetchContractData();
  }, []);

  useEffect(() => {
    setAmount("");
    setReceiveable("");
  }, [paymenType]);

  // Constant variables
  const tokenPriceInUsd = 0.00022; // Example price per token in USD (adjust this)

  const members = [
    {
      name: t("ceoName"),
      role: "CEO",
      photo: "ceo.jpg",
      flag: "poland_flag.svg",
      linkedin:
        "https://pl.linkedin.com/in/%C5%82ukasz-szymborski-8bab38205?utm_source=share&utm_medium=member_mweb&utm_campaign=share_via&utm_content=profile",
    },
  ];

  const developers = [
    {
      name: "Arek",
    },
    {
      name: "Mati",
    },
    {
      name: "Pah",
    },
    {
      name: "Vlad",
    },
    {
      name: "Juri",
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
          <div className="[clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] absolute inset-[1px] flex items-center justify-center bg-[#1C1C1C] pt-6 pb-6 p-5">
            <span className="gradient-text text-sm md:text-lg font-semibold text-center">
              {t("allTokensWillBeClaimable")}
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
                  {/* {totalUsers !== null ? (
                    <div className="w-full flex items-center justify-between">
                      <span className="text-[#747474] font-semibold text-sm md:text-lg">
                        Total Unique Users :{" "}
                      </span>
                      <span className="gradient-text font-semibold text-sm md:text-xl">
                        {totalUsers}
                      </span>
                    </div>
                  ) : (
                    <span>...</span>
                  )}
                  <div className="h-[1px] w-full bg-gradient mt-1"></div> */}
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
                <div className="flex flex-row gap-8 items-start justify-center mt-2 support-multichain">
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src="ethereum.svg"
                      alt="ETH"
                      className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                    />
                    <p className="font-normal gradient-text text-xs md:text-lg">
                      ETH
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src="base.svg"
                      alt="BASE"
                      className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                    />
                    <p className="font-normal gradient-text text-xs md:text-lg">
                      BASE
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src="ton.svg"
                      alt="TON"
                      className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                    />
                    <p className="font-normal gradient-text text-xs md:text-lg">
                      TON
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src="bnb.svg"
                      alt="BNB"
                      className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                    />
                    <p className="font-normal gradient-text text-xs md:text-lg">
                      BNB
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src="sol.svg"
                      alt="SOL"
                      className="md:w-12 md:h-12 w-10 h-10 transition-all ease-in-out duration-300 hover:scale-110 cursor-pointer"
                    />
                    <p className="font-normal gradient-text text-xs md:text-lg">
                      SOLANA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Presale Section */}
        <div className="flex flex-col lg:flex-row items-start justify-between w-[83%] mx-auto mt-8">
          <div className="bg-gradient [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)] relative h-[610px] token-detail w-full lg:w-[50%]">
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
                      <div className="transition-all ease-in-out duration-300 hover:scale-105 [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] relative bg-gradient h-[40px] w-[100px] xl:w-[80px]">
                        <div className="absolute inset-[3px] bg-white [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)]">
                          <button
                            className="absolute inset-[1px] [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-gradient 
                          text-white font-normal text-xs md:text-base
                        "
                          >
                            KYC
                          </button>
                        </div>
                      </div>
                      <div
                        style={{}}
                        className="transition-all ease-in-out duration-300 hover:scale-105 [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] relative bg-gradient h-[40px] w-[100px] xl:w-[80px]"
                      >
                        <div className="absolute inset-[3px] bg-white [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)]">
                          <a
                            href="https://www.cyberscope.io/audits/chrle"
                            className="absolute inset-[1px] flex items-center justify-center [clip-path:polygon(0%_0.8em,_0.8em_0%,_100%_0%,_100%_calc(100%_-_0.8em),_calc(100%_-_0.8em)_100%,_0_100%)] bg-gradient 
                          text-white font-normal text-xs md:text-base
                        "
                          >
                            AUDIT
                          </a>
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
                        href="https://basescan.org/address/0xBde71bB4593C4964dad1A685CbE9Cf6a2cDBDca7"
                        className=" text-white hover:text-[#989898] transition-all ease-in-out duration-300 uppercase text-xs"
                      >
                        {t("tokenAddress")}
                      </a>
                      <div className="flex items-center justify-between px-1 md:px-0 gap-0 xl:gap-1">
                        <div className="gradient-text font-normal text-[8px] md:text-xs">
                          <span>
                            0xBde71bB4593C4964dad1A685CbE9Cf6a2cDBDca7
                          </span>
                        </div>
                        <CopyToClipboardButton
                          textToCopy={
                            "0xBde71bB4593C4964dad1A685CbE9Cf6a2cDBDca7"
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-col xl:flex-row items-center justify-between mt-2 xl:mt-0">
                      <a
                        href="https://basescan.org/address/0xdDc631F8197C9bb390B28a7604A2ddC65dC662FC#internaltx"
                        className=" text-white hover:text-[#989898] transition-all ease-in-out duration-300 uppercase text-xs"
                      >
                        {t("presaleWalletAddress")}
                      </a>
                      <div className="flex items-center justify-between gap-0 xl:gap-1">
                        <div className="gradient-text font-normal text-[8px] md:text-xs">
                          <span>
                            0xdDc631F8197C9bb390B28a7604A2ddC65dC662FC
                          </span>
                        </div>
                        <CopyToClipboardButton
                          textToCopy={
                            "0xdDc631F8197C9bb390B28a7604A2ddC65dC662FC"
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
                    Base {t("network")} (ETH)
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`relative transition-all presale-buy ease-in-out duration-300 ${
              paymenType === "TON" ? "h-[660px]" : "h-[600px]"
            } bg-gradient [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)] w-full lg:w-[40%] mt-8 lg:mt-0`}
          >
            <div className="absolute [clip-path:polygon(0%_1.5em,_1.5em_0%,_100%_0%,_100%_calc(100%_-_1.5em),_calc(100%_-_1.5em)_100%,_0_100%)] bg-[#1C1C1C] inset-[1px] px-4 md:px-10 py-10">
              <h2 className="text-white text-center md:mt-2 mt-0 mb-2 font-semibold text-xs md:text-lg">
                {t("network")}{" "}
                <span className="gradient-text font-semibold text-xs md:text-lg">
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
                      {paymenType === "TON" ? 2.1 : 1}
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
                  <div className="payment-dropdown flex flex-col w-full absolute bg-[#212121] h-[205px] mt-[-14px] border-[2px] rounded-lg border-[#444444] z-20">
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
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <span className="text-sm md:text-base">ETH</span>
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
                        className="w-4 h-4 sm:w-5 sm:h-5"
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
                        className=" w-4 h-4 sm:w-5 sm:h-5"
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
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <span className="text-sm md:text-base">CARD</span>
                    </button>
                    <button
                      onClick={(e) => {
                        setIsPaymentDropdownOpen(false);
                        setPaymentType("TON");
                      }}
                      className={`flex items-center sm:space-x-2 font-normal hover:bg-custom-gradient-button text-white hover:bg- px-[.50rem] py-2 sm:px-4 sm:py-2 shadow-md`}
                    >
                      <img
                        src="./ton.svg"
                        alt="TON"
                        className="w-4 h-4 sm:w-5 sm:h-5"
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
                        className="[clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] absolute bg-current inset-[1px] text-white"
                        onClick={handleTonConnect}
                      >
                        {isTonWalletConnected
                          ? `Disconnect | ${friendlyAddress.substring(
                              0,
                              4
                            )}... | ${tonBalance} TON`
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
                          : paymenType === "USDT"
                          ? " USDT"
                          : paymenType === "USDC"
                          ? " USDC"
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
                      placeholder="0"
                      className={`bg-transparent w-[90%] md:w-full outline-none px-2 ${
                        loading || !isConnected
                          ? "text-[#CCCCCC] cursor-not-allowed"
                          : "text-white"
                      }`}
                      value={amount}
                      disabled={loading || !isConnected}
                      onChange={handlePaymentChange}
                    />
                    <img
                      src={
                        paymenType === "ETH"
                          ? "./eth.svg"
                          : paymenType === "USDT"
                          ? "./usdt.svg"
                          : paymenType === "USDC"
                          ? "./usdc.svg"
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
                      disabled={loading || !isConnected}
                      className={`bg-transparent w-[90%] md:w-full outline-none px-2 ${
                        loading || !isConnected
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
              <div className="flex justify-between items-center mt-2">
                <span className="text-white font-normal text-base">
                  {t("totalAmount")}{" "}
                </span>
                <span className="font-semibold gradient-text text-base">
                  {receiveable}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white">{t("totalPurchase")} </span>
                <span className="font-semibold text-base gradient-text">
                  {unclaimedTokens}
                </span>
              </div>

              {tonTransactionLink && (
                <div className="mt-2 flex items-center justify-between">
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
              <div
                className={`relative h-[50px] mt-4 [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] transition-all ease-in-out duration-300 ${
                  loading ||
                  !isConnected ||
                  (paymenType === "TON" && !isTonWalletConnected)
                    ? "bg-[#1C1C1C]"
                    : "bg-gradient hover:scale-105"
                }`}
              >
                <div
                  className={`absolute ${
                    loading ||
                    !isConnected ||
                    (paymenType === "TON" && !isTonWalletConnected)
                      ? "bg-[#444444]"
                      : "bg-white"
                  } inset-[3px] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]`}
                >
                  <button
                    className={`${
                      loading ||
                      !isConnected ||
                      (paymenType === "TON" && !isTonWalletConnected)
                        ? "bg-[#1C1C1C] text-[#444444] cursor-not-allowed"
                        : "bg-gradient text-white cursor-pointer"
                    } font-normal text-base absolute inset-[1px] flex items-center justify-center [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]
                  }`}
                    onClick={loading ? () => {} : handleBuy}
                    disabled={
                      loading ||
                      !isConnected ||
                      (paymenType === "TON" && !isTonWalletConnected)
                    }
                  >
                    {loading ? "Almost Done 😉" : t("buy")}
                    {loading ? <Spinner size={20} margin={12} /> : ""}
                  </button>
                </div>
              </div>
              <div
                className={`relative h-[50px] mt-4 [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] transition-all ease-in-out duration-300 ${
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

        <div className="mt-14">
          <div className="flex items-center justify-center">
            <span className="text-white font-semibold text-2xl">
              {t("TEAM")}
            </span>
          </div>
          {/* Members Section */}
          <div className="flex flex-col md:flex-row gap-10 items-center w-[83%] justify-between mx-auto mt-8">
            {members.map((member, index) => (
              <div
                key={index}
                className="relative member w-[360px] clip bg-gradient h-[360px]"
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
                      <Link to={member.linkedin}>
                        <img src="linkedin.svg" className="w-5 h-5" />
                      </Link>
                    )}
                    <img
                      src={member.flag}
                      alt={member.name}
                      className={`w-8 h-4 ${member.linkedin && "ml-4"}`}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="relative bg-gradient h-[360px] member w-[80%] clip">
              <div className="absolute clip bg-[#1C1C1C] inset-[1px] flex flex-col items-center justify-center p-8 z-50">
                <h1 className="gradient-text font-semibold text-md mb-4">
                  {t("ourDevelopers")}
                </h1>
                {developers.map((dev, index) => (
                  <div
                    className={`relative bg-gradient [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] h-[50px] w-full ${
                      index > 0 && "mt-4"
                    }`}
                    key={index}
                  >
                    <div className="absolute bg-[#1C1C1C] opacity-90 [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] inset-[1px] flex items-center justify-center">
                      <h1 className="gradient-text font-semibold text-sm lg:text-lg">
                        {dev.name}
                      </h1>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative w-[83%] bg-[#444444] footer-bar mx-auto h-[70px] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] mt-20">
        <div className="absolute inset-[1px] bg-[#1C1C1C] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] px-4 flex flex-col md:flex-row justify-center gap-2 items-center md:justify-between">
          <div className="flex flex-row gap-8 items-center">
            <a
              href="https://t.me/+oNLtgu5xw51kMzRh"
              target="_blank"
              rel="noreferrer"
            >
              <img src="./telegram.png" alt="" className="icon" />
            </a>
            <a
              href="https://www.youtube.com/@CharlieUnicoin"
              target="_blank"
              rel="noreferrer"
            >
              <img src="./youtube.png" alt="" className="icon" />
            </a>
            <a
              href="https://x.com/CHRLE_UnicornAI"
              target="_blank"
              rel="noreferrer"
            >
              <img src="./twitter.png" alt="" className="icon" />
            </a>
          </div>
          <a href="#home">
            <div className="relative h-[45px] bg-gradient w-[200px] [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)] transition-all ease-in-out duration-300 hover:scale-105">
              <div className="absolute inset-[3px] bg-white [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]">
                <button className="absolute inset-[1px] flex items-center justify-center bg-gradient text-white font-normal text-base [clip-path:polygon(0%_1em,_1em_0%,_100%_0%,_100%_calc(100%_-_1em),_calc(100%_-_1em)_100%,_0_100%)]">
                  Buy CHARLIE
                </button>
              </div>
            </div>
          </a>
        </div>
      </div>
    </>
  );
};

export default MainPage;
