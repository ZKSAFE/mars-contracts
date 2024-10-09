// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Mars.sol";
import "./TradeService.sol";
import "./MonoTrade.sol";
import "hardhat/console.sol";

contract Mining {

    Mars public mars = new Mars();
    TradeService public service = new TradeService();

    mapping (bytes26 => bool) public isMined;

    constructor() {
    }

    function feeTo() public view returns (address) {
        return address(this);
    }

    function mine(address tradeAddr, uint48 orderId, bytes calldata routersBytes) public returns (uint) {
        require(!isMined[_encodeAddressUint48(tradeAddr, orderId)], "already mined");

        MonoTrade.Order memory order = MonoTrade(tradeAddr).getOrder(orderId);
        require(order.progress == type(uint32).max, "Mining: mine:: order is not done");

        uint112 tokenInAmount = order.amountOut * MonoTrade(tradeAddr).fee() / 10000;
        address tokenInAddr = address(MonoTrade(tradeAddr).token0());
        require(tokenInAmount > 0, "Mining: mine:: nothing to mine");

        uint routersLength = routersBytes.length / 20 - 1;
        for (uint i = 0; i < routersLength; i++) {
            uint p = i * 20;
            address routerTokenIn = address(bytes20(bytes(routersBytes[p : p + 20])));
            address routerTokenOut = address(bytes20(bytes(routersBytes[p + 20 : p + 40])));
            // console.log("routerTokenIn:", routerTokenIn, "routerTokenOut:", routerTokenOut);
            if (i == 0) {
                require(routerTokenIn == tokenInAddr, "Mining: mine:: router wrong");
            }
            if (i == routersLength - 1) {
                require(routerTokenOut == address(mars), "Mining: mine:: router wrong");
            }

            address routerTradeAddr = service.getTrade(routerTokenIn, routerTokenOut);
            require(routerTradeAddr != address(0), "Mining: mine:: router trade is not exist");

            if (IERC20(routerTokenIn).allowance(address(this), routerTradeAddr) < tokenInAmount) {
                IERC20(routerTokenIn).approve(routerTradeAddr, type(uint).max);
            }
            // uint balance = IERC20(routerTokenIn).balanceOf(address(this));
            // console.log("balance:", balance, "tokenInAmount:", tokenInAmount);
            
            (uint112 token0Pay, uint112 token1Gain, ) = MonoTrade(routerTradeAddr).takeOrder(tokenInAmount, 1);
            require(token0Pay == tokenInAmount, "Mining: mine:: partly done is not allowed");
            
            tokenInAmount = token1Gain; //continue loop
        }

        mars.transfer(order.owner, tokenInAmount); //mining Mars
        isMined[_encodeAddressUint48(tradeAddr, orderId)] = true;

        return tokenInAmount;
    }

    function _encodeAddressUint48(address addr, uint48 u48) internal pure returns (bytes26) {
        return bytes26(bytes.concat(bytes20(uint160(addr)), bytes6(u48)));
    }

    function _decodeAddressUint48(bytes26 b26) internal pure returns (address addr, uint48 u48) {
        addr = address(uint160(bytes20(b26)));
        u48 = uint48(uint208(b26));
    }

}