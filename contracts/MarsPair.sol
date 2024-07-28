// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract MarsPair {
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
        uint32 progress; //progress / type(uint32).max is the progress[0, 1]
        //(removed for saving gas) bool isDone; //beforeOrderId==type(uint48).max means removed(done)
    }

    mapping (uint48 => Order) public buyOrders; //orderId => Order
    uint48 public topBuyOrderId; //0:buyOrders is empty

    mapping (uint48 => Order) public sellOrders; //orderId => Order
    uint48 public topSellOrderId; //0:sellOrders is empty

    // event MakeOrder(bool isBuy, uint tokenIn, uint tokenOut);


    constructor(address token0Addr, address token1Addr, uint8 _fee) {
        token0 = IERC20(token0Addr);
        token1 = IERC20(token1Addr);
        fee = _fee;
        feeTo = msg.sender;
    }

    function getBuyOrder(uint48 orderId) public view returns (Order memory) {
        return buyOrders[orderId];
    }

    function getSellOrder(uint48 orderId) public view returns (Order memory) {
        return sellOrders[orderId];
    }

     ///////////////Buy Order////////////

    function makeBuyOrder(uint112 token1In, uint112 token0Out, uint48 beforeOrderId) public returns (uint48) {
        require(token1In > 0, "token1In amount cannot be 0");
        require(token0Out > 0, "token0Out amount cannot be 0");
        token1.transferFrom(msg.sender, address(this), uint(token1In));

        ++count;

        //if buyOrders is empty
        if (topBuyOrderId == 0) {
            buyOrders[count] = Order(0, 0, msg.sender, token1In, token0Out, 0);
            topBuyOrderId = count;
            return count;
        }

        //if newOrder is the new topOrder
        if (beforeOrderId == 0) {
            Order storage topOrder = buyOrders[topBuyOrderId];
            require(topOrder.amountOut * token1In > topOrder.amountIn * token0Out, "your price must > topOrder");

            topOrder.beforeOrderId = count;
            buyOrders[count] = Order(0, topBuyOrderId, msg.sender, token1In, token0Out, 0);
            topBuyOrderId = count;
            return count;
        }

        Order storage beforeOrder = buyOrders[beforeOrderId];
        require(beforeOrder.amountIn != 0, "beforeOrder is not exist");
        require(beforeOrder.beforeOrderId != type(uint48).max, "beforeOrder is removed(done)");
        require(beforeOrder.amountOut * token1In <= beforeOrder.amountIn * token0Out, "your price must <= beforeOrder");
        
        //if newOrder is the new lastOrder
        if (beforeOrder.afterOrderId == 0) {
            beforeOrder.afterOrderId = count;
            buyOrders[count] = Order(beforeOrderId, 0, msg.sender, token1In, token0Out, 0);
            return count;
        }

        //if beforeOrder and afterOrder both exist
        Order storage afterOrder = buyOrders[beforeOrder.afterOrderId];
        require(afterOrder.amountIn != 0, "afterOrder is not exist");
        require(afterOrder.beforeOrderId != type(uint48).max, "afterOrder is removed(done)");
        require(afterOrder.amountOut * token1In > afterOrder.amountIn * token0Out, "your price must > afterOrder");

        buyOrders[count] = Order(beforeOrderId, beforeOrder.afterOrderId, msg.sender, token1In, token0Out, 0);
        beforeOrder.afterOrderId = count;
        afterOrder.beforeOrderId = count;
        return count;
    }

    function takeBuyOrder(uint112 token0In, uint112 token1Want) public returns (uint112 token0Pay, uint112 token1Gain, uint112 token0Fee) {
        require(topBuyOrderId != 0, "buyOrders is empty");

        token0.transferFrom(msg.sender, address(this), uint(token0In));

        uint112 takerToken0Left = token0In;

        //topOrder.amountOut - WETH
        //topOrder.amountIn - USDT

        while (topBuyOrderId != 0) {
            Order storage topOrder = buyOrders[topBuyOrderId];
            if (token0In * topOrder.amountIn < token1Want * topOrder.amountOut ) {
                break; //price not good
            }
            uint112 topOrderToken0Left = topOrder.amountOut - topOrder.progress * topOrder.amountOut / type(uint32).max;
            uint112 amountInUsed = topOrder.progress * topOrder.amountIn / type(uint32).max;

            if (takerToken0Left >= topOrderToken0Left) { //completely take the order
                takerToken0Left -= topOrderToken0Left;
                token1Gain += (topOrder.amountIn - amountInUsed);
                
                //topOrder is done
                _removeOrderLink(topOrder, buyOrders);
                topOrder.progress = type(uint32).max;
                token0.transfer(topOrder.owner, uint(topOrderToken0Left));
                topOrder.beforeOrderId = type(uint48).max;

                // console.log("done, amountOut:", topOrderToken0Left);
                topBuyOrderId = topOrder.afterOrderId; //continue loop

            } else {  //partly take the order
                uint112 deltaToken1Gain = takerToken0Left * topOrder.amountIn / topOrder.amountOut;
                token1Gain += deltaToken1Gain;

                //topOrder is partly done
                amountInUsed += deltaToken1Gain;
                topOrder.progress = uint32(amountInUsed * type(uint32).max / topOrder.amountIn);
                token0.transfer(topOrder.owner, takerToken0Left);

                // console.log("partly done, takerToken0Left:", takerToken0Left);
                takerToken0Left = 0;
                break;
            }
        }

        token0Pay = token0In - takerToken0Left;
        require(token0Pay > 0, "no deal");

        token0Fee = token0Pay * uint112(fee) / 10000;
        if (token0Fee > 0) {
            token0.transferFrom(msg.sender, feeTo, uint(token0Fee));
        }
        if (takerToken0Left > 0) {
            token0.transfer(msg.sender, uint(takerToken0Left));
        }
        if (token1Gain > 0) {
            token1.transfer(msg.sender, uint(token1Gain));
        }
    }

    function cancelBuyOrder(uint48 orderId) public returns (uint112 token1Left) {
        Order storage order = buyOrders[orderId];
        require(order.owner == msg.sender, "you are not owner of the order");
        require(order.beforeOrderId != type(uint48).max, "the order is already removed(done)");

        _removeOrderLink(order, buyOrders);
        if (topBuyOrderId == orderId) {
            topBuyOrderId = order.afterOrderId;
        }
        order.beforeOrderId = type(uint48).max;

        uint112 amountInUsed = order.progress * order.amountIn / type(uint32).max;
        token1Left = order.amountIn - amountInUsed;
        if (token1Left > 0) {
            token1.transfer(order.owner, uint(token1Left));
        }
    }

    function changeBuyOrderOwner(uint48 orderId, address newOwner) public {
        Order storage order = buyOrders[orderId];
        require(order.owner == msg.sender, "you are not owner of the order");
        require(order.beforeOrderId != type(uint48).max, "the order is already removed(done)");
        require(newOwner != address(0), "newOwner can't be address(0)");

        order.owner = newOwner;
    }

    ///////////////Sell Order////////////

    function makeSellOrder(uint112 token0In, uint112 token1Out, uint48 beforeOrderId) public returns (uint48) {
        require(token0In > 0, "token0In amount cannot be 0");
        require(token1Out > 0, "token1Out amount cannot be 0");
        token0.transferFrom(msg.sender, address(this), uint(token0In));

        ++count;

        //if sellOrders is empty
        if (topSellOrderId == 0) {
            sellOrders[count] = Order(0, 0, msg.sender, token0In, token1Out, 0);
            topSellOrderId = count;
            return count;
        }

        //if newOrder is the new topOrder
        if (beforeOrderId == 0) {
            Order storage topOrder = sellOrders[topSellOrderId];
            require(topOrder.amountOut * token0In > topOrder.amountIn * token1Out, "your price must < topOrder");

            topOrder.beforeOrderId = count;
            sellOrders[count] = Order(0, topSellOrderId, msg.sender, token0In, token1Out, 0);
            topSellOrderId = count;
            return count;
        }

        Order storage beforeOrder = sellOrders[beforeOrderId];
        require(beforeOrder.amountIn != 0, "beforeOrder is not exist");
        require(beforeOrder.beforeOrderId != type(uint48).max, "beforeOrder is removed(done)");
        require(beforeOrder.amountOut * token0In <= beforeOrder.amountIn * token1Out, "your price must >= beforeOrder");
        
        //if newOrder is the new lastOrder
        if (beforeOrder.afterOrderId == 0) {
            beforeOrder.afterOrderId = count;
            sellOrders[count] = Order(beforeOrderId, 0, msg.sender, token0In, token1Out, 0);
            return count;
        }

        //if beforeOrder and afterOrder both exist
        Order storage afterOrder = sellOrders[beforeOrder.afterOrderId];
        require(afterOrder.amountIn != 0, "afterOrder is not exist");
        require(afterOrder.beforeOrderId != type(uint48).max, "afterOrder is removed(done)");
        require(afterOrder.amountOut * token0In > afterOrder.amountIn * token1Out, "your price must < afterOrder");

        sellOrders[count] = Order(beforeOrderId, beforeOrder.afterOrderId, msg.sender, token0In, token1Out, 0);
        beforeOrder.afterOrderId = count;
        afterOrder.beforeOrderId = count;
        return count;
    }

    function takeSellOrder(uint112 token1In, uint112 token0Want) public returns (uint112 token1Pay, uint112 token0Gain, uint112 token1Fee) {
        require(topSellOrderId != 0, "sellOrders is empty");

        token1.transferFrom(msg.sender, address(this), token1In);

        uint112 takerToken1Left = token1In;

        //topOrder.amountOut - USDT
        //topOrder.amountIn - WETH

        while (topSellOrderId != 0) {
            Order storage topOrder = sellOrders[topSellOrderId];
            if (token1In * topOrder.amountIn < token0Want * topOrder.amountOut ) {
                break; //price not good
            }
            uint112 topOrderToken1Left = topOrder.amountOut - topOrder.progress * topOrder.amountOut / type(uint32).max;
            uint112 amountInUsed = topOrder.progress * topOrder.amountIn / type(uint32).max;

            if (takerToken1Left >= topOrderToken1Left) { //completely take the order
                takerToken1Left -= topOrderToken1Left;
                token0Gain += (topOrder.amountIn - amountInUsed);
                
                //topOrder is done
                _removeOrderLink(topOrder, sellOrders);
                topOrder.progress = type(uint32).max;
                token1.transfer(topOrder.owner, uint(topOrderToken1Left));
                topOrder.beforeOrderId = type(uint48).max;

                // console.log("done, amountOut:", topOrderToken1Left);
                topSellOrderId = topOrder.afterOrderId; //continue loop

            } else {  //partly take the order
                uint112 deltaToken0Gain = takerToken1Left * topOrder.amountIn / topOrder.amountOut;
                token0Gain += deltaToken0Gain;

                //topOrder is partly done
                amountInUsed += deltaToken0Gain;
                topOrder.progress = uint32(amountInUsed * type(uint32).max / topOrder.amountIn);
                token1.transfer(topOrder.owner, uint(takerToken1Left));

                // console.log("partly done, takerToken1Left:", takerToken1Left, token0Gain);
                takerToken1Left = 0;
                break;
            }
        }

        token1Pay = token1In - takerToken1Left;
        require(token1Pay > 0, "no deal");

        token1Fee = token1Pay * uint112(fee) / 10000;
        if (token1Fee > 0) {
            token1.transferFrom(msg.sender, feeTo, uint(token1Fee));
        }
        if (takerToken1Left > 0) {
            token1.transfer(msg.sender, uint(takerToken1Left));
        }
        if (token0Gain > 0) {
            token0.transfer(msg.sender, uint(token0Gain));
        }
    }

    function cancelSellOrder(uint48 orderId) public returns (uint112 token0Left) {
        Order storage order = sellOrders[orderId];
        require(order.owner == msg.sender, "you are not owner of the order");
        require(order.beforeOrderId != type(uint48).max, "the order is already removed(done)");

        _removeOrderLink(order, sellOrders);
        if (topSellOrderId == orderId) {
            topSellOrderId = order.afterOrderId;
        }
        order.beforeOrderId = type(uint48).max;

        uint112 amountInUsed = order.progress * order.amountIn / type(uint32).max;
        token0Left = order.amountIn - amountInUsed;
        if (token0Left > 0) {
            token0.transfer(order.owner, uint(token0Left));
        }
    }

    function changeSellOrderOwner(uint48 orderId, address newOwner) public {
        Order storage order = sellOrders[orderId];
        require(order.owner == msg.sender, "you are not owner of the order");
        require(order.beforeOrderId != type(uint48).max, "the order is already removed(done)");

        order.owner = newOwner;
    }

    function _removeOrderLink(Order storage order, mapping (uint48 => Order) storage orders) internal {
        if (order.beforeOrderId != 0) {
            orders[order.beforeOrderId].afterOrderId = order.afterOrderId;
        }
        if (order.afterOrderId != 0) {
            orders[order.afterOrderId].beforeOrderId = order.beforeOrderId;
        }
    }

}