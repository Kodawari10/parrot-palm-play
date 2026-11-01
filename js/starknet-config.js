/*
 * Parrot Palm: Starknet settings (optional).
 * The grove, album, and map work with no wallet. After deploying contracts/src/parrot_palm.cairo,
 * paste the address into `contractAddress`. While it is empty, players can still connect, but minting stays off.
 * Rare tiles (legendary, extra) and the finished chart are the only keepsakes.
 */
window.PP_STARKNET_CONFIG = {
  enabled: true,
  network: 'sepolia',
  networkName: 'Sepolia testnet',
  chainId: '0x534e5f5345504f4c4941',
  rpcUrl: 'https://starknet-sepolia.drpc.org',
  contractAddress: '',
  explorerTx: 'https://sepolia.voyager.online/tx/',
  explorerContract: 'https://sepolia.voyager.online/contract/',
  faucetUrl: 'https://starknet-faucet.vercel.app/',
  cartridge: {
    enabled: true,
    feeMode: { type: 'paymaster' },
    fallbackFeeMode: 'user_pays',
    deploy: 'if_needed',
    methods: ['mint_tile', 'mint_chart']
  },
  installLinks: [
    { name: 'Ready', url: 'https://www.ready.co/' },
    { name: 'Braavos', url: 'https://braavos.app/' }
  ]
};
