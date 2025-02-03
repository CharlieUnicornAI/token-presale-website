import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { mainnet, base, bsc, polygon, solana } from "@reown/appkit/networks";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import RoutesFile from "./RoutesFile";
import "./App.css";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { TonWalletProvider } from "./context/TonWalletContext";
// import { AppKitProvider } from "./AppkitProvider";
import {
  PhantomWalletAdapter,
  AlphaWalletAdapter,
  CloverWalletAdapter,
  AvanaWalletAdapter,
  FractalWalletAdapter,
  HuobiWalletAdapter,
  HyperPayWalletAdapter,
  KeystoneWalletAdapter,
  SolflareWalletAdapter,
  SolongWalletAdapter,
  LedgerWalletAdapter,
  SpotWalletAdapter,
} from "@solana/wallet-adapter-wallets";

// 1. Get projectId
const projectId = "2107c00a7b77ee5371a8e43b5c13a4e6";

// 2. Set the networks
const networks = [mainnet, base, bsc, polygon, solana];

// 3. Create a metadata object - optional
const metadata = {
  name: "Charlie Unicorn AI presale website",
  description: "Charlie Unicorn AI presale website",
  url: "https://charlietheunicoin.shop/", // origin must match your domain & subdomain
  icons: ["/public/logo.png"],
};

const wallets = [
  new PhantomWalletAdapter(),
  new AlphaWalletAdapter(),
  new AvanaWalletAdapter(),
  new CloverWalletAdapter(),
  new FractalWalletAdapter(),
  new HuobiWalletAdapter(),
  new HyperPayWalletAdapter(),
  new KeystoneWalletAdapter(),
  new SolflareWalletAdapter(),
  new SolongWalletAdapter(),
  new SpotWalletAdapter(),
  new LedgerWalletAdapter(),
];

const solanaWeb3JsAdapter = new SolanaAdapter({ wallets });

// 4. Create a AppKit instance
export const appkitModal = createAppKit({
  adapters: [new EthersAdapter(), solanaWeb3JsAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    socials: false,
    email: false,
  },
});

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
        <RoutesFile />
      </TonWalletProvider>
      <ToastContainer theme="dark" />
    </TonConnectUIProvider>
  );
}

export default App;
