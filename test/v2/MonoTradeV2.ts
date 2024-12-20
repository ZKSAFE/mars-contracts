import hre from 'hardhat'
import * as viem from 'viem'


describe('Trade gas test', function () {

    let accounts:any
    let publicClient:any
    let weth:any
    let usdt:any
    let trade:any

    before(async function () {
        accounts = await hre.viem.getWalletClients()
        publicClient = await hre.viem.getPublicClient()
        console.log('account0:', accounts[0].account.address)
    })
    

    it('deploy', async function () {
        weth = await hre.viem.deployContract('MockERC20', ['TEST WETH', 'WETH'])
        console.log('weth deployed:', weth.address)
        await weth.write.mint([accounts[0].account.address, viem.parseUnits('1000', 18)])
        await weth.write.mint([accounts[1].account.address, viem.parseUnits('1000', 18)])
        
        usdt = await hre.viem.deployContract('MockERC20', ['TEST USDT', 'USDT'])
        console.log('usdt deployed:', usdt.address)
        await usdt.write.setDecimals([6])
        await usdt.write.mint([accounts[0].account.address, viem.parseUnits('1000', 6)])
        await usdt.write.mint([accounts[1].account.address, viem.parseUnits('1000', 6)])

        trade = await hre.viem.deployContract('MonoTradeV2', [weth.address, usdt.address, 100])
        console.log('trade deployed:', trade.address)
    })
    
    // it('testing 6 decimals', async function () {
    //     let decimals = 2
    //     let n = viem.parseUnits('12345678901234.1234560', decimals)
    //     console.log(n, n.toString(16))
    
    //     let jsn = to6Decimals(n, decimals)
    //     console.log(jsn, jsn.toString(16))
    
    //     let soln = await trade.read.to6Decimals([n, decimals])
    //     console.log(soln, soln.toString(16))
    
    //     let jsn2 = from6Decimals(jsn, decimals)
    //     console.log(jsn2, jsn2.toString(16))
    
    //     let soln2 = await trade.read.from6Decimals([soln, decimals])
    //     console.log(soln2, soln2.toString(16))
    // })

    it('testing WETH/USDT', async function () {
        //makeBuyOrder
        await usdt.write.approve([trade.address, viem.parseUnits('1000', 6)])
        for (let i=0; i<100; i++) {
            await trade.write.makeOrder([viem.parseUnits((1 + i/10).toString(), 6), viem.parseUnits('0.1', 18), 0n])
        }
        await print()


        //takeBuyOrder
        await weth.write.approve([trade.address, viem.parseUnits('1000', 18)], { account: accounts[1].account })

        let gas = await publicClient.estimateContractGas({
            address: trade.address,
            abi: trade.abi,
            functionName: 'takeOrder',
            args: [viem.parseUnits('10', 18), 0n],
            account: accounts[1].account
        })
        console.log('estimateContractGas:', gas) //1884661n 1948278n

        await trade.write.takeOrder([viem.parseUnits('10', 18), 0n], { account: accounts[1].account })

        await print()
    })


    async function print() {
        console.log('account0 weth:', 
            viem.formatUnits(
                await weth.read.balanceOf([accounts[0].account.address]), 
                await weth.read.decimals()
            ), 
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([accounts[0].account.address]),
                await usdt.read.decimals()
            )
        )

        console.log('account1 weth:', 
            viem.formatUnits(
                await weth.read.balanceOf([accounts[1].account.address]), 
                await weth.read.decimals()
            ), 
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([accounts[1].account.address]), 
                await usdt.read.decimals()
            )
        )

        console.log('trade weth:', 
            viem.formatUnits(
                await weth.read.balanceOf([trade.address]), 
                await weth.read.decimals()
            ), 
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([trade.address]), 
                await usdt.read.decimals()
            )
        )
    }

    function to6Decimals(amount:bigint, decimals:number) {
        if (decimals <= 6) {
            return amount
        } else {
            return amount / (10n ** (BigInt(decimals) - 6n))
        }
    }

    function from6Decimals(amountDec:bigint, decimals:number) {
        if (decimals <= 6) {
            return amountDec;
        } else {
            return amountDec * 10n ** (BigInt(decimals) - 6n)
        }
    }
})