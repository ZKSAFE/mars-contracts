import hre from 'hardhat'
import * as viem from 'viem'


describe('OrderPool gas test', function () {

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
        for (let i=0; i<100; i++) {
            await orderPool.write.makeBuyOrder([viem.parseUnits((1 + i/10).toString(), 6), viem.parseUnits('0.1', 18), 0n])
        }
        await print()
    

        //takeBuyOrder
        await token.write.approve([orderPool.address, viem.parseUnits('1000', 18)], { account: accounts[1].account })

        let gas = await publicClient.estimateContractGas({
            address: orderPool.address,
            abi: orderPool.abi,
            functionName: 'takeBuyOrder',
            args: [viem.parseUnits('10', 18), 0n],
            account: accounts[1].account
        })
        console.log('estimateContractGas:', gas) //10:719421  100:6444613

        await orderPool.write.takeBuyOrder([viem.parseUnits('10', 18), 0n], { account: accounts[1].account })
        
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