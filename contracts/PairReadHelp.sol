// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./Pair.sol";
import "hardhat/console.sol";

contract PairReadHelp {
    
    struct Order {
        uint48 orderId; //0:not exist; start from 1
        address owner;
        uint amountIn; //token deposit in
        uint amountOut; //want token out
        uint amountInUsed;
        bool isDone; //means removed
    }

    constructor() {
    }

    function getBuyList(address pairAddr, uint48 fromOrderId, uint8 num) public view returns (Order[] memory) {
        Pair pair = Pair(pairAddr);
        Pair.Order memory pairOrder = pair.getBuyOrder(fromOrderId);
        Order[] memory result = new Order[](num);

        result[0] = convertOrder(pairOrder, fromOrderId);
        for (uint8 i = 1; i < num; i++) {
            uint48 orderId = pairOrder.afterOrderId;
            pairOrder = pair.getBuyOrder(orderId);
            result[i] = convertOrder(pairOrder, orderId);
        }
        return result;
    }

    function getOrder(address pairAddr, uint48 orderId) public view returns (Order memory) {
        Pair pair = Pair(pairAddr);
        Pair.Order memory pairOrder = pair.getBuyOrder(orderId);
        return convertOrder(pairOrder, orderId);
    }

    function convertOrder(Pair.Order memory pairOrder, uint48 orderId) internal pure returns (Order memory) {
        return Order(
            orderId, 
            pairOrder.owner,
            pairOrder.amountIn,
            pairOrder.amountOut,
            pairOrder.amountInUsed,
            pairOrder.beforeOrderId == type(uint48).max
        );
    }

}