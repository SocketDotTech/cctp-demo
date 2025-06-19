# CCTP Token Transfer Demo

This is a demo application for making your already deployed token cross-chain using Socket and CCTP. The application allows users to:

1. Select the source chain where their token is deployed
2. Enter their token address
3. Deploy token contracts and vault across multiple chains
4. Transfer tokens between different chains

## Supported Chains

- Arbitrum Sepolia
- Optimism Sepolia
- Base Sepolia

## Prerequisites

- Node.js 18.x or later
- MetaMask wallet
- Access to the supported testnet chains

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd cctp-demo
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_APP_GATEWAY_ADDRESS=<your-app-gateway-address>
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_OPTIMISM_SEPOLIA_RPC=https://sepolia.optimism.io
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Connect your MetaMask wallet
2. Select the source chain where your token is deployed
3. Enter your token address
4. Deploy the token contracts and vault
5. Once deployed, you can transfer tokens between different chains

## Features

- Chain selection for source and destination
- Token information fetching
- Contract deployment across multiple chains
- Token approval and transfer functionality
- Real-time balance and allowance checking
- Error handling and user feedback

## Technologies Used

- Next.js
- TypeScript
- ethers.js
- Tailwind CSS
- Socket Protocol
- CCTP (Cross-Chain Transfer Protocol) 