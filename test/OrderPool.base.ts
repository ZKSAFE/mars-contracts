import hre from 'hardhat'
import * as viem from 'viem'


describe('OrderPool base test', function () {

    let accounts:any
    let publicClient:any
    let token:any
    let usdt:any
    let orderPool:any

    before(async function () {
        accounts = await hre.viem.getWalletClients()
        publicClient = await hre.viem.getPublicClient()
        console.log('account0:', accounts[0].account.address)
    })
    

    it('testing WETH/USDT', async function () {
        token = await hre.viem.deployContract('MockERC20', ['TEST WETH', 'WETH'])
        console.log('token deployed:', token.address)
        await token.write.mint([accounts[0].account.address, viem.parseUnits('1000', 18)])
        await token.write.mint([accounts[1].account.address, viem.parseUnits('1000', 18)])
        
        usdt = await hre.viem.deployContract('MockERC20', ['TEST USDT', 'USDT'])
        console.log('usdt deployed:', usdt.address)
        await usdt.write.setDecimals([6])
        await usdt.write.mint([accounts[0].account.address, viem.parseUnits('1000', 6)])
        await usdt.write.mint([accounts[1].account.address, viem.parseUnits('1000', 6)])

        orderPool = await hre.viem.deployContract('OrderPool', [token.address, usdt.address])
        console.log('orderPool deployed:', orderPool.address)
    

        //makeBuyOrder
        await usdt.write.approve([orderPool.address, viem.parseUnits('1000', 6)])
        await orderPool.write.makeBuyOrder([viem.parseUnits('100', 6), viem.parseUnits('1', 18), 0n])
        await orderPool.write.makeBuyOrder([viem.parseUnits('200', 6), viem.parseUnits('1', 18), 0n])
        await orderPool.write.makeBuyOrder([viem.parseUnits('300', 6), viem.parseUnits('1', 18), 0n])

        let topBuyOrderId = await orderPool.read.topBuyOrderId()
        console.log(await orderPool.read.getBuyOrders([topBuyOrderId, 3n]))

        await print()
    

        //takeBuyOrder
        await token.write.approve([orderPool.address, viem.parseUnits('3', 18)], { account: accounts[1].account })
        await orderPool.write.takeBuyOrder([viem.parseUnits('0.8', 18), 0n], { account: accounts[1].account })
        await print()
        await orderPool.write.takeBuyOrder([viem.parseUnits('0.8', 18), 0n], { account: accounts[1].account })
        await print()
        await orderPool.write.takeBuyOrder([viem.parseUnits('0.8', 18), 0n], { account: accounts[1].account })
        await print()

        topBuyOrderId = await orderPool.read.topBuyOrderId()
        console.log(await orderPool.read.getBuyOrders([topBuyOrderId, 3n]))
    

        //cancelBuyOrder
        await orderPool.write.cancelBuyOrder([1n])

        topBuyOrderId = await orderPool.read.topBuyOrderId()
        console.log(await orderPool.read.getBuyOrders([topBuyOrderId, 1n]))

        await print()
    })

    it('testing PEPE/USDT', async function () {
        token = await hre.viem.deployContract('MockERC20', ['TEST PEPE', 'PEPE'])
        console.log('token deployed:', token.address)
        await token.write.mint([accounts[0].account.address, viem.parseUnits('100000000000000000', 18)])
        await token.write.mint([accounts[1].account.address, viem.parseUnits('100000000000000000', 18)])
        
        usdt = await hre.viem.deployContract('MockERC20', ['TEST USDT', 'USDT'])
        console.log('usdt deployed:', usdt.address)
        await usdt.write.setDecimals([6])
        await usdt.write.mint([accounts[0].account.address, viem.parseUnits('1000', 6)])
        await usdt.write.mint([accounts[1].account.address, viem.parseUnits('1000', 6)])

        orderPool = await hre.viem.deployContract('OrderPool', [token.address, usdt.address])
        console.log('orderPool deployed:', orderPool.address)
    

        //makeBuyOrder
        await usdt.write.approve([orderPool.address, viem.parseUnits('1000', 6)])
        await orderPool.write.makeBuyOrder([viem.parseUnits('1', 6), viem.parseUnits('10000000000000000', 18), 0n])
        await orderPool.write.makeBuyOrder([viem.parseUnits('2', 6), viem.parseUnits('10000000000000000', 18), 0n])
        await orderPool.write.makeBuyOrder([viem.parseUnits('3', 6), viem.parseUnits('10000000000000000', 18), 0n])

        let topBuyOrderId = await orderPool.read.topBuyOrderId()
        console.log('getBuyOrders:', await orderPool.read.getBuyOrders([topBuyOrderId, 3n]))

        await print()
    

        //takeBuyOrder
        await token.write.approve([orderPool.address, viem.parseUnits('100000000000000000', 18)], { account: accounts[1].account })
        await orderPool.write.takeBuyOrder([viem.parseUnits('8000000000000000', 18), 0n], { account: accounts[1].account })
        await print()
        await orderPool.write.takeBuyOrder([viem.parseUnits('8000000000000000', 18), 0n], { account: accounts[1].account })
        await print()
        await orderPool.write.takeBuyOrder([viem.parseUnits('8000000000000000', 18), 0n], { account: accounts[1].account })
        await print()

        topBuyOrderId = await orderPool.read.topBuyOrderId()
        console.log(await orderPool.read.getBuyOrders([topBuyOrderId, 3n]))
    

        //cancelBuyOrder
        await orderPool.write.cancelBuyOrder([1n])

        topBuyOrderId = await orderPool.read.topBuyOrderId()
        console.log(await orderPool.read.getBuyOrders([topBuyOrderId, 1n]))

        await print()
    })


    
    async function print() {
        console.log('account0 token:', 
            viem.formatUnits(
                await token.read.balanceOf([accounts[0].account.address]), 
                await token.read.decimals()
            ), 
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([accounts[0].account.address]),
                await usdt.read.decimals()
            )
        )

        console.log('account1 token:', 
            viem.formatUnits(
                await token.read.balanceOf([accounts[1].account.address]), 
                await token.read.decimals()
            ), 
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([accounts[1].account.address]), 
                await usdt.read.decimals()
            )
        )

        console.log('pool token:', 
            viem.formatUnits(
                await token.read.balanceOf([orderPool.address]), 
                await token.read.decimals()
            ), 
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([orderPool.address]), 
                await usdt.read.decimals()
            )
        )
    }

})