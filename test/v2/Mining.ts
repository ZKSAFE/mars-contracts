import hre from 'hardhat'
import * as viem from 'viem'
import { expect } from "chai"
import { abi as tradeAbi } from '../../artifacts/contracts/v2/MonoTrade.sol/MonoTrade.json'
import { abi as serviceAbi } from '../../artifacts/contracts/v2/TradeService.sol/TradeService.json'
import { abi as marsAbi } from '../../artifacts/contracts/v2/Mars.sol/Mars.json'


describe('Mining test', function () {

    let accounts:any
    let account: any
    let publicClient:any
    let weth:any
    let usdt:any
    let mars:any
    let mining:any
    let service:any
    let mars_usdt:string
    let usdt_mars:string
    let weth_usdt:string
    let usdt_weth:string

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

        mining = await hre.viem.deployContract('Mining', [])
        console.log('Mining deployed:', mining.address)

        service = viem.getContract({
            address: await mining.read.service(),
            abi: serviceAbi,
            client: accounts[0],
        })

        mars = viem.getContract({
            address: await mining.read.mars(),
            abi: marsAbi,
            client: accounts[0],
        })
        await mars.write.mint([accounts[0].account.address, viem.parseUnits('1000', 18)])

        //create mars_usdt_pair

        await service.write.createPair([mars.address, usdt.address])
        mars_usdt = await service.read.getTrade([mars.address, usdt.address])
        usdt_mars = await service.read.getTrade([usdt.address, mars.address])
        console.log('mars_usdt:', mars_usdt)
        console.log('usdt_mars:', usdt_mars)

        //makeSellOrder for mars_usdt_pair
        account = accounts[0].account
        await mars.write.approve([service.address, viem.parseUnits('1000', 18)], { account })
        await service.write.makeOrder([usdt_mars, viem.parseUnits('1000', 18), viem.parseUnits('10', 6), 0], { account }) //#1
    
        //create weth_usdt_pair
        await service.write.createPair([weth.address, usdt.address])
        weth_usdt = await service.read.getTrade([weth.address, usdt.address])
        usdt_weth = await service.read.getTrade([usdt.address, weth.address])
        console.log('weth_usdt:', weth_usdt)
        console.log('usdt_weth:', usdt_weth)
    })


    it('make orders', async function () {
        //makeBuyOrder
        account = accounts[1].account
        await usdt.write.approve([service.address, viem.parseUnits('1000', 6)], { account })
        await service.write.makeOrder([weth_usdt, viem.parseUnits('90', 6), viem.parseUnits('1', 18), 0], { account }) //#1
        await service.write.makeOrder([weth_usdt, viem.parseUnits('100', 6), viem.parseUnits('1', 18), 0], { account }) //#2
        
        //makeSellOrder
        account = accounts[2].account
        await weth.write.approve([service.address, viem.parseUnits('1000', 18)], { account })
        await service.write.makeOrder([usdt_weth, viem.parseUnits('1', 18), viem.parseUnits('110', 6), 0], { account }) //#1
        await service.write.makeOrder([usdt_weth, viem.parseUnits('1', 18), viem.parseUnits('100', 6), 0], { account }) //#2

        // let userOeders = await service.read.getUserOrders([account.address, 0, 6])
        // console.log(userOeders)

        await print()
    })


    it('take orders', async function () {
        account = accounts[3].account
        //takeBuyOrder
        await weth.write.approve([service.address, viem.parseUnits('1000', 18)], { account })
        await service.write.takeOrder([weth_usdt, viem.parseUnits('1', 18), 0n], { account })
        console.log('takeBuyOrder:')
        await print()
        
        //takeSellOrder
        await usdt.write.approve([service.address, viem.parseUnits('1000', 6)], { account })
        await service.write.takeOrder([usdt_weth, viem.parseUnits('100', 6), 0n], { account })
        console.log('takeSellOrder:')
        await print()
    })


    it('mining 1', async function () {
        let routers = [weth.address, usdt.address, mars.address]
        let routersBytes = viem.concat(routers)
        await mining.write.mine([weth_usdt, 2, routersBytes])

        await print()
    })

    it('mining 2', async function () {
        let routers = [usdt.address, mars.address]
        let routersBytes = viem.concat(routers)
        await mining.write.mine([usdt_weth, 2, routersBytes])

        await print()

        expect(await weth.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0', 18))
        expect(await usdt.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('1.9', 6))
        expect(await mars.read.balanceOf([accounts[0].account.address])).to.equal(viem.parseUnits('0', 18))
        expect(await weth.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('1001.01', 18))
        expect(await usdt.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('810', 6))
        expect(await mars.read.balanceOf([accounts[1].account.address])).to.equal(viem.parseUnits('90', 18))
        expect(await weth.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('998', 18))
        expect(await usdt.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('1100', 6))
        expect(await mars.read.balanceOf([accounts[2].account.address])).to.equal(viem.parseUnits('100', 18))
        expect(await weth.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('999.99', 18))
        expect(await usdt.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('999', 6))
        expect(await mars.read.balanceOf([accounts[3].account.address])).to.equal(viem.parseUnits('0', 18))
    })


    async function print() {
        for (let i = 0; i <= 3; i++) {
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