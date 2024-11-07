// This file was autogenerated by hardhat-viem, do not edit it.
// prettier-ignore
// tslint:disable
// eslint-disable

import type { Address } from "viem";
import type { GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import "@nomicfoundation/hardhat-viem/types";

export interface IFactory$Type {
  "_format": "hh-sol-artifact-1",
  "contractName": "IFactory",
  "sourceName": "contracts/v2/MonoTrade.sol",
  "abi": [
    {
      "inputs": [],
      "name": "feeTo",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
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
    contractName: "IFactory",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<IFactory$Type["abi"]>>;
  export function deployContract(
    contractName: "contracts/v2/MonoTrade.sol:IFactory",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<IFactory$Type["abi"]>>;

  export function sendDeploymentTransaction(
    contractName: "IFactory",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<IFactory$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;
  export function sendDeploymentTransaction(
    contractName: "contracts/v2/MonoTrade.sol:IFactory",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<IFactory$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;

  export function getContractAt(
    contractName: "IFactory",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<IFactory$Type["abi"]>>;
  export function getContractAt(
    contractName: "contracts/v2/MonoTrade.sol:IFactory",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<IFactory$Type["abi"]>>;
}