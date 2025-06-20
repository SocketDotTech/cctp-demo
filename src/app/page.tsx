'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Chain, TokenInfo, DeployedContracts } from '@/types';
import { SUPPORTED_CHAINS, ERC20_ABI, APP_GATEWAY_ABI, providers, CHAIN_SLUGS, CHAIN_INFO, VAULT_CONTRACT_ID, SUPER_TOKEN_CONTRACT_ID } from '@/constants';
import TokenDeployment from '@/components/TokenDeployment';
import TokenTransfer from '@/components/TokenTransfer';
import WalletIndicator from '@/components/WalletIndicator';
import { getOnChainAddress } from '@/utils/contracts';

export default function Home() {
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [deployedContracts, setDeployedContracts] = useState<DeployedContracts | null>(null);
  const [selectedDestinationChains, setSelectedDestinationChains] = useState<Chain[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingContracts, setIsCheckingContracts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Auto-fetch token details when token address changes
  useEffect(() => {
    const fetchTokenDetails = async () => {
      if (!tokenAddress || !selectedChain) return;

      // Validate address format
      if (!ethers.utils.isAddress(tokenAddress)) {
        setError('Invalid token address format');
        setTokenInfo(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create provider for the selected chain
        const provider = providers[selectedChain.id as keyof typeof providers];
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

        // Fetch token details in parallel
        const [name, symbol, decimals] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals(),
        ]);

        console.log('name', name);
        console.log('symbol', symbol);
        console.log('decimals', decimals);

        setTokenInfo({
          address: tokenAddress,
          name,
          symbol,
          decimals: Number(decimals),
          chainId: selectedChain.id,
        });

        // Reset selected destination chains when fetching new token
        setSelectedDestinationChains([]);
        setDeployedContracts(null);
        setShowTransfer(false);
      } catch (err: any) {
        console.error('Error fetching token details:', err);
        setError('Failed to fetch token details. Please check the address and try again.');
        setTokenInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to avoid too many requests while typing
    const timeoutId = setTimeout(fetchTokenDetails, 500);
    return () => clearTimeout(timeoutId);
  }, [tokenAddress, selectedChain]);

  const handleChainSelect = (chain: Chain) => {
    setSelectedChain(chain);
    setTokenInfo(null);
    setDeployedContracts(null);
    setSelectedDestinationChains([]);
    setShowTransfer(false);
    setError(null);
  };

  const handleDestinationChainToggle = (chain: Chain) => {
    setSelectedDestinationChains(prev => {
      const isSelected = prev.find(c => c.id === chain.id);
      if (isSelected) {
        return prev.filter(c => c.id !== chain.id);
      } else {
        return [...prev, chain];
      }
    });
  };

  const handleContinue = async () => {
    if (!selectedChain || selectedDestinationChains.length === 0) return;

    setIsCheckingContracts(true);
    setError(null);

    try {
      // Check vault address on source chain
      const vaultAddress = await getOnChainAddress(
        VAULT_CONTRACT_ID,
        selectedChain.id
      );
      console.log('vaultAddress', vaultAddress);

      // Check super token addresses for all selected chains
      const superTokenAddresses: { [chainId: number]: string } = {};
      let allAddressesFound = true;

      for (const chain of selectedDestinationChains) {
        const superTokenAddress = await getOnChainAddress(
          SUPER_TOKEN_CONTRACT_ID,
          chain.id
        );
        console.log('superTokenAddress', superTokenAddress, chain.id);
        superTokenAddresses[chain.id] = superTokenAddress;
        if (superTokenAddress === ethers.constants.AddressZero) {
          allAddressesFound = false;
        }
      }

      if (vaultAddress !== ethers.constants.AddressZero && allAddressesFound) {
        console.log('deployedContracts', {
          vaultAddress,
          superTokenAddresses,
        });
        setDeployedContracts({
          vaultAddress,
          superTokenAddresses,
        });
      } else {
        console.log('deployedContracts not found');
        setDeployedContracts(null);
      }

      setShowTransfer(true);
    } catch (err: any) {
      console.error('Error checking deployed contracts:', err);
      setError('Failed to check deployed contracts');
      setDeployedContracts(null);
    } finally {
      setIsCheckingContracts(false);
    }
  };

  const handleReset = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      // Switch to EVMX chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CHAIN_INFO[CHAIN_SLUGS.EVMX].id.toString(16)}` }],
      });

      const provider = new ethers.providers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Get app gateway contract
      const appGateway = new ethers.Contract(
        CHAIN_INFO[CHAIN_SLUGS.EVMX].appGateway!,
        APP_GATEWAY_ABI,
        signer
      );

      // Call reset function
      const tx = await appGateway.reset();
      await tx.wait();

      // Reset all state
      setSelectedChain(null);
      setTokenAddress('');
      setTokenInfo(null);
      setDeployedContracts(null);
      setSelectedDestinationChains([]);
      setShowTransfer(false);
      setError(null);

    } catch (err: any) {
      console.error('Error resetting:', err);
      setError(err.message || 'Failed to reset');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Reset Button */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isResetting ? 'Resetting...' : 'Reset'}
            </button>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Token Expander
              </h1>
              <p className="text-lg text-gray-600">
              Take your Stable Token anywhere with SOCKET and CCTP Circle Security
              </p>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>

          <WalletIndicator />

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Step 1: Select Source Chain & Token
            </h2>

            {/* Source Chain Selection */}
            <div className="space-y-3 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Source Chain</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {SUPPORTED_CHAINS.map((chain) => (
                  <div
                    key={chain}
                    onClick={() => handleChainSelect(CHAIN_INFO[chain])}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedChain?.id === chain
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {CHAIN_INFO[chain].name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Token Address Input */}
            {selectedChain && (
              <div className="space-y-3 mb-6">
                <label htmlFor="tokenAddress" className="block text-sm font-medium text-gray-700">
                  Token Address
                </label>
                <div className="max-w-md">
                  <input
                    type="text"
                    id="tokenAddress"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary focus:ring-2 focus:ring-opacity-50 sm:text-sm px-4 py-3"
                    placeholder="Enter token contract address"
                  />
                </div>
                {isLoading && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Fetching token details...</span>
                  </div>
                )}
              </div>
            )}

            {/* Token Details Display */}
            {tokenInfo && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 mb-6">
                <h4 className="font-medium text-gray-900">Token Details</h4>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Name:</span> {tokenInfo.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Symbol:</span> {tokenInfo.symbol}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Decimals:</span> {tokenInfo.decimals}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Address:</span> {tokenInfo.address}
                </p>
              </div>
            )}

            {/* Destination Chain Selection */}
            {tokenInfo && (
              <div className="space-y-3 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Destination Chains</h3>
                <p className="text-sm text-gray-600">Select chains where you want to expand your token:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SUPPORTED_CHAINS.filter(chain => chain !== selectedChain?.id).map((chain) => (
                    <div
                      key={chain}
                      onClick={() => handleDestinationChainToggle(CHAIN_INFO[chain])}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedDestinationChains.find(c => c.id === chain)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {CHAIN_INFO[chain].name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Continue Button */}
            {tokenInfo && selectedDestinationChains.length > 0 && (
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleContinue}
                  disabled={isCheckingContracts}
                  className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isCheckingContracts ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Checking contracts...</span>
                    </div>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            )}

            {/* Deployed Contracts Display */}
            {deployedContracts && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-green-900 mb-3">Deployed Contracts Found</h4>
                <div className="space-y-2">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Vault Address:</span>{' '}
                    {CHAIN_INFO[selectedChain!.id]?.explorerUrl ? (
                      <a
                        href={`${CHAIN_INFO[selectedChain!.id].explorerUrl}/address/${deployedContracts.vaultAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-mono"
                      >
                        {deployedContracts.vaultAddress}
                      </a>
                    ) : (
                      <span className="font-mono">{deployedContracts.vaultAddress}</span>
                    )}
                  </p>
                  {Object.entries(deployedContracts.superTokenAddresses).map(([chainId, address]) => (
                    <p key={chainId} className="text-sm text-green-800">
                      <span className="font-medium">
                        {CHAIN_INFO[Number(chainId)]?.name || `Chain ${chainId}`} Super Token:
                      </span>{' '}
                      {CHAIN_INFO[Number(chainId)]?.explorerUrl ? (
                        <a
                          href={`${CHAIN_INFO[Number(chainId)].explorerUrl}/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-mono"
                        >
                          {address}
                        </a>
                      ) : (
                        <span className="font-mono">{address}</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Token Deployment Component - Only show when contracts not found */}
          {tokenInfo && selectedDestinationChains.length > 0 && !deployedContracts && showTransfer && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Step 4: Deploy Token Contracts
              </h2>
              <TokenDeployment
                tokenInfo={tokenInfo}
                selectedChain={selectedChain!}
                destinationChains={selectedDestinationChains}
                onDeploymentComplete={(contracts) => {
                  setDeployedContracts(contracts);
                }}
              />
            </div>
          )}

          {/* Token Transfer Component */}
          {showTransfer && tokenInfo && deployedContracts && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Step 5: Transfer Token
              </h2>
              <TokenTransfer
                tokenInfo={tokenInfo}
                selectedChain={selectedChain!}
                deployedContracts={deployedContracts}
                destinationChains={selectedDestinationChains}
                onDeployContracts={async (chainSlugs) => {
                  console.log('Deploying contracts for chains:', chainSlugs);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 