'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Chain, TokenInfo, DeployedContracts } from '@/types';
import { APP_GATEWAY_ABI, SUPER_TOKEN_CONTRACT_ID, VAULT_CONTRACT_ID, CHAIN_INFO } from '@/constants';
import { getOnChainAddress } from '@/utils/contracts';

interface TokenDeploymentProps {
  tokenInfo: TokenInfo;
  selectedChain: Chain;
  destinationChains: Chain[];
  onDeploymentComplete: (contracts: DeployedContracts) => void;
}

const EVMX_CHAIN = {
  chainId: '7625382',
  chainName: 'EVMX Dev',
  nativeCurrency: {
    name: 'EVMX',
    symbol: 'EVMX',
    decimals: 18,
  },
  rpcUrls: [process.env.NEXT_PUBLIC_DEV_EVMX_RPC!],
};

export default function TokenDeployment({
  tokenInfo,
  selectedChain,
  destinationChains,
  onDeploymentComplete,
}: TokenDeploymentProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null);
  const [isPollingStatus, setIsPollingStatus] = useState(false);
  const [deployedAddresses, setDeployedAddresses] = useState<{
    vault: string;
    superTokens: { [chainId: number]: string };
  } | null>(null);

  // Check wallet connection on component mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        setIsWalletConnected(accounts.length > 0);
      } catch (err) {
        console.error('Error checking wallet connection:', err);
        setIsWalletConnected(false);
      }
    } else {
      setIsWalletConnected(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to continue');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setIsWalletConnected(true);
        setError(null);
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    }
  };

  const deployContracts = async () => {
    if (!isWalletConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (destinationChains.length === 0) {
      setError('Please select at least one destination chain');
      return;
    }

    setIsDeploying(true);
    setError(null);
    setTxHash(null);
    setIsPolling(false);
    setDeploymentStatus(null);
    setDeployedAddresses(null);

    try {
      // Switch to EVMX chain before deployment
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: EVMX_CHAIN.chainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [EVMX_CHAIN],
          });
        } else {
          throw switchError;
        }
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();
      const appGateway = new ethers.Contract(
        process.env.NEXT_PUBLIC_APP_GATEWAY_ADDRESS!,
        APP_GATEWAY_ABI,
        signer
      );

      // Prepare deployment parameters
      const params = {
        name_: tokenInfo.name,
        symbol_: tokenInfo.symbol,
        decimals_: tokenInfo.decimals,
        initialSupplyHolder_: (await provider.listAccounts())[0],
        initialSupply_: ethers.utils.parseUnits('1000000', tokenInfo.decimals), // 1M tokens
      };

      // Get chain slugs for selected destination chains
      const chainSlugs = destinationChains.map(chain => chain.chainId);

      // Deploy contracts
      const tx = await appGateway.deployContracts(
        selectedChain.chainId,
        tokenInfo.address,
        params,
        chainSlugs
      );

      setTxHash(tx.hash);
      setIsPolling(true);

      await tx.wait();

      // Start polling for deployment status
      setIsPollingStatus(true);
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_DEV_API_URL}/dev/getDetailsByTxHash?txHash=${tx.hash}`);
          const data = await response.json();
          
          if (data.status === "SUCCESS" && data.response && data.response.length > 0) {
            const deploymentData = data.response[0];
            setDeploymentStatus(deploymentData);
            
            // Stop polling if status is COMPLETED
            if (deploymentData.status === "COMPLETED") {
              clearInterval(pollInterval);
              setIsPollingStatus(false);
              
              // Extract deployed addresses from the response
              const vaultAddress = await getOnChainAddress(
                VAULT_CONTRACT_ID,
                selectedChain.chainId
              );

              const superTokenAddresses: { [chainId: number]: string } = {};
              for (const chainId of chainSlugs) {
                const superTokenAddress = await getOnChainAddress(
                  SUPER_TOKEN_CONTRACT_ID,
                  chainId
                );
                superTokenAddresses[chainId] = superTokenAddress;
              }

              if (vaultAddress !== ethers.constants.AddressZero) {
                setDeployedAddresses({
                  vault: vaultAddress,
                  superTokens: superTokenAddresses,
                });
                onDeploymentComplete({
                  vaultAddress,
                  superTokenAddresses,
                });
              }
            }
          }
        } catch (err) {
          console.error('Error polling deployment status:', err);
        }
      }, 5000); // Poll every 5 seconds

      // Clear interval after 10 minutes (timeout)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isPollingStatus) {
          setIsPollingStatus(false);
          setError('Deployment status polling timeout');
        }
      }, 10 * 60 * 1000);

    } catch (err: any) {
      console.error('Error deploying contracts:', err);
      setError(err.message || 'Failed to deploy contracts');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isWalletConnected ? (
        <div className="text-center">
          <button
            onClick={connectWallet}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Deploy Contracts for Transfer
            </h3>
            <p className="text-gray-600 mb-6">
              This will deploy the necessary contracts on the selected chains to enable token expansion.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Deployment Details</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p><span className="font-medium">Token:</span> {tokenInfo.name} ({tokenInfo.symbol})</p>
                <p><span className="font-medium">Source Chain:</span> {selectedChain.name}</p>
                <p><span className="font-medium">Destination Chains:</span> {destinationChains.map(chain => chain.name).join(', ')}</p>
              </div>
            </div>

            <button
              onClick={deployContracts}
              disabled={isDeploying || isPolling || destinationChains.length === 0}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isDeploying ? 'Deploying...' : isPolling ? 'Waiting for deployment...' : 'Deploy Contracts'}
            </button>

            {/* Deployment Status */}
            {txHash && (
              <div className={`bg-gray-50 p-4 rounded-lg space-y-3 transition-opacity duration-300 ${
                isPollingStatus ? 'opacity-75' : 'opacity-100'
              }`}>
                <h4 className="font-medium text-gray-900">Deployment Status</h4>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Transaction:</span>{' '}
                  <span className="font-mono">{txHash}</span>
                </div>

                {isPollingStatus && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Checking deployment status...</span>
                  </div>
                )}

                {deploymentStatus && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Status:</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        deploymentStatus.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {deploymentStatus.status}
                      </span>
                    </div>

                    {deploymentStatus.writePayloads && deploymentStatus.writePayloads.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Chain
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contract Type
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Transaction
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {deploymentStatus.writePayloads.map((payload: any, index: number) => (
                              <tr key={index}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {CHAIN_INFO[payload.chainSlug]?.name || `Chain ${payload.chainSlug}`}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {payload.chainSlug === selectedChain.chainId ? 'Vault' : 'Super Token'}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    payload.executeDetails.isExecuted
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {payload.executeDetails.isExecuted ? 'Deployed' : 'Pending'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {payload.executeDetails.executeTxHash ? (
                                    CHAIN_INFO[payload.chainSlug]?.explorerUrl ? (
                                      <a
                                        href={`${CHAIN_INFO[payload.chainSlug].explorerUrl}/tx/${payload.executeDetails.executeTxHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline font-mono text-xs"
                                      >
                                        {payload.executeDetails.executeTxHash.slice(0, 10)}...
                                      </a>
                                    ) : (
                                      <span className="font-mono text-xs">
                                        {payload.executeDetails.executeTxHash.slice(0, 10)}...
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {deployedAddresses && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">Deployment Successful!</h4>
                <div className="space-y-2">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Vault Address:</span>{' '}
                    {CHAIN_INFO[selectedChain.chainId]?.explorerUrl ? (
                      <a
                        href={`${CHAIN_INFO[selectedChain.chainId].explorerUrl}/address/${deployedAddresses.vault}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-mono"
                      >
                        {deployedAddresses.vault}
                      </a>
                    ) : (
                      <span className="font-mono">{deployedAddresses.vault}</span>
                    )}
                  </p>
                  {Object.entries(deployedAddresses.superTokens).map(([chainId, address]) => (
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
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
} 