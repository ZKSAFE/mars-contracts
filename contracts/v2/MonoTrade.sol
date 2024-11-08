// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../help/TransferHelper.sol";
import "hardhat/console.sol";

interface IFactory {
    function feeTo() external returns (address);
}

/**
 * @notice The trading direction is mono, send token1 in for making order, or sending token0 for taking order
 * 2 MonoTrades can be combined into a trading pair
 */
contract MonoTrade {
    using TransferHelper for address;

    address public immutable token0;
    address public immutable token1;
    uint8 public immutable fee; //100 means 1%
    address public immutable factory;

    uint48 public count = 0;

    struct Order {
        //uses single storage slot
        //(removed for saving gas) uint48 orderId; //0:not exist; start from 1
        uint48 beforeOrderId; //0:this is the top order
        uint48 afterOrderId; //0:this is the last order
        address owner;

        //uses single storage slot
        uint112 token1In; //token deposit in
        uint112 token0Out; //want token out
        uint32 progress; // progress/type(uint32).max is the progress[0, 1], if token1In is a large number, precision will be decreased
        //(removed for saving gas) bool isDone; //beforeOrderId==type(uint48).max means removed(done)
    }

    mapping (uint48 => Order) public orders; //orderId => Order
    uint48 public topOrderId; //0:orders is empty

    event TakeOrder(uint112 token0Paid, uint112 token1Gain);
    event MakeOrder(uint48 indexed orderId, uint112 token1In, uint112 token0Out);
    event CancelOrder(uint48 indexed orderId);

    constructor(address _token0, address _token1, uint8 _fee) {
        token0 = _token0;
        token1 = _token1;
        fee = _fee;
        factory = msg.sender;
    }

    function getOrder(uint48 orderId) public view returns (Order memory) {
        return orders[orderId];
    }

    function findBeforeOrderId(uint112 token1In, uint112 token0Out, uint48 findFromId)
        view public returns (uint48) {
        
        uint48 id = topOrderId;

        if (id == 0) {
            return 0;
        }

        if (findFromId == 0) {
            findFromId = id;
        }

        Order memory order = orders[findFromId];
        
        if (order.token1In != 0 && order.beforeOrderId != type(uint48).max) {
            id = findFromId;
        }

        while (true) {
            if (order.token0Out * token1In > order.token1In * token0Out) {
                return order.beforeOrderId;
            }
            if (order.afterOrderId == 0) {
                return id;
            } else {
                id = order.afterOrderId;
            }
            order = orders[id];
        }

        return type(uint48).max;
    }

    function makeOrder(uint112 token1In, uint112 token0Out, uint48 beforeOrderId) public returns (uint48) {
        require(token1In > 0, "MonoTrade: makeOrder:: token1In amount cannot be 0");
        require(token0Out > 0, "MonoTrade: makeOrder:: token0Out amount cannot be 0");
        token1.safeTransferFrom(msg.sender, address(this), token1In);

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
            require(topOrder.token0Out * token1In > topOrder.token1In * token0Out, "MonoTrade: makeOrder:: your price must > topOrder");

            topOrder.beforeOrderId = count;
            orders[count] = Order(0, topOrderId, msg.sender, token1In, token0Out, 0);
            topOrderId = count;
            return count;
        }

        Order storage beforeOrder = orders[beforeOrderId];
        require(beforeOrder.token1In != 0, "MonoTrade: makeOrder:: beforeOrder is not exist");
        require(beforeOrder.beforeOrderId != type(uint48).max, "MonoTrade: makeOrder:: beforeOrder is removed(done)");
        require(beforeOrder.token0Out * token1In <= beforeOrder.token1In * token0Out, "MonoTrade: makeOrder:: your price must <= beforeOrder");
        
        //if newOrder is the new lastOrder
        if (beforeOrder.afterOrderId == 0) {
            beforeOrder.afterOrderId = count;
            orders[count] = Order(beforeOrderId, 0, msg.sender, token1In, token0Out, 0);
            return count;
        }

        //if beforeOrder and afterOrder both exist
        Order storage afterOrder = orders[beforeOrder.afterOrderId];
        require(afterOrder.token1In != 0, "MonoTrade: makeOrder:: afterOrder is not exist");
        require(afterOrder.beforeOrderId != type(uint48).max, "MonoTrade: makeOrder:: afterOrder is removed");
        require(afterOrder.token0Out * token1In > afterOrder.token1In * token0Out, "MonoTrade: makeOrder:: your price must > afterOrder");

        orders[count] = Order(beforeOrderId, beforeOrder.afterOrderId, msg.sender, token1In, token0Out, 0);
        beforeOrder.afterOrderId = count;
        afterOrder.beforeOrderId = count;

        emit MakeOrder(count, token1In, token0Out);
        return count;
    }

    function takeOrder(uint112 token0In, uint112 token1ForPrice) public returns (uint112 token0Paid, uint112 token1Gain, uint112 token0Fee) {
        if (topOrderId == 0) {
            return (0, 0, 0); //orders is empty
        }

        token0.safeTransferFrom(msg.sender, address(this), token0In);

        uint112 takerToken0Left = token0In;

        while (topOrderId != 0) {
            Order storage topOrder = orders[topOrderId];
            if (token0In * topOrder.token1In < token1ForPrice * topOrder.token0Out) {
                break; //price not good
            }
            uint112 token1InUsed = topOrder.progress * topOrder.token1In / type(uint32).max;
            uint112 topOrderToken0Left = (topOrder.token1In - token1InUsed) * topOrder.token0Out / topOrder.token1In;

            if (takerToken0Left >= topOrderToken0Left) { //completely take the order
                takerToken0Left -= topOrderToken0Left;
                token1Gain += (topOrder.token1In - token1InUsed);
                
                //topOrder is done
                _removeOrderLink(topOrder);
                topOrder.progress = type(uint32).max;
                token0.safeTransfer(topOrder.owner, topOrderToken0Left);
                topOrder.beforeOrderId = type(uint48).max;

                // console.log("done, token0Out:", topOrderToken0Left);
                topOrderId = topOrder.afterOrderId; //continue loop

            } else {  //partly take the order
                uint112 deltaToken1Gain = takerToken0Left * topOrder.token1In / topOrder.token0Out;
                token1Gain += deltaToken1Gain;

                //topOrder is partly done
                token1InUsed += deltaToken1Gain;
                topOrder.progress = uint32(token1InUsed * type(uint32).max / topOrder.token1In) + 1;
                // console.log("partly take buyOrder, token1InUsed:", token1InUsed, topOrder.progress, takerToken0Left);
                token0.safeTransfer(topOrder.owner, takerToken0Left);

                // console.log("partly done, takerToken0Left:", takerToken0Left);
                takerToken0Left = 0;
                break;
            }
        }

        token0Paid = token0In - takerToken0Left;
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
            token0.safeTransfer(msg.sender, takerToken0Left);
        }
        if (token1Gain > 0) {
            token1.safeTransfer(msg.sender, token1Gain);
            emit TakeOrder(token0Paid, token1Gain);
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

        uint112 token1InUsed = order.progress * order.token1In / type(uint32).max;
        token1Left = order.token1In - token1InUsed;
        if (token1Left > 0) {
            token1.safeTransfer(order.owner, token1Left);
            emit CancelOrder(orderId);
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