// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { Ownable2Step } from "@openzeppelin/contracts/access/Ownable2Step.sol";
import "../help/TransferHelper.sol";
import "./MonoTrade.sol";
import "hardhat/console.sol";

contract TradeService is Ownable2Step {
    using TransferHelper for address;

    uint8 public constant fee = 100; //10 means 0.1%
    address public feeTo;

    //trades[token0][token1] => MonoTrade address 
    mapping(address => mapping(address => address)) trades;

    event PairCreated(address indexed tokenA, address indexed tokenB, address tradeAB, address tradeBA);

    constructor() {
        feeTo = msg.sender;
    }

    function changeFeeTo(address _feeTo) public onlyOwner {
        feeTo = _feeTo;
    }

    function createPair(address tokenA, address tokenB) external returns (address tradeAB, address tradeBA) {
        require(tokenA != tokenB, "TradeService: createPair:: tokenA and tokenB cannot be the same");
        require(tokenA != address(0), "TradeService: createPair:: tokenA cannot be 0");
        require(tokenB != address(0), "TradeService: createPair:: tokenB cannot be 0");
        require(trades[tokenA][tokenB] == address(0), "TradeService: createPair:: tradeAB already exist");
        require(trades[tokenB][tokenA] == address(0), "TradeService: createPair:: tradeBA already exist");

        bytes32 salt = keccak256(abi.encodePacked(tokenA, tokenB));
        tradeAB = address(new MonoTrade{salt: salt}(tokenA, tokenB, fee));
        trades[tokenA][tokenB] = tradeAB;

        salt = keccak256(abi.encodePacked(tokenB, tokenA));
        tradeBA = address(new MonoTrade{salt: salt}(tokenB, tokenA, fee));
        trades[tokenB][tokenA] = tradeBA;

        refreshApprove(tokenA, tokenB);

        emit PairCreated(tokenA, tokenB, tradeAB, tradeBA);
    }

    function refreshApprove(address tokenA, address tokenB) public {
        address tradeAB = trades[tokenA][tokenB];
        require(tradeAB != address(0), "TradeService: refreshApprove:: tradeAB not exist");
        tokenA.safeApprove(tradeAB, type(uint).max);
        tokenB.safeApprove(tradeAB, type(uint).max);

        address tradeBA = trades[tokenB][tokenA];
        require(tradeBA != address(0), "TradeService: refreshApprove:: tradeAB not exist");
        tokenA.safeApprove(tradeBA, type(uint).max);
        tokenB.safeApprove(tradeBA, type(uint).max);
    }

    function computeTradeAddr(address token0, address token1) public view returns (address) {
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
                                    abi.encode(token0, token1, fee) //constructor params
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
        uint112 token1In;
        uint112 token0Out;
        uint32 progress;
    }

    //UserOrder combine OrderCreate and MarsPair.Order
    struct UserOrder {
        uint48 index;
        address trade;
        string token0Symbol;
        string token1Symbol;
        uint48 orderId;
        uint32 createTime;
        uint112 tokenIn;
        uint112 tokenOut;
        uint32 progress;
        bool isRemoved;
    }

    struct OrderCreate {
        address trade;
        uint48 orderId;
        uint32 createTime;
        uint112 paid; //bofore order created
        uint112 gain; //bofore order created
    }

    //store user's order list, include all pairs
    //bytes.concat(bytes20(uint160(user)), bytes6(index)) => OrderCreate
    mapping (bytes26 => OrderCreate) orderCreates;

    //store the length of user's order list, 
    mapping (address => uint48) public userOrdersLength;


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
        result[0] = ListOrder(fromOrderId, tradeOrder.token1In, tradeOrder.token0Out, tradeOrder.progress);
        for (uint8 i = 1; i < num; i++) {
            uint48 orderId = tradeOrder.afterOrderId;
            tradeOrder = trade.getOrder(orderId);
            result[i] = ListOrder(orderId, tradeOrder.token1In, tradeOrder.token0Out, tradeOrder.progress);
        }
        return result;
    }

    function getUserOrders(address user, uint48 lastIndex, uint48 num) external view returns (UserOrder[] memory) {
        UserOrder[] memory orders = new UserOrder[](num);

        if (lastIndex == 0) {
            lastIndex = userOrdersLength[user];
        }
        if (lastIndex == 0) {
            return orders;
        }

        for (uint48 index = lastIndex; lastIndex - index < num && index > 0; --index) {
            OrderCreate memory orderCreate = orderCreates[_encodeAddressUint48(user, index)];

            UserOrder memory userOrder;
            if (orderCreate.orderId == 0) {
                userOrder = UserOrder(
                    index,
                    orderCreate.trade,
                    IERC20Metadata(MonoTrade(orderCreate.trade).token0()).symbol(),
                    IERC20Metadata(MonoTrade(orderCreate.trade).token1()).symbol(),
                    0,
                    orderCreate.createTime,
                    orderCreate.paid,
                    orderCreate.gain,
                    type(uint32).max,
                    true
                );

            } else {
                MonoTrade.Order memory tradeOrder = MonoTrade(orderCreate.trade).getOrder(orderCreate.orderId);

                uint32 progress;
                if (tradeOrder.progress < type(uint32).max) {
                    progress = uint32(
                            (tradeOrder.token1In * tradeOrder.progress / type(uint32).max + orderCreate.paid)
                            * type(uint32).max
                            / (tradeOrder.token1In + orderCreate.paid)
                        );
                } else {
                    progress = type(uint32).max;
                }

                userOrder = UserOrder(
                    index,
                    orderCreate.trade,
                    IERC20Metadata(MonoTrade(orderCreate.trade).token0()).symbol(),
                    IERC20Metadata(MonoTrade(orderCreate.trade).token1()).symbol(),
                    orderCreate.orderId,
                    orderCreate.createTime,
                    tradeOrder.token1In + orderCreate.paid,
                    tradeOrder.token0Out * (tradeOrder.token1In + orderCreate.paid) / tradeOrder.token1In,
                    progress,
                    tradeOrder.beforeOrderId == type(uint48).max
                );
            }
            orders[lastIndex - index] = userOrder;
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

    function _addOrderCreate(address tradeAddr, uint48 newOrderId, uint112 pay, uint112 gain) internal {
        uint48 index = userOrdersLength[msg.sender];
        index++;

        orderCreates[_encodeAddressUint48(msg.sender, index)] 
            = OrderCreate(tradeAddr, newOrderId, uint32(block.timestamp), pay, gain);

        userOrdersLength[msg.sender] = index;
    }

    ////////////////////////
    /////// trading ///////
    ////////////////////////

    function findBeforeOrderId(address tradeAddr, uint112 token1In, uint112 token0Out, uint48 findFromId)
        view public returns (uint48) {

        MonoTrade trade = MonoTrade(tradeAddr);
        uint48 id = trade.topOrderId();

        if (id == 0) {
            return 0;
        }

        if (findFromId == 0) {
            findFromId = id;
        }

        (uint48 _beforeOrderId, uint48 _afterOrderId, , uint112 _token1In, uint112 _token0Out, )
            = trade.orders(findFromId);
        
        if (_token1In != 0 && _beforeOrderId != type(uint48).max) {
            id = findFromId;
        }

        while (true) {
            if (_token0Out * token1In > _token1In * token0Out) {
                return _beforeOrderId;
            }
            if (_afterOrderId == 0) {
                return id;
            } else {
                id = _afterOrderId;
            }
            (_beforeOrderId, _afterOrderId, , _token1In, _token0Out, ) = trade.orders(id);
        }

        return type(uint48).max;
    }

    //if beforeOrder not exist, auto find BeforeOrderId
    function makeOrder(address tradeAddr, uint112 token1In, uint112 token0Out, uint48 beforeOrderId)
        external returns (uint48 newOrderId) {

        MonoTrade trade = MonoTrade(tradeAddr);

        address token1 = trade.token1();
        token1.safeTransferFrom(msg.sender, address(this), token1In);

        uint48 tradeBeforeOrderId = findBeforeOrderId(tradeAddr, token1In, token0Out, beforeOrderId);
        newOrderId = trade.makeOrder(token1In, token0Out, tradeBeforeOrderId);
        trade.changeOrderOwner(newOrderId, msg.sender);

        _addOrderCreate(tradeAddr, newOrderId, 0, 0);
    }

    //if partly done, the left makes sell order
    function placeOrder(address tradeAddr, uint112 token0In, uint112 token1ForPrice)
        external returns (uint112 token0Paid, uint112 token1Gain, uint112 token0Fee) {

        MonoTrade trade = MonoTrade(tradeAddr);
        address token0 = trade.token0();
        address token1 = trade.token1();

        uint112 fullFee = token0In * trade.fee() / 10000;
        uint112 token0InWithFee = fullFee + token0In;
        token0.safeTransferFrom(msg.sender, address(this), token0InWithFee);

        (token0Paid, token1Gain, token0Fee) = trade.takeOrder(token0In, token1ForPrice);
        if (token1Gain > 0) {
            token1.safeTransfer(msg.sender, token1Gain);
        }
        if (fullFee > token0Fee) {
            token0.safeTransfer(msg.sender, fullFee - token0Fee); //give back
        }
        
        //make sell order
        if (token0In > token0Paid) {
            uint112 newToken0In = token0In - token0Paid;
            uint112 newToken1Want = newToken0In * token1ForPrice / token0In;
            tradeAddr = trades[token1][token0];
            trade = MonoTrade(tradeAddr);
            uint48 beforeOrderId = findBeforeOrderId(tradeAddr, newToken0In, newToken1Want, 0);
            uint48 newOrderId = trade.makeOrder(newToken0In, newToken1Want, beforeOrderId);
            trade.changeOrderOwner(newOrderId, msg.sender);

            _addOrderCreate(tradeAddr, newOrderId, token0Paid, token1Gain);
        
        } else {
            _addOrderCreate(tradeAddr, 0, token0Paid, token1Gain);
        }
    }

    //if partly done, the left give back
    function takeOrder(address tradeAddr, uint112 token0In, uint112 token1ForPrice)
        external returns (uint112 token0Paid, uint112 token1Gain, uint112 token0Fee) {

        MonoTrade trade = MonoTrade(tradeAddr);
        address token0 = trade.token0();
        address token1 = trade.token1();
        
        uint112 fullFee = token0In * trade.fee() / 10000;
        uint112 token0InWithFee = fullFee + token0In;
        token0.safeTransferFrom(msg.sender, address(this), token0InWithFee);

        (token0Paid, token1Gain, token0Fee) = trade.takeOrder(token0In, token1ForPrice);
        token1.safeTransfer(msg.sender, token1Gain);
        
        //give back
        if (token0In > token0Paid) {
            uint112 token0Left = token0In - token0Paid;
            uint112 feeBack = fullFee - token0Fee;
            token0.safeTransfer(msg.sender, token0Left + feeBack); //give back
        }

        _addOrderCreate(tradeAddr, 0, token0Paid, token1Gain);
    }
}