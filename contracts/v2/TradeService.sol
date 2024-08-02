// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./MonoTrade.sol";
import "hardhat/console.sol";

contract TradeService {

    uint8 public constant fee = 100;
    address public immutable feeTo;

    //trades[token0][token1] => MonoTrade address 
    mapping(address => mapping(address => address)) public trades;

    event PairCreated(address indexed tokenA, address indexed tokenB, address tradeAB, address tradeBA);

    constructor() {
        feeTo = msg.sender;
    }

    function createPair(address tokenA, address tokenB) external returns (address tradeAB, address tradeBA) {
        require(tokenA != tokenB, "TradeService: createPair:: tokenA and tokenB cannot be the same");
        require(tokenA != address(0), "TradeService: createPair:: tokenA cannot be 0");
        require(tokenB != address(0), "TradeService: createPair:: tokenB cannot be 0");
        require(trades[tokenA][tokenB] == address(0), "TradeService: createPair:: tradeAB already exist");
        require(trades[tokenB][tokenA] == address(0), "TradeService: createPair:: tradeBA already exist");

        bytes32 salt = keccak256(abi.encodePacked(tokenA, tokenB));
        MonoTrade pair = new MonoTrade{salt: salt}(tokenA, tokenB, fee, feeTo);
        tradeAB = address(pair);
        trades[tokenA][tokenB] = tradeAB;

        salt = keccak256(abi.encodePacked(tokenB, tokenA));
        pair = new MonoTrade{salt: salt}(tokenB, tokenA, fee, feeTo);
        tradeBA = address(pair);
        trades[tokenB][tokenA] = tradeBA;

        emit PairCreated(tokenA, tokenB, tradeAB, tradeBA);
    }

    function computePairAddr(address token0, address token1) public view returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        address predictedAddr = address(
            uint160(
                uint(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            salt,
                            keccak256(
                                abi.encodePacked(
                                    type(MonoTrade).creationCode, 
                                    abi.encode(token0, token1, fee, feeTo) //constructor params
                                )
                            )
                        )
                    )
                )
            )
        );

        return predictedAddr;
    }

    function getTrade(address token0, address token1) public view returns (address) {
        return trades[token0][token1];
    }




    //for BuyList and SellList
    struct ListOrder {
        uint48 orderId;
        uint112 amountIn;
        uint112 amountOut;
        uint32 progress;
    }

    //UserOrder combine OrderCreate and MarsPair.Order
    struct UserOrder {
        address trade;
        address token0;
        address token1;
        uint48 orderId;
        uint32 createTime;
        address owner;
        uint112 amountIn;
        uint112 amountOut;
        uint32 progress;
        bool isRemoved;
    }

    struct OrderCreate {
        address trade;
        uint48 orderId;
        uint32 createTime;
    }

    //store user's order list, include all pairs
    //bytes.concat(bytes20(uint160(user)), bytes6(index)) => OrderCreate
    mapping (bytes26 => OrderCreate) orderCreates;

    //store the length of user's order list, 
    mapping (address => uint48) userOrdersLength;


    ////////////////////////
    ///////// view /////////
    ////////////////////////

    function getOrderList(address tradeAddr, uint48 fromOrderId, uint8 num) external view returns (ListOrder[] memory) {
        ListOrder[] memory result = new ListOrder[](num);
        MonoTrade trade = MonoTrade(tradeAddr);

        if (fromOrderId == 0) {
            fromOrderId = trade.topOrderId();
        }

        MonoTrade.Order memory tradeOrder = trade.getOrder(fromOrderId);
        result[0] = ListOrder(fromOrderId, tradeOrder.amountIn, tradeOrder.amountOut, tradeOrder.progress);
        for (uint8 i = 1; i < num; i++) {
            uint48 orderId = tradeOrder.afterOrderId;
            tradeOrder = trade.getOrder(orderId);
            result[i] = ListOrder(orderId, tradeOrder.amountIn, tradeOrder.amountOut, tradeOrder.progress);
        }
        return result;
    }

    function getUserOrders(address user, uint48 startIndex, uint48 num) external view returns (UserOrder[] memory) {
        UserOrder[] memory orders = new UserOrder[](num);

        if (startIndex == 0) {
            startIndex = userOrdersLength[user];
        }
        if (startIndex == 0) {
            return orders;
        }

        for (uint48 index = startIndex; startIndex - index < num; --index) {
            OrderCreate memory orderCreate = orderCreates[_encodeAddressUint48(user, index)];
            MonoTrade.Order memory tradeOrder = MonoTrade(orderCreate.trade).getOrder(orderCreate.orderId);
            orders[startIndex - index] = _combineUserOrder(orderCreate, tradeOrder);
        }
        return orders;
    }

    function _encodeAddressUint48(address addr, uint48 u48) internal pure returns (bytes26) {
        return bytes26(bytes.concat(bytes20(uint160(addr)), bytes6(u48)));
    }

    function _decodeAddressUint48(bytes26 b26) internal pure returns (address addr, uint48 u48) {
        addr = address(uint160(bytes20(b26)));
        u48 = uint48(uint208(b26));
    }

    function _combineUserOrder(OrderCreate memory orderCreate, MonoTrade.Order memory tradeOrder) internal view returns (UserOrder memory) {
        return UserOrder(
            orderCreate.trade,
            address(MonoTrade(orderCreate.trade).token0()),
            address(MonoTrade(orderCreate.trade).token1()),
            orderCreate.orderId,
            orderCreate.createTime,
            tradeOrder.owner,
            tradeOrder.amountIn,
            tradeOrder.amountOut,
            tradeOrder.progress,
            tradeOrder.beforeOrderId == type(uint48).max
        );
    }

    function _addOrderCreate(address tradeAddr, uint48 newOrderId) internal {
        uint48 index = userOrdersLength[msg.sender];
        index++;
        orderCreates[_encodeAddressUint48(msg.sender, index)] =  OrderCreate(tradeAddr, newOrderId, uint32(block.timestamp));
        userOrdersLength[msg.sender] = index;
    }

    ////////////////////////
    /////// trading ///////
    ////////////////////////

    function _findBeforeOrderIdInOrderList(address tradeAddr, uint112 token1In, uint112 token0Out, uint48 findFromId) view internal returns (uint48) {
        MonoTrade trade = MonoTrade(tradeAddr);
        uint48 id = trade.topOrderId();

        if (id == 0) {
            return 0;
        }

        if (findFromId == 0) {
            findFromId = id;
        }

        (uint48 beforeOrderId, uint48 afterOrderId, , uint112 amountIn, uint112 amountOut, ) = trade.orders(findFromId);
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
            (beforeOrderId, afterOrderId, , amountIn, amountOut, ) = trade.orders(id);
        }

        return type(uint48).max;
    }

    //if beforeOrder not exist, auto find BeforeOrderId
    function makeOrder(address tradeAddr, uint112 token1In, uint112 token0Out, uint48 beforeOrderId) external returns (uint48 newOrderId) {
        MonoTrade trade = MonoTrade(tradeAddr);

        IERC20 token1 = trade.token1();
        token1.transferFrom(msg.sender, address(this), token1In);
        if (token1.allowance(address(this), tradeAddr) < token1In) {
            token1.approve(tradeAddr, type(uint).max);
        }

        uint48 tradeBeforeOrderId = _findBeforeOrderIdInOrderList(tradeAddr, token1In, token0Out, beforeOrderId);
        newOrderId = trade.makeOrder(token1In, token0Out, tradeBeforeOrderId);
        trade.changeOrderOwner(newOrderId, msg.sender);

        _addOrderCreate(tradeAddr, newOrderId);
    }

    //Experience like CEX, if partly done, the left makes sell order
    function takeOrder(address tradeAddr, uint112 token0In, uint112 token1Want) external returns (uint112 token0Pay, uint112 token1Gain, uint112 token0Fee) {
        MonoTrade trade = MonoTrade(tradeAddr);
        IERC20 token0 = trade.token0();
        IERC20 token1 = trade.token1();
        
        uint112 fullFee = token0In * trade.fee() / 10000;
        uint112 token0InWithFee = fullFee + token0In;
        token0.transferFrom(msg.sender, address(this), token0InWithFee);
        if (token0.allowance(address(this), tradeAddr) < token0InWithFee) {
            token0.approve(tradeAddr, type(uint).max);
        }

        (token0Pay, token1Gain, token0Fee) = trade.takeOrder(token0In, token1Want);
        token1.transfer(msg.sender, token1Gain);
        if (fullFee > token0Fee) {
            token0.transfer(msg.sender, fullFee - token0Fee); //give back
        }
        
        //make sell order
        if (token0In > token0Pay) {
            uint112 newToken0In = token0In - token0Pay;
            uint112 newToken1Want = newToken0In * token1Want / token0In;
            tradeAddr = trades[address(token1)][address(token0)];
            uint48 beforeOrderId = _findBeforeOrderIdInOrderList(tradeAddr, newToken0In, newToken1Want, 0);
            uint48 newOrderId = trade.makeOrder(newToken0In, newToken1Want, beforeOrderId);
            trade.changeOrderOwner(newOrderId, msg.sender);
        }
    }

    //Experience like CEX, if partly done, the left give back
    function takeOrder2(address tradeAddr, uint112 token0In, uint112 token1Want) external returns (uint112 token0Pay, uint112 token1Gain, uint112 token0Fee) {
        MonoTrade trade = MonoTrade(tradeAddr);
        IERC20 token0 = trade.token0();
        IERC20 token1 = trade.token1();
        
        uint112 fullFee = token0In * trade.fee() / 10000;
        uint112 token0InWithFee = fullFee + token0In;
        token0.transferFrom(msg.sender, address(this), token0InWithFee);
        if (token0.allowance(address(this), tradeAddr) < token0InWithFee) {
            token0.approve(tradeAddr, type(uint).max);
        }

        (token0Pay, token1Gain, token0Fee) = trade.takeOrder(token0In, token1Want);
        token1.transfer(msg.sender, token1Gain);
        
        //give back
        if (token0In > token0Pay) {
            uint112 token0Left = token0In - token0Pay;
            uint112 feeBack = fullFee - token0Fee;
            token0.transfer(msg.sender, token0Left + feeBack); //give back
        }
    }
}