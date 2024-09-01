import * as viem from 'viem'
import { createPublicClient, createWalletClient, http } from 'viem'
import { lineaSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as erc20Json from '../artifacts/contracts/mock/MockERC20.sol/MockERC20.json'
import * as serviceJson from '../artifacts/contracts/v2/TradeService.sol/TradeService.json'

//linea_sepolia 2024/9/1
var USDT_ADDR = '0xd6b0cd180639d9464f51a0ecb816a22add26f701'
var MEME_ADDR = '0x89491dd50edbee8caae912cba162a6b2c6ac69ce'
var SERVICE_ADDR = '0x2d90e99d7ff0f7ad75e94bfceae21ebfdbadad84'
var USDT_MEME_ADDR = '0x566137bC9A4a28214B4407dd6dE8bff291C4C21F'
var MEME_USDT_ADDR = '0x9aA120dCA5fDeED7e26ceCA5346dC7ff0b6684Aa'

async function main() {
    const pk = '0x' + process.env.ETH_PK_1 as string
    const account = privateKeyToAccount(pk as `0x${string}`)
    console.log('account:', account.address)

    const publicClient = createPublicClient({
        chain: lineaSepolia,
        transport: http()
    })
    console.log('eth:', viem.formatUnits(
        await publicClient.getBalance({
            address: account.address
        }), 18)
    )

    const walletClient = createWalletClient({
        account,
        chain: lineaSepolia,
        transport: http()
    })

    // await initBuyOrders(walletClient, publicClient, account)
    // await initSellOrders(walletClient, publicClient, account)

    //get trade contract address
    let tradeAddr = await publicClient.readContract({
        address: SERVICE_ADDR as `0x${string}`,
        abi: serviceJson.abi,
        args: [MEME_ADDR, USDT_ADDR],
        functionName: 'getTrade',
    })
    console.log('tradeAddr:', tradeAddr)
    // tradeAddr: 0x9aA120dCA5fDeED7e26ceCA5346dC7ff0b6684Aa

    //get sell list
    // let fromOrderId = 0
    // let num = 5
    // let orderArr = await publicClient.readContract({
    //     address: SERVICE_ADDR as `0x${string}`,
    //     abi: serviceJson.abi,
    //     args: [USDT_MEME_ADDR, fromOrderId, num],
    //     functionName: 'getOrderList',
    // })
    // console.log('orderArr:', orderArr)
    // orderArr: [
    //     {
    //       orderId: 1,
    //       amountIn: 100000000000000000000n,
    //       amountOut: 100000000n,
    //       progress: 0
    //     },
    //     {
    //       orderId: 2,
    //       amountIn: 100000000000000000000n,
    //       amountOut: 110000000n,
    //       progress: 0
    //     },
    //     {
    //       orderId: 3,
    //       amountIn: 100000000000000000000n,
    //       amountOut: 130000000n,
    //       progress: 0
    //     },
    //     ...
    // ]


    // fromOrderId = 0
    // num = 5
    // orderArr = await publicClient.readContract({
    //     address: SERVICE_ADDR as `0x${string}`,
    //     abi: serviceJson.abi,
    //     args: [MEME_USDT_ADDR, fromOrderId, num],
    //     functionName: 'getOrderList',
    // })
    // console.log('orderArr:', orderArr)
    // orderArr: [
    //     {
    //       orderId: 1,
    //       amountIn: 100000000n,
    //       amountOut: 100000000000000000000n,
    //       progress: 0
    //     },
    //     {
    //       orderId: 2,
    //       amountIn: 95000000n,
    //       amountOut: 100000000000000000000n,
    //       progress: 0
    //     },
    //     {
    //       orderId: 3,
    //       amountIn: 90000000n,
    //       amountOut: 100000000000000000000n,
    //       progress: 0
    //     },
    //     ...
    // ]


    let lastIndex = 0
    let num = 10
    let userOrderArr = await publicClient.readContract({
        address: SERVICE_ADDR as `0x${string}`,
        abi: serviceJson.abi,
        args: [account.address, lastIndex, num],
        functionName: 'getUserOrders',
    })
    console.log('userOrderArr:', userOrderArr)
    // userOrderArr:[{
    //     index: 7,
    //     trade: '0x566137bC9A4a28214B4407dd6dE8bff291C4C21F',
    //     token0: '0xD6B0cD180639D9464f51A0ECb816A22ADd26f701',
    //     token1: '0x89491dd50EdbEE8CaAE912cbA162a6b2C6aC69ce',
    //     orderId: 4,
    //     createTime: 1725165097,
    //     amountIn: 100000000000000000000n,
    //     amountOut: 130000000n,
    //     progress: 0,
    //     isRemoved: false
    //   },
    //   ...
    // ]
    
}

async function initSellOrders(walletClient: any, publicClient: any, account: viem.PrivateKeyAccount) {
    let token1In = viem.parseUnits('1000', 18)
    let hash = await walletClient.writeContract({
        address: MEME_ADDR,
        abi: erc20Json.abi,
        functionName: 'approve',
        args: [SERVICE_ADDR, token1In],
        account,
    })
    await publicClient.waitForTransactionReceipt({ hash })
    console.log('approve done')

    for (let i=0; i<5; i++) {
        let beforeOrderId = 0
        token1In = viem.parseUnits('100', 18)
        let token0Out = viem.parseUnits((100 + 10 * i).toString(), 6)
        await walletClient.writeContract({
            address: SERVICE_ADDR,
            abi: serviceJson.abi,
            functionName: 'makeOrder',
            args: [USDT_MEME_ADDR, token1In, token0Out, beforeOrderId],
            account,
        })
        console.log('makeOrder done', i)
    }
}

async function initBuyOrders(walletClient: any, publicClient: any, account: viem.PrivateKeyAccount) {
    let token1In = viem.parseUnits('1000', 6)
    let hash = await walletClient.writeContract({
        address: USDT_ADDR,
        abi: erc20Json.abi,
        functionName: 'approve',
        args: [SERVICE_ADDR, token1In],
        account,
    })
    await publicClient.waitForTransactionReceipt({ hash })
    console.log('approve done')

    for (let i=0; i<5; i++) {
        let beforeOrderId = 0
        token1In = viem.parseUnits((100 - 10 * i).toString(), 6)
        let token0Out = viem.parseUnits('100', 18)
        await walletClient.writeContract({
            address: SERVICE_ADDR,
            abi: serviceJson.abi,
            functionName: 'makeOrder',
            args: [MEME_USDT_ADDR, token1In, token0Out, beforeOrderId],
            account,
        })
        console.log('makeOrder done', i)
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });