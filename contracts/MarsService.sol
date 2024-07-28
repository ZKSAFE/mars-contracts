// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MarsPair.sol";
import "hardhat/console.sol";

/**
 * @title MarsService
 * @author JXRow
 * @notice for UI use, insead of back-end
 */
contract MarsService {

    //this Order combine OrderCreate and MarsPair.Order
    struct Order {
        address pair;
        uint48 orderId;
        uint32 createTime;
        bool isBuy;
        address owner;
        uint amountIn;
        uint amountOut;
        uint amountInUsed;
        bool isRemoved;
    }

    struct OrderCreate {
        address pair;
        uint48 orderId;
        uint32 createTime;
        bool isBuy;
    }

    //store user's order list, include all pairs
    //bytes.concat(bytes20(uint160(user)), bytes6(index)) => OrderCreate
    mapping (bytes26 => OrderCreate) orderCreates;

    //store the length of user's order list, 
    mapping (address => uint48) userOrdersLength;

    constructor() {
    }


    ////////////////////////
    ///////// view /////////
    ////////////////////////

    function getBuyList(address pairAddr, uint48 fromOrderId, uint8 num) external view returns (MarsPair.Order[] memory) {
        MarsPair.Order[] memory result = new MarsPair.Order[](num);
        MarsPair pair = MarsPair(pairAddr);

        if (fromOrderId == 0) {
            fromOrderId = pair.topBuyOrderId();
        }

        MarsPair.Order memory pairOrder = pair.getBuyOrder(fromOrderId);
        result[0] = pairOrder;
        for (uint8 i = 1; i < num; i++) {
            uint48 orderId = pairOrder.afterOrderId;
            pairOrder = pair.getBuyOrder(orderId);
            result[i] = pairOrder;
        }
        return result;
    }

    function getSellList(address pairAddr, uint48 fromOrderId, uint8 num) external view returns (MarsPair.Order[] memory) {
        MarsPair.Order[] memory result = new MarsPair.Order[](num);
        MarsPair pair = MarsPair(pairAddr);

        if (fromOrderId == 0) {
            fromOrderId = pair.topSellOrderId();
        }

        MarsPair.Order memory pairOrder = pair.getSellOrder(fromOrderId);
        result[0] = pairOrder;
        for (uint8 i = 1; i < num; i++) {
            uint48 orderId = pairOrder.afterOrderId;
            pairOrder = pair.getSellOrder(orderId);
            result[i] = pairOrder;
        }
        return result;
    }

    function getUserOrders(address user, uint48 startIndex, uint48 num) external view returns (Order[] memory) {
        Order[] memory orders = new Order[](num);

        if (startIndex == 0) {
            startIndex = userOrdersLength[user];
        }
        if (startIndex == 0) {
            return orders;
        }

        for (uint48 index = startIndex; startIndex - index < num; --index) {
            OrderCreate memory orderCreate = orderCreates[_encodeAddressUint48(user, index)];
            MarsPair.Order memory pairOrder = _getPairOrder(orderCreate.pair, orderCreate.orderId, orderCreate.isBuy);
            orders[startIndex - index] = _convertOrder(orderCreate, pairOrder);
        }
        return orders;
    }

    function _getPairOrder(address pairAddr, uint48 orderId, bool isBuy) internal view returns (MarsPair.Order memory) {
        return isBuy ? MarsPair(pairAddr).getBuyOrder(orderId) : MarsPair(pairAddr).getSellOrder(orderId);
    }

    function _encodeAddressUint48(address addr, uint48 u48) internal pure returns (bytes26) {
        return bytes26(bytes.concat(bytes20(uint160(addr)), bytes6(u48)));
    }

    function _decodeAddressUint48(bytes26 b26) internal pure returns (address addr, uint48 u48) {
        addr = address(uint160(bytes20(b26)));
        u48 = uint48(uint208(b26));
    }

    function _convertOrder(OrderCreate memory orderCreate, MarsPair.Order memory pairOrder) internal pure returns (Order memory) {
        return Order(
            orderCreate.pair,
            orderCreate.orderId,
            orderCreate.createTime,
            orderCreate.isBuy,
            pairOrder.owner,
            pairOrder.amountIn,
            pairOrder.amountOut,
            pairOrder.amountInUsed,
            pairOrder.beforeOrderId == type(uint48).max
        );
    }

    function _addOrderCreate(address pairAddr, uint48 newOrderId, bool isBuy) internal {
        uint48 index = userOrdersLength[msg.sender];
        index++;
        orderCreates[_encodeAddressUint48(msg.sender, index)] =  OrderCreate(pairAddr, newOrderId, uint32(block.timestamp), isBuy);
        userOrdersLength[msg.sender] = index;
    }


    ////////////////////////
    ///////// buy /////////
    ////////////////////////

    function _findBeforeOrderIdInBuyList(address pairAddr, uint token1In, uint token0Out, uint48 findFromId) view internal returns (uint48) {
        MarsPair pair = MarsPair(pairAddr);
        uint48 id = pair.topBuyOrderId();

        if (id == 0) {
            return 0;
        }

        if (findFromId == 0) {
            findFromId = id;
        }

        (uint48 beforeOrderId, uint48 afterOrderId, , uint amountIn, uint amountOut, ) = pair.buyOrders(findFromId);
        if (amountIn != 0 && beforeOrderId != type(uint48).max) {
            id = findFromId;
        }

        while (true) {
            if (amountOut * token1In > amountIn * token0Out) {
                return beforeOrderId;
            }
            if (afterOrderId == 0) {
                return id;
            } else {
                id = afterOrderId;
            }
            (beforeOrderId, afterOrderId, , amountIn, amountOut, ) = pair.buyOrders(id);
        }

        return type(uint48).max;
    }

    //if beforeOrder not exist, auto find BeforeOrderId
    function makeBuyOrder(address pairAddr, uint token1In, uint token0Out, uint48 beforeOrderId) external returns (uint48 newOrderId) {
        MarsPair pair = MarsPair(pairAddr);

        IERC20 token1 = pair.token1();
        token1.transferFrom(msg.sender, address(this), token1In);
        if (token1.allowance(address(this), pairAddr) < token1In) {
            token1.approve(pairAddr, type(uint).max);
        }

        uint48 pairBeforeOrderId = _findBeforeOrderIdInBuyList(pairAddr, token1In, token0Out, beforeOrderId);
        newOrderId = pair.makeBuyOrder(token1In, token0Out, pairBeforeOrderId);
        pair.changeBuyOrderOwner(newOrderId, msg.sender);

        _addOrderCreate(pairAddr, newOrderId, true);
    }

    //Experience like CEX, if partly done, the left makes sell order
    function takeBuyOrder(address pairAddr, uint token0In, uint token1Want) external returns (uint token0Pay, uint token1Gain, uint token0Fee) {
        MarsPair pair = MarsPair(pairAddr);
        IERC20 token0 = pair.token0();
        
        uint fullFee = token0In * pair.fee() / 10000;
        uint token0InWithFee = fullFee + token0In;
        token0.transferFrom(msg.sender, address(this), token0InWithFee);
        if (token0.allowance(address(this), pairAddr) < token0InWithFee) {
            token0.approve(pairAddr, type(uint).max);
        }

        (token0Pay, token1Gain, token0Fee) = pair.takeBuyOrder(token0In, token1Want);
        pair.token1().transfer(msg.sender, token1Gain);
        if (fullFee > token0Fee) {
            token0.transfer(msg.sender, fullFee - token0Fee); //give back
        }
        
        //make sell order
        if (token0In > token0Pay) {
            uint newToken0In = token0In - token0Pay;
            uint newToken1Want = newToken0In * token1Want / token0In;
            
            uint48 beforeOrderId = _findBeforeOrderIdInSellList(pairAddr, newToken0In, newToken1Want, 0);
            uint48 newOrderId = pair.makeSellOrder(newToken0In, newToken1Want, beforeOrderId);
            pair.changeSellOrderOwner(newOrderId, msg.sender);
        }
    }

    //Experience like CEX, if partly done, the left give back
    function takeBuyOrder2(address pairAddr, uint token0In, uint token1Want) external returns (uint token0Pay, uint token1Gain, uint token0Fee) {
        MarsPair pair = MarsPair(pairAddr);
        IERC20 token0 = pair.token0();
        
        uint fullFee = token0In * pair.fee() / 10000;
        uint token0InWithFee = fullFee + token0In;
        token0.transferFrom(msg.sender, address(this), token0InWithFee);
        if (token0.allowance(address(this), pairAddr) < token0InWithFee) {
            token0.approve(pairAddr, type(uint).max);
        }

        (token0Pay, token1Gain, token0Fee) = pair.takeBuyOrder(token0In, token1Want);
        pair.token1().transfer(msg.sender, token1Gain);
        
        //give back
        if (token0In > token0Pay) {
            uint token0Left = token0In - token0Pay;
            uint feeBack = fullFee - token0Fee;
            token0.transfer(msg.sender, token0Left + feeBack); //give back
        }
    }


    ////////////////////////
    ///////// sell /////////
    ////////////////////////

    function _findBeforeOrderIdInSellList(address pairAddr, uint token0In, uint token1Out, uint48 findFromId) view internal returns (uint48) {
        MarsPair pair = MarsPair(pairAddr);
        uint48 id = pair.topSellOrderId();

        if (id == 0) {
            return 0;
        }

        if (findFromId == 0) {
            findFromId = id;
        }

        (uint48 beforeOrderId, uint48 afterOrderId, , uint amountIn, uint amountOut, ) = pair.sellOrders(findFromId);
        if (amountIn != 0 && beforeOrderId != type(uint48).max) {
            id = findFromId;
        }

        while (true) {
            if (amountOut * token0In > amountIn * token1Out) {
                return beforeOrderId;
            }
            if (afterOrderId == 0) {
                return id;
            } else {
                id = afterOrderId;
            }
            (beforeOrderId, afterOrderId, , amountIn, amountOut, ) = pair.sellOrders(id);
        }

        return type(uint48).max;
    }

    //Auto find BeforeOrderId
    function makeSellOrder(address pairAddr, uint token0In, uint token1Out, uint48 beforeOrderId) external returns (uint48 newOrderId) {
        MarsPair pair = MarsPair(pairAddr);

        IERC20 token0 = pair.token0();
        token0.transferFrom(msg.sender, address(this), token0In);
        if (token0.allowance(address(this), pairAddr) < token0In) {
            token0.approve(pairAddr, type(uint).max);
        }

        uint48 pairBeforeOrderId = _findBeforeOrderIdInSellList(pairAddr, token0In, token1Out, beforeOrderId);
        newOrderId = pair.makeSellOrder(token0In, token1Out, pairBeforeOrderId);
        pair.changeSellOrderOwner(newOrderId, msg.sender);

        _addOrderCreate(pairAddr, newOrderId, false);
    }

    //Experience like CEX, if partly done, the left makes buy order
    function takeSellOrder(address pairAddr, uint token1In, uint token0Want) external returns (uint token1Pay, uint token0Gain, uint token1Fee) {
        MarsPair pair = MarsPair(pairAddr);
        IERC20 token1 = pair.token1();
        uint fullFee = token1In * pair.fee() / 10000;
        uint token1InWithFee = fullFee + token1In;
        token1.transferFrom(msg.sender, address(this), token1InWithFee);
        if (token1.allowance(address(this), pairAddr) < token1InWithFee) {
            token1.approve(pairAddr, type(uint).max);
        }

        (token1Pay, token0Gain, token1Fee) = pair.takeSellOrder(token1In, token0Want);
        pair.token0().transfer(msg.sender, token0Gain);
        if (fullFee > token1Fee) {
            token1.transfer(msg.sender, fullFee - token1Fee); //give back
        }
        
        //make buy order
        if (token1In > token1Pay) {
            uint newToken1In = token1In - token1Pay;
            uint newToken0Want = newToken1In * token0Want / token1In;

            uint48 beforeOrderId = _findBeforeOrderIdInBuyList(pairAddr, newToken1In, newToken0Want, 0);
            uint48 newOrderId = pair.makeBuyOrder(newToken1In, newToken0Want, beforeOrderId);
            pair.changeBuyOrderOwner(newOrderId, msg.sender);
        }
    }

    //Experience like CEX, if partly done, the left makes buy order
    function takeSellOrder2(address pairAddr, uint token1In, uint token0Want) external returns (uint token1Pay, uint token0Gain, uint token1Fee) {
        MarsPair pair = MarsPair(pairAddr);
        IERC20 token1 = pair.token1();
        uint fullFee = token1In * pair.fee() / 10000;
        uint token1InWithFee = fullFee + token1In;
        token1.transferFrom(msg.sender, address(this), token1InWithFee);
        if (token1.allowance(address(this), pairAddr) < token1InWithFee) {
            token1.approve(pairAddr, type(uint).max);
        }

        (token1Pay, token0Gain, token1Fee) = pair.takeSellOrder(token1In, token0Want);
        pair.token0().transfer(msg.sender, token0Gain);
        
        //make buy order
        if (token1In > token1Pay) {
            uint token1Left = token1In - token1Pay;
            uint feeBack = fullFee - token1Fee;
            token1.transfer(msg.sender, token1Left + feeBack); //give back
        }
    }
}