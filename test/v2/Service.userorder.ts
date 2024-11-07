import hre from 'hardhat'
import * as viem from 'viem'
import { expect } from "chai"
import { abi as tradeAbi } from '../../artifacts/contracts/v2/MonoTrade.sol/MonoTrade.json'


describe('Service functions test', function () {

    let accounts: any
    let account: any
    let publicClient: any
    let weth: any
    let usdt: any
    let service: any
    let trade_weth_usdt: any
    let trade_usdt_weth: any

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
        await usdt.write.mint([accounts[3].account.address, viem.parseUnits('2000', 6)])

        service = await hre.viem.deployContract('TradeService', [])
        console.log('service deployed:', service.address)

        await service.write.createPair([weth.address, usdt.address])
        console.log('service createPair done')

        trade_weth_usdt = viem.getContract({
            address: await service.read.getTrade([weth.address, usdt.address]),
            abi: tradeAbi,
            client: publicClient,
        })
        trade_usdt_weth = viem.getContract({
            address: await service.read.getTrade([usdt.address, weth.address]),
            abi: tradeAbi,
            client: publicClient,
        })
    })


    it('testing makeBuyOrder', async function () {
        account = accounts[2].account
        await usdt.write.approve([service.address, viem.parseUnits('1000', 6)], { account })

        await service.write.makeOrder([trade_weth_usdt.address, viem.parseUnits('100', 6), viem.parseUnits('1', 18), 0], { account }) //#1
        await service.write.makeOrder([trade_weth_usdt.address, viem.parseUnits('200', 6), viem.parseUnits('1', 18), 0], { account }) //#2
        await service.write.makeOrder([trade_weth_usdt.address, viem.parseUnits('150', 6), viem.parseUnits('1', 18), 0], { account }) //#3
        await service.write.makeOrder([trade_weth_usdt.address, viem.parseUnits('50', 6), viem.parseUnits('1', 18), 0], { account }) //#4
        await service.write.makeOrder([trade_weth_usdt.address, viem.parseUnits('100', 6), viem.parseUnits('1', 18), 0], { account }) //#5

        await print('account2:', accounts[2].account.address)
    })


    it('testing placeOrder: all taked', async function () {
        account = accounts[1].account
        await weth.write.approve([service.address, viem.parseUnits('1000', 18)], { account })

        await service.write.placeOrder([trade_weth_usdt.address, viem.parseUnits('1', 18), viem.parseUnits('1', 6)], { account })

        await print('account1:', accounts[1].account.address)
        await print('account2:', accounts[2].account.address)
    })


    it('testing placeOrder: auto make sell order', async function () {
        account = accounts[1].account
        await weth.write.approve([service.address, viem.parseUnits('1000', 18)], { account })

        await service.write.placeOrder([trade_weth_usdt.address, viem.parseUnits('2', 18), viem.parseUnits('220', 6)], { account })

        await print('account1:', accounts[1].account.address)
        await print('account2:', accounts[2].account.address)
    })


    it('testing takeOrder: the left give back', async function () {
        account = accounts[1].account
        await weth.write.approve([service.address, viem.parseUnits('1000', 18)], { account })

        await service.write.takeOrder([trade_weth_usdt.address, viem.parseUnits('3', 18), viem.parseUnits('300', 6)], { account })

        await print('account1:', accounts[1].account.address)
        await print('account2:', accounts[2].account.address)
    })

    async function print(str: string, user: any) {
        console.log(str,
            'weth:',
            viem.formatUnits(
                await weth.read.balanceOf([user]),
                await weth.read.decimals()
            ),
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([user]),
                await usdt.read.decimals()
            )
        )

        let orders = []
        let userOeders = await service.read.getUserOrders([user, 0, 5])
        for (let o of userOeders) {
            if (o.index > 0) {
                if (o.orderId == 0) {
                    console.log('index:', o.index, '吃单', '进:', o.token1In, '出:', o.token0Out, '完全成交')
                } else {
                    console.log('index:', o.index, '挂单', '进:', o.token1In, '出:', o.token0Out, '成交进度:', 100 * o.progress / 4294967295 + '%')
                }
                orders.push(o)
            }
        }
        // console.log(str, orders)
    }
})