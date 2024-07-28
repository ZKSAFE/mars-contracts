import hre from 'hardhat'
import * as viem from 'viem'


describe('Pair decimals test', function () {

    let accounts:any
    let publicClient:any
    let token:any
    let usdt:any
    let pair:any

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

        pair = await hre.viem.deployContract('MarsPair', [token.address, usdt.address, 100])
        console.log('pair deployed:', pair.address)
    

        //makeBuyOrder
        await usdt.write.approve([pair.address, viem.parseUnits('1000', 6)])
        await pair.write.makeBuyOrder([viem.parseUnits('100', 6), viem.parseUnits('1', 18), 0n])
        await pair.write.makeBuyOrder([viem.parseUnits('200', 6), viem.parseUnits('1', 18), 0n])
        await pair.write.makeBuyOrder([viem.parseUnits('300', 6), viem.parseUnits('1', 18), 0n])

        let topBuyOrderId = await pair.read.topBuyOrderId()

        await print()
    

        //takeBuyOrder
        await token.write.approve([pair.address, viem.parseUnits('3', 18)], { account: accounts[1].account })
        await pair.write.takeBuyOrder([viem.parseUnits('0.8', 18), 0n], { account: accounts[1].account })
        await print()
        await pair.write.takeBuyOrder([viem.parseUnits('0.8', 18), 0n], { account: accounts[1].account })
        await print()
        await pair.write.takeBuyOrder([viem.parseUnits('0.8', 18), 0n], { account: accounts[1].account })
        await print()

        topBuyOrderId = await pair.read.topBuyOrderId()
    

        //cancelBuyOrder
        await pair.write.cancelBuyOrder([1n])

        topBuyOrderId = await pair.read.topBuyOrderId()

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

        pair = await hre.viem.deployContract('MarsPair', [token.address, usdt.address, 100])
        console.log('pair deployed:', pair.address)
    

        //makeBuyOrder
        await usdt.write.approve([pair.address, viem.parseUnits('1000', 6)])
        await pair.write.makeBuyOrder([viem.parseUnits('1', 6), viem.parseUnits('1000000000000', 18), 0n])
        await pair.write.makeBuyOrder([viem.parseUnits('2', 6), viem.parseUnits('1000000000000', 18), 0n])
        await pair.write.makeBuyOrder([viem.parseUnits('3', 6), viem.parseUnits('1000000000000', 18), 0n])

        let topBuyOrderId = await pair.read.topBuyOrderId()

        await print()
    

        //takeBuyOrder
        await token.write.approve([pair.address, viem.parseUnits('100000000000000000', 18)], { account: accounts[1].account })
        await pair.write.takeBuyOrder([viem.parseUnits('800000000000', 18), 0n], { account: accounts[1].account })
        await print()
        await pair.write.takeBuyOrder([viem.parseUnits('800000000000', 18), 0n], { account: accounts[1].account })
        await print()
        await pair.write.takeBuyOrder([viem.parseUnits('800000000000', 18), 0n], { account: accounts[1].account })
        await print()

        topBuyOrderId = await pair.read.topBuyOrderId()
    

        //cancelBuyOrder
        await pair.write.cancelBuyOrder([1n])

        topBuyOrderId = await pair.read.topBuyOrderId()

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

        console.log('pair token:', 
            viem.formatUnits(
                await token.read.balanceOf([pair.address]), 
                await token.read.decimals()
            ), 
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([pair.address]), 
                await usdt.read.decimals()
            )
        )
    }

})