// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract MarsPair {
    IERC20 public immutable token0;
    IERC20 public immutable token1;
    uint8 public immutable fee; //100 means 1%
    address public immutable feeTo;

    uint48 public lastOrderId = 0;


    struct Order {
        //(removed for saving gas) uint48 orderId; //0:not exist; start from 1
        uint48 beforeOrderId; //0:this is the top order
        uint48 afterOrderId; //0:this is the last order
        address owner;
        uint amountIn; //token deposit in
        uint amountOut; //want token out
        uint amountInUsed;
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

    function makeBuyOrder(uint token1In, uint token0Out, uint48 beforeOrderId) public returns (uint48 newOrderId) {
        require(token1In > 0, "token1In amount cannot be 0");
        require(token0Out > 0, "token0Out amount cannot be 0");
        token1.transferFrom(msg.sender, address(this), token1In);

        newOrderId = ++lastOrderId;

        //if buyOrders is empty
        if (topBuyOrderId == 0) {
            buyOrders[newOrderId] = Order(0, 0, msg.sender, token1In, token0Out, 0);
            topBuyOrderId = newOrderId;
            return newOrderId;
        }

        //if newOrder is the new topOrder
        if (beforeOrderId == 0) {
            Order storage topOrder = buyOrders[topBuyOrderId];
            require(topOrder.amountOut * token1In > topOrder.amountIn * token0Out, "your price must > topOrder");

            topOrder.beforeOrderId = newOrderId;
            buyOrders[newOrderId] = Order(0, topBuyOrderId, msg.sender, token1In, token0Out, 0);
            topBuyOrderId = newOrderId;
            return newOrderId;
        }

        Order storage beforeOrder = buyOrders[beforeOrderId];
        require(beforeOrder.owner != address(0), "beforeOrder is not exist");
        require(beforeOrder.beforeOrderId != type(uint48).max, "beforeOrder is removed(done)");
        require(beforeOrder.amountOut * token1In <= beforeOrder.amountIn * token0Out, "your price must <= beforeOrder");
        
        //if newOrder is the new lastOrder
        if (beforeOrder.afterOrderId == 0) {
            beforeOrder.afterOrderId = newOrderId;
            buyOrders[newOrderId] = Order(beforeOrderId, 0, msg.sender, token1In, token0Out, 0);
            return newOrderId;
        }

        //if beforeOrder and afterOrder both exist
        Order storage afterOrder = buyOrders[beforeOrder.afterOrderId];
        require(afterOrder.owner != address(0), "afterOrder is not exist");
        require(afterOrder.beforeOrderId != type(uint48).max, "afterOrder is removed(done)");
        require(afterOrder.amountOut * token1In > afterOrder.amountIn * token0Out, "your price must > afterOrder");

        buyOrders[newOrderId] = Order(beforeOrderId, beforeOrder.afterOrderId, msg.sender, token1In, token0Out, 0);
        beforeOrder.afterOrderId = newOrderId;
        afterOrder.beforeOrderId = newOrderId;
        return newOrderId;
    }

    function takeBuyOrder(uint token0In, uint token1want) public returns (uint token0Sold, uint token1Gain, uint token0Fee) {
        require(topBuyOrderId != 0, "buyOrders is empty");

        token0.transferFrom(msg.sender, address(this), token0In);

        uint takerToken0Left = token0In;

        //topOrder.amountOut - WETH
        //topOrder.amountIn - USDT

        while (topBuyOrderId != 0) {
            Order storage topOrder = buyOrders[topBuyOrderId];
            if (token0In * topOrder.amountIn < token1want * topOrder.amountOut ) {
                break; //price not good
            }
            uint topOrderToken0Left = topOrder.amountOut - topOrder.amountInUsed * topOrder.amountOut / topOrder.amountIn;

            if (takerToken0Left >= topOrderToken0Left) { //completely take the order
                takerToken0Left -= topOrderToken0Left;
                token1Gain += (topOrder.amountIn - topOrder.amountInUsed);
                
                //topOrder is done
                _removeOrderLink(topOrder, buyOrders);
                topOrder.amountInUsed = topOrder.amountIn;
                token0.transfer(topOrder.owner, topOrderToken0Left);
                topOrder.beforeOrderId = type(uint48).max;

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
        require(token0Sold > 0, "no deal");

        token0Fee = token0Sold * uint(fee) / 10000;
        if (token0Fee > 0) {
            token0.transferFrom(msg.sender, feeTo, token0Fee);
        }
        if (takerToken0Left > 0) {
            token0.transfer(msg.sender, takerToken0Left);
        }
        if (token1Gain > 0) {
            token1.transfer(msg.sender, token1Gain);
        }
    }

    //Experience like CEX, if partly done, the left makes sell order
    function takeBuyOrder2(uint token0InWithFee, uint token1want) public returns (uint token0Sold, uint token1Gain, uint token0Fee) {
        uint preFee = token0InWithFee * uint(fee) / 10000;
        (token0Sold, token1Gain, token0Fee) = takeBuyOrder(token0InWithFee - preFee, token1want);
        //TBA

    }

    function cancelBuyOrder(uint48 orderId) public returns (uint token1Left) {
        Order storage order = buyOrders[orderId];
        require(order.owner == msg.sender, "you are not owner of the order");
        require(order.beforeOrderId != type(uint48).max, "the order is already removed(done)");

        _removeOrderLink(order, buyOrders);
        if (topBuyOrderId == orderId) {
            topBuyOrderId = order.afterOrderId;
        }
        order.beforeOrderId = type(uint48).max;

        token1Left = order.amountIn - order.amountInUsed;
        if (token1Left > 0) {
            token1.transfer(order.owner, token1Left);
        }
    }

    ///////////////Sell Order////////////

    function makeSellOrder(uint token0In, uint token1Out, uint48 beforeOrderId) public returns (uint48 newOrderId) {
        require(token0In > 0, "token0In amount cannot be 0");
        require(token1Out > 0, "token1Out amount cannot be 0");
        token0.transferFrom(msg.sender, address(this), token0In);

        newOrderId = ++lastOrderId;

        //if sellOrders is empty
        if (topSellOrderId == 0) {
            sellOrders[newOrderId] = Order(0, 0, msg.sender, token0In, token1Out, 0);
            topSellOrderId = newOrderId;
            return newOrderId;
        }

        //if newOrder is the new topOrder
        if (beforeOrderId == 0) {
            Order storage topOrder = sellOrders[topSellOrderId];
            require(topOrder.amountOut * token0In > topOrder.amountIn * token1Out, "your price must < topOrder");

            topOrder.beforeOrderId = newOrderId;
            sellOrders[newOrderId] = Order(0, topSellOrderId, msg.sender, token0In, token1Out, 0);
            topSellOrderId = newOrderId;
            return newOrderId;
        }

        Order storage beforeOrder = sellOrders[beforeOrderId];
        require(beforeOrder.owner != address(0), "beforeOrder is not exist");
        require(beforeOrder.beforeOrderId != type(uint48).max, "beforeOrder is removed(done)");
        require(beforeOrder.amountOut * token0In <= beforeOrder.amountIn * token1Out, "your price must >= beforeOrder");
        
        //if newOrder is the new lastOrder
        if (beforeOrder.afterOrderId == 0) {
            beforeOrder.afterOrderId = newOrderId;
            sellOrders[newOrderId] = Order(beforeOrderId, 0, msg.sender, token0In, token1Out, 0);
            return newOrderId;
        }

        //if beforeOrder and afterOrder both exist
        Order storage afterOrder = sellOrders[beforeOrder.afterOrderId];
        require(afterOrder.owner != address(0), "afterOrder is not exist");
        require(afterOrder.beforeOrderId != type(uint48).max, "afterOrder is removed(done)");
        require(afterOrder.amountOut * token0In > afterOrder.amountIn * token1Out, "your price must < afterOrder");

        sellOrders[newOrderId] = Order(beforeOrderId, beforeOrder.afterOrderId, msg.sender, token0In, token1Out, 0);
        beforeOrder.afterOrderId = newOrderId;
        afterOrder.beforeOrderId = newOrderId;
        return newOrderId;
    }

    function takeSellOrder(uint token1In, uint token0want) public returns (uint token1Sold, uint token0Gain, uint token1Fee) {
        require(topSellOrderId != 0, "sellOrders is empty");

        token1.transferFrom(msg.sender, address(this), token1In);

        uint takerToken1Left = token1In;

        //topOrder.amountOut - USDT
        //topOrder.amountIn - WETH

        while (topSellOrderId != 0) {
            Order storage topOrder = sellOrders[topSellOrderId];
            if (token1In * topOrder.amountIn < token0want * topOrder.amountOut ) {
                break; //price not good
            }
            uint topOrderToken1Left = topOrder.amountOut - topOrder.amountInUsed * topOrder.amountOut / topOrder.amountIn;

            if (takerToken1Left >= topOrderToken1Left) { //completely take the order
                takerToken1Left -= topOrderToken1Left;
                token0Gain += (topOrder.amountIn - topOrder.amountInUsed);
                
                //topOrder is done
                _removeOrderLink(topOrder, sellOrders);
                topOrder.amountInUsed = topOrder.amountIn;
                token1.transfer(topOrder.owner, topOrderToken1Left);
                topOrder.beforeOrderId = type(uint48).max;

                // console.log("done, amountOut:", topOrderToken1Left);
                topSellOrderId = topOrder.afterOrderId; //continue loop

            } else {  //partly take the order
                uint deltaToken0Gain = takerToken1Left * topOrder.amountIn / topOrder.amountOut;
                token0Gain += deltaToken0Gain;

                //topOrder is partly done
                topOrder.amountInUsed += deltaToken0Gain;
                token1.transfer(topOrder.owner, takerToken1Left);

                // console.log("partly done, takerToken1Left:", takerToken1Left, token0Gain);
                takerToken1Left = 0;
                break;
            }
        }

        token1Sold = token1In - takerToken1Left;
        require(token1Sold > 0, "no deal");

        token1Fee = token1Sold * uint(fee) / 10000;
        if (token1Fee > 0) {
            token1.transferFrom(msg.sender, feeTo, token1Fee);
        }
        if (takerToken1Left > 0) {
            token1.transfer(msg.sender, takerToken1Left);
        }
        if (token0Gain > 0) {
            token0.transfer(msg.sender, token0Gain);
        }
    }

    // Experience like CEX, if partly done, the left makes buy order
    function takeSellOrder2(uint token1InWithFee, uint token0want) public returns (uint token1Sold, uint token0Gain, uint token1Fee) {
        uint preFee = token1InWithFee * uint(fee) / 10000;
        (token1Sold, token0Gain, token1Fee) = takeSellOrder(token1InWithFee - preFee, token0want);
        //TBA

    }

    function cancelSellOrder(uint48 orderId) public returns (uint token0Left) {
        Order storage order = sellOrders[orderId];
        require(order.owner == msg.sender, "you are not owner of the order");
        require(order.beforeOrderId != type(uint48).max, "the order is already removed(done)");

        _removeOrderLink(order, sellOrders);
        if (topSellOrderId == orderId) {
            topSellOrderId = order.afterOrderId;
        }
        order.beforeOrderId = type(uint48).max;

        token0Left = order.amountIn - order.amountInUsed;
        if (token0Left > 0) {
            token0.transfer(order.owner, token0Left);
        }
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