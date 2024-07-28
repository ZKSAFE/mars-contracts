import hre from 'hardhat'
import * as viem from 'viem'


describe('Pair gas test', function () {

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
        for (let i=0; i<100; i++) {
            await pair.write.makeBuyOrder([viem.parseUnits((1 + i/10).toString(), 6), viem.parseUnits('0.1', 18), 0n])
        }
        await print()
    

        //takeBuyOrder
        await token.write.approve([pair.address, viem.parseUnits('1000', 18)], { account: accounts[1].account })

        let gas = await publicClient.estimateContractGas({
            address: pair.address,
            abi: pair.abi,
            functionName: 'takeBuyOrder',
            args: [viem.parseUnits('10', 18), 0n],
            account: accounts[1].account
        })
        console.log('estimateContractGas:', gas) //10:702954n  100:6253505n  optimiz for single slot:1840383n

        await pair.write.takeBuyOrder([viem.parseUnits('10', 18), 0n], { account: accounts[1].account })
        
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