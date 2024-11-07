// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../help/TransferHelper.sol";
import "hardhat/console.sol";

interface IFactory {
    function feeTo() external returns (address);
}

interface IERC20 {
    function decimals() external view returns (uint8);
}

/**
 * @notice The trading direction is mono, send token1 in for making order, or sending token0 for taking order
 * 2 MonoTrades can be combined into a trading pair
 */
contract MonoTradeV2 {
    using TransferHelper for address;

    address public immutable token0;
    uint8 public immutable token0Decimals;
    address public immutable token1;
    uint8 public immutable token1Decimals;
    address public immutable factory;
    uint8 public immutable fee; //100 means 1%

    uint48 public count = 0;

    struct Order {
        //uses single storage slot
        //(removed for saving gas) uint48 orderId; //0:not exist; start from 1
        uint48 beforeOrderId; //0:this is the top order
        uint48 afterOrderId; //0:this is the last order
        address owner;

        //uses single storage slot
        uint64 amountIn; //token deposit in
        uint64 amountOut; //want token out
        uint64 amountInCost;
        uint64 amountOutFilled;
        //(removed for saving gas) bool isDone; //beforeOrderId==type(uint48).max means removed(done)
    }

    mapping (uint48 => Order) public orders; //orderId => Order
    uint48 public topOrderId; //0:orders is empty

    event TakeOrder(uint token0Paid, uint token1Gain);
    event MakeOrder(uint48 indexed orderId, uint token1In, uint token0Out);
    event CancelOrder(uint48 indexed orderId);

    constructor(address _token0, address _token1, uint8 _fee) {
        token0 = _token0;
        token1 = _token1;
        fee = _fee;
        factory = msg.sender;
        token0Decimals = IERC20(_token0).decimals();
        token1Decimals = IERC20(_token1).decimals();
    }

    function getOrder(uint48 orderId) public view returns (Order memory) {
        return orders[orderId];
    }

    function makeOrder(uint token1In, uint token0Out, uint48 beforeOrderId) public returns (uint48) {
        uint64 token1InDec = to6Decimals(token1In, token1Decimals);
        // console.log("token1In", token1In, token1Decimals, token1InDec);
        uint64 token0OutDec = to6Decimals(token0Out, token0Decimals);
        // console.log("token0Out", token0Out, token0Decimals, token0OutDec);
        require(token1InDec > 0, "MonoTrade: makeOrder:: token1InDec amount cannot be 0");
        require(token0OutDec > 0, "MonoTrade: makeOrder:: token0OutDec amount cannot be 0");

        token1.safeTransferFrom(msg.sender, address(this), from6Decimals(token1InDec, token1Decimals));

        ++count;

        //if orders is empty
        if (topOrderId == 0) {
            orders[count] = Order(0, 0, msg.sender, token1InDec, token0OutDec, 0, 0);
            topOrderId = count;
            return count;
        }

        //if newOrder is the new topOrder
        if (beforeOrderId == 0) {
            Order storage topOrder = orders[topOrderId];
            require(topOrder.amountOut * token1InDec > topOrder.amountIn * token0OutDec, "MonoTrade: makeOrder:: your price must > topOrder");

            topOrder.beforeOrderId = count;
            orders[count] = Order(0, topOrderId, msg.sender, token1InDec, token0OutDec, 0, 0);
            topOrderId = count;
            return count;
        }

        Order storage beforeOrder = orders[beforeOrderId];
        require(beforeOrder.amountIn != 0, "MonoTrade: makeOrder:: beforeOrder is not exist");
        require(beforeOrder.beforeOrderId != type(uint48).max, "MonoTrade: makeOrder:: beforeOrder is removed(done)");
        require(beforeOrder.amountOut * token1InDec <= beforeOrder.amountIn * token0OutDec, "MonoTrade: makeOrder:: your price must <= beforeOrder");
        
        //if newOrder is the new lastOrder
        if (beforeOrder.afterOrderId == 0) {
            beforeOrder.afterOrderId = count;
            orders[count] = Order(beforeOrderId, 0, msg.sender, token1InDec, token0OutDec, 0, 0);
            return count;
        }

        //if beforeOrder and afterOrder both exist
        Order storage afterOrder = orders[beforeOrder.afterOrderId];
        require(afterOrder.amountIn != 0, "MonoTrade: makeOrder:: afterOrder is not exist");
        require(afterOrder.beforeOrderId != type(uint48).max, "MonoTrade: makeOrder:: afterOrder is removed");
        require(afterOrder.amountOut * token1InDec > afterOrder.amountIn * token0OutDec, "MonoTrade: makeOrder:: your price must > afterOrder");

        orders[count] = Order(beforeOrderId, beforeOrder.afterOrderId, msg.sender, token1InDec, token0OutDec, 0, 0);
        beforeOrder.afterOrderId = count;
        afterOrder.beforeOrderId = count;

        emit MakeOrder(count, from6Decimals(token1InDec, token1Decimals), from6Decimals(token0OutDec, token0Decimals));
        return count;
    }

    function takeOrder(uint token0In, uint token1ForPrice) public returns (uint token0Paid, uint token1Gain, uint token0Fee) {
        if (topOrderId == 0) {
            return (0, 0, 0); //orders is empty
        }
        
        uint64 token0InDec = to6Decimals(token0In, token0Decimals);
        // console.log("token0In", token0In, token0Decimals, token0InDec);
        uint64 token1ForPriceDec = to6Decimals(token1ForPrice, token1Decimals);
        // console.log("token1ForPrice", token1ForPrice, token1Decimals, token1ForPriceDec);
        require(token0InDec > 0, "MonoTrade: takeOrder:: token0InDec amount cannot be 0");
        // require(token1ForPriceDec > 0, "MonoTrade: takeOrder:: token1ForPriceDec amount cannot be 0");

        token0.safeTransferFrom(msg.sender, address(this), from6Decimals(token0InDec, token0Decimals));

        uint64 takerToken0Left = token0InDec;
        uint64 token1GainDec = 0;
        while (topOrderId != 0) {
            Order storage topOrder = orders[topOrderId];
            if (token0InDec * topOrder.amountIn < token1ForPriceDec * topOrder.amountOut ) {
                break; //price not good
            }
            uint64 topOrderToken0Left = (topOrder.amountIn - topOrder.amountInCost) * topOrder.amountOut / topOrder.amountIn;

            if (takerToken0Left >= topOrderToken0Left) { //completely take the order
                takerToken0Left -= topOrderToken0Left;
                token1GainDec += (topOrder.amountIn - topOrder.amountInCost);
                
                //topOrder is done
                _removeOrderLink(topOrder);
                topOrder.amountInCost = topOrder.amountIn;
                topOrder.amountOutFilled += topOrderToken0Left;
                token0.safeTransfer(topOrder.owner, from6Decimals(topOrderToken0Left, token0Decimals));
                topOrder.beforeOrderId = type(uint48).max;

                // console.log("done, amountOut:", topOrderToken0Left);
                topOrderId = topOrder.afterOrderId; //continue loop

            } else {  //partly take the order
                uint64 deltaToken1Gain = takerToken0Left * topOrder.amountIn / topOrder.amountOut;
                token1GainDec += deltaToken1Gain;

                //topOrder is partly done
                topOrder.amountInCost += deltaToken1Gain;
                topOrder.amountOutFilled += takerToken0Left;
                // console.log("partly take buyOrder, amountInUsed:", amountInUsed, topOrder.progress, takerToken0Left);
                token0.safeTransfer(topOrder.owner, from6Decimals(takerToken0Left, token0Decimals));

                // console.log("partly done, takerToken0Left:", takerToken0Left);
                takerToken0Left = 0;
                break;
            }
        }

        token0Paid = to6Decimals(token0InDec - takerToken0Left, token0Decimals);
        // require(token0Paid > 0, "MonoTrade: takeOrder:: no deal");

        //if factory is contract or not
        address feeToAddr = factory.code.length > 0 ? IFactory(factory).feeTo() : factory;

        //if msg.sender is feeTo, fee is 0
        if (msg.sender != feeToAddr) {
            token0Fee = token0Paid * fee / 10000;
            if (token0Fee > 0) {
                token0.safeTransferFrom(msg.sender, feeToAddr, token0Fee);
            }
        } 
        if (takerToken0Left > 0) {
            token0.safeTransfer(msg.sender, from6Decimals(takerToken0Left, token0Decimals));
        }
        if (token1GainDec > 0) {
            token1Gain = from6Decimals(token1GainDec, token1Decimals);
            token1.safeTransfer(msg.sender, token1Gain);
            emit TakeOrder(token0Paid, token1Gain);
        }
    }

    // function cancelOrder(uint48 orderId) public returns (uint64 token1Left) {
    //     Order storage order = orders[orderId];
    //     require(order.owner == msg.sender, "MonoTrade: cancelOrder:: you are not owner of the order");
    //     require(order.beforeOrderId != type(uint48).max, "MonoTrade: cancelOrder:: the order is already removed(done)");

    //     _removeOrderLink(order);
    //     if (topOrderId == orderId) {
    //         topOrderId = order.afterOrderId;
    //     }
    //     order.beforeOrderId = type(uint48).max;

    //     uint64 amountInUsed = uint64(uint(order.progress) * order.amountIn / type(uint32).max);
    //     token1Left = order.amountIn - amountInUsed;
    //     if (token1Left > 0) {
    //         token1.safeTransfer(order.owner, uint(token1Left));
    //         emit CancelOrder(orderId);
    //     }
    // }

    // function changeOrderOwner(uint48 orderId, address newOwner) public {
    //     Order storage order = orders[orderId];
    //     require(order.owner == msg.sender, "MonoTrade: changeOrderOwner:: you are not owner of the order");
    //     require(order.beforeOrderId != type(uint48).max, "MonoTrade: changeOrderOwner:: the order is already removed(done)");
    //     require(newOwner != address(0), "MonoTrade: changeOrderOwner:: newOwner can't be address(0)");

    //     order.owner = newOwner;
    // }

    function _removeOrderLink(Order storage order) internal {
        if (order.beforeOrderId != 0) {
            orders[order.beforeOrderId].afterOrderId = order.afterOrderId;
        }
        if (order.afterOrderId != 0) {
            orders[order.afterOrderId].beforeOrderId = order.beforeOrderId;
        }
    }

    function to6Decimals(uint amount, uint8 decimals) public pure returns (uint64 amountDec) {
        if (decimals <= 6) {
            amountDec = uint64(amount);
        } else {
            amountDec = uint64(amount / 10 ** (decimals - 6));
        }
    }

    function from6Decimals(uint64 amountDec, uint8 decimals) public pure returns (uint amount) {
        if (decimals <= 6) {
            amount = uint64(amountDec);
        } else {
            amount = uint(amountDec) * 10 ** (decimals - 6);
        }
    }

}