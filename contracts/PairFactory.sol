// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./Pair.sol";
import "hardhat/console.sol";

contract PairFactory {
    bytes32 public constant INIT_CODE_PAIR_HASH = keccak256(abi.encodePacked(type(Pair).creationCode));

    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    struct Order {
        uint96 orderId; //0:not exist; start from 1
        uint96 beforeOrderId; //0:this is the top order
        uint96 afterOrderId; //0:this is the last order
        address owner;
        uint amountIn; //token deposit in
        uint amountOut; //want token out
        uint amountInUsed;
        bool isDone; //means removed
    }

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);


    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    // function allPairsLength() external override view returns (uint) {
    //     return allPairs.length;
    // }

    // function createPair(address tokenA, address tokenB) external override returns (address pair) {
    //     require(tokenA != tokenB, 'IDENTICAL_ADDRESSES');
    //     (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    //     require(token0 != address(0), 'ZERO_ADDRESS');
    //     require(getPair[token0][token1] == address(0), 'PAIR_EXISTS'); // single check is sufficient
    //     bytes memory bytecode = type(OrderPool).creationCode;
    //     bytes32 salt = keccak256(abi.encodePacked(token0, token1));
    //     assembly {
    //         pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
    //     }
    //     // UniswapV2Pair(pair).initialize(token0, token1);
    //     getPair[token0][token1] = pair;
    //     getPair[token1][token0] = pair; // populate mapping in the reverse direction
    //     allPairs.push(pair);
    //     emit PairCreated(token0, token1, pair, allPairs.length);
    // }

    // function setFeeTo(address _feeTo) external override {
    //     require(msg.sender == feeToSetter, 'FORBIDDEN');
    //     feeTo = _feeTo;
    // }

    // function setFeeToSetter(address _feeToSetter) external override {
    //     require(msg.sender == feeToSetter, 'FORBIDDEN');
    //     feeToSetter = _feeToSetter;
    // }

    function getBuyOrders(address pairAddr, uint96 fromOrderId, uint8 num) public view returns (Order[] memory) {
        Pair pair = Pair(pairAddr);
        Pair.Order memory pairOrder = pair.getBuyOrder(fromOrderId);
        Order[] memory result = new Order[](num);

        result[0] = convertOrder(pairOrder, fromOrderId);
        for (uint8 i = 1; i < num; i++) {
            uint96 orderId = pairOrder.afterOrderId;
            pairOrder = pair.getBuyOrder(orderId);
            result[i] = convertOrder(pairOrder, orderId);
        }
        return result;
    }

    function convertOrder(Pair.Order memory pairOrder, uint96 orderId) internal pure returns (Order memory) {
        return Order(
            orderId, 
            pairOrder.beforeOrderId, 
            pairOrder.afterOrderId, 
            pairOrder.owner,
            pairOrder.amountIn,
            pairOrder.amountOut,
            pairOrder.amountInUsed,
            pairOrder.isDone
        );
    }

}