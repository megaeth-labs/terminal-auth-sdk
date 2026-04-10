import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Terminal SDK Redirect Example",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID",
  chains: [mainnet, sepolia],
});
