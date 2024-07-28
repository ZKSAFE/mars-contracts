import hre from 'hardhat'
import * as viem from 'viem'
import { expect } from "chai"


describe('Service list test', function () {

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

        service = await hre.viem.deployContract('MarsService', [])
        console.log('MarsService deployed:', service.address)

        pair = await hre.viem.deployContract('MarsPair', [weth.address, usdt.address, 100])
        console.log('pair deployed:', pair.address)
    })


    it('testing makeBuyOrder', async function () {
        account = accounts[2].account
        await usdt.write.approve([service.address, viem.parseUnits('1000', 6)], { account })

        for (let i = 0; i < 100; i++) {
            let args = [pair.address, viem.parseUnits((10  * Math.random()).toString(), 6), viem.parseUnits('1', 18), 0]
            let gas = await publicClient.estimateContractGas({
                address: service.address,
                abi: service.abi,
                functionName: 'makeBuyOrder',
                args: args,
                account
            })
            console.log('estimateContractGas:', gas)

            await service.write.makeBuyOrder(args, { account }) 
        }

        let buyOrders = await service.read.getBuyList([pair.address, 0, 100n])

        let minAmountIn = Number.MAX_SAFE_INTEGER
        for (let order of buyOrders) {
            // console.log(order.amountIn)
            expect(Number(order.amountIn)).to.lessThan(minAmountIn)
            minAmountIn = Number(order.amountIn)
        }

    })


    it('testing makeSellOrder', async function () {
        account = accounts[1].account
        await weth.write.approve([service.address, viem.parseUnits('1000', 18)], { account })

        for (let i = 0; i < 100; i++) {
            let args = [pair.address, viem.parseUnits('1', 18), viem.parseUnits((10  * Math.random()).toString(), 6), 0]
            let gas = await publicClient.estimateContractGas({
                address: service.address,
                abi: service.abi,
                functionName: 'makeSellOrder',
                args: args,
                account
            })
            console.log('estimateContractGas:', gas)

            await service.write.makeSellOrder(args, { account }) 
        }

        let sellOrders = await service.read.getSellList([pair.address, 0, 100n])

        let maxAmountOut = 0
        for (let order of sellOrders) {
            // console.log(order.amountOut)
            expect(Number(order.amountOut)).to.be.above(maxAmountOut)
            maxAmountOut = Number(order.amountOut)
        }
    })


    it('testing getUserOrders', async function () {
        let orders = await service.read.getUserOrders([accounts[1].account.address, 0, 5])
        for (let order of orders) {
            console.log(order)
        }
    })

})