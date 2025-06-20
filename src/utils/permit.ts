import { ERC20_ABI, PERMIT_HELPER_ABI, providers } from '@/constants';
import { ethers } from 'ethers';

export async function createPermitSignature(
    token: ethers.Contract,
    owner: string,
    spender: string,
    value: ethers.BigNumberish,
    deadline: ethers.BigNumberish,
    signer: ethers.Signer
) {
    const nonce = await token.nonces(owner);
    const name = await token.name();
    const version = "1";
    const network = await signer.provider?.getNetwork();
    const chainId = network?.chainId || 1;

    // Get permit helper signature
    if (!process.env.NEXT_PUBLIC_PERMIT_HELPER_ADDRESS) {
        throw new Error("PERMIT_HELPER_ADDRESS is not set");
    }
    // Calculate EIP-712 signature
    const domain = {
        name,
        version,
        chainId,
        verifyingContract: token.address
    };

    const types = {
        Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" }
        ]
    };

    const message = {
        owner,
        spender,
        value,
        nonce,
        deadline
    };

    // Get EIP-712 signature (ethers v5)
    const eip712Signature = await signer._signTypedData(domain, types, message);
    const eip712Split = ethers.utils.splitSignature(eip712Signature);

    const provider = providers[chainId as keyof typeof providers];
    const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
    try {
        await tokenContract.callStatic.permit(owner, spender, value, deadline, eip712Split.v, eip712Split.r, eip712Split.s);
        console.log("EIP-712 signature is valid");
    } catch (error) {        
        console.log("Error in eip712:", error);
    }

    return eip712Split;
}