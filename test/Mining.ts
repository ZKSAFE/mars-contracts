import hre from 'hardhat'
import * as viem from 'viem'
import { abi as pairAbi } from '../artifacts/contracts/MarsPair.sol/MarsPair.json'
import { abi as factoryAbi } from '../artifacts/contracts/MarsFactory.sol/MarsFactory.json'
import { abi as marsAbi } from '../artifacts/contracts/MarsToken.sol/MarsToken.json'


describe('Mining test', function () {

    let accounts:any
    let account: any
    let publicClient:any
    let weth:any
    let usdt:any
    let mars:any
    let mining:any
    let factory:any
    let mars_usdt_pair:any
    let weth_usdt_pair:any

    before(async function () {
        accounts = await hre.viem.getWalletClients()
        publicClient = await hre.viem.getPublicClient()
        console.log('account0:', accounts[0].account.address)
    })
    

    it('deploy', async function () {
        weth = await hre.viem.deployContract('MockERC20', ['TEST WETH', 'WETH'])
        console.log('weth deployed:', weth.address)
        await weth.write.mint([accounts[1].account.address, viem.parseUnits('1000', 18)])
        await weth.write.mint([accounts[2].account.address, viem.parseUnits('1000', 18)])
        await weth.write.mint([accounts[3].account.address, viem.parseUnits('1000', 18)])
        
        usdt = await hre.viem.deployContract('MockERC20', ['TEST USDT', 'USDT'])
        console.log('usdt deployed:', usdt.address)
        await usdt.write.setDecimals([6])
        await usdt.write.mint([accounts[1].account.address, viem.parseUnits('1000', 6)])
        await usdt.write.mint([accounts[2].account.address, viem.parseUnits('1000', 6)])
        await usdt.write.mint([accounts[3].account.address, viem.parseUnits('1000', 6)])

        mining = await hre.viem.deployContract('MarsMining', [])
        console.log('MarsMining deployed:', mining.address)

        factory = viem.getContract({
            address: await mining.read.factory(),
            abi: factoryAbi,
            client: accounts[0],
        })

        mars = viem.getContract({
            address: await mining.read.mars(),
            abi: marsAbi,
            client: accounts[0],
        })
        await mars.write.mint([accounts[0].account.address, viem.parseUnits('1000', 18)])

        //create mars_usdt_pair
        let predictedAddr = await factory.read.computePairAddr([mars.address, usdt.address])
        mars_usdt_pair = viem.getContract({
            address: predictedAddr,
            abi: pairAbi,
            client: publicClient,
        })

        await factory.write.createPair([mars.address, usdt.address])
        console.log('createPair mars/usdt:', mars_usdt_pair.address)

        //makeSellOrder for mars_usdt_pair
        account = accounts[0].account
        await mars.write.approve([mars_usdt_pair.address, viem.parseUnits('1000', 18)], { account })
        await mars_usdt_pair.write.makeSellOrder([viem.parseUnits('1000', 18), viem.parseUnits('10', 6), 0n], { account }) 
    
        //create weth_usdt_pair
        predictedAddr = await factory.read.computePairAddr([weth.address, usdt.address])
        weth_usdt_pair = viem.getContract({
            address: predictedAddr,
            abi: pairAbi,
            client: publicClient,
        })

        await factory.write.createPair([weth.address, usdt.address])
        console.log('createPair weth/usdt:', weth_usdt_pair.address)
    })


    it('make orders', async function () {
        //makeBuyOrder
        account = accounts[1].account
        await usdt.write.approve([weth_usdt_pair.address, viem.parseUnits('1000', 6)], { account })
        await weth_usdt_pair.write.makeBuyOrder([viem.parseUnits('90', 6), viem.parseUnits('1', 18), 0n], { account })
        await weth_usdt_pair.write.makeBuyOrder([viem.parseUnits('100', 6), viem.parseUnits('1', 18), 0n], { account })
        
        //makeSellOrder
        account = accounts[2].account
        await weth.write.approve([weth_usdt_pair.address, viem.parseUnits('1000', 18)], { account })
        await weth_usdt_pair.write.makeSellOrder([viem.parseUnits('1', 18), viem.parseUnits('110', 6), 0n], { account })
        await weth_usdt_pair.write.makeSellOrder([viem.parseUnits('1', 18), viem.parseUnits('100', 6), 0n], { account })

        await print()
    })


    it('take orders', async function () {
        account = accounts[3].account
        //takeBuyOrder
        await weth.write.approve([weth_usdt_pair.address, viem.parseUnits('1000', 18)], { account })
        await weth_usdt_pair.write.takeBuyOrder([viem.parseUnits('1', 18), 0n], { account })
        console.log('takeBuyOrder:')
        await print()
        
        //takeSellOrder
        await usdt.write.approve([weth_usdt_pair.address, viem.parseUnits('1000', 6)], { account })
        await weth_usdt_pair.write.takeSellOrder([viem.parseUnits('100', 6), 0n], { account })
        console.log('takeSellOrder:')
        await print()
    })


    // it('testing miningFee', async function () {
    //     await mining.write.miningFee([pair.address, 7, true])
    //     console.log('miningFee from #7 order')
    //     await print()
        
    //     await mining.write.miningFee([pair.address, 2, true])
    //     console.log('miningFee from #2 order')
    //     await print()
    // })

    it('mining #2 order', async function () {
        let routers = [weth.address, usdt.address, mars.address]
        let routersBytes = viem.concat(routers)
        await mining.write.mining([weth_usdt_pair.address, 2, routersBytes])

        await print()
    })

    it('mining #4 order', async function () {
        let routers = [usdt.address, mars.address]
        let routersBytes = viem.concat(routers)
        await mining.write.mining([weth_usdt_pair.address, 4, routersBytes])

        await print()
    })


    async function print() {
        for (let i = 1; i <= 3; i++) {
            console.log('account' + i + ' weth:',
                viem.formatUnits(
                    await weth.read.balanceOf([accounts[i].account.address]),
                    await weth.read.decimals()
                ),
                'usdt:',
                viem.formatUnits(
                    await usdt.read.balanceOf([accounts[i].account.address]),
                    await usdt.read.decimals()
                ),
                'mars:',
                viem.formatUnits(
                    await mars.read.balanceOf([accounts[i].account.address]),
                    await mars.read.decimals()
                )
            )
        }

        console.log('pair weth:',
            viem.formatUnits(
                await weth.read.balanceOf([weth_usdt_pair.address]),
                await weth.read.decimals()
            ),
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([weth_usdt_pair.address]),
                await usdt.read.decimals()
            ),
            'mars:',
            viem.formatUnits(
                await mars.read.balanceOf([weth_usdt_pair.address]),
                await mars.read.decimals()
            )
        )

        console.log('mining weth:',
            viem.formatUnits(
                await weth.read.balanceOf([mining.address]),
                await weth.read.decimals()
            ),
            'usdt:',
            viem.formatUnits(
                await usdt.read.balanceOf([mining.address]),
                await usdt.read.decimals()
            ),
            'mars:',
            viem.formatUnits(
                await mars.read.balanceOf([mining.address]),
                await mars.read.decimals()
            )
        )
    }
})