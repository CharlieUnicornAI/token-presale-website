import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { base, solana } from "@reown/appkit/networks";
import RoutesFile from "./RoutesFile";
import "./App.css";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { TonWalletProvider } from "./context/TonWalletContext";

// 1. Get projectId
const projectId = "308d3b59065c26b4028999d22a457378";

// 2. Set the networks
const networks = [base, solana];

// 3. Create a metadata object - optional
const metadata = {
  name: "Charlie Unicoin AI's presale website",
  description: "Charlie Unicoin AI's presale website",
  url: "https://charlieunicornaipresale.com/", // origin must match your domain & subdomain
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
    <TonConnectUIProvider manifestUrl="http://localhost:3000/tonconnect-manifest.json">
      <TonWalletProvider>
        <RoutesFile />
      </TonWalletProvider>
      <ToastContainer theme="dark" />
    </TonConnectUIProvider>
  );
}

export default App;
