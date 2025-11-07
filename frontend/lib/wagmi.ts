import { http, createConfig, createStorage } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Only import in browser environment
const isBrowser = typeof window !== 'undefined';

// Type-safe chain configuration
const appChains = [
  {
    id: 31337,
    name: 'Hardhat',
    network: 'hardhat',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: { http: ['http://127.0.0.1:8545'] },
      public: { http: ['http://127.0.0.1:8545'] },
    },
    testnet: true,
  },
  mainnet,
  sepolia,
] as const;

type AppChains = typeof appChains[number]['id'];

// Get the WalletConnect project ID from environment variables
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!walletConnectProjectId) {
  console.warn('WalletConnect Project ID is not set. Using default ID which may not work in production.');
}

// Create transports for all chains
const transports = appChains.reduce((acc, chain) => {
  acc[chain.id] = http();
  return acc;
}, {} as Record<AppChains, any>);

// Create connectors (only in browser)
const connectors = isBrowser ? [
  // MetaMask - using the simplest possible configuration
  injected({
    target: 'metaMask',
    shimDisconnect: true,
  }),
  
  // WalletConnect v2
  walletConnect({
    projectId: walletConnectProjectId || 'default-project-id',
    showQrModal: true,
    metadata: {
      name: 'DTeams',
      description: 'Decentralized Teams Platform',
      url: isBrowser ? window.location.origin : 'http://localhost:3000',
      icons: ['/icon.png']
    },
    qrModalOptions: {
      themeMode: 'dark',
    },
  })
] : [];

// Create the config with proper storage for SSR
const config = createConfig({
  chains: appChains as any,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [31337]: http('http://127.0.0.1:8545'),
  },
  connectors,
  ssr: true,
  storage: createStorage({
    storage: isBrowser ? window.localStorage : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  }),
  batch: { 
    multicall: true,
  },
  pollingInterval: 10_000,
});

export { config };

