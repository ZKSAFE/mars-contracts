import * as viem from 'viem'
import { FeeAmount } from '@uniswap/v3-sdk'
import { Token } from '@uniswap/sdk-core'

const eachGaslimit = 300000n

let QuoterV3Addr: `0x${string}`
let WETH_TOKEN: Token, USDC_TOKEN: Token, USDT_TOKEN: Token, DAI_TOKEN: Token

let quoterV3abi: any
let publicClient: any


export class Pool {
    tokenIn: Token
    tokenOut: Token
    fee: number

    constructor(tokenIn: Token, tokenOut: Token, fee: number) {
        this.tokenIn = tokenIn
        this.tokenOut = tokenOut
        this.fee = fee
    }
}

export async function setup(
    params: {
        WETH_TOKEN: Token,
        USDC_TOKEN: Token,
        USDT_TOKEN: Token,
        DAI_TOKEN: Token,
        QuoterV3Addr: `0x${string}`,
        quoterV3abi: any,
        publicClient: any
    }
) {
    WETH_TOKEN = params.WETH_TOKEN
    USDC_TOKEN = params.USDC_TOKEN
    USDT_TOKEN = params.USDT_TOKEN
    DAI_TOKEN = params.DAI_TOKEN
    QuoterV3Addr = params.QuoterV3Addr
    quoterV3abi = params.quoterV3abi
    publicClient = params.publicClient
}


export function getRoutersInfo_USD(tokenIn: Token, tokenOut: Token) {
    let routerPoolsArr: Pool[][] = []
    let feeArr = [FeeAmount.HIGH, FeeAmount.MEDIUM, FeeAmount.LOW, FeeAmount.LOWEST]

    let tokenUSDs = [USDC_TOKEN, USDT_TOKEN, DAI_TOKEN]
    let tokenUSDAddrs = [USDC_TOKEN.address, USDT_TOKEN.address, DAI_TOKEN.address]
    let indexIn = tokenUSDAddrs.indexOf(tokenIn.address)
    let indexOut = tokenUSDAddrs.indexOf(tokenOut.address)

    if (indexIn == -1 && indexOut >= 0) { //tokenOut is USD

        tokenUSDs.splice(indexOut, 1)
        for (let tokenUSD of tokenUSDs) {
            //TOKEN -> USD
            for (let fee0 of feeArr) {
                //USD -> USD
                routerPoolsArr.push([
                    new Pool(tokenIn, tokenUSD, fee0),
                    new Pool(tokenUSD, tokenOut, FeeAmount.LOWEST)
                ])
            }
        }

    } else if (indexIn >= 0 && indexOut == -1) { //tokenIn is USD

        tokenUSDs.splice(indexIn, 1)
        for (let tokenUSD of tokenUSDs) {
            //USD -> USD
            for (let fee1 of feeArr) {
                //USD -> TOKEN
                routerPoolsArr.push([
                    new Pool(tokenIn, tokenUSD, FeeAmount.LOWEST),
                    new Pool(tokenUSD, tokenOut, fee1)
                ])
            }
        }

    } else {
        throw new Error('only one of tokenIn and tokenOut MUST be stable coin')
    }

    return routerPoolsArr
}


export function getRoutersInfo_WETH(tokenIn: Token, tokenOut: Token) {
    let routerPoolsArr: Pool[][] = []

    let feeArr = [FeeAmount.HIGH, FeeAmount.MEDIUM, FeeAmount.LOW, FeeAmount.LOWEST]
    for (let fee0 of feeArr) {
        //USDC -> WETH
        for (let fee1 of feeArr) {
            //WETH -> PEPE
            routerPoolsArr.push([
                new Pool(tokenIn, WETH_TOKEN, fee0),
                new Pool(WETH_TOKEN, tokenOut, fee1)
            ])
        }
    }
    return routerPoolsArr
}


export function getRoutersInfo(tokenIn: Token, tokenOut: Token) {
    let routerPoolsArr = []

    let feeArr = [FeeAmount.HIGH, FeeAmount.MEDIUM, FeeAmount.LOW, FeeAmount.LOWEST]
    for (let fee of feeArr) {
        routerPoolsArr.push([
            { tokenIn, tokenOut, fee }
        ])
    }
    return routerPoolsArr
}


