# Mars Project

Mars is an order book DEX designed for high-performance EVM public chains. We aim to achieve the following goals:

1. No backend, fully utilizing the processing power of the public chain.
2. User operation logic consistent with centralized exchanges (CEX).
3. The gas costs of the most resource-intensive operations remain within acceptable limits.
4. As a foundational protocol, it provides excellent support for building blocks in DeFi.

### Core Principles

The on-chain order list is always sorted by price, using a LinkedList data structure to store orders, which enhances the efficiency of insertion and removal operations. Each order's data structure is aligned to storage slots, occupying only two slots, which significantly reduces gas costs. The most gas-intensive operation is taking orders. Each time an order is taken, it requires changing the order's status and transferring tokens to the user who made the order. Thus, the more orders taken, the higher the gas cost. Currently, taking 100 orders incurs a gas cost of 1,818,463, which is sufficient for daily use.

**MarsPair.sol** is the core contract responsible for algorithm implementation. <br>
**MarsService.sol** is the peripheral contract responsible for integration with the frontend.

We are currently developing version 2, which attempts to separate buying and selling by deploying two MonoTrade.sol contracts for each trading pair, effectively reducing the amount of code by half. With fewer interfaces, this approach is more conducive to DeFi expansion.

### Expansion

Mars is designed as a foundational protocol with no centralized privilege. To maintain the operation of this system, order maken is fee-free, while taking orders incurs a fee. Users who make orders can mine MarsTokens through MarsMining.sol; trading is mining. The process of mining MarsTokens effectively uses the trading fees to purchase MarsTokens for users, contributing to the increase in MarsToken value.

In order to encourage more partners to participate in the construction of the Mars ecosystem, all trading fees from Mars are returned. As an agent of Mars, you can receive the total trading fees, which you can then share with your users. If you deploy your own DEX, the fees you obtain will be the same as those from integrating with Mars. It is more advantageous to share liquidity with Mars.