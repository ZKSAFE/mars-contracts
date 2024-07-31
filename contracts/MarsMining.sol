// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MarsToken.sol";
import "./MarsFactory.sol";
import "./MarsPair.sol";
import "hardhat/console.sol";

contract MarsMining {

    MarsToken public mars = new MarsToken();
    MarsFactory public factory = new MarsFactory();

    mapping (bytes26 => bool) public isMined;

    constructor() {
    }

    // function miningFee(address pairAddr, uint48 orderId) public {
    //     if (_isBuy(pairAddr, orderId)) {
    //         MarsPair.Order memory order = MarsPair(pairAddr).getBuyOrder(orderId);
    //         require(order.progress == type(uint32).max, "order is not done");
            
    //         uint112 fee = order.amountOut * MarsPair(pairAddr).fee() / 10000;
    //         MarsPair(pairAddr).token0().transfer(order.owner, fee);

    //     } else {
    //         MarsPair.Order memory order = MarsPair(pairAddr).getSellOrder(orderId);
    //         require(order.progress == type(uint32).max, "order is not done");

    //         uint112 fee = order.amountOut * MarsPair(pairAddr).fee() / 10000;
    //         MarsPair(pairAddr).token1().transfer(order.owner, fee);
    //     }
    // }

    function mining(address pairAddr, uint48 orderId, bytes calldata routersBytes) public returns (uint) {
        require(!isMined[_encodeAddressUint48(pairAddr, orderId)], "already mined");

        address tokenInAddr;
        uint112 tokenInAmount;
        MarsPair.Order memory order;
        if (MarsPair(pairAddr).isBuy(orderId)) {
            order = MarsPair(pairAddr).getBuyOrder(orderId);
            require(order.progress == type(uint32).max, "order is not done");
            
            tokenInAmount = order.amountOut * MarsPair(pairAddr).fee() / 10000;
            tokenInAddr = address(MarsPair(pairAddr).token0());

        } else {
            order = MarsPair(pairAddr).getSellOrder(orderId);
            require(order.progress == type(uint32).max, "order is not done");

            tokenInAmount = order.amountOut * MarsPair(pairAddr).fee() / 10000;
            tokenInAddr = address(MarsPair(pairAddr).token1());
        }

        require(tokenInAmount > 0, "nothing to mine");

        uint routersLength = routersBytes.length / 20 - 1;
        for (uint i = 0; i < routersLength; i++) {
            uint p = i * 20;
            address routerTokenIn = address(bytes20(bytes(routersBytes[p : p + 20])));
            address routerTokenOut = address(bytes20(bytes(routersBytes[p + 20 : p + 40])));
            // console.log("routerTokenIn:", routerTokenIn, "routerTokenOut:", routerTokenOut);
            if (i == 0) {
                require(routerTokenIn == tokenInAddr, "router wrong");
            }
            if (i == routersLength - 1) {
                require(routerTokenOut == address(mars), "router wrong");
            }

            bool isTakeBuyOrder = true;
            address routerPairAddr = factory.computePairAddr(routerTokenIn, routerTokenOut);
            if (!factory.hasPair(routerPairAddr)) {
                isTakeBuyOrder = false;
                routerPairAddr = factory.computePairAddr(routerTokenOut, routerTokenIn);
                require(factory.hasPair(routerPairAddr), "router pair not exist");
            }

            IERC20(routerTokenIn).approve(routerPairAddr, type(uint).max);
            // uint balance = IERC20(routerTokenIn).balanceOf(address(this));
            // console.log("balance:", balance, "tokenInAmount:", tokenInAmount);
            if (isTakeBuyOrder) {
                (uint112 token0Pay, uint112 token1Gain, uint112 token0Fee) = MarsPair(routerPairAddr).takeBuyOrder(tokenInAmount, 1);
                require(token0Fee == 0, "token0Fee should be 0");
                require(token0Pay == tokenInAmount, "partly done is not allowed");
                tokenInAmount = token1Gain; //continue loop
            } else {
                (uint112 token1Pay, uint112 token0Gain, uint112 token1Fee) = MarsPair(routerPairAddr).takeSellOrder(tokenInAmount, 1);
                require(token1Fee == 0, "token1Fee should be 0");
                require(token1Pay == tokenInAmount, "partly done is not allowed");
                tokenInAmount = token0Gain; //continue loop
            }
            IERC20(routerTokenIn).approve(routerPairAddr, 0);
        }

        mars.transfer(order.owner, tokenInAmount); //mining mars
        isMined[_encodeAddressUint48(pairAddr, orderId)] = true;

        return tokenInAmount;
    }

    function _encodeAddressUint48(address addr, uint48 u48) internal pure returns (bytes26) {
        return bytes26(bytes.concat(bytes20(uint160(addr)), bytes6(u48)));
    }

    function _decodeAddressUint48(bytes26 b26) internal pure returns (address addr, uint48 u48) {
        addr = address(uint160(bytes20(b26)));
        u48 = uint48(uint208(b26));
    }

}