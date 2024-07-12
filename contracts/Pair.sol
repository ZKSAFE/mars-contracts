// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract Pair {
    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint96 public lastOrderId = 0;

    struct Order {
        //(removed for saving gas) uint96 orderId; //0:not exist; start from 1
        uint96 beforeOrderId; //0:this is the top order
        uint96 afterOrderId; //0:this is the last order
        address owner;
        uint amountIn; //token deposit in
        uint amountOut; //want token out
        uint amountInUsed;
        bool isDone; //means removed
    }

    mapping (uint96 => Order) public buyOrders; //orderId => Order
    uint96 public topBuyOrderId; //0:buyOrders is empty

    // event MakeOrder(bool isBuy, uint tokenIn, uint tokenOut);


    constructor(address token0Addr, address token1Addr) {
        token0 = IERC20(token0Addr);
        token1 = IERC20(token1Addr);
    }

    function getBuyOrder(uint96 orderId) public view returns (Order memory) {
        return buyOrders[orderId];
    }

    function makeBuyOrder(uint token1In, uint token0Out, uint96 beforeOrderId) public returns (uint96 newOrderId) {
        require(token1In > 0, "tokenIn amount cannot be 0");
        require(token0Out > 0, "tokenOut amount cannot be 0");
        token1.transferFrom(msg.sender, address(this), token1In);

        newOrderId = ++lastOrderId;

        //if buyOrders is empty
        if (topBuyOrderId == 0) {
            buyOrders[newOrderId] = Order(0, 0, msg.sender, token1In, token0Out, 0, false);
            topBuyOrderId = newOrderId;
            return newOrderId;
        }

        //if newOrder is the new topOrder
        if (beforeOrderId == 0) {
            Order storage topOrder = buyOrders[topBuyOrderId];
            require(topOrder.amountOut * token1In / token0Out > topOrder.amountIn, "your price must > topOrder");

            topOrder.beforeOrderId = newOrderId;
            buyOrders[newOrderId] = Order(0, topBuyOrderId, msg.sender, token1In, token0Out, 0, false);
            topBuyOrderId = newOrderId;
            return newOrderId;
        }

        Order storage beforeOrder = buyOrders[beforeOrderId];
        require(beforeOrder.owner != address(0), "beforeOrder is not exist");
        require(!beforeOrder.isDone, "beforeOrder is removed(done)");
        require(beforeOrder.amountOut * token1In / token0Out <= beforeOrder.amountIn, "your price must <= beforeOrder");
        
        //if newOrder is the new lastOrder
        if (beforeOrder.afterOrderId == 0) {
            beforeOrder.afterOrderId = newOrderId;
            buyOrders[newOrderId] = Order(beforeOrderId, 0, msg.sender, token1In, token0Out, 0, false);
            return newOrderId;
        }

        //if beforeOrder and afterOrder both exist
        Order storage afterOrder = buyOrders[beforeOrder.afterOrderId];
        require(afterOrder.owner != address(0), "afterOrder is not exist");
        require(!afterOrder.isDone, "afterOrder is removed(done)");
        require(afterOrder.amountOut * token1In / token0Out > afterOrder.amountIn, "your price must > afterOrder");

        buyOrders[newOrderId] = Order(beforeOrderId, beforeOrder.afterOrderId, msg.sender, token1In, token0Out, 0, false);
        beforeOrder.afterOrderId = newOrderId;
        afterOrder.beforeOrderId = newOrderId;
        return newOrderId;
    }

    function takeBuyOrder(uint token0In, uint token1want) public returns (uint token0Sold, uint token1Gain) {
        require(topBuyOrderId != 0, "buyOrders is empty");

        token0.transferFrom(msg.sender, address(this), token0In);

        uint takerToken0Left = token0In;

        while (topBuyOrderId != 0) {
            Order storage topOrder = buyOrders[topBuyOrderId];
            uint topOrderToken0Left = topOrder.amountOut - topOrder.amountInUsed * topOrder.amountOut / topOrder.amountIn;

            if (takerToken0Left >= topOrderToken0Left) { //completely take the order
                takerToken0Left -= topOrderToken0Left;
                token1Gain += (topOrder.amountIn - topOrder.amountInUsed);
                
                //topOrder is done
                _removeBuyOrderLink(topOrder);
                topOrder.amountInUsed = topOrder.amountIn;
                token0.transfer(topOrder.owner, topOrderToken0Left);
                topOrder.isDone = true;

                // console.log("done, amountOut:", topOrderToken0Left);
                topBuyOrderId = topOrder.afterOrderId; //continue loop

            } else {  //partly take the order
                uint deltaToken1Gain = takerToken0Left * topOrder.amountIn / topOrder.amountOut;
                token1Gain += deltaToken1Gain;

                //topOrder is partly done
                topOrder.amountInUsed += deltaToken1Gain;
                token0.transfer(topOrder.owner, takerToken0Left);

                // console.log("partly done, takerToken0Left:", takerToken0Left);
                takerToken0Left = 0;
                break;
            }
        }

        token0Sold = token0In - takerToken0Left;
        require(token0In >= token1want * token0Sold / token1Gain, "price not good");

        if (takerToken0Left > 0) {
            token0.transfer(msg.sender, takerToken0Left);
        }
        if (token1Gain > 0) {
            token1.transfer(msg.sender, token1Gain);
        }
    }

    function cancelBuyOrder(uint96 orderId) public returns (uint token1Left) {
        Order storage order = buyOrders[orderId];
        require(order.owner == msg.sender, "you are not owner of the order");
        require(!order.isDone, "the order is already removed(done)");

        _removeBuyOrderLink(order);
        if (topBuyOrderId == orderId) {
            topBuyOrderId = order.afterOrderId;
        }
        order.isDone = true;

        token1Left = order.amountIn - order.amountInUsed;
        if (token1Left > 0) {
            token1.transfer(order.owner, token1Left);
        }
    }

    function _removeBuyOrderLink(Order storage order) internal {
        if (order.beforeOrderId != 0) {
            buyOrders[order.beforeOrderId].afterOrderId = order.afterOrderId;
        }
        if (order.afterOrderId != 0) {
            buyOrders[order.afterOrderId].beforeOrderId = order.beforeOrderId;
        }
    }

}