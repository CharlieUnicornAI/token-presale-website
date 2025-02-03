// import { createAppKit } from "@reown/appkit/react";

// import { WagmiProvider } from "wagmi";
// import { mainnet, base, bsc, polygon, solana } from "@reown/appkit/networks";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
// import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
// import {
//   PhantomWalletAdapter,
//   AlphaWalletAdapter,
//   CloverWalletAdapter,
//   AvanaWalletAdapter,
//   FractalWalletAdapter,
//   HuobiWalletAdapter,
//   HyperPayWalletAdapter,
//   KeystoneWalletAdapter,
//   SolflareWalletAdapter,
//   SolongWalletAdapter,
//   LedgerWalletAdapter,
//   SpotWalletAdapter,
// } from "@solana/wallet-adapter-wallets";

// // 0. Setup queryClient
// const queryClient = new QueryClient();

// // 1. Get projectId from https://cloud.reown.com
// const projectId = "2107c00a7b77ee5371a8e43b5c13a4e6";

// // 2. Set the networks
// const networks = [base, mainnet, bsc, polygon, solana];

// // 3. Create a metadata object - optional
// const metadata = {
//   name: "Charlie Unicorn AI presale website",
//   description: "Charlie Unicorn AI presale website",
//   url: "https://charlietheunicoin.shop/", // origin must match your domain & subdomain
//   icons: ["/public/logo.png"],
// };

// // 4. Create Wagmi Adapter
// const wagmiAdapter = new WagmiAdapter({
//   networks,
//   projectId,
//   ssr: false,
// });

// // 5. Set solana wallets
// const wallets = [
//   new PhantomWalletAdapter(),
//   new AlphaWalletAdapter(),
//   new AvanaWalletAdapter(),
//   new CloverWalletAdapter(),
//   new FractalWalletAdapter(),
//   new HuobiWalletAdapter(),
//   new HyperPayWalletAdapter(),
//   new KeystoneWalletAdapter(),
//   new SolflareWalletAdapter(),
//   new SolongWalletAdapter(),
//   new SpotWalletAdapter(),
//   new LedgerWalletAdapter(),
// ];

// const solanaWeb3JsAdapter = new SolanaAdapter({ wallets });

// // 6. Create modal
// export const appkitModal = createAppKit({
//   adapters: [wagmiAdapter, solanaWeb3JsAdapter],
//   networks,
//   projectId,
//   metadata,
//   features: {
//     analytics: true,
//     socials: false,
//     email: false,
//   },
// });

// export function AppKitProvider({ children }) {
//   return (
//     <WagmiProvider config={wagmiAdapter.wagmiConfig}>
//       <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
//     </WagmiProvider>
//   );
// }
