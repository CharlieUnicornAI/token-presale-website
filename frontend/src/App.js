import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { base, mainnet, bsc, polygon } from "@reown/appkit/networks";
import RoutesFile from "./RoutesFile";
import "./App.css";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { TonWalletProvider } from "./context/TonWalletContext";
import "@solana/wallet-adapter-react-ui/styles.css"; // ✅ Ensure wallet modal styles are imported
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

// 1. Get projectId
const projectId = "2107c00a7b77ee5371a8e43b5c13a4e6";

// 2. Set the networks
const networks = [base, mainnet, bsc, polygon];

// 3. Create a metadata object - optional
const metadata = {
  name: "Charlie Unicorn AI presale website",
  description: "Charlie Unicorn AI presale website",
  url: "https://charlietheunicoin.shop/", // origin must match your domain & subdomain
  icons: ["/public/logo.png"],
};

// 4. Create a AppKit instance
createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    socials: false,
    email: false,
  },
});

// 5. Setup Solana wallet adapters
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

const isTonConnectSdkError = (error) => {
  return error && error.code && error.code.startsWith("TON_CONNECT_");
};

function App() {
  window.addEventListener("unhandledrejection", function (event) {
    if (isTonConnectSdkError(event.reason)) {
      console.warn("TonConnect SDK Error:", event.reason);
    }
  });

  return (
    <TonConnectUIProvider manifestUrl="https://charlieunicornai-sale.eu/tonconnect-manifest.json">
      <TonWalletProvider>
        <ConnectionProvider endpoint="https://holy-alpha-haze.solana-mainnet.quiknode.pro/c88b09f136b6fafab638cb0dc2f2c95aa6ec3150/">
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <RoutesFile />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </TonWalletProvider>
      <ToastContainer theme="dark" />
    </TonConnectUIProvider>
  );
}

export default App;
