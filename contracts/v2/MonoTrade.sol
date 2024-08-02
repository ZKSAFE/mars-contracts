// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

/**
 * @notice The trading direction is mono, send token1 in for making order, or sending token0 for taking order
 * 2 MonoTrades can be combined into a trading pair
 */
contract MonoTrade {

    IERC20 public immutable token0;
    IERC20 public immutable token1;
    uint8 public immutable fee; //100 means 1%
    address public immutable feeTo;

    uint48 public count = 0;

    struct Order {
        //uses single storage slot
        //(removed for saving gas) uint48 orderId; //0:not exist; start from 1
        uint48 beforeOrderId; //0:this is the top order
        uint48 afterOrderId; //0:this is the last order
        address owner;

        //uses single storage slot
        uint112 amountIn; //token deposit in
        uint112 amountOut; //want token out
        uint32 progress; // progress/type(uint32).max is the progress[0, 1], if amountIn is a large number, precision will be decreased
        //(removed for saving gas) bool isDone; //beforeOrderId==type(uint48).max means removed(done)
    }

    mapping (uint48 => Order) public orders; //orderId => Order
    uint48 public topOrderId; //0:orders is empty

    constructor(address token0Addr, address token1Addr, uint8 _fee, address _feeTo) {
        token0 = IERC20(token0Addr);
        token1 = IERC20(token1Addr);
        fee = _fee;
        feeTo = _feeTo;
    }

    function getOrder(uint48 orderId) public view returns (Order memory) {
        return orders[orderId];
    }

    function makeOrder(uint112 token1In, uint112 token0Out, uint48 beforeOrderId) public returns (uint48) {
        require(token1In > 0, "MonoTrade: makeOrder:: token1In amount cannot be 0");
        require(token0Out > 0, "MonoTrade: makeOrder:: token0Out amount cannot be 0");
        token1.transferFrom(msg.sender, address(this), uint(token1In));

        ++count;

        //if orders is empty
        if (topOrderId == 0) {
            orders[count] = Order(0, 0, msg.sender, token1In, token0Out, 0);
            topOrderId = count;
            return count;
        }

        //if newOrder is the new topOrder
        if (beforeOrderId == 0) {
            Order storage topOrder = orders[topOrderId];
            require(topOrder.amountOut * uint(token1In) > topOrder.amountIn * uint(token0Out), "MonoTrade: makeOrder:: your price must > topOrder");

            topOrder.beforeOrderId = count;
            orders[count] = Order(0, topOrderId, msg.sender, token1In, token0Out, 0);
            topOrderId = count;
            return count;
        }

        Order storage beforeOrder = orders[beforeOrderId];
        require(beforeOrder.amountIn != 0, "MonoTrade: makeOrder:: beforeOrder is not exist");
        require(beforeOrder.beforeOrderId != type(uint48).max, "MonoTrade: makeOrder:: beforeOrder is removed(done)");
        require(beforeOrder.amountOut * uint(token1In) <= beforeOrder.amountIn * uint(token0Out), "MonoTrade: makeOrder:: your price must <= beforeOrder");
        
        //if newOrder is the new lastOrder
        if (beforeOrder.afterOrderId == 0) {
            beforeOrder.afterOrderId = count;
            orders[count] = Order(beforeOrderId, 0, msg.sender, token1In, token0Out, 0);
            return count;
        }

        //if beforeOrder and afterOrder both exist
        Order storage afterOrder = orders[beforeOrder.afterOrderId];
        require(afterOrder.amountIn != 0, "MonoTrade: makeOrder:: afterOrder is not exist");
        require(afterOrder.beforeOrderId != type(uint48).max, "MonoTrade: makeOrder:: afterOrder is removed");
        require(afterOrder.amountOut * uint(token1In) > afterOrder.amountIn * uint(token0Out), "MonoTrade: makeOrder:: your price must > afterOrder");

        orders[count] = Order(beforeOrderId, beforeOrder.afterOrderId, msg.sender, token1In, token0Out, 0);
        beforeOrder.afterOrderId = count;
        afterOrder.beforeOrderId = count;
        return count;
    }

    function takeOrder(uint112 token0In, uint112 token1Want) public returns (uint112 token0Pay, uint112 token1Gain, uint112 token0Fee) {
        require(topOrderId != 0, "MonoTrade: takeOrder:: orders is empty");

        token0.transferFrom(msg.sender, address(this), uint(token0In));

        uint112 takerToken0Left = token0In;

        while (topOrderId != 0) {
            Order storage topOrder = orders[topOrderId];
            if (uint(token0In) * topOrder.amountIn < uint(token1Want) * topOrder.amountOut ) {
                break; //price not good
            }
            uint112 amountInUsed = uint112(uint(topOrder.progress) * topOrder.amountIn / type(uint32).max);
            uint112 topOrderToken0Left = topOrder.amountOut - uint112(uint(amountInUsed) * topOrder.amountOut / topOrder.amountIn);

            if (takerToken0Left >= topOrderToken0Left) { //completely take the order
                takerToken0Left -= topOrderToken0Left;
                token1Gain += (topOrder.amountIn - amountInUsed);
                
                //topOrder is done
                _removeOrderLink(topOrder);
                topOrder.progress = type(uint32).max;
                token0.transfer(topOrder.owner, uint(topOrderToken0Left));
                topOrder.beforeOrderId = type(uint48).max;

                // console.log("done, amountOut:", topOrderToken0Left);
                topOrderId = topOrder.afterOrderId; //continue loop

            } else {  //partly take the order
                uint112 deltaToken1Gain = uint112(uint(takerToken0Left) * topOrder.amountIn / topOrder.amountOut);
                token1Gain += deltaToken1Gain;

                //topOrder is partly done
                amountInUsed += deltaToken1Gain;
                topOrder.progress = uint32(amountInUsed * type(uint32).max / topOrder.amountIn) + 1;
                // console.log("partly take buyOrder, amountInUsed:", amountInUsed, topOrder.progress, takerToken0Left);
                token0.transfer(topOrder.owner, takerToken0Left);

                // console.log("partly done, takerToken0Left:", takerToken0Left);
                takerToken0Left = 0;
                break;
            }
        }

        token0Pay = token0In - takerToken0Left;
        require(token0Pay > 0, "MonoTrade: takeOrder:: no deal");

        //if msg.sender is feeTo, fee is 0
        if (msg.sender != feeTo) {
            token0Fee = token0Pay * uint112(fee) / 10000;
            if (token0Fee > 0) {
                token0.transferFrom(msg.sender, feeTo, uint(token0Fee));
            }
        } 
        if (takerToken0Left > 0) {
            token0.transfer(msg.sender, uint(takerToken0Left));
        }
        if (token1Gain > 0) {
            token1.transfer(msg.sender, uint(token1Gain));
        }
    }

    function cancelOrder(uint48 orderId) public returns (uint112 token1Left) {
        Order storage order = orders[orderId];
        require(order.owner == msg.sender, "MonoTrade: cancelOrder:: you are not owner of the order");
        require(order.beforeOrderId != type(uint48).max, "MonoTrade: cancelOrder:: the order is already removed(done)");

        _removeOrderLink(order);
        if (topOrderId == orderId) {
            topOrderId = order.afterOrderId;
        }
        order.beforeOrderId = type(uint48).max;

        uint112 amountInUsed = uint112(uint(order.progress) * order.amountIn / type(uint32).max);
        // console.log("cancelOrder amountInUsed:", amountInUsed, order.progress);
        token1Left = order.amountIn - amountInUsed;
        if (token1Left > 0) {
            token1.transfer(order.owner, uint(token1Left));
        }
    }

    function changeOrderOwner(uint48 orderId, address newOwner) public {
        Order storage order = orders[orderId];
        require(order.owner == msg.sender, "MonoTrade: changeOrderOwner:: you are not owner of the order");
        require(order.beforeOrderId != type(uint48).max, "MonoTrade: changeOrderOwner:: the order is already removed(done)");
        require(newOwner != address(0), "MonoTrade: changeOrderOwner:: newOwner can't be address(0)");

        order.owner = newOwner;
    }

    function _removeOrderLink(Order storage order) internal {
        if (order.beforeOrderId != 0) {
            orders[order.beforeOrderId].afterOrderId = order.afterOrderId;
        }
        if (order.afterOrderId != 0) {
            orders[order.afterOrderId].beforeOrderId = order.beforeOrderId;
        }
    }

}