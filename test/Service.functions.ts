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
        await usdt.write.mint([accounts[2].account.address, viem.parseUnits('2000', 6)])

        service = await hre.viem.deployContract('MarsService', [])
        console.log('MarsService deployed:', service.address)

        pair = await hre.viem.deployContract('MarsPair', [weth.address, usdt.address, 100, accounts[0].account.address])
        console.log('pair deployed:', pair.address)
    })


    it('testing makeBuyOrder', async function () {
        account = accounts[2].account
        await usdt.write.approve([service.address, viem.parseUnits('1000', 6)], { account })

        await service.write.makeBuyOrder([pair.address, viem.parseUnits('100', 6), viem.parseUnits('1', 18), 0], { account })
        await service.write.makeBuyOrder([pair.address, viem.parseUnits('200', 6), viem.parseUnits('1', 18), 0], { account })
        await service.write.makeBuyOrder([pair.address, viem.parseUnits('150', 6), viem.parseUnits('1', 18), 0], { account })
        await service.write.makeBuyOrder([pair.address, viem.parseUnits('50', 6), viem.parseUnits('1', 18), 0], { account })
        await service.write.makeBuyOrder([pair.address, viem.parseUnits('100', 6), viem.parseUnits('1', 18), 0], { account })

        await print()
    })


    it('testing takeBuyOrder: auto make sell order', async function () {
        account = accounts[1].account
        await weth.write.approve([service.address, viem.parseUnits('3.03', 18)], { account })

        await service.write.takeBuyOrder([pair.address, viem.parseUnits('3', 18), viem.parseUnits('330', 6)], { account })

        await print()
    })


    it('testing takeBuyOrder2: the left give back', async function () {
        account = accounts[1].account
        await weth.write.approve([service.address, viem.parseUnits('1000', 18)], { account })

        await service.write.takeBuyOrder2([pair.address, viem.parseUnits('3', 18), viem.parseUnits('300', 6)], { account })

        await print()
    })


    it('testing makeSellOrder', async function () {
        account = accounts[1].account
        await weth.write.approve([service.address, viem.parseUnits('1000', 18)], { account })

        await service.write.makeSellOrder([pair.address, viem.parseUnits('1', 18), viem.parseUnits('120', 6), 0], { account })
        await service.write.makeSellOrder([pair.address, viem.parseUnits('1', 18), viem.parseUnits('100', 6), 0], { account })
        await service.write.makeSellOrder([pair.address, viem.parseUnits('1', 18), viem.parseUnits('40', 6), 0], { account })
        await service.write.makeSellOrder([pair.address, viem.parseUnits('1', 18), viem.parseUnits('110', 6), 0], { account })

        let topSellOrderId = await pair.read.topSellOrderId()
        let sellOrders = await service.read.getSellList([pair.address, topSellOrderId, 4n])
        // console.log(sellOrders)

        await print()
    })


    it('testing takeSellOrder: auto make buy order', async function () {
        account = accounts[2].account
        await usdt.write.approve([service.address, viem.parseUnits('303', 6)], { account })

        await service.write.takeSellOrder([pair.address, viem.parseUnits('300', 6), viem.parseUnits('3', 18)], { account })

        await print()
    })


    it('testing takeSellOrder2: the left give back', async function () {
        account = accounts[2].account
        await usdt.write.approve([service.address, viem.parseUnits('1100', 6)], { account })

        await service.write.takeSellOrder2([pair.address, viem.parseUnits('330', 6), viem.parseUnits('3', 18)], { account })

        await print()
    })


    it('testing takeBuyOrder2: take all', async function () {
        account = accounts[1].account
        await weth.write.approve([service.address, viem.parseUnits('1000', 18)], { account })

        await service.write.takeBuyOrder2([pair.address, viem.parseUnits('10', 18), 1n], { account })

        await print()
    })


    it('testing takeSellOrder2: take all', async function () {
        account = accounts[2].account
        await usdt.write.approve([service.address, viem.parseUnits('1100', 6)], { account })

        await service.write.takeSellOrder2([pair.address, viem.parseUnits('200', 6), 1n], { account })

        await print()
    })


    async function print() {
        for (let i = 0; i <= 2; i++) {
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