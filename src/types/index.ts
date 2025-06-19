export interface Chain {
  id: number;
  name: string;
  chainId: number;
  rpc: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  appGateway?: string;
  explorerUrl?: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  chainId: number;
}

export interface DeployedContracts {
  vaultAddress: string;
  superTokenAddresses: { [chainId: number]: string };
}

export interface TransferParams {
  sourceChain: Chain;
  destinationChain: Chain;
  amount: string;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: any[]) => void) => void;
      removeListener: (event: string, callback: (accounts: any[]) => void) => void;
    };
  }
} 