import * as viem from 'viem'
import { createPublicClient, createWalletClient, http } from 'viem'
import { lineaSepolia, unichainSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as erc20Json from '../artifacts/contracts/mock/MockERC20.sol/MockERC20.json'
import * as serviceJson from '../artifacts/contracts/v2/TradeService.sol/TradeService.json'
import * as tradeJson from '../artifacts/contracts/v2/MonoTrade.sol/MonoTrade.json'

//linea_sepolia 2024/9/1
// var USDT_ADDR = '0xd6b0cd180639d9464f51a0ecb816a22add26f701'
// var MEME_ADDR = '0x89491dd50edbee8caae912cba162a6b2c6ac69ce'
// var SERVICE_ADDR = '0x2d90e99d7ff0f7ad75e94bfceae21ebfdbadad84'
// var USDT_MEME_ADDR = '0x566137bC9A4a28214B4407dd6dE8bff291C4C21F'
// var MEME_USDT_ADDR = '0x9aA120dCA5fDeED7e26ceCA5346dC7ff0b6684Aa'

//linea_sepolia 2024/10/8
// var USDT_ADDR = '0xd6b0cd180639d9464f51a0ecb816a22add26f701'
// var MEME_ADDR = '0x89491dd50edbee8caae912cba162a6b2c6ac69ce'
// var SERVICE_ADDR = '0xd8456d902cb9fcfab991ca8e48312f5718cdaa79'
// var USDT_MEME_ADDR = '0x75351fD68BDC2cafc6f1C80993421b08aC2bf0eA'
// var MEME_USDT_ADDR = '0x18D5b2f3ABbE2F314B32966c41604761F3d69346'

//unichainSepolia 2024/10/15
var USDT_ADDR = '0x99b52f524b70cd0c93bd592b1843bf2f49a5fe75'
var MEME_ADDR = '0x4355d86e90d1646d0b79a362b7e5b29092047bce'
var SERVICE_ADDR = '0x9260bb1a28a1fd9f8dbd4386577003b51bb07fa6'
var USDT_MEME_ADDR = '0x03DF076cA486b570a9Fb24bb77F7687B6e64b4Da'
var MEME_USDT_ADDR = '0x9b16489771c8D3DaD4aA8e09A6B540B0A02D24F6'

async function main() {
    const pk = '0x' + process.env.ETH_PK_1 as string
    const account = privateKeyToAccount(pk as `0x${string}`)
    console.log('account:', account.address)

    const publicClient = createPublicClient({
        chain: unichainSepolia,
        transport: http()
    })
    console.log('eth:', viem.formatUnits(
        await publicClient.getBalance({
            address: account.address
        }), 18)
    )

    const walletClient = createWalletClient({
        account,
        chain: unichainSepolia,
        transport: http()
    })

    // await initBuyOrders(walletClient, publicClient, account)
    // await initSellOrders(walletClient, publicClient, account)

    // await getTradeAddr(walletClient, publicClient, account)
    // await getTradeInfo(walletClient, publicClient, account)
    // await getOrderList(walletClient, publicClient, account)
    // await getUserOrderList(walletClient, publicClient, account)

    // await placeOrder(walletClient, publicClient, account)
    // await makeOrder(walletClient, publicClient, account)
    // await takeOrder(walletClient, publicClient, account)
}


async function getTradeAddr(walletClient: any, publicClient: any, account: viem.PrivateKeyAccount) {
    let tradeAddr = await publicClient.readContract({
        address: SERVICE_ADDR as `0x${string}`,
        abi: serviceJson.abi,
        args: [MEME_ADDR, USDT_ADDR],
        functionName: 'getTrade',
    })
    console.log('MEME_USDT:', tradeAddr)

    tradeAddr = await publicClient.readContract({
        address: SERVICE_ADDR as `0x${string}`,
        abi: serviceJson.abi,
        args: [MEME_ADDR, USDT_ADDR],
        functionName: 'getTrade',
    })
    console.log('USDT_MEME:', tradeAddr)
}


async function getTradeInfo(walletClient: any, publicClient: any, account: viem.PrivateKeyAccount) {
    const tradeWagmi = {
        address: USDT_MEME_ADDR,
        abi: tradeJson.abi
    } as const

    let arr = await publicClient.multicall({
        contracts: [
            { ...tradeWagmi, functionName: 'token0' },
            { ...tradeWagmi, functionName: 'token1' },
            { ...tradeWagmi, functionName: 'fee' },
        ]
    })
    console.log('trade info:', arr)
    // trade info: [
    //     {
    //       result: '0xD6B0cD180639D9464f51A0ECb816A22ADd26f701',
    //       status: 'success'
    //     },
    //     {
    //       result: '0x89491dd50EdbEE8CaAE912cbA162a6b2C6aC69ce',
    //       status: 'success'
    //     },
    //     { result: 100, status: 'success' }
    // ]

    const token0Wagmi = {
        address: arr[0].result,
        abi: erc20Json.abi
    } as const

    const token1Wagmi = {
        address: arr[1].result,
        abi: erc20Json.abi
    } as const

    arr = await publicClient.multicall({
        contracts: [
            { ...token0Wagmi, functionName: 'name' },
            { ...token0Wagmi, functionName: 'symbol' },
            { ...token0Wagmi, functionName: 'decimals' },
            { ...token0Wagmi, functionName: 'balanceOf', args:[account.address] },
            { ...token1Wagmi, functionName: 'name' },
            { ...token1Wagmi, functionName: 'symbol' },
            { ...token1Wagmi, functionName: 'decimals' },
            { ...token1Wagmi, functionName: 'balanceOf', args:[account.address] },
        ]
    })
    console.log('token detail:', arr)
    // token detail: [
    //     { result: 'TEST USDT', status: 'success' },
    //     { result: 'USDT', status: 'success' },
    //     { result: 6, status: 'success' },
    //     { result: 1999740000000n, status: 'success' },
    //     { result: 'TEST MEME', status: 'success' },
    //     { result: 'MEME', status: 'success' },
    //     { result: 18, status: 'success' },
    //     { result: 1999600000000000000000000n, status: 'success' }
    // ]
}


async function getOrderList(walletClient: any, publicClient: any, account: viem.PrivateKeyAccount) {
    //get sell list
    let fromOrderId = 0
    let num = 20
    let orderArr = await publicClient.readContract({
        address: SERVICE_ADDR as `0x${string}`,
        abi: serviceJson.abi,
        args: [USDT_MEME_ADDR, fromOrderId, num],
        functionName: 'getOrderList',
    })
    console.log('sell orderArr:', orderArr)
    // orderArr: [
    //     {
    //       orderId: 1,
    //       amountIn: 100000000000000000000n,
    //       amountOut: 100000000n,
    //       progress: 0
    //     },
    //     ...
    // ]

    let sellPrice = parseFloat(viem.formatUnits(orderArr[0].amountOut, 6)) / parseFloat(viem.formatUnits(orderArr[0].amountIn, 18))
    console.log('sellPrice:', sellPrice)

    //get buy list
    fromOrderId = 0
    num = 20
    orderArr = await publicClient.readContract({
        address: SERVICE_ADDR as `0x${string}`,
        abi: serviceJson.abi,
        args: [MEME_USDT_ADDR, fromOrderId, num],
        functionName: 'getOrderList',
    })
    console.log('buy orderArr:', orderArr)
    // orderArr: [
    //     {
    //       orderId: 1,
    //       amountIn: 100000000n,
    //       amountOut: 100000000000000000000n,
    //       progress: 0
    //     },
    //     ...
    // ]

    let buyPrice = parseFloat(viem.formatUnits(orderArr[0].amountIn, 6)) / parseFloat(viem.formatUnits(orderArr[0].amountOut, 18))
    console.log('buyPrice:', buyPrice)

    //get current price
    let currPrice = (sellPrice + buyPrice) / 2
    console.log('currPrice:', currPrice)
}


async function getUserOrders(walletClient: any, publicClient: any, account: viem.PrivateKeyAccount) {
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


async function placeOrder(walletClient: any, publicClient: any, account: viem.PrivateKeyAccount) {
    let token0In = viem.parseUnits('100', 18)
    let token1Want = viem.parseUnits('100', 6)

    let fee = 100n //read from contract
    let token0InWithFee = token0In * fee / 10000n + token0In
    let hash = await walletClient.writeContract({
        address: MEME_ADDR,
        abi: erc20Json.abi,
        functionName: 'approve',
        args: [SERVICE_ADDR, token0InWithFee],
        account,
    })
    await publicClient.waitForTransactionReceipt({ hash })
    console.log('approve done')

    let sim = await publicClient.simulateContract({
        address: SERVICE_ADDR,
        abi: serviceJson.abi,
        functionName: 'placeOrder',
        args: [MEME_USDT_ADDR, token0In, token1Want],
        account,
    })
    console.log('sim.result:', sim.result)
    // hash = await walletClient.writeContract(sim.request)
    // console.log('placeLimitOrder done')
}


async function makeOrder(walletClient: any, publicClient: any, account: viem.PrivateKeyAccount) {
    let token1In = viem.parseUnits('100', 18)
    let token0Want = viem.parseUnits('1000', 6)

    let hash = await walletClient.writeContract({
        address: MEME_ADDR,
        abi: erc20Json.abi,
        functionName: 'approve',
        args: [SERVICE_ADDR, token1In],
        account,
    })
    await publicClient.waitForTransactionReceipt({ hash })
    console.log('approve done')

    let beforeOrderId = await publicClient.readContract({
        address: SERVICE_ADDR,
        abi: serviceJson.abi,
        functionName: 'findBeforeOrderId',
        args: [USDT_MEME_ADDR, token1In, token0Want, 0],
        account,
    })
    console.log('beforeOrderId:', beforeOrderId)

    let sim = await publicClient.simulateContract({
        address: SERVICE_ADDR,
        abi: serviceJson.abi,
        functionName: 'makeOrder',
        args: [USDT_MEME_ADDR, token1In, token0Want, beforeOrderId],
        account,
    })
    console.log('sim.result:', sim.result)
    // hash = await walletClient.writeContract(sim.request)
    // console.log('placeLimitOrder done')
}


async function takeOrder(walletClient: any, publicClient: any, account: viem.PrivateKeyAccount) {
    let token0In = viem.parseUnits('100', 18)
    let token1Want = viem.parseUnits('100', 6)

    let fee = 100n //read from contract
    let token0InWithFee = token0In * fee / 10000n + token0In
    let hash = await walletClient.writeContract({
        address: MEME_ADDR,
        abi: erc20Json.abi,
        functionName: 'approve',
        args: [SERVICE_ADDR, token0InWithFee],
        account,
    })
    await publicClient.waitForTransactionReceipt({ hash })
    console.log('approve done')

    let sim = await publicClient.simulateContract({
        address: SERVICE_ADDR,
        abi: serviceJson.abi,
        functionName: 'takeOrder',
        args: [MEME_USDT_ADDR, token0In, token1Want],
        account,
    })
    console.log('sim.result:', sim.result)
    // hash = await walletClient.writeContract(sim.request)
    // console.log('placeLimitOrder done')
}


async function cancelOrder(walletClient: any, publicClient: any, account: viem.PrivateKeyAccount) {
    let orderId = 1 //get orderId from getUserOrders
    let trade = '0x03DF076cA486b570a9Fb24bb77F7687B6e64b4Da' //get trade from getUserOrders

    let sim = await publicClient.simulateContract({
        address: trade,
        abi: tradeJson.abi,
        functionName: 'cancelOrder',
        args: [orderId],
        account,
    })
    console.log('sim.result:', sim.result)
    // hash = await walletClient.writeContract(sim.request)
    // console.log('placeLimitOrder done')
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

    for (let i = 0; i < 5; i++) {
        let beforeOrderId = 0
        token1In = viem.parseUnits('100', 18)
        let token0Out = viem.parseUnits((100 + 10 * i).toString(), 6)
        let hash = await walletClient.writeContract({
            address: SERVICE_ADDR,
            abi: serviceJson.abi,
            functionName: 'makeOrder',
            args: [USDT_MEME_ADDR, token1In, token0Out, beforeOrderId],
            account,
        })
        await publicClient.waitForTransactionReceipt({ hash })
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

    for (let i = 0; i < 5; i++) {
        let beforeOrderId = 0
        token1In = viem.parseUnits((100 - 10 * i).toString(), 6)
        let token0Out = viem.parseUnits('100', 18)
        let hash = await walletClient.writeContract({
            address: SERVICE_ADDR,
            abi: serviceJson.abi,
            functionName: 'makeOrder',
            args: [MEME_USDT_ADDR, token1In, token0Out, beforeOrderId],
            account,
        })
        await publicClient.waitForTransactionReceipt({ hash })
        console.log('makeOrder done', i)
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });