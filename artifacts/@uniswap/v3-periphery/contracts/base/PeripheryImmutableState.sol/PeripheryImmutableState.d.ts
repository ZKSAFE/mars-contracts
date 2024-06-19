// This file was autogenerated by hardhat-viem, do not edit it.
// prettier-ignore
// tslint:disable
// eslint-disable

import type { Address } from "viem";
import type { GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import "@nomicfoundation/hardhat-viem/types";

export interface PeripheryImmutableState$Type {
  "_format": "hh-sol-artifact-1",
  "contractName": "PeripheryImmutableState",
  "sourceName": "@uniswap/v3-periphery/contracts/base/PeripheryImmutableState.sol",
  "abi": [
    {
      "inputs": [],
      "name": "WETH9",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "factory",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "bytecode": "0x",
  "deployedBytecode": "0x",
  "linkReferences": {},
  "deployedLinkReferences": {}
}

declare module "@nomicfoundation/hardhat-viem/types" {
  export function deployContract(
    contractName: "PeripheryImmutableState",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<PeripheryImmutableState$Type["abi"]>>;
  export function deployContract(
    contractName: "@uniswap/v3-periphery/contracts/base/PeripheryImmutableState.sol:PeripheryImmutableState",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<PeripheryImmutableState$Type["abi"]>>;

  export function sendDeploymentTransaction(
    contractName: "PeripheryImmutableState",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<PeripheryImmutableState$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;
  export function sendDeploymentTransaction(
    contractName: "@uniswap/v3-periphery/contracts/base/PeripheryImmutableState.sol:PeripheryImmutableState",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<PeripheryImmutableState$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;

  export function getContractAt(
    contractName: "PeripheryImmutableState",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<PeripheryImmutableState$Type["abi"]>>;
  export function getContractAt(
    contractName: "@uniswap/v3-periphery/contracts/base/PeripheryImmutableState.sol:PeripheryImmutableState",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<PeripheryImmutableState$Type["abi"]>>;
}
