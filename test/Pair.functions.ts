import hre from 'hardhat'
import * as viem from 'viem'
import { expect } from "chai"


describe('Pair functions test', function () {

    let accounts: any
    let account: any
    let publicClient: any
    let weth: any
    let usdt: any
    let service: any
    let pair: any

    before(async function () {
        accounts = await hre.viem.getWalletClients()
        publicClient = await hre.viem.getPublicClient()
        console.log('account0:', accounts[0].account.address)

        weth = await hre.viem.deployContract('MockERC20', ['TEST WETH', 'WETH'])
        console.log('token deployed:', weth.address)
        await weth.write.mint([accounts[1].account.address, viem.parseUnits('1000', 18)])

        usdt = await hre.viem.deployContract('MockERC20', ['TEST USDT', 'USDT'])
        console.log('usdt deployed:', usdt.address)
        await usdt.write.setDecimals([6])
        await usdt.write.mint([accounts[2].account.address, viem.parseUnits('1000', 6)])
        await usdt.write.mint([accounts[3].account.address, viem.parseUnits('1000', 6)])

        service = await hre.viem.deployContract('MarsService', [])
        console.log('MarsService deployed:', service.address)

        pair = await hre.viem.deployContract('MarsPair', [weth.address, usdt.address, 100])
        console.log('pair deployed:', pair.address)
    })


    it('testing makeBuyOrder', async function () {
        //makeBuyOrder
        account = accounts[2].account
        await usdt.write.approve([pair.address, viem.parseUnits('1000', 6)], { account })
        await pair.write.makeBuyOrder([viem.parseUnits('100', 6), viem.parseUnits('1', 18), 0n], { account }) //#1, if buyOrders is empty
        await pair.write.makeBuyOrder([viem.parseUnits('200', 6), viem.parseUnits('1', 18), 0n], { account }) //#2, if newOrder is the new topOrder
        await pair.write.makeBuyOrder([viem.parseUnits('50', 6), viem.parseUnits('1', 18), 1n], { account }) //#3, if newOrder is the new lastOrder
        // the buy list should be:
        // #2
        // #1
        // #3

        //makeBuyOrder
        account = accounts[3].account
        await usdt.write.approve([pair.address, viem.parseUnits('1000', 6)], { account })
        await pair.write.makeBuyOrder([viem.parseUnits('150', 6), viem.parseUnits('1', 18), 2n], { account }) //#4
        await pair.write.makeBuyOrder([viem.parseUnits('25', 6), viem.parseUnits('1', 18), 3n], { account }) //#5
        await pair.write.makeBuyOrder([viem.parseUnits('75', 6), viem.parseUnits('1', 18), 1n], { account }) //#6
        await pair.write.makeBuyOrder([viem.parseUnits('250', 6), viem.parseUnits('1', 18), 0n], { account }) //#7
        // the buy list should be:
        // #7 : $250
        // #2 : $200
        // #4 : $150
        // #1 : $100
        // #6 : $75
        // #3 : $50
        // #5 : $25

        let buyOrders = await service.read.getBuyList([pair.address, 0, 7n])

        expect(buyOrders[0].orderId).to.equal(7)
        expect(buyOrders[1].orderId).to.equal(2)
        expect(buyOrders[2].orderId).to.equal(4)
        expect(buyOrders[3].orderId).to.equal(1)
        expect(buyOrders[4].orderId).to.equal(6)
        expect(buyOrders[5].orderId).to.equal(3)
        expect(buyOrders[6].orderId).to.equal(5)

        await print()
    })


    it('testing cancelBuyOrder', async function () {
        //#7 order partly done
        account = accounts[1].account
        await weth.write.approve([pair.address, viem.parseUnits('1000', 18)], { account })
        await pair.write.takeBuyOrder([viem.parseUnits('0.1', 18), 0n], { account })

        // expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('999.899', 18))
        // expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('25', 6))
        // expect(await weth.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('0.1', 18))
        // expect(await usdt.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('500', 6))

        account = accounts[2].account
        await pair.write.cancelBuyOrder([2n], { account })
        await pair.write.cancelBuyOrder([1n], { account })

        account = accounts[3].account
        await pair.write.cancelBuyOrder([7n], { account })
        await pair.write.cancelBuyOrder([5n], { account })

        // expect(await weth.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('0', 18))
        // expect(await usdt.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('950', 6))
        // expect(await weth.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('0.1', 18))
        // expect(await usdt.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('750', 6))

        let buyOrders = await service.read.getBuyList([pair.address, 0, 3n])
        // console.log(buyOrders)

        expect(buyOrders[0].orderId).to.equal(4)
        expect(buyOrders[1].orderId).to.equal(6)
        expect(buyOrders[2].orderId).to.equal(3)

        await print()
    })


    it('testing takeBuyOrder', async function () {
        account = accounts[1].account
        await expect(pair.write.takeBuyOrder([viem.parseUnits('0.5', 18), viem.parseUnits('76', 6)], { account })).to.be.rejected

        await pair.write.takeBuyOrder([viem.parseUnits('0.5', 18), viem.parseUnits('75', 6)], { account })

        let buyOrders = await service.read.getBuyList([pair.address, 0, 3n])
        expect(buyOrders[0].orderId).to.equal(4)
        // expect(buyOrders[0].amountInUsed).to.equal(viem.parseUnits('75', 6))

        await pair.write.takeBuyOrder([viem.parseUnits('2', 18), 0n], { account })
        buyOrders = await service.read.getBuyList([pair.address, 0, 3n])
        expect(buyOrders[0].orderId).to.equal(3)
        // expect(buyOrders[0].amountInUsed).to.equal(viem.parseUnits('25', 6))

        await pair.write.takeBuyOrder([viem.parseUnits('1', 18), 0n], { account })
        buyOrders = await service.read.getBuyList([pair.address, 0, 3n])
        expect(buyOrders[0].orderId).to.equal(0)

        await print()
    })


    it('buy end', async function () {
        expect(await pair.read.topBuyOrderId()).to.equal(0)

        let topSellOrderId = await pair.read.topSellOrderId()
        let sellOrders = await service.read.getSellList([pair.address, topSellOrderId, 3n])
        console.log(sellOrders)

        //end balances
        // expect(await weth.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0.031', 18))
        // expect(await usdt.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0', 6))

        // expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('996.869', 18))
        // expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('300', 6))

        // expect(await weth.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('1', 18))
        // expect(await usdt.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('950', 6))

        // expect(await weth.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('2.1', 18))
        // expect(await usdt.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('750', 6))

        // expect(await weth.read.balanceOf([pair.address])).to.equal(viem.parseUnits('0', 18))
        // expect(await usdt.read.balanceOf([pair.address])).to.equal(viem.parseUnits('0', 6))

        //done orders
        // expect(await service.read.getOrder([pair.address, 1n])).to.deep.equal({
        //     orderId: 1,
        //     owner: viem.getAddress(accounts[2].account.address),
        //     amountIn: 100000000n,
        //     amountOut: 1000000000000000000n,
        //     amountInUsed: 0n,
        //     isDone: true
        // })
        // expect(await service.read.getOrder([pair.address, 2n])).to.deep.equal({
        //     orderId: 2,
        //     owner: viem.getAddress(accounts[2].account.address),
        //     amountIn: 200000000n,
        //     amountOut: 1000000000000000000n,
        //     amountInUsed: 0n,
        //     isDone: true
        // })
        // expect(await service.read.getOrder([pair.address, 3n])).to.deep.equal({
        //     orderId: 3,
        //     owner: viem.getAddress(accounts[2].account.address),
        //     amountIn: 50000000n,
        //     amountOut: 1000000000000000000n,
        //     amountInUsed: 50000000n,
        //     isDone: true
        // })
        // expect(await service.read.getOrder([pair.address, 4n])).to.deep.equal({
        //     orderId: 4,
        //     owner: viem.getAddress(accounts[3].account.address),
        //     amountIn: 150000000n,
        //     amountOut: 1000000000000000000n,
        //     amountInUsed: 150000000n,
        //     isDone: true
        // })
        // expect(await service.read.getOrder([pair.address, 5n])).to.deep.equal({
        //     orderId: 5,
        //     owner: viem.getAddress(accounts[3].account.address),
        //     amountIn: 25000000n,
        //     amountOut: 1000000000000000000n,
        //     amountInUsed: 0n,
        //     isDone: true
        // })
        // expect(await service.read.getOrder([pair.address, 6n])).to.deep.equal({
        //     orderId: 6,
        //     owner: viem.getAddress(accounts[3].account.address),
        //     amountIn: 75000000n,
        //     amountOut: 1000000000000000000n,
        //     amountInUsed: 75000000n,
        //     isDone: true
        // })
        // expect(await service.read.getOrder([pair.address, 7n])).to.deep.equal({
        //     orderId: 7,
        //     owner: viem.getAddress(accounts[3].account.address),
        //     amountIn: 250000000n,
        //     amountOut: 1000000000000000000n,
        //     amountInUsed: 25000000n,
        //     isDone: true
        // })
    })


    it('testing makeSellOrder', async function () {
        //makeSellOrder
        account = accounts[1].account
        await weth.write.approve([pair.address, viem.parseUnits('1000', 18)], { account })
        await pair.write.makeSellOrder([viem.parseUnits('1', 18), viem.parseUnits('100', 6), 0n], { account }) //#8, if sellOrders is empty
        await pair.write.makeSellOrder([viem.parseUnits('1', 18), viem.parseUnits('50', 6), 0n], { account }) //#9, if newOrder is the new topOrder
        await pair.write.makeSellOrder([viem.parseUnits('1', 18), viem.parseUnits('200', 6), 8n], { account }) //#10, if newOrder is the new lastOrder
        // the buy list should be:
        // #2
        // #1
        // #3

        //makeSellOrder
        account = accounts[3].account
        await weth.write.approve([pair.address, viem.parseUnits('1000', 18)], { account })
        await pair.write.makeSellOrder([viem.parseUnits('0.5', 18), viem.parseUnits('30', 6), 9n], { account }) //#11
        await pair.write.makeSellOrder([viem.parseUnits('0.5', 18), viem.parseUnits('110', 6), 10n], { account }) //#12
        await pair.write.makeSellOrder([viem.parseUnits('0.5', 18), viem.parseUnits('60', 6), 8n], { account }) //#13
        await pair.write.makeSellOrder([viem.parseUnits('0.5', 18), viem.parseUnits('20', 6), 0n], { account }) //#14
        // the sell list should be:
        // #12 : $220
        // #10 : $200
        // #13 : $120
        // #8 : $100
        // #11 : $60
        // #9 : $50
        // #14 : $40

        let topSellOrderId = await pair.read.topSellOrderId()
        let sellOrders = await service.read.getSellList([pair.address, topSellOrderId, 7n])

        expect(sellOrders[0].orderId).to.equal(14)
        expect(sellOrders[1].orderId).to.equal(9)
        expect(sellOrders[2].orderId).to.equal(11)
        expect(sellOrders[3].orderId).to.equal(8)
        expect(sellOrders[4].orderId).to.equal(13)
        expect(sellOrders[5].orderId).to.equal(10)
        expect(sellOrders[6].orderId).to.equal(12)

        await print()
    })


    it('testing cancelSellOrder', async function () {
        //#14 order partly done
        account = accounts[2].account
        await usdt.write.approve([pair.address, viem.parseUnits('1000', 6)], { account })
        await pair.write.takeSellOrder([viem.parseUnits('10', 6), 0n], { account })

        // expect(await weth.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('1.2', 18))
        // expect(await usdt.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('941.92', 6))
        // expect(await weth.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('0.1', 18))
        // expect(await usdt.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('758', 6))

        account = accounts[1].account
        await pair.write.cancelSellOrder([8n], { account })
        await pair.write.cancelSellOrder([9n], { account })

        account = accounts[3].account
        await pair.write.cancelSellOrder([14n], { account })
        await pair.write.cancelSellOrder([13n], { account })

        // expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('995.869', 18))
        // expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('300', 6))
        // expect(await weth.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('0.9', 18))
        // expect(await usdt.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('758', 6))

        let sellOrders = await service.read.getSellList([pair.address, 0, 7n])

        expect(sellOrders[0].orderId).to.equal(11)
        expect(sellOrders[1].orderId).to.equal(10)
        expect(sellOrders[2].orderId).to.equal(12)

        await print()
    })


    it('testing takeSellOrder', async function () {
        account = accounts[2].account
        await expect(pair.write.takeSellOrder([viem.parseUnits('15', 6), viem.parseUnits('0.26', 18)], { account })).to.be.rejected

        await pair.write.takeSellOrder([viem.parseUnits('15', 6), viem.parseUnits('0.25', 18)], { account })

        let sellOrders = await service.read.getSellList([pair.address, 0, 3n])
        expect(sellOrders[0].orderId).to.equal(11)
        // expect(sellOrders[0].amountInUsed).to.equal(viem.parseUnits('0.25', 18))

        await pair.write.takeSellOrder([viem.parseUnits('100', 6), 0n], { account })
        sellOrders = await service.read.getSellList([pair.address, 0, 3n])
        expect(sellOrders[0].orderId).to.equal(10)
        // expect(sellOrders[0].amountInUsed).to.equal(viem.parseUnits('0.425', 18))

        await pair.write.takeSellOrder([viem.parseUnits('300', 6), 0n], { account })
        sellOrders = await service.read.getSellList([pair.address, 0, 3n])
        expect(sellOrders[0].orderId).to.equal(0)

        await print()
    })


    it('sell end', async function () {
        expect(await pair.read.topBuyOrderId()).to.equal(0)

        //end balances
        // expect(await weth.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0.031', 18))
        // expect(await usdt.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('3.48', 6))

        // expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('995.869', 18))
        // expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('500', 6))

        // expect(await weth.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('3.2', 18))
        // expect(await usdt.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('598.52', 6))

        // expect(await weth.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('0.9', 18))
        // expect(await usdt.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('898', 6))

        // expect(await weth.read.balanceOf([pair.address])).to.equal(viem.parseUnits('0', 18))
        // expect(await usdt.read.balanceOf([pair.address])).to.equal(viem.parseUnits('0', 6))

        //done orders
        // expect(await service.read.getOrder([pair.address, 8n])).to.deep.equal({
        //     orderId: 8,
        //     owner: viem.getAddress(accounts[1].account.address),
        //     amountIn: 1000000000000000000n,
        //     amountOut: 100000000n,
        //     amountInUsed: 0n,
        //     isDone: true
        // })
        // expect(await service.read.getOrder([pair.address, 9n])).to.deep.equal({
        //     orderId: 9,
        //     owner: viem.getAddress(accounts[1].account.address),
        //     amountIn: 1000000000000000000n,
        //     amountOut: 50000000n,
        //     amountInUsed: 0n,
        //     isDone: true
        // })
        // expect(await service.read.getOrder([pair.address, 10n])).to.deep.equal({
        //     orderId: 10,
        //     owner: viem.getAddress(accounts[1].account.address),
        //     amountIn: 1000000000000000000n,
        //     amountOut: 200000000n,
        //     amountInUsed: 1000000000000000000n,
        //     isDone: true
        // })
        // expect(await service.read.getOrder([pair.address, 11n])).to.deep.equal({
        //     orderId: 11,
        //     owner: viem.getAddress(accounts[3].account.address),
        //     amountIn: 500000000000000000n,
        //     amountOut: 30000000n,
        //     amountInUsed: 500000000000000000n,
        //     isDone: true
        // })
        // expect(await service.read.getOrder([pair.address, 12n])).to.deep.equal({
        //     orderId: 12,
        //     owner: viem.getAddress(accounts[3].account.address),
        //     amountIn: 500000000000000000n,
        //     amountOut: 110000000n,
        //     amountInUsed: 500000000000000000n,
        //     isDone: true
        // })
        // expect(await service.read.getOrder([pair.address, 13n])).to.deep.equal({
        //     orderId: 13,
        //     owner: viem.getAddress(accounts[3].account.address),
        //     amountIn: 500000000000000000n,
        //     amountOut: 60000000n,
        //     amountInUsed: 0n,
        //     isDone: true
        // })
        // expect(await service.read.getOrder([pair.address, 14n])).to.deep.equal({
        //     orderId: 14,
        //     owner: viem.getAddress(accounts[3].account.address),
        //     amountIn: 500000000000000000n,
        //     amountOut: 20000000n,
        //     amountInUsed: 200000000000000000n,
        //     isDone: true
        // })
    })


    async function print() {
        for (let i = 0; i <= 3; i++) {
            console.log('account' + i + ' weth:',
                viem.formatUnits(
                    await weth.read.balanceOf([accounts[i].account.address]),
                    await weth.read.decimals()
                ),
                'usdt:',
                viem.formatUnits(
                    await usdt.read.balanceOf([accounts[i].account.address]),
                    await usdt.read.decimals()
                )
            )
        }

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