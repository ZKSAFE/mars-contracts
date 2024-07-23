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
        await usdt.write.mint([accounts[2].account.address, viem.parseUnits('2000', 6)])

        help = await hre.viem.deployContract('MarsHelp', [])
        console.log('MarsHelp deployed:', help.address)

        pair = await hre.viem.deployContract('MarsPair', [weth.address, usdt.address, 100])
        console.log('pair deployed:', pair.address)
    })


    it('testing makeBuyOrder', async function () {
        account = accounts[2].account
        await usdt.write.approve([help.address, viem.parseUnits('1000', 6)], { account })

        await help.write.makeBuyOrder([pair.address, viem.parseUnits('100', 6), viem.parseUnits('1', 18)], { account }) //#1
        await help.write.makeBuyOrder([pair.address, viem.parseUnits('200', 6), viem.parseUnits('1', 18)], { account }) //#2
        await help.write.makeBuyOrder([pair.address, viem.parseUnits('150', 6), viem.parseUnits('1', 18)], { account }) //#3
        await help.write.makeBuyOrder([pair.address, viem.parseUnits('50', 6), viem.parseUnits('1', 18)], { account }) //#4

        await print()
    })


    it('testing takeBuyOrder: auto make sell order', async function () {
        account = accounts[1].account
        await weth.write.approve([help.address, viem.parseUnits('3.03', 18)], { account })

        await help.write.takeBuyOrder([pair.address, viem.parseUnits('3', 18), viem.parseUnits('330', 6)], { account }) //#5

        await print()
    })


    it('testing makeSellOrder', async function () {
        account = accounts[1].account
        await weth.write.approve([help.address, viem.parseUnits('1000', 18)], { account })

        await help.write.makeSellOrder([pair.address, viem.parseUnits('1', 18), viem.parseUnits('120', 6)], { account }) //#6
        await help.write.makeSellOrder([pair.address, viem.parseUnits('1', 18), viem.parseUnits('100', 6)], { account }) //#7
        await help.write.makeSellOrder([pair.address, viem.parseUnits('1', 18), viem.parseUnits('90', 6)], { account }) //#8

        let topSellOrderId = await pair.read.topSellOrderId()
        let sellOrders = await help.read.getSellList([pair.address, topSellOrderId, 4n])
        // console.log(sellOrders)

        await print()
    })


    it('testing takeSellOrder: auto make buy order', async function () {
        account = accounts[2].account
        await usdt.write.approve([help.address, viem.parseUnits('303', 6)], { account })

        await help.write.takeSellOrder([pair.address, viem.parseUnits('300', 6), viem.parseUnits('3', 18)], { account }) //#9

        await print()
    })


    it('testing takeBuyOrder2: take all', async function () {
        account = accounts[1].account
        await weth.write.approve([help.address, viem.parseUnits('1000', 18)], { account })

        await help.write.takeBuyOrder2([pair.address, viem.parseUnits('10', 18), 1n], { account })

        await print()
    })


    it('testing takeSellOrder2: take all', async function () {
        account = accounts[2].account
        await usdt.write.approve([help.address, viem.parseUnits('1100', 6)], { account })

        await help.write.takeSellOrder2([pair.address, viem.parseUnits('1000', 6), 1n], { account })

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