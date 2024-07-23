// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MarsPair.sol";
import "hardhat/console.sol";

contract MarsHelp {
    
    struct Order {
        uint48 orderId; //0:not exist; start from 1
        address owner;
        uint amountIn; //token deposit in
        uint amountOut; //Want token out
        uint amountInUsed;
        bool isDone; //means removed
    }

    constructor() {
    }

    function getBuyList(address pairAddr, uint48 fromOrderId, uint8 num) public view returns (Order[] memory) {
        MarsPair pair = MarsPair(pairAddr);
        MarsPair.Order memory pairOrder = pair.getBuyOrder(fromOrderId);
        Order[] memory result = new Order[](num);

        result[0] = convertOrder(pairOrder, fromOrderId);
        for (uint8 i = 1; i < num; i++) {
            uint48 orderId = pairOrder.afterOrderId;
            pairOrder = pair.getBuyOrder(orderId);
            result[i] = convertOrder(pairOrder, orderId);
        }
        return result;
    }

    function getSellList(address pairAddr, uint48 fromOrderId, uint8 num) public view returns (Order[] memory) {
        MarsPair pair = MarsPair(pairAddr);
        MarsPair.Order memory pairOrder = pair.getSellOrder(fromOrderId);
        Order[] memory result = new Order[](num);

        result[0] = convertOrder(pairOrder, fromOrderId);
        for (uint8 i = 1; i < num; i++) {
            uint48 orderId = pairOrder.afterOrderId;
            pairOrder = pair.getSellOrder(orderId);
            result[i] = convertOrder(pairOrder, orderId);
        }
        return result;
    }

    function getOrder(address pairAddr, uint48 orderId) public view returns (Order memory) {
        MarsPair pair = MarsPair(pairAddr);
        MarsPair.Order memory pairOrder = pair.getBuyOrder(orderId);
        if (pairOrder.owner == address(0)) {
            pairOrder = pair.getSellOrder(orderId);
        }
        return convertOrder(pairOrder, orderId);
    }

    function convertOrder(MarsPair.Order memory pairOrder, uint48 orderId) internal pure returns (Order memory) {
        return Order(
            orderId, 
            pairOrder.owner,
            pairOrder.amountIn,
            pairOrder.amountOut,
            pairOrder.amountInUsed,
            pairOrder.beforeOrderId == type(uint48).max
        );
    }

    function findBeforeOrderIdInBuyList(address pairAddr, uint token1In, uint token0Out) view public returns (uint48) {
        MarsPair pair = MarsPair(pairAddr);
        uint48 id = pair.topBuyOrderId();

        if (id == 0) {
            return 0;
        }

        while (true) {
            (uint48 beforeOrderId, uint48 afterOrderId, , uint amountIn, uint amountOut, ) = pair.buyOrders(id);
            if (amountOut * token1In > amountIn * token0Out) {
                return beforeOrderId;
            }
            if (afterOrderId == 0) {
                return id;
            } else {
                id = afterOrderId;
            }
        }

        return type(uint48).max;
    }

    //Auto find BeforeOrderId
    function makeBuyOrder(address pairAddr, uint token1In, uint token0Out) public returns (uint48 newOrderId) {
        MarsPair pair = MarsPair(pairAddr);

        IERC20 token1 = pair.token1();
        token1.transferFrom(msg.sender, address(this), token1In);
        if (token1.allowance(address(this), pairAddr) < token1In) {
            token1.approve(pairAddr, type(uint).max);
        }

        uint48 beforeOrderId = findBeforeOrderIdInBuyList(pairAddr, token1In, token0Out);
        newOrderId = pair.makeBuyOrder(token1In, token0Out, beforeOrderId);
        pair.changeBuyOrderOwner(newOrderId, msg.sender);
    }

    //Experience like CEX, if partly done, the left makes sell order
    function takeBuyOrder(address pairAddr, uint token0In, uint token1Want) public returns (uint token0Pay, uint token1Gain, uint token0Fee) {
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
            
            uint48 beforeOrderId = findBeforeOrderIdInSellList(pairAddr, newToken0In, newToken1Want);
            uint48 newOrderId = pair.makeSellOrder(newToken0In, newToken1Want, beforeOrderId);
            pair.changeSellOrderOwner(newOrderId, msg.sender);
        }
    }

    //Experience like CEX, if partly done, the left give back
    function takeBuyOrder2(address pairAddr, uint token0In, uint token1Want) public returns (uint token0Pay, uint token1Gain, uint token0Fee) {
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

    function findBeforeOrderIdInSellList(address pairAddr, uint token0In, uint token1Out) view public returns (uint48) {
        MarsPair pair = MarsPair(pairAddr);
        uint48 id = pair.topSellOrderId();

        if (id == 0) {
            return 0;
        }

        while (true) {
            (uint48 beforeOrderId, uint48 afterOrderId, , uint amountIn, uint amountOut, ) = pair.sellOrders(id);
            if (amountOut * token0In > amountIn * token1Out) {
                return beforeOrderId;
            }
            if (afterOrderId == 0) {
                return id;
            } else {
                id = afterOrderId;
            }
        }

        return type(uint48).max;
    }

    //Auto find BeforeOrderId
    function makeSellOrder(address pairAddr, uint token0In, uint token1Out) public returns (uint48 newOrderId) {
        MarsPair pair = MarsPair(pairAddr);

        IERC20 token0 = pair.token0();
        token0.transferFrom(msg.sender, address(this), token0In);
        if (token0.allowance(address(this), pairAddr) < token0In) {
            token0.approve(pairAddr, type(uint).max);
        }

        uint48 beforeOrderId = findBeforeOrderIdInSellList(pairAddr, token0In, token1Out);
        newOrderId = pair.makeSellOrder(token0In, token1Out, beforeOrderId);
        pair.changeSellOrderOwner(newOrderId, msg.sender);
    }

    //Experience like CEX, if partly done, the left makes buy order
    function takeSellOrder(address pairAddr, uint token1In, uint token0Want) public returns (uint token1Pay, uint token0Gain, uint token1Fee) {
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

            uint48 beforeOrderId = findBeforeOrderIdInBuyList(pairAddr, newToken1In, newToken0Want);
            uint48 newOrderId = pair.makeBuyOrder(newToken1In, newToken0Want, beforeOrderId);
            pair.changeBuyOrderOwner(newOrderId, msg.sender);
        }
    }

    //Experience like CEX, if partly done, the left makes buy order
    function takeSellOrder2(address pairAddr, uint token1In, uint token0Want) public returns (uint token1Pay, uint token0Gain, uint token1Fee) {
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