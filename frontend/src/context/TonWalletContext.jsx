import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import TonWeb from "tonweb";

const initialTonWalletContextValues = {
  isTonWalletConnected: false,
  friendlyAddress: null,
  rAddress: null,
  tonBalance: 0,
  tonPrice: null,
  currentNetwork: null,
  sendTon: async (amount, recipient) => {},
};

const TonWalletContext = createContext(initialTonWalletContextValues);

export const useCustomTonWallet = () => {
  const context = useContext(TonWalletContext);
  if (!context) {
    throw new Error("useCustomTonWallet must be used within TonWalletProvider");
  }
  return context;
};

export const TonWalletProvider = ({ children }) => {
  const [isTonWalletConnected, setIsTonWalletConnected] = useState(false);
  const [friendlyAddress, setFriendlyAddress] = useState(null);
  const [rAddress, setRAddress] = useState(null);
  const [tonBalance, setTonBalance] = useState(0);
  const [tonPrice, setTonPrice] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [tonConnectUI] = useTonConnectUI();
  // const tonweb = new TonWeb(new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC"));
  const tonweb = new TonWeb(
    new TonWeb.HttpProvider("https://testnet.toncenter.com/api/v2/jsonRPC")
  );

  useEffect(() => {
    // Update connection state and addresses
    setIsTonWalletConnected(tonConnectUI.connected);
    if (tonConnectUI.connected) {
      setFriendlyAddress(userFriendlyAddress);
      setRAddress(rawAddress);
    } else {
      setFriendlyAddress(null);
      setRAddress(null);
      setTonBalance(0);
      setCurrentNetwork(null);
    }
  }, [tonConnectUI.connected, userFriendlyAddress, rawAddress]);

  const sendTon = async (amount, recipient) => {
    try {
      const transaction = {
        messages: [
          {
            address: recipient,
            amount: amount,
          },
        ],
      };
      const result = tonConnectUI.sendTransaction(transaction);
      return result;
    } catch (err) {
      console.log("sendTon error: ", err);
    }
  };

  useEffect(() => {
    // Fetch balance when connected
    const fetchBalance = async (walletAddress) => {
      try {
        const result = await tonweb.getBalance(walletAddress);
        const balanceTon = TonWeb.utils.fromNano(result);
        setTonBalance(balanceTon);
      } catch (err) {
        console.error("Error fetching balance:", err);
      }
    };

    if (tonConnectUI.connected && friendlyAddress) {
      fetchBalance(friendlyAddress);
    }
  }, [tonConnectUI.connected, friendlyAddress]);

  useCallback(async () => {}, [tonConnectUI.connected]);

  return (
    <TonWalletContext.Provider
      value={{
        isTonWalletConnected,
        friendlyAddress,
        rAddress,
        tonBalance,
        tonPrice,
        sendTon,
      }}
    >
      {children}
    </TonWalletContext.Provider>
  );
};
