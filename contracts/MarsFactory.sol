// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./MarsPair.sol";
import "hardhat/console.sol";

contract MarsFactory {

    uint8 public constant fee = 100;
    address public immutable feeTo;

    mapping(address => bool) public hasPair;

    event PairCreated(address indexed token0, address indexed token1, address pair);


    constructor() {
        feeTo = msg.sender;
    }

    function createPair(address token0, address token1) external returns (address pairAddr) {
        require(token0 != token1, 'IDENTICAL_ADDRESSES');
        require(token0 != address(0), 'ZERO_ADDRESS');
        require(token1 != address(0), 'ZERO_ADDRESS');

        address predictedAddr = computePairAddr(token0, token1);
        require(!hasPair[predictedAddr], 'PAIR_EXISTS');

        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        MarsPair pair = new MarsPair{salt: salt}(token0, token1, fee, feeTo);

        pairAddr = address(pair);
        hasPair[pairAddr] = true;

        emit PairCreated(token0, token1, pairAddr);
    }

    function computePairAddr(address token0, address token1) public view returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        address predictedAddr = address(
            uint160(
                uint(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            salt,
                            keccak256(
                                abi.encodePacked(
                                    type(MarsPair).creationCode, 
                                    abi.encode(token0, token1, fee, feeTo) //constructor params
                                )
                            )
                        )
                    )
                )
            )
        );

        return predictedAddr;
    }
}