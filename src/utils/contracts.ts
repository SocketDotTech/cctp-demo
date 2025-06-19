import { ethers } from 'ethers';
import { APP_GATEWAY_ABI } from '@/constants';
import { providers, CHAIN_SLUGS } from '@/constants';

export async function getOnChainAddress(
  contractId: string,
  chainId: number
): Promise<string> {
  const provider = providers[CHAIN_SLUGS.EVMX];
  const appGateway = new ethers.Contract(
    process.env.NEXT_PUBLIC_APP_GATEWAY_ADDRESS!,
    APP_GATEWAY_ABI,
    provider
  );

  return appGateway.getOnChainAddress(contractId, chainId);
} 