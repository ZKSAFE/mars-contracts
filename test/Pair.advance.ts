import hre from 'hardhat'
import * as viem from 'viem'
import { expect } from "chai"


describe('Pair advance test', function () {

    let accounts:any
    let publicClient:any
    let weth:any
    let usdt:any
    let pairFactory:any
    let pair:any

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

        pairFactory = await hre.viem.deployContract('PairFactory', [accounts[0].account.address])
        console.log('pairFactory deployed:', pairFactory.address)

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
        // #7
        // #2
        // #4
        // #1
        // #6
        // #3
        // #5

        let topBuyOrderId = await pair.read.topBuyOrderId()
        let buyOrders = await pairFactory.read.getBuyOrders([pair.address, topBuyOrderId, 7n])
        // console.log(buyOrders)
        
        expect(buyOrders[0].orderId).to.equal(7n)
        expect(buyOrders[1].orderId).to.equal(2n)
        expect(buyOrders[2].orderId).to.equal(4n)
        expect(buyOrders[3].orderId).to.equal(1n)
        expect(buyOrders[4].orderId).to.equal(6n)
        expect(buyOrders[5].orderId).to.equal(3n)
        expect(buyOrders[6].orderId).to.equal(5n)

        await print()
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