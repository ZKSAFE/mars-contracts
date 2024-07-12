// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./Pair.sol";
import "hardhat/console.sol";

contract PairReadHelp {
    
    struct Order {
        uint96 orderId; //0:not exist; start from 1
        uint96 beforeOrderId; //0:this is the top order
        uint96 afterOrderId; //0:this is the last order
        address owner;
        uint amountIn; //token deposit in
        uint amountOut; //want token out
        uint amountInUsed;
        bool isDone; //means removed
    }

    constructor() {
    }

    function getBuyList(address pairAddr, uint96 fromOrderId, uint8 num) public view returns (Order[] memory) {
        Pair pair = Pair(pairAddr);
        Pair.Order memory pairOrder = pair.getBuyOrder(fromOrderId);
        Order[] memory result = new Order[](num);

        result[0] = convertOrder(pairOrder, fromOrderId);
        for (uint8 i = 1; i < num; i++) {
            uint96 orderId = pairOrder.afterOrderId;
            pairOrder = pair.getBuyOrder(orderId);
            result[i] = convertOrder(pairOrder, orderId);
        }
        return result;
    }

    function convertOrder(Pair.Order memory pairOrder, uint96 orderId) internal pure returns (Order memory) {
        return Order(
            orderId, 
            pairOrder.beforeOrderId, 
            pairOrder.afterOrderId, 
            pairOrder.owner,
            pairOrder.amountIn,
            pairOrder.amountOut,
            pairOrder.amountInUsed,
            pairOrder.isDone
        );
    }

}