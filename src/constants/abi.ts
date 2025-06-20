export const APP_GATEWAY_ABI = [

	{
		"type": "function",
		"name": "deployContracts",
		"inputs": [
			{
				"name": "sourceChainSlug_",
				"type": "uint32",
				"internalType": "uint32"
			},
			{ "name": "sourceToken_", "type": "address", "internalType": "address" },
			{
				"name": "params_",
				"type": "tuple",
				"internalType": "struct CCTPSuperTokenAppGateway.ConstructorParams",
				"components": [
					{ "name": "name_", "type": "string", "internalType": "string" },
					{ "name": "symbol_", "type": "string", "internalType": "string" },
					{ "name": "decimals_", "type": "uint8", "internalType": "uint8" },
					{
						"name": "initialSupplyHolder_",
						"type": "address",
						"internalType": "address"
					},
					{
						"name": "initialSupply_",
						"type": "uint256",
						"internalType": "uint256"
					}
				]
			},
			{ "name": "chainSlugs_", "type": "uint32[]", "internalType": "uint32[]" }
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "reset",
		"inputs": [
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "forwarderAddresses",
		"inputs": [
			{ "name": "", "type": "bytes32", "internalType": "bytes32" },
			{ "name": "", "type": "uint32", "internalType": "uint32" }
		],
		"outputs": [{ "name": "", "type": "address", "internalType": "address" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "getOnChainAddress",
		"inputs": [
			{ "name": "contractId_", "type": "bytes32", "internalType": "bytes32" },
			{ "name": "chainSlug_", "type": "uint32", "internalType": "uint32" }
		],
		"outputs": [
			{ "name": "onChainAddress", "type": "address", "internalType": "address" }
		],
		"stateMutability": "view"
	},
	
	{
		"type": "function",
		"name": "sourceChainSlug",
		"inputs": [],
		"outputs": [{ "name": "", "type": "uint32", "internalType": "uint32" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "sourceToken",
		"inputs": [],
		"outputs": [{ "name": "", "type": "address", "internalType": "address" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "superToken",
		"inputs": [],
		"outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "transfer",
		"inputs": [{ "name": "order_", "type": "bytes", "internalType": "bytes" }],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "vault",
		"inputs": [],
		"outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "transferWithPermit",
		"inputs": [
			{
				"name": "order",
				"type": "tuple",
				"internalType": "struct CCTPSuperTokenAppGateway.PermitTransferOrder",
				"components": [
					{
						"name": "sourceChainSlug",
						"type": "uint32",
						"internalType": "uint32"
					},
					{
						"name": "dstChainSlug",
						"type": "uint32",
						"internalType": "uint32"
					},
					{
						"name": "srcToken",
						"type": "address",
						"internalType": "address"
					},
					{
						"name": "dstToken",
						"type": "address",
						"internalType": "address"
					},
					{
						"name": "user",
						"type": "address",
						"internalType": "address"
					},
					{
						"name": "srcAmount",
						"type": "uint256",
						"internalType": "uint256"
					},
					{
						"name": "deadline",
						"type": "uint256",
						"internalType": "uint256"
					},
					{
						"name": "permitDeadline",
						"type": "uint256",
						"internalType": "uint256"
					},
					{
						"name": "v",
						"type": "uint8",
						"internalType": "uint8"
					},
					{
						"name": "r",
						"type": "bytes32",
						"internalType": "bytes32"
					},
					{
						"name": "s",
						"type": "bytes32",
						"internalType": "bytes32"
					}
				]
			}
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
]


export const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', type: 'bytes32' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ],
    name: 'permit',
    outputs: [],
    type: 'function',
  },
];

export const PERMIT_HELPER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "getSuperTokenPermitHash",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];