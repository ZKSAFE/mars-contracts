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

        let topOrderId = await trade_weth_usdt.read.topOrderId()
        let orders = await service.read.getOrderList([trade_weth_usdt.address, topOrderId, 5])
        console.log(orders)

        expect(orders[0].orderId).to.equal(2) //200
        expect(orders[1].orderId).to.equal(3) //150
        expect(orders[2].orderId).to.equal(1) //100
        expect(orders[3].orderId).to.equal(5) //100
        expect(orders[4].orderId).to.equal(4) //50

        await print()
    })


    it('testing takeBuyOrder: auto make sell order', async function () {
        account = accounts[1].account
        await weth.write.approve([service.address, viem.parseUnits('1000', 18)], { account })

        await service.write.takeOrder([trade_weth_usdt.address, viem.parseUnits('3', 18), viem.parseUnits('330', 6)], { account })

        expect(await weth.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0.02', 18))
        expect(await usdt.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0', 6))
        expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('996.98', 18))
        expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('350', 6))
        expect(await weth.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('2', 18))
        expect(await usdt.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('1400', 6))

        expect(await weth.read.balanceOf([trade_weth_usdt.address])).to.equal(viem.parseUnits('0', 18))
        expect(await usdt.read.balanceOf([trade_weth_usdt.address])).to.equal(viem.parseUnits('250', 6))
        expect(await weth.read.balanceOf([trade_usdt_weth.address])).to.equal(viem.parseUnits('1', 18))
        expect(await usdt.read.balanceOf([trade_usdt_weth.address])).to.equal(viem.parseUnits('0', 6))

        let topOrderId = await trade_usdt_weth.read.topOrderId()
        let orders = await service.read.getOrderList([trade_usdt_weth.address, topOrderId, 1])
        // console.log(orders)

        //auto make sell order
        expect(orders[0].amountOut).to.equal(viem.parseUnits('110', 6))

        await print()
    })


    it('testing takeBuyOrder2: the left give back', async function () {
        account = accounts[1].account
        await weth.write.approve([service.address, viem.parseUnits('1000', 18)], { account })

        await service.write.takeOrder2([trade_weth_usdt.address, viem.parseUnits('3', 18), viem.parseUnits('300', 6)], { account })

        expect(await weth.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0.04', 18))
        expect(await usdt.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0', 6))
        expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('994.96', 18))
        expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('550', 6))
        expect(await weth.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('4', 18))
        expect(await usdt.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('1400', 6))

        expect(await weth.read.balanceOf([trade_weth_usdt.address])).to.equal(viem.parseUnits('0', 18))
        expect(await usdt.read.balanceOf([trade_weth_usdt.address])).to.equal(viem.parseUnits('50', 6))
        expect(await weth.read.balanceOf([trade_usdt_weth.address])).to.equal(viem.parseUnits('1', 18))
        expect(await usdt.read.balanceOf([trade_usdt_weth.address])).to.equal(viem.parseUnits('0', 6))

        await print()
    })


    it('testing makeSellOrder', async function () {
        account = accounts[1].account
        await weth.write.approve([service.address, viem.parseUnits('1000', 18)], { account })

        await service.write.makeOrder([trade_usdt_weth.address, viem.parseUnits('1', 18), viem.parseUnits('120', 6), 0], { account }) //#2
        await service.write.makeOrder([trade_usdt_weth.address, viem.parseUnits('1', 18), viem.parseUnits('100', 6), 0], { account }) //#3
        await service.write.makeOrder([trade_usdt_weth.address, viem.parseUnits('1', 18), viem.parseUnits('40', 6), 0], { account }) //#4
        await service.write.makeOrder([trade_usdt_weth.address, viem.parseUnits('1', 18), viem.parseUnits('110', 6), 0], { account }) //#5
        
        let topOrderId = await trade_usdt_weth.read.topOrderId()
        let orders = await service.read.getOrderList([trade_usdt_weth.address, topOrderId, 5])
        // console.log(orders)

        expect(orders[0].orderId).to.equal(4) //40
        expect(orders[1].orderId).to.equal(3) //100
        expect(orders[2].orderId).to.equal(1) //110
        expect(orders[3].orderId).to.equal(5) //110
        expect(orders[4].orderId).to.equal(2) //120

        await print()
    })


    it('testing takeSellOrder: auto make buy order', async function () {
        account = accounts[2].account
        await usdt.write.approve([service.address, viem.parseUnits('303', 6)], { account })

        await service.write.takeOrder([trade_usdt_weth.address, viem.parseUnits('300', 6), viem.parseUnits('3', 18)], { account })

        expect(await weth.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0.04', 18))
        expect(await usdt.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('1.4', 6))
        expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('990.96', 18))
        expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('690', 6))
        expect(await weth.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('6', 18))
        expect(await usdt.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('1098.6', 6))

        expect(await weth.read.balanceOf([trade_weth_usdt.address])).to.equal(viem.parseUnits('0', 18))
        expect(await usdt.read.balanceOf([trade_weth_usdt.address])).to.equal(viem.parseUnits('210', 6))
        expect(await weth.read.balanceOf([trade_usdt_weth.address])).to.equal(viem.parseUnits('3', 18))
        expect(await usdt.read.balanceOf([trade_usdt_weth.address])).to.equal(viem.parseUnits('0', 6))

        let topOrderId = await trade_weth_usdt.read.topOrderId()
        let orders = await service.read.getOrderList([trade_weth_usdt.address, topOrderId, 5])
        // console.log(orders)

        //auto make buy order
        expect(orders[0].amountOut).to.equal(viem.parseUnits('1.6', 18))
        expect(orders[1].amountOut).to.equal(viem.parseUnits('1', 18))

        let userOeders = await service.read.getUserOrders([accounts[1].account.address, 0, 6])
        console.log(userOeders)

        await print()
    })


    it('testing takeSellOrder2: the left give back', async function () {
        account = accounts[2].account
        await usdt.write.approve([service.address, viem.parseUnits('1100', 6)], { account })

        await service.write.takeOrder2([trade_usdt_weth.address, viem.parseUnits('330', 6), viem.parseUnits('3', 18)], { account })

        expect(await weth.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0.04', 18))
        expect(await usdt.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('3.6', 6))
        expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('990.96', 18))
        expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('910', 6))
        expect(await weth.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('8', 18))
        expect(await usdt.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('876.4', 6))

        expect(await weth.read.balanceOf([trade_weth_usdt.address])).to.equal(viem.parseUnits('0', 18))
        expect(await usdt.read.balanceOf([trade_weth_usdt.address])).to.equal(viem.parseUnits('210', 6))
        expect(await weth.read.balanceOf([trade_usdt_weth.address])).to.equal(viem.parseUnits('1', 18))
        expect(await usdt.read.balanceOf([trade_usdt_weth.address])).to.equal(viem.parseUnits('0', 6))

        await print()
    })


    it('testing takeBuyOrder2: take all', async function () {
        account = accounts[1].account
        await weth.write.approve([service.address, viem.parseUnits('1000', 18)], { account })

        await service.write.takeOrder2([trade_weth_usdt.address, viem.parseUnits('10', 18), 1n], { account })

        expect(await weth.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0.066', 18))
        expect(await usdt.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('3.6', 6))
        expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('988.334', 18))
        expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('1120', 6))
        expect(await weth.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('10.6', 18))
        expect(await usdt.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('876.4', 6))

        expect(await weth.read.balanceOf([trade_weth_usdt.address])).to.equal(viem.parseUnits('0', 18))
        expect(await usdt.read.balanceOf([trade_weth_usdt.address])).to.equal(viem.parseUnits('0', 6))
        expect(await weth.read.balanceOf([trade_usdt_weth.address])).to.equal(viem.parseUnits('1', 18))
        expect(await usdt.read.balanceOf([trade_usdt_weth.address])).to.equal(viem.parseUnits('0', 6))

        await print()
    })


    it('testing takeSellOrder2: take all', async function () {
        account = accounts[2].account
        await usdt.write.approve([service.address, viem.parseUnits('1100', 6)], { account })

        await service.write.takeOrder2([trade_usdt_weth.address, viem.parseUnits('200', 6), 1n], { account })

        expect(await weth.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0.066', 18))
        expect(await usdt.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('4.8', 6))
        expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('988.334', 18))
        expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('1240', 6))
        expect(await weth.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('11.6', 18))
        expect(await usdt.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('755.2', 6))

        expect(await weth.read.balanceOf([trade_weth_usdt.address])).to.equal(viem.parseUnits('0', 18))
        expect(await usdt.read.balanceOf([trade_weth_usdt.address])).to.equal(viem.parseUnits('0', 6))
        expect(await weth.read.balanceOf([trade_usdt_weth.address])).to.equal(viem.parseUnits('0', 18))
        expect(await usdt.read.balanceOf([trade_usdt_weth.address])).to.equal(viem.parseUnits('0', 6))

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

        console.log('trade_weth_usdt weth:',
            viem.formatUnits(
                await weth.read.balanceOf([trade_weth_usdt.address]),
                await weth.read.decimals()
            ),
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([trade_weth_usdt.address]),
                await usdt.read.decimals()
            )
        )

        console.log('trade_usdt_weth weth:',
            viem.formatUnits(
                await weth.read.balanceOf([trade_usdt_weth.address]),
                await weth.read.decimals()
            ),
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([trade_usdt_weth.address]),
                await usdt.read.decimals()
            )
        )
    }

})