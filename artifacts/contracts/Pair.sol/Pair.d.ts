// This file was autogenerated by hardhat-viem, do not edit it.
// prettier-ignore
// tslint:disable
// eslint-disable

import type { Address } from "viem";
import type { AbiParameterToPrimitiveType, GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import "@nomicfoundation/hardhat-viem/types";

export interface Pair$Type {
  "_format": "hh-sol-artifact-1",
  "contractName": "Pair",
  "sourceName": "contracts/Pair.sol",
  "abi": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token0Addr",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "token1Addr",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "uint48",
          "name": "",
          "type": "uint48"
        }
      ],
      "name": "buyOrders",
      "outputs": [
        {
          "internalType": "uint48",
          "name": "beforeOrderId",
          "type": "uint48"
        },
        {
          "internalType": "uint48",
          "name": "afterOrderId",
          "type": "uint48"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountOut",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountInUsed",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint48",
          "name": "orderId",
          "type": "uint48"
        }
      ],
      "name": "cancelBuyOrder",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "token1Left",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint48",
          "name": "orderId",
          "type": "uint48"
        }
      ],
      "name": "getBuyOrder",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint48",
              "name": "beforeOrderId",
              "type": "uint48"
            },
            {
              "internalType": "uint48",
              "name": "afterOrderId",
              "type": "uint48"
            },
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amountIn",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "amountOut",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "amountInUsed",
              "type": "uint256"
            }
          ],
          "internalType": "struct Pair.Order",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "lastOrderId",
      "outputs": [
        {
          "internalType": "uint48",
          "name": "",
          "type": "uint48"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "token1In",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "token0Out",
          "type": "uint256"
        },
        {
          "internalType": "uint48",
          "name": "beforeOrderId",
          "type": "uint48"
        }
      ],
      "name": "makeBuyOrder",
      "outputs": [
        {
          "internalType": "uint48",
          "name": "newOrderId",
          "type": "uint48"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "token0In",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "token1want",
          "type": "uint256"
        }
      ],
      "name": "takeBuyOrder",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "token0Sold",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "token1Gain",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "token0",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "token1",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "topBuyOrderId",
      "outputs": [
        {
          "internalType": "uint48",
          "name": "",
          "type": "uint48"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "bytecode": "0x60c06040526000805465ffffffffffff1916905534801561001f57600080fd5b5060405161157038038061157083398101604081905261003e91610071565b6001600160a01b039182166080521660a0526100a4565b80516001600160a01b038116811461006c57600080fd5b919050565b6000806040838503121561008457600080fd5b61008d83610055565b915061009b60208401610055565b90509250929050565b60805160a0516114776100f960003960008181610165015281816104d9015281816109c90152610b0b015260008181609d015281816105c3015281816107120152818161082c015261093001526114776000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c8063c4ccb40a11610066578063c4ccb40a1461014e578063d21220a714610160578063d44ca7af14610187578063dda37b2414610228578063e5c274bc1461023b57600080fd5b80630dfe1681146100985780635662ecc7146100dc57806367d301f9146101055780638a44b05614610126575b600080fd5b6100bf7f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020015b60405180910390f35b6000546100ee9065ffffffffffff1681565b60405165ffffffffffff90911681526020016100d3565b61011861011336600461130d565b61034d565b6040519081526020016100d3565b610139610134366004611328565b61054e565b604080519283526020830191909152016100d3565b6002546100ee9065ffffffffffff1681565b6100bf7f000000000000000000000000000000000000000000000000000000000000000081565b6101e361019536600461130d565b6001602081905260009182526040909120805491810154600282015460039092015465ffffffffffff80851694600160301b810490911693600160601b9091046001600160a01b0316929186565b6040805165ffffffffffff97881681529690951660208701526001600160a01b03909316938501939093526060840152608083019190915260a082015260c0016100d3565b6100ee61023636600461134a565b610a48565b6102f061024936600461130d565b6040805160c081018252600080825260208201819052918101829052606081018290526080810182905260a08101919091525065ffffffffffff908116600090815260016020818152604092839020835160c08101855281548087168252600160301b810490961692810192909252600160601b9094046001600160a01b03169281019290925282015460608201526002820154608082015260039091015460a082015290565b6040516100d39190815165ffffffffffff9081168252602080840151909116908201526040808301516001600160a01b031690820152606080830151908201526080808301519082015260a0918201519181019190915260c00190565b65ffffffffffff811660009081526001602052604081208054600160601b90046001600160a01b031633146103c95760405162461bcd60e51b815260206004820152601e60248201527f796f7520617265206e6f74206f776e6572206f6620746865206f72646572000060448201526064015b60405180910390fd5b805465ffffffffffff1665fffffffffffe19016104335760405162461bcd60e51b815260206004820152602260248201527f746865206f7264657220697320616c72656164792072656d6f76656428646f6e604482015261652960f01b60648201526084016103c0565b61043c8161125b565b60025465ffffffffffff80851691160361047857805460028054600160301b90920465ffffffffffff1665ffffffffffff199092169190911790555b805465ffffffffffff191665ffffffffffff178155600381015460018201546104a19190611395565b9150811561054857805460405163a9059cbb60e01b8152600160601b9091046001600160a01b039081166004830152602482018490527f0000000000000000000000000000000000000000000000000000000000000000169063a9059cbb906044016020604051808303816000875af1158015610522573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061054691906113ae565b505b50919050565b600254600090819065ffffffffffff1681036105a15760405162461bcd60e51b81526020600482015260126024820152716275794f726465727320697320656d70747960701b60448201526064016103c0565b6040516323b872dd60e01b8152336004820152306024820152604481018590527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906323b872dd906064016020604051808303816000875af1158015610614573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061063891906113ae565b50835b60025465ffffffffffff16156108ad576002805465ffffffffffff16600090815260016020819052604082209081015492810154600382015491939161068191906113d0565b61068b91906113e7565b826002015461069a9190611395565b90508083106107b4576106ad8184611395565b9250816003015482600101546106c39190611395565b6106cd9085611409565b93506106d88261125b565b60018201546003830155815460405163a9059cbb60e01b8152600160601b9091046001600160a01b039081166004830152602482018390527f0000000000000000000000000000000000000000000000000000000000000000169063a9059cbb906044016020604051808303816000875af115801561075b573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061077f91906113ae565b50815465ffffffffffff1990811665ffffffffffff90811780855560028054909316600160301b9091049091161790556108a6565b600082600201548360010154856107cb91906113d0565b6107d591906113e7565b90506107e18186611409565b9450808360030160008282546107f79190611409565b9091555050825460405163a9059cbb60e01b8152600160601b9091046001600160a01b039081166004830152602482018690527f0000000000000000000000000000000000000000000000000000000000000000169063a9059cbb906044016020604051808303816000875af1158015610875573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061089991906113ae565b50600093505050506108ad565b505061063b565b6108b78186611395565b9250816108c484866113d0565b6108ce91906113e7565b85101561090e5760405162461bcd60e51b815260206004820152600e60248201526d1c1c9a58d9481b9bdd0819dbdbd960921b60448201526064016103c0565b80156109a75760405163a9059cbb60e01b8152336004820152602481018290527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063a9059cbb906044016020604051808303816000875af1158015610981573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109a591906113ae565b505b8115610a405760405163a9059cbb60e01b8152336004820152602481018390527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063a9059cbb906044016020604051808303816000875af1158015610a1a573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610a3e91906113ae565b505b509250929050565b6000808411610a995760405162461bcd60e51b815260206004820152601a60248201527f746f6b656e496e20616d6f756e742063616e6e6f74206265203000000000000060448201526064016103c0565b60008311610ae95760405162461bcd60e51b815260206004820152601b60248201527f746f6b656e4f757420616d6f756e742063616e6e6f742062652030000000000060448201526064016103c0565b6040516323b872dd60e01b8152336004820152306024820152604481018590527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906323b872dd906064016020604051808303816000875af1158015610b5c573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610b8091906113ae565b50600080548190610b989065ffffffffffff1661141c565b91906101000a81548165ffffffffffff021916908365ffffffffffff16021790559050600260009054906101000a900465ffffffffffff1665ffffffffffff16600003610ca4576040805160c0810182526000808252602080830182815233848601908152606085018a8152608086018a815260a0870186815265ffffffffffff8a81168089526001978890529990972097518854955194516001600160a01b0316600160601b026001600160601b03958916600160301b026001600160601b03199097169190981617949094179290921694909417855592519184019190915590516002808401919091559051600390920191909155805465ffffffffffff19169091179055611254565b8165ffffffffffff16600003610e0a576002805465ffffffffffff16600090815260016020819052604090912090810154918101549091908590610ce99088906113d0565b610cf391906113e7565b11610d405760405162461bcd60e51b815260206004820152601a60248201527f796f7572207072696365206d757374203e20746f704f7264657200000000000060448201526064016103c0565b805465ffffffffffff80841665ffffffffffff1992831681179093556040805160c0810182526000808252600280548516602080850191825233858701908152606086018e8152608087018e815260a088018781528c88526001948590529890962096518754945192516001600160a01b0316600160601b026001600160601b03938b16600160301b026001600160601b031990961691909a1617939093171696909617845551948301949094555181840155905160039091015580549091169091179055611254565b65ffffffffffff821660009081526001602052604090208054600160601b90046001600160a01b0316610e7f5760405162461bcd60e51b815260206004820152601860248201527f6265666f72654f72646572206973206e6f74206578697374000000000000000060448201526064016103c0565b805465ffffffffffff1665fffffffffffe1901610ede5760405162461bcd60e51b815260206004820152601c60248201527f6265666f72654f726465722069732072656d6f76656428646f6e65290000000060448201526064016103c0565b806001015484868360020154610ef491906113d0565b610efe91906113e7565b1115610f4c5760405162461bcd60e51b815260206004820152601e60248201527f796f7572207072696365206d757374203c3d206265666f72654f72646572000060448201526064016103c0565b8054600160301b900465ffffffffffff1660000361102d57805465ffffffffffff808416600160301b81810265ffffffffffff60301b19909416939093179093556040805160c08101825286831681526000602080830182815233848601908152606085018d8152608086018d815260a087018681529a86526001948590529690942094518554925191516001600160a01b0316600160601b026001600160601b039289169099026001600160601b031990931697169690961717949094169490941781559251918301919091555160028201559051600390910155611254565b805465ffffffffffff600160301b9091041660009081526001602052604090208054600160601b90046001600160a01b03166110ab5760405162461bcd60e51b815260206004820152601760248201527f61667465724f72646572206973206e6f7420657869737400000000000000000060448201526064016103c0565b805465ffffffffffff1665fffffffffffe190161110a5760405162461bcd60e51b815260206004820152601b60248201527f61667465724f726465722069732072656d6f76656428646f6e6529000000000060448201526064016103c0565b80600101548587836002015461112091906113d0565b61112a91906113e7565b116111775760405162461bcd60e51b815260206004820152601c60248201527f796f7572207072696365206d757374203e2061667465724f726465720000000060448201526064016103c0565b6040805160c08101825265ffffffffffff80871682528454600160301b908190048216602080850191825233858701908152606086018d8152608087018d8152600060a089018181528d89168083526001968790529a90912098518954965194516001600160a01b0316600160601b026001600160601b03958a1689026001600160601b031990981691909916179590951792909216959095178655935190850155915160028401559051600390920191909155835490820265ffffffffffff60301b199190911617909255805465ffffffffffff191690911790555b9392505050565b805465ffffffffffff16156112a557805465ffffffffffff8082166000908152600160205260409020805465ffffffffffff60301b1916600160301b938490049092169092021790555b8054600160301b900465ffffffffffff16156112ef578054600160301b810465ffffffffffff9081166000908152600160205260409020805465ffffffffffff1916919092161790555b50565b803565ffffffffffff8116811461130857600080fd5b919050565b60006020828403121561131f57600080fd5b611254826112f2565b6000806040838503121561133b57600080fd5b50508035926020909101359150565b60008060006060848603121561135f57600080fd5b8335925060208401359150611376604085016112f2565b90509250925092565b634e487b7160e01b600052601160045260246000fd5b818103818111156113a8576113a861137f565b92915050565b6000602082840312156113c057600080fd5b8151801515811461125457600080fd5b80820281158282048414176113a8576113a861137f565b60008261140457634e487b7160e01b600052601260045260246000fd5b500490565b808201808211156113a8576113a861137f565b600065ffffffffffff8083168181036114375761143761137f565b600101939250505056fea26469706673582212201cbdb00b24bc049dbaf03e3a13fb311b9c42117b47bfd34fc2336a1204489f3964736f6c63430008180033",
  "deployedBytecode": "0x608060405234801561001057600080fd5b50600436106100935760003560e01c8063c4ccb40a11610066578063c4ccb40a1461014e578063d21220a714610160578063d44ca7af14610187578063dda37b2414610228578063e5c274bc1461023b57600080fd5b80630dfe1681146100985780635662ecc7146100dc57806367d301f9146101055780638a44b05614610126575b600080fd5b6100bf7f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020015b60405180910390f35b6000546100ee9065ffffffffffff1681565b60405165ffffffffffff90911681526020016100d3565b61011861011336600461130d565b61034d565b6040519081526020016100d3565b610139610134366004611328565b61054e565b604080519283526020830191909152016100d3565b6002546100ee9065ffffffffffff1681565b6100bf7f000000000000000000000000000000000000000000000000000000000000000081565b6101e361019536600461130d565b6001602081905260009182526040909120805491810154600282015460039092015465ffffffffffff80851694600160301b810490911693600160601b9091046001600160a01b0316929186565b6040805165ffffffffffff97881681529690951660208701526001600160a01b03909316938501939093526060840152608083019190915260a082015260c0016100d3565b6100ee61023636600461134a565b610a48565b6102f061024936600461130d565b6040805160c081018252600080825260208201819052918101829052606081018290526080810182905260a08101919091525065ffffffffffff908116600090815260016020818152604092839020835160c08101855281548087168252600160301b810490961692810192909252600160601b9094046001600160a01b03169281019290925282015460608201526002820154608082015260039091015460a082015290565b6040516100d39190815165ffffffffffff9081168252602080840151909116908201526040808301516001600160a01b031690820152606080830151908201526080808301519082015260a0918201519181019190915260c00190565b65ffffffffffff811660009081526001602052604081208054600160601b90046001600160a01b031633146103c95760405162461bcd60e51b815260206004820152601e60248201527f796f7520617265206e6f74206f776e6572206f6620746865206f72646572000060448201526064015b60405180910390fd5b805465ffffffffffff1665fffffffffffe19016104335760405162461bcd60e51b815260206004820152602260248201527f746865206f7264657220697320616c72656164792072656d6f76656428646f6e604482015261652960f01b60648201526084016103c0565b61043c8161125b565b60025465ffffffffffff80851691160361047857805460028054600160301b90920465ffffffffffff1665ffffffffffff199092169190911790555b805465ffffffffffff191665ffffffffffff178155600381015460018201546104a19190611395565b9150811561054857805460405163a9059cbb60e01b8152600160601b9091046001600160a01b039081166004830152602482018490527f0000000000000000000000000000000000000000000000000000000000000000169063a9059cbb906044016020604051808303816000875af1158015610522573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061054691906113ae565b505b50919050565b600254600090819065ffffffffffff1681036105a15760405162461bcd60e51b81526020600482015260126024820152716275794f726465727320697320656d70747960701b60448201526064016103c0565b6040516323b872dd60e01b8152336004820152306024820152604481018590527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906323b872dd906064016020604051808303816000875af1158015610614573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061063891906113ae565b50835b60025465ffffffffffff16156108ad576002805465ffffffffffff16600090815260016020819052604082209081015492810154600382015491939161068191906113d0565b61068b91906113e7565b826002015461069a9190611395565b90508083106107b4576106ad8184611395565b9250816003015482600101546106c39190611395565b6106cd9085611409565b93506106d88261125b565b60018201546003830155815460405163a9059cbb60e01b8152600160601b9091046001600160a01b039081166004830152602482018390527f0000000000000000000000000000000000000000000000000000000000000000169063a9059cbb906044016020604051808303816000875af115801561075b573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061077f91906113ae565b50815465ffffffffffff1990811665ffffffffffff90811780855560028054909316600160301b9091049091161790556108a6565b600082600201548360010154856107cb91906113d0565b6107d591906113e7565b90506107e18186611409565b9450808360030160008282546107f79190611409565b9091555050825460405163a9059cbb60e01b8152600160601b9091046001600160a01b039081166004830152602482018690527f0000000000000000000000000000000000000000000000000000000000000000169063a9059cbb906044016020604051808303816000875af1158015610875573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061089991906113ae565b50600093505050506108ad565b505061063b565b6108b78186611395565b9250816108c484866113d0565b6108ce91906113e7565b85101561090e5760405162461bcd60e51b815260206004820152600e60248201526d1c1c9a58d9481b9bdd0819dbdbd960921b60448201526064016103c0565b80156109a75760405163a9059cbb60e01b8152336004820152602481018290527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063a9059cbb906044016020604051808303816000875af1158015610981573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109a591906113ae565b505b8115610a405760405163a9059cbb60e01b8152336004820152602481018390527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063a9059cbb906044016020604051808303816000875af1158015610a1a573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610a3e91906113ae565b505b509250929050565b6000808411610a995760405162461bcd60e51b815260206004820152601a60248201527f746f6b656e496e20616d6f756e742063616e6e6f74206265203000000000000060448201526064016103c0565b60008311610ae95760405162461bcd60e51b815260206004820152601b60248201527f746f6b656e4f757420616d6f756e742063616e6e6f742062652030000000000060448201526064016103c0565b6040516323b872dd60e01b8152336004820152306024820152604481018590527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906323b872dd906064016020604051808303816000875af1158015610b5c573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610b8091906113ae565b50600080548190610b989065ffffffffffff1661141c565b91906101000a81548165ffffffffffff021916908365ffffffffffff16021790559050600260009054906101000a900465ffffffffffff1665ffffffffffff16600003610ca4576040805160c0810182526000808252602080830182815233848601908152606085018a8152608086018a815260a0870186815265ffffffffffff8a81168089526001978890529990972097518854955194516001600160a01b0316600160601b026001600160601b03958916600160301b026001600160601b03199097169190981617949094179290921694909417855592519184019190915590516002808401919091559051600390920191909155805465ffffffffffff19169091179055611254565b8165ffffffffffff16600003610e0a576002805465ffffffffffff16600090815260016020819052604090912090810154918101549091908590610ce99088906113d0565b610cf391906113e7565b11610d405760405162461bcd60e51b815260206004820152601a60248201527f796f7572207072696365206d757374203e20746f704f7264657200000000000060448201526064016103c0565b805465ffffffffffff80841665ffffffffffff1992831681179093556040805160c0810182526000808252600280548516602080850191825233858701908152606086018e8152608087018e815260a088018781528c88526001948590529890962096518754945192516001600160a01b0316600160601b026001600160601b03938b16600160301b026001600160601b031990961691909a1617939093171696909617845551948301949094555181840155905160039091015580549091169091179055611254565b65ffffffffffff821660009081526001602052604090208054600160601b90046001600160a01b0316610e7f5760405162461bcd60e51b815260206004820152601860248201527f6265666f72654f72646572206973206e6f74206578697374000000000000000060448201526064016103c0565b805465ffffffffffff1665fffffffffffe1901610ede5760405162461bcd60e51b815260206004820152601c60248201527f6265666f72654f726465722069732072656d6f76656428646f6e65290000000060448201526064016103c0565b806001015484868360020154610ef491906113d0565b610efe91906113e7565b1115610f4c5760405162461bcd60e51b815260206004820152601e60248201527f796f7572207072696365206d757374203c3d206265666f72654f72646572000060448201526064016103c0565b8054600160301b900465ffffffffffff1660000361102d57805465ffffffffffff808416600160301b81810265ffffffffffff60301b19909416939093179093556040805160c08101825286831681526000602080830182815233848601908152606085018d8152608086018d815260a087018681529a86526001948590529690942094518554925191516001600160a01b0316600160601b026001600160601b039289169099026001600160601b031990931697169690961717949094169490941781559251918301919091555160028201559051600390910155611254565b805465ffffffffffff600160301b9091041660009081526001602052604090208054600160601b90046001600160a01b03166110ab5760405162461bcd60e51b815260206004820152601760248201527f61667465724f72646572206973206e6f7420657869737400000000000000000060448201526064016103c0565b805465ffffffffffff1665fffffffffffe190161110a5760405162461bcd60e51b815260206004820152601b60248201527f61667465724f726465722069732072656d6f76656428646f6e6529000000000060448201526064016103c0565b80600101548587836002015461112091906113d0565b61112a91906113e7565b116111775760405162461bcd60e51b815260206004820152601c60248201527f796f7572207072696365206d757374203e2061667465724f726465720000000060448201526064016103c0565b6040805160c08101825265ffffffffffff80871682528454600160301b908190048216602080850191825233858701908152606086018d8152608087018d8152600060a089018181528d89168083526001968790529a90912098518954965194516001600160a01b0316600160601b026001600160601b03958a1689026001600160601b031990981691909916179590951792909216959095178655935190850155915160028401559051600390920191909155835490820265ffffffffffff60301b199190911617909255805465ffffffffffff191690911790555b9392505050565b805465ffffffffffff16156112a557805465ffffffffffff8082166000908152600160205260409020805465ffffffffffff60301b1916600160301b938490049092169092021790555b8054600160301b900465ffffffffffff16156112ef578054600160301b810465ffffffffffff9081166000908152600160205260409020805465ffffffffffff1916919092161790555b50565b803565ffffffffffff8116811461130857600080fd5b919050565b60006020828403121561131f57600080fd5b611254826112f2565b6000806040838503121561133b57600080fd5b50508035926020909101359150565b60008060006060848603121561135f57600080fd5b8335925060208401359150611376604085016112f2565b90509250925092565b634e487b7160e01b600052601160045260246000fd5b818103818111156113a8576113a861137f565b92915050565b6000602082840312156113c057600080fd5b8151801515811461125457600080fd5b80820281158282048414176113a8576113a861137f565b60008261140457634e487b7160e01b600052601260045260246000fd5b500490565b808201808211156113a8576113a861137f565b600065ffffffffffff8083168181036114375761143761137f565b600101939250505056fea26469706673582212201cbdb00b24bc049dbaf03e3a13fb311b9c42117b47bfd34fc2336a1204489f3964736f6c63430008180033",
  "linkReferences": {},
  "deployedLinkReferences": {}
}

declare module "@nomicfoundation/hardhat-viem/types" {
  export function deployContract(
    contractName: "Pair",
    constructorArgs: [token0Addr: AbiParameterToPrimitiveType<{"name":"token0Addr","type":"address"}>, token1Addr: AbiParameterToPrimitiveType<{"name":"token1Addr","type":"address"}>],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<Pair$Type["abi"]>>;
  export function deployContract(
    contractName: "contracts/Pair.sol:Pair",
    constructorArgs: [token0Addr: AbiParameterToPrimitiveType<{"name":"token0Addr","type":"address"}>, token1Addr: AbiParameterToPrimitiveType<{"name":"token1Addr","type":"address"}>],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<Pair$Type["abi"]>>;

  export function sendDeploymentTransaction(
    contractName: "Pair",
    constructorArgs: [token0Addr: AbiParameterToPrimitiveType<{"name":"token0Addr","type":"address"}>, token1Addr: AbiParameterToPrimitiveType<{"name":"token1Addr","type":"address"}>],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<Pair$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;
  export function sendDeploymentTransaction(
    contractName: "contracts/Pair.sol:Pair",
    constructorArgs: [token0Addr: AbiParameterToPrimitiveType<{"name":"token0Addr","type":"address"}>, token1Addr: AbiParameterToPrimitiveType<{"name":"token1Addr","type":"address"}>],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<Pair$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;

  export function getContractAt(
    contractName: "Pair",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<Pair$Type["abi"]>>;
  export function getContractAt(
    contractName: "contracts/Pair.sol:Pair",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<Pair$Type["abi"]>>;
}