function getCallDatasForAmountOut(amountIn: bigint, routerPoolsArr: Pool[][]) {
    let callDatas: `0x${string}`[] = []
    for (let i = 0; i < routerPoolsArr.length; i++) {
        let routerPools = routerPoolsArr[i]

        let path: `0x${string}`[] = []
        for (let i = 0; i < routerPools.length; i++) {
            let pool = routerPools[i]
            if (i == 0) {
                path.push(pool.tokenIn.address as `0x${string}`)
            }
            path.push(viem.numberToHex(pool.fee, { size: 3 }))
            path.push(pool.tokenOut.address as `0x${string}`)
        }

        let callData: `0x${string}` = viem.encodeFunctionData({
            abi: quoterV3abi,
            functionName: 'quoteExactInput',
            args: [viem.concat(path), amountIn]
        })
        callDatas.push(callData)
    }
    return callDatas
}



function getCallDatasForAmountIn(routerPoolsArr: Pool[][], amountOut: bigint) {
    let callDatas: `0x${string}`[] = []
    for (let i = 0; i < routerPoolsArr.length; i++) {
        let routerPools = routerPoolsArr[i]

        let path: `0x${string}`[] = []
        for (let i = routerPools.length - 1; i >= 0; i--) {
            let pool = routerPools[i]
            if (i == routerPools.length - 1) {
                path.push(pool.tokenOut.address as `0x${string}`)
            }
            path.push(viem.numberToHex(pool.fee, { size: 3 }))
            path.push(pool.tokenIn.address as `0x${string}`)
        }

        let callData: `0x${string}` = viem.encodeFunctionData({
            abi: quoterV3abi,
            functionName: 'quoteExactOutput',
            args: [viem.concat(path), amountOut]
        })
        callDatas.push(callData)
    }
    return callDatas
}


export async function getBestOfAmountOut(routerPoolsArr: Pool[][], amountIn: bigint) {
    let callDatas: `0x${string}`[] = getCallDatasForAmountOut(amountIn, routerPoolsArr)

    const { result } = await publicClient.simulateContract({
        address: QuoterV3Addr,
        abi: quoterV3abi,
        functionName: 'aggregate',
        args: [callDatas, eachGaslimit]
    })

    let best = getHighestAmountOut(routerPoolsArr, result)
    return best
}


export async function getBestOfAmountIn(routerPoolsArr: Pool[][], amountOut: bigint) {
    let callDatas: `0x${string}`[] = getCallDatasForAmountIn(routerPoolsArr, amountOut)

    const { result } = await publicClient.simulateContract({
        address: QuoterV3Addr,
        abi: quoterV3abi,
        functionName: 'aggregate',
        args: [callDatas, eachGaslimit],
    })

    let best = getLowestAmountIn(routerPoolsArr, result)
    return best
}


export function getHighestAmountOut(routerPoolsArr: Pool[][], amountOuts: [bigint]) {
    let best = null
    for (let i = 0; i < routerPoolsArr.length; i++) {
        let routerPools = routerPoolsArr[i]
        let amountOut = amountOuts[i]

        let routerStr = 'amountOut:' + amountOut + ' router:'
        for (let pool of routerPools) {
            routerStr += pool.tokenIn.symbol + '-' + pool.fee + '-' + pool.tokenOut.symbol + ' '
        }

        console.log(routerStr)
        if (amountOut == 0n) continue

        if (best) {
            if (amountOut > best.amountOut) {
                best = { routerPools, amountOut, routerStr }
            }
        } else {
            best = { routerPools, amountOut, routerStr }
        }
    }
    if (best == null) {
        best = { routerPools: [], amountOut: 0n, routerStr: 'No routers' }
    }
    return best
}


export function getLowestAmountIn(routerPoolsArr: Pool[][], amountIns: [bigint]) {
    let best = null
    for (let i = 0; i < routerPoolsArr.length; i++) {
        let routerPools = routerPoolsArr[i]
        let amountIn = amountIns[i]

        let routerStr = 'amountIn:' + amountIn + ' router:'
        for (let pool of routerPools) {
            routerStr += pool.tokenIn.symbol + '-' + pool.fee + '-' + pool.tokenOut.symbol + ' '
        }

        console.log(routerStr)
        if (amountIn == 0n) continue

        if (best) {
            if (amountIn < best.amountIn) {
                best = { routerPools, amountIn, routerStr }
            }
        } else {
            best = { routerPools, amountIn, routerStr }
        }
    }
    if (best == null) {
        best = { routerPools: [], amountOut: 0n, routerStr: 'No routers' }
    }
    return best
}