import hre from 'hardhat'
import * as viem from 'viem'
import { expect } from "chai"


describe('Help list test', function () {

    let accounts: any
    let account: any
    let publicClient: any
    let weth: any
    let usdt: any
    let help: any
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

        help = await hre.viem.deployContract('MarsHelp', [])
        console.log('MarsHelp deployed:', help.address)

        pair = await hre.viem.deployContract('MarsPair', [weth.address, usdt.address, 100])
        console.log('pair deployed:', pair.address)
    })


    it('testing makeBuyOrder', async function () {
        account = accounts[2].account
        await usdt.write.approve([help.address, viem.parseUnits('1000', 6)], { account })

        for (let i = 0; i < 100; i++) {
            let args = [pair.address, viem.parseUnits((10  * Math.random()).toString(), 6), viem.parseUnits('1', 18)]
            let gas = await publicClient.estimateContractGas({
                address: help.address,
                abi: help.abi,
                functionName: 'makeBuyOrder',
                args: args,
                account
            })
            console.log('estimateContractGas:', gas)

            await help.write.makeBuyOrder(args, { account }) 
        }

        let topBuyOrderId = await pair.read.topBuyOrderId()
        let buyOrders = await help.read.getBuyList([pair.address, topBuyOrderId, 100n])

        let minAmountIn = Number.MAX_SAFE_INTEGER
        for (let order of buyOrders) {
            // console.log(order.amountIn)
            expect(Number(order.amountIn)).to.lessThan(minAmountIn)
            minAmountIn = Number(order.amountIn)
        }
    })


    it('testing makeSellOrder', async function () {
        account = accounts[1].account
        await weth.write.approve([help.address, viem.parseUnits('1000', 18)], { account })

        for (let i = 0; i < 100; i++) {
            let args = [pair.address, viem.parseUnits('1', 18), viem.parseUnits((10  * Math.random()).toString(), 6)]
            let gas = await publicClient.estimateContractGas({
                address: help.address,
                abi: help.abi,
                functionName: 'makeSellOrder',
                args: args,
                account
            })
            console.log('estimateContractGas:', gas)

            await help.write.makeSellOrder(args, { account }) 
        }

        let topSellOrderId = await pair.read.topSellOrderId()
        let sellOrders = await help.read.getSellList([pair.address, topSellOrderId, 100n])

        let maxAmountOut = 0
        for (let order of sellOrders) {
            // console.log(order.amountOut)
            expect(Number(order.amountOut)).to.be.above(maxAmountOut)
            maxAmountOut = Number(order.amountOut)
        }
    })

})