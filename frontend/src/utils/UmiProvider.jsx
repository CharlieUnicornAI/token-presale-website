import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { useWallet } from "@solana/wallet-adapter-react";
import { ReactNode, createContext, useContext } from "react";

import { mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import {
  Umi,
  createNoopSigner,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { RPC_URL } from "./Pub"




const UmiContext = createContext < UmiContext > ({ umi: null });

export const UmiProvider = ({ children }) => {
  const wallet = useWallet();
  const umi = createUmi(RPC_URL).use(mplTokenMetadata()).use(mplCandyMachine());
  if (wallet.publicKey === null) {
    const noopSigner = createNoopSigner(
      publicKey("11111111111111111111111111111111")
    );
    umi.use(signerIdentity(noopSigner));
  } else {
    umi.use(walletAdapterIdentity(wallet));
  }

  return <UmiContext.Provider value={{ umi }}>{children}</UmiContext.Provider>;
};

export function useUmi() {
  const umi = useContext(UmiContext).umi;
  if (!umi) {
    throw new Error(
      "Umi context was not initialized. " +
      "Did you forget to wrap your app with <UmiProvider />?"
    );
  }
  return umi;
}
