import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
	defaultNetwork: 'hardhat',
	networks: {
		hardhat: {

		},
		eth_mainnet: {
			url: 'https://eth-mainnet.g.alchemy.com/v2/lc3dgPEqj__ohEOBX-AW32BM5gVM4_-H',
			chainId: 1,
			accounts: [
				process.env.ETH_PK_1 as string,
			]
		},
		eth_goerli: {
			url: 'https://rpc.ankr.com/eth_goerli/495ef0ee52bacde16818f2c0934540dd6fedc9b071ca0f80ea963aab4ba98118',
			chainId: 5,
			accounts: [
				process.env.ETH_PK_1 as string,
			]
		},
		eth_sepolia: {
			url: 'https://rpc.ankr.com/eth_sepolia/495ef0ee52bacde16818f2c0934540dd6fedc9b071ca0f80ea963aab4ba98118',
			chainId: 11155111,
			accounts: [
				process.env.ETH_PK_0 as string,
			]
		},
		polygon: {
			url: 'https://polygon-mainnet.g.alchemy.com/v2/nAV259BLGV6xe01dxQigkMcQRoG28l6m',
			chainId: 137,
			accounts: [
				process.env.ETH_PK_1 as string,
			]
		},
		bsc: {
			url: 'https://bsc.nodereal.io',
			chainId: 56,
			accounts: [
				process.env.ETH_PK_1 as string,
			]
		},
		op_mainnet: {
			url: 'https://opt-mainnet.g.alchemy.com/v2/5bcCIrNMuuZ1eyTsfi8f_0tlFvS2a2Yz',
			// url: 'https://mainnet.optimism.io/',
			chainId: 10,
			accounts: [
				process.env.ETH_PK_1 as string,
			]
		},
		op_sepolia: {
			url: 'https://sepolia.optimism.io',
			chainId: 11155420,
			accounts: [
				process.env.ETH_PK_1 as string,
			]
		},
		arbitrumOne: {
			url: 'https://arb-mainnet.g.alchemy.com/v2/KObwPy_MUfKJYvJIsLzhzLT3avv-PaEe',
			chainId: 42161,
			accounts: [
				process.env.ETH_PK_1 as string,
			]
		},
		merlin: {
			url: 'https://rpc.merlinchain.io',
			chainId: 4200,
			accounts: [
				process.env.ETH_PK_0 as string,
			]
		},
		merlin_testnet: {
			url: 'https://testnet-rpc.merlinchain.io',
			chainId: 686868,
			accounts: [
				process.env.ETH_PK_9 as string,
			]
		},
		linea_sepolia: {
			url: 'https://linea-sepolia.infura.io/v3/',
			chainId: 59141,
			accounts: [
				process.env.ETH_PK_1 as string,
			]
		}
	},
	solidity: {
		compilers: [
			{
				version: '0.8.24',
				settings: {
					optimizer: {
						enabled: true,
						runs: 200
					}
				}
			},
			{
				version: '0.6.12',
				settings: {
					optimizer: {
						enabled: true,
						runs: 200
					}
				}
			},
			{
				version: '0.7.6',
				settings: {
					optimizer: {
						enabled: true,
						runs: 200
					}
				}
			}
		]
	},
	etherscan: {
		apiKey: {
			eth_mainnet: process.env.Etherscan_API_KEY as string,
			goerli: process.env.Etherscan_API_KEY as string,
			sepolia: process.env.Etherscan_API_KEY as string,
			op_mainnet: process.env.Opscan_API_KEY as string,
			arbitrumOne: process.env.Arbiscan_API_KEY as string,
			polygon: process.env.Polygonscan_API_KEY as string,
			bsc: process.env.Bscscan_API_KEY as string,
			merlin_testnet: 'b111c997-1827-49a3-bfd5-26cbc7ab24a6'
		},
		customChains: [
			{
				network: 'eth_mainnet',
				chainId: 1,
				urls: {
					apiURL: 'https://api.etherscan.com/api',
					browserURL: 'https://etherscan.io'
				}
			},
			{
				network: 'op_mainnet',
				chainId: 10,
				urls: {
					apiURL: 'https://api-optimistic.etherscan.io/api',
					browserURL: 'https://optimistic.etherscan.io'
				}
			},
			{
				network: 'merlin_testnet',
				chainId: 686868,
				urls: {
					apiURL: 'https://testnet-scan.merlinchain.io/api',
					browserURL: 'https://testnet-scan.merlinchain.io'
				}
			}
		]
	},
	mocha: {
		timeout: 100000000
	}
};

export default config;
