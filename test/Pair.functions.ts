import hre from 'hardhat'
import * as viem from 'viem'
import { expect } from "chai"


describe('Pair functions test', function () {

    let accounts: any
    let publicClient: any
    let weth: any
    let usdt: any
    let pairReadHelp: any
    let pair: any

    before(async function () {
        accounts = await hre.viem.getWalletClients()
        publicClient = await hre.viem.getPublicClient()
        console.log('account0:', accounts[0].account.address)
    })


    it('testing makeBuyOrder', async function () {
        weth = await hre.viem.deployContract('MockERC20', ['TEST WETH', 'WETH'])
        console.log('token deployed:', weth.address)
        await weth.write.mint([accounts[2].account.address, viem.parseUnits('1000', 18)])

        usdt = await hre.viem.deployContract('MockERC20', ['TEST USDT', 'USDT'])
        console.log('usdt deployed:', usdt.address)
        await usdt.write.setDecimals([6])
        await usdt.write.mint([accounts[0].account.address, viem.parseUnits('1000', 6)])
        await usdt.write.mint([accounts[1].account.address, viem.parseUnits('1000', 6)])

        pairReadHelp = await hre.viem.deployContract('PairReadHelp', [])
        console.log('pairReadHelp deployed:', pairReadHelp.address)

        pair = await hre.viem.deployContract('Pair', [weth.address, usdt.address])
        console.log('pair deployed:', pair.address)


        //makeBuyOrder
        await usdt.write.approve([pair.address, viem.parseUnits('1000', 6)])
        await pair.write.makeBuyOrder([viem.parseUnits('100', 6), viem.parseUnits('1', 18), 0n]) //#1, if buyOrders is empty
        await pair.write.makeBuyOrder([viem.parseUnits('200', 6), viem.parseUnits('1', 18), 0n]) //#2, if newOrder is the new topOrder
        await pair.write.makeBuyOrder([viem.parseUnits('50', 6), viem.parseUnits('1', 18), 1n]) //#3, if newOrder is the new lastOrder
        // the buy list should be:
        // #2
        // #1
        // #3

        //makeBuyOrder
        await usdt.write.approve([pair.address, viem.parseUnits('1000', 6)], { account: accounts[1].account })
        await pair.write.makeBuyOrder([viem.parseUnits('150', 6), viem.parseUnits('1', 18), 2n], { account: accounts[1].account }) //#4
        await pair.write.makeBuyOrder([viem.parseUnits('25', 6), viem.parseUnits('1', 18), 3n], { account: accounts[1].account }) //#5
        await pair.write.makeBuyOrder([viem.parseUnits('75', 6), viem.parseUnits('1', 18), 1n], { account: accounts[1].account }) //#6
        await pair.write.makeBuyOrder([viem.parseUnits('250', 6), viem.parseUnits('1', 18), 0n], { account: accounts[1].account }) //#7
        // the buy list should be:
        // #7 : $250
        // #2 : $200
        // #4 : $150
        // #1 : $100
        // #6 : $75
        // #3 : $50
        // #5 : $25

        let topBuyOrderId = await pair.read.topBuyOrderId()
        let buyOrders = await pairReadHelp.read.getBuyList([pair.address, topBuyOrderId, 7n])

        expect(buyOrders[0].orderId).to.equal(7n)
        expect(buyOrders[1].orderId).to.equal(2n)
        expect(buyOrders[2].orderId).to.equal(4n)
        expect(buyOrders[3].orderId).to.equal(1n)
        expect(buyOrders[4].orderId).to.equal(6n)
        expect(buyOrders[5].orderId).to.equal(3n)
        expect(buyOrders[6].orderId).to.equal(5n)

        await print()
    })


    it('testing cancelBuyOrder', async function () {
        //#7 order partly done
        await weth.write.approve([pair.address, viem.parseUnits('1000', 18)], { account: accounts[2].account })
        await pair.write.takeBuyOrder([viem.parseUnits('0.1', 18), 0n], { account: accounts[2].account })
        expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('0.1', 18))
        expect(await weth.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('999.9', 18))
        expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('500', 6))
        expect(await usdt.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('25', 6))

        await pair.write.cancelBuyOrder([7n], { account: accounts[1].account })
        await pair.write.cancelBuyOrder([5n], { account: accounts[1].account })
        await pair.write.cancelBuyOrder([2n])
        await pair.write.cancelBuyOrder([1n])
        expect(await weth.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0', 18))
        expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('0.1', 18))
        expect(await usdt.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('950', 6))
        expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('750', 6))

        let topBuyOrderId = await pair.read.topBuyOrderId()
        let buyOrders = await pairReadHelp.read.getBuyList([pair.address, topBuyOrderId, 3n])
        // console.log(buyOrders)

        expect(buyOrders[0].orderId).to.equal(4n)
        expect(buyOrders[1].orderId).to.equal(6n)
        expect(buyOrders[2].orderId).to.equal(3n)

        await print()
    })


    it('testing takeBuyOrder', async function () {
        await expect(pair.write.takeBuyOrder([viem.parseUnits('0.5', 18), viem.parseUnits('76', 6)], { account: accounts[2].account })).to.be.rejected

        await pair.write.takeBuyOrder([viem.parseUnits('0.5', 18), viem.parseUnits('75', 6)], { account: accounts[2].account })

        let topBuyOrderId = await pair.read.topBuyOrderId()
        let buyOrders = await pairReadHelp.read.getBuyList([pair.address, topBuyOrderId, 3n])
        expect(buyOrders[0].orderId).to.equal(4n)
        expect(buyOrders[0].amountInUsed).to.equal(viem.parseUnits('75', 6))

        await pair.write.takeBuyOrder([viem.parseUnits('2', 18), 0n], { account: accounts[2].account })
        topBuyOrderId = await pair.read.topBuyOrderId()
        buyOrders = await pairReadHelp.read.getBuyList([pair.address, topBuyOrderId, 3n])
        expect(buyOrders[0].orderId).to.equal(3n)
        expect(buyOrders[0].amountInUsed).to.equal(viem.parseUnits('25', 6))

        await pair.write.takeBuyOrder([viem.parseUnits('1', 18), 0n], { account: accounts[2].account })
        topBuyOrderId = await pair.read.topBuyOrderId()
        buyOrders = await pairReadHelp.read.getBuyList([pair.address, topBuyOrderId, 3n])
        expect(buyOrders[0].orderId).to.equal(0n)

        await print()
    })


    it('end', async function () {
        expect(await pair.read.topBuyOrderId()).to.equal(0n)

        //end balances
        expect(await weth.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('1', 18))
        expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('2.1', 18))
        expect(await weth.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('996.9', 18))
        expect(await weth.read.balanceOf([pair.address])).to.equal(viem.parseUnits('0', 18))
        expect(await usdt.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('950', 6))
        expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('750', 6))
        expect(await usdt.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('300', 6))
        expect(await usdt.read.balanceOf([pair.address])).to.equal(viem.parseUnits('0', 6))

        //done orders
        expect(await pair.read.getBuyOrder([1n])).to.deep.equal({
            beforeOrderId: 4n,
            afterOrderId: 6n,
            owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            amountIn: 100000000n,
            amountOut: 1000000000000000000n,
            amountInUsed: 0n,
            isDone: true
        })
        expect(await pair.read.getBuyOrder([2n])).to.deep.equal({
            beforeOrderId: 0n,
            afterOrderId: 4n,
            owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            amountIn: 200000000n,
            amountOut: 1000000000000000000n,
            amountInUsed: 0n,
            isDone: true
        })
        expect(await pair.read.getBuyOrder([3n])).to.deep.equal({
            beforeOrderId: 0n,
            afterOrderId: 0n,
            owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            amountIn: 50000000n,
            amountOut: 1000000000000000000n,
            amountInUsed: 50000000n,
            isDone: true
        })
        expect(await pair.read.getBuyOrder([4n])).to.deep.equal({
            beforeOrderId: 0n,
            afterOrderId: 6n,
            owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            amountIn: 150000000n,
            amountOut: 1000000000000000000n,
            amountInUsed: 150000000n,
            isDone: true
        })
        expect(await pair.read.getBuyOrder([5n])).to.deep.equal({
            beforeOrderId: 3n,
            afterOrderId: 0n,
            owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            amountIn: 25000000n,
            amountOut: 1000000000000000000n,
            amountInUsed: 0n,
            isDone: true
        })
        expect(await pair.read.getBuyOrder([6n])).to.deep.equal({
            beforeOrderId: 0n,
            afterOrderId: 3n,
            owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            amountIn: 75000000n,
            amountOut: 1000000000000000000n,
            amountInUsed: 75000000n,
            isDone: true
        })
        expect(await pair.read.getBuyOrder([7n])).to.deep.equal({
            beforeOrderId: 0n,
            afterOrderId: 2n,
            owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            amountIn: 250000000n,
            amountOut: 1000000000000000000n,
            amountInUsed: 25000000n,
            isDone: true
        })
    })


    async function print() {
        console.log('account0 weth:',
            viem.formatUnits(
                await weth.read.balanceOf([accounts[0].account.address]),
                await weth.read.decimals()
            ),
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([accounts[0].account.address]),
                await usdt.read.decimals()
            )
        )

        console.log('account1 weth:',
            viem.formatUnits(
                await weth.read.balanceOf([accounts[1].account.address]),
                await weth.read.decimals()
            ),
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([accounts[1].account.address]),
                await usdt.read.decimals()
            )
        )

        console.log('account2 weth:',
            viem.formatUnits(
                await weth.read.balanceOf([accounts[2].account.address]),
                await weth.read.decimals()
            ),
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([accounts[2].account.address]),
                await usdt.read.decimals()
            )
        )

        console.log('pair weth:',
            viem.formatUnits(
                await weth.read.balanceOf([pair.address]),
                await weth.read.decimals()
            ),
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([pair.address]),
                await usdt.read.decimals()
            )
        )
    }

})