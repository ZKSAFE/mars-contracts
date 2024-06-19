import { time, loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import hre from 'hardhat'
import * as viem from 'viem'
import { ChainId, Token, Ether } from '@uniswap/sdk-core'
import * as QuoterV3Help from './help/QuoterV3Help'
import { abi as quoterV3abi  } from '../artifacts/contracts/help/QuoterV3.sol/QuoterV3.json'

const NATIVE_ETH = Ether.onChain(ChainId.OPTIMISM)
const USDC_TOKEN = new Token(ChainId.OPTIMISM, '0x0b2c639c533813f4aa9d7837caf62653d097ff85', 6, 'USDC', 'USD Coin')
const USDT_TOKEN = new Token(ChainId.OPTIMISM, '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', 6, 'USDT', 'Tether USD')
const DAI_TOKEN = new Token(ChainId.OPTIMISM, '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', 18, 'DAI', 'Dai Stablecoin')
const TOKEN_TOKEN = new Token(ChainId.OPTIMISM, '0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1', 18, 'WLD', 'World Coin')
const QuoterV3Addr = '0x42651ae9f9aae9ac51fd155dd4e98240e11e1344'

describe('QuoterV3 test', function () {

    let accounts
    let publicClient

    before(async function () {
        accounts = await hre.viem.getWalletClients()
        publicClient = await hre.viem.getPublicClient()
        console.log('account0:', accounts[0].account.address)

        await QuoterV3Help.setup({
            ChainId: ChainId.OPTIMISM,
            USDC_TOKEN,
            USDT_TOKEN,
            DAI_TOKEN,
            QuoterV3Addr,
            quoterV3abi,
            publicClient
        })
    })

    it('quote amountOut USDC>WETH>TOKEN', async function () {
        let tokenIn = USDC_TOKEN
        let tokenOut = TOKEN_TOKEN
        let amountIn = viem.parseUnits('100', 6)

        let best = await QuoterV3Help.getBestOfAmountOut(QuoterV3Help.getRoutersInfo_WETH(tokenIn, tokenOut), amountIn)
        console.log('best:', best.routerStr)
    })

    it('quote amountIn USDC>WETH>TOKEN', async function () {
        let tokenIn = USDC_TOKEN
        let tokenOut = TOKEN_TOKEN
        let amountOut = viem.parseUnits('100', 18)

        let best = await QuoterV3Help.getBestOfAmountIn(QuoterV3Help.getRoutersInfo_WETH(tokenIn, tokenOut), amountOut)
        console.log('best:', best.routerStr)
    })

    it('quote amountOut USDC>ETH', async function () {
        let tokenIn = USDC_TOKEN
        let tokenOut = NATIVE_ETH
        let amountIn = viem.parseUnits('100', 6)

        let best = await QuoterV3Help.getBestOfAmountOut(QuoterV3Help.getRoutersInfo(tokenIn, tokenOut), amountIn)
        console.log('best:', best.routerStr)
    })

    it('quote amountIn USDC>ETH', async function () {
        let tokenIn = USDC_TOKEN
        let tokenOut = NATIVE_ETH
        let amountOut = viem.parseUnits('1', 18)

        let best = await QuoterV3Help.getBestOfAmountIn(QuoterV3Help.getRoutersInfo(tokenIn, tokenOut), amountOut)
        console.log('best:', best.routerStr)
    })

    it('quote amountOut USDC>TOKEN', async function () {
        let tokenIn = USDC_TOKEN
        let tokenOut = TOKEN_TOKEN
        let amountIn = viem.parseUnits('100', 6)

        let best = await QuoterV3Help.getBestOfAmountOut(QuoterV3Help.getRoutersInfo(tokenIn, tokenOut), amountIn)
        console.log('best:', best.routerStr)
    })

    it('quote amountIn USDC>TOKEN', async function () {
        let tokenIn = USDC_TOKEN
        let tokenOut = TOKEN_TOKEN
        let amountOut = viem.parseUnits('100', 18)

        let best = await QuoterV3Help.getBestOfAmountIn(QuoterV3Help.getRoutersInfo(tokenIn, tokenOut), amountOut)
        console.log('best:', best.routerStr)
    })

    /////////////////////////////
    //////    Advance     ///////
    /////////////////////////////

    ////////  buy ETH  //////////

    it('quote amountOut USDC>ETH & USDC>USD>ETH', async function () {
        let tokenIn = USDC_TOKEN
        let tokenOut = NATIVE_ETH
        let amountIn = viem.parseUnits('10000', 6)

        let r0 = QuoterV3Help.getRoutersInfo(tokenIn, tokenOut)
        let r1 = QuoterV3Help.getRoutersInfo_USD(tokenIn, tokenOut)

        let best = await QuoterV3Help.getBestOfAmountOut([...r0, ...r1], amountIn)
        console.log('best:', best.routerStr)
    })

    it('quote amountIn USDC>ETH & USDC>USD>ETH', async function () {
        let tokenIn = USDC_TOKEN
        let tokenOut = NATIVE_ETH
        let amountOut = viem.parseUnits('1', 18)

        let r0 = QuoterV3Help.getRoutersInfo(tokenIn, tokenOut)
        let r1 = QuoterV3Help.getRoutersInfo_USD(tokenIn, tokenOut)

        let best = await QuoterV3Help.getBestOfAmountIn([...r0, ...r1], amountOut)
        console.log('best:', best.routerStr)
    })

    //////////  sell ETH  //////////

    it('quote amountOut ETH>USDC & ETH>USD>USDC', async function () {
        let tokenIn = NATIVE_ETH
        let tokenOut = USDC_TOKEN
        let amountIn = viem.parseUnits('1', 18)

        let r0 = QuoterV3Help.getRoutersInfo(tokenIn, tokenOut)
        let r1 = QuoterV3Help.getRoutersInfo_USD(tokenIn, tokenOut)

        let best = await QuoterV3Help.getBestOfAmountOut([...r0, ...r1], amountIn)
        console.log('best:', best.routerStr)
    })

    it('quote amountIn ETH>USDC & ETH>USD>USDC', async function () {
        let tokenIn = NATIVE_ETH
        let tokenOut = USDC_TOKEN
        let amountOut = viem.parseUnits('10000', 6)

        let r0 = QuoterV3Help.getRoutersInfo(tokenIn, tokenOut)
        let r1 = QuoterV3Help.getRoutersInfo_USD(tokenIn, tokenOut)

        let best = await QuoterV3Help.getBestOfAmountIn([...r0, ...r1], amountOut)
        console.log('best:', best.routerStr)
    })

    //////////  buy Token  //////////

    it('quote amountOut USDC>WETH>TOKEN & USDC>TOKEN & USDC>USD>TOKEN', async function () {
        let tokenIn = USDC_TOKEN
        let tokenOut = TOKEN_TOKEN
        let amountIn = viem.parseUnits('100', 6)

        let r0 = QuoterV3Help.getRoutersInfo_WETH(tokenIn, tokenOut)
        let r1 = QuoterV3Help.getRoutersInfo(tokenIn, tokenOut)
        let r2 = QuoterV3Help.getRoutersInfo_USD(tokenIn, tokenOut)

        let best = await QuoterV3Help.getBestOfAmountOut([...r0, ...r1, ...r2], amountIn)
        console.log('best:', best.routerStr)
    })

    it('quote amountIn USDC>WETH>TOKEN & USDC>TOKEN & USDC>USD>TOKEN', async function () {
        let tokenIn = USDC_TOKEN
        let tokenOut = TOKEN_TOKEN
        let amountOut = viem.parseUnits('100', 18)

        let r0 = QuoterV3Help.getRoutersInfo_WETH(tokenIn, tokenOut)
        let r1 = QuoterV3Help.getRoutersInfo(tokenIn, tokenOut)
        let r2 = QuoterV3Help.getRoutersInfo_USD(tokenIn, tokenOut)

        let best = await QuoterV3Help.getBestOfAmountIn([...r0, ...r1, ...r2], amountOut)
        console.log('best:', best.routerStr)
    })

    // //////////  sell Token  //////////

    it('quote amountOut TOKEN>WETH>USDC & TOKEN>USDC & TOKEN>USD>USDC', async function () {
        let tokenIn = TOKEN_TOKEN
        let tokenOut = USDT_TOKEN
        let amountIn = viem.parseUnits('100', 18)

        let r0 = QuoterV3Help.getRoutersInfo_WETH(tokenIn, tokenOut)
        let r1 = QuoterV3Help.getRoutersInfo(tokenIn, tokenOut)
        let r2 = QuoterV3Help.getRoutersInfo_USD(tokenIn, tokenOut)

        let best = await QuoterV3Help.getBestOfAmountOut([...r0, ...r1, ...r2], amountIn)
        console.log('best:', best.routerStr)
    })

    it('quote amountIn TOKEN>WETH>USDC & TOKEN>USDC & TOKEN>USD>USDC', async function () {
        let tokenIn = TOKEN_TOKEN
        let tokenOut = USDC_TOKEN
        let amountOut = viem.parseUnits('100', 6)

        let r0 = QuoterV3Help.getRoutersInfo_WETH(tokenIn, tokenOut)
        let r1 = QuoterV3Help.getRoutersInfo(tokenIn, tokenOut)
        let r2 = QuoterV3Help.getRoutersInfo_USD(tokenIn, tokenOut)

        let best = await QuoterV3Help.getBestOfAmountIn([...r0, ...r1, ...r2], amountOut)
        console.log('best:', best.routerStr)
    })
})