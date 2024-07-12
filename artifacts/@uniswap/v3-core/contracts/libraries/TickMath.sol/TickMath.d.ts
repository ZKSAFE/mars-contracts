// This file was autogenerated by hardhat-viem, do not edit it.
// prettier-ignore
// tslint:disable
// eslint-disable

import type { Address } from "viem";
import type { GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import "@nomicfoundation/hardhat-viem/types";

export interface TickMath$Type {
  "_format": "hh-sol-artifact-1",
  "contractName": "TickMath",
  "sourceName": "@uniswap/v3-core/contracts/libraries/TickMath.sol",
  "abi": [],
  "bytecode": "0x60566023600b82828239805160001a607314601657fe5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600080fdfea2646970667358221220c514f986628190018bc9297fa68433fbba17061473c629c0d985757de6fd75fd64736f6c63430007060033",
  "deployedBytecode": "0x73000000000000000000000000000000000000000030146080604052600080fdfea2646970667358221220c514f986628190018bc9297fa68433fbba17061473c629c0d985757de6fd75fd64736f6c63430007060033",
  "linkReferences": {},
  "deployedLinkReferences": {}
}

declare module "@nomicfoundation/hardhat-viem/types" {
  export function deployContract(
    contractName: "TickMath",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<TickMath$Type["abi"]>>;
  export function deployContract(
    contractName: "@uniswap/v3-core/contracts/libraries/TickMath.sol:TickMath",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<TickMath$Type["abi"]>>;

  export function sendDeploymentTransaction(
    contractName: "TickMath",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<TickMath$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;
  export function sendDeploymentTransaction(
    contractName: "@uniswap/v3-core/contracts/libraries/TickMath.sol:TickMath",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<TickMath$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;

  export function getContractAt(
    contractName: "TickMath",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<TickMath$Type["abi"]>>;
  export function getContractAt(
    contractName: "@uniswap/v3-core/contracts/libraries/TickMath.sol:TickMath",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<TickMath$Type["abi"]>>;
}