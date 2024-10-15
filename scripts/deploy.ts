import * as viem from 'viem'
import { createPublicClient, createWalletClient, http } from 'viem'
import { lineaSepolia, unichainSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as erc20Json from '../artifacts/contracts/mock/MockERC20.sol/MockERC20.json'
import * as serviceJson from '../artifacts/contracts/v2/TradeService.sol/TradeService.json'

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


    let hash, tx, sim

    // hash = await walletClient.deployContract({
    //     abi: erc20Json.abi,
    //     account,
    //     args: ['TEST USDT', 'USDT'],
    //     bytecode: erc20Json.bytecode as `0x${string}`
    // })
    // tx = await publicClient.waitForTransactionReceipt({ hash })
    // console.log('USDT address:', tx.contractAddress)
    // USDT_ADDR = tx.contractAddress as `0x${string}`

    // sim = await publicClient.simulateContract({
    //     address: USDT_ADDR as `0x${string}`,
    //     abi: erc20Json.abi,
    //     functionName: 'setDecimals',
    //     args: [6],
    //     account
    // })
    // hash = await walletClient.writeContract(sim.request)
    // await publicClient.waitForTransactionReceipt({ hash })
    // console.log('setDecimals done', hash)

    sim = await publicClient.simulateContract({
        address: USDT_ADDR as `0x${string}`,
        abi: erc20Json.abi,
        functionName: 'mint',
        args: [account.address, viem.parseUnits('2000000', 6)],
        account
    })
    hash = await walletClient.writeContract(sim.request)
    await publicClient.waitForTransactionReceipt({ hash })
    console.log('mint done', hash)



    hash = await walletClient.deployContract({
        abi: erc20Json.abi,
        account,
        args: ['TEST MEME', 'MEME'],
        bytecode: erc20Json.bytecode as `0x${string}`
    })
    tx = await publicClient.waitForTransactionReceipt({ hash })
    console.log('MEME address:', tx.contractAddress)
    MEME_ADDR = tx.contractAddress as `0x${string}`

    sim = await publicClient.simulateContract({
        address: MEME_ADDR as `0x${string}`,
        abi: erc20Json.abi,
        functionName: 'mint',
        args: [account.address, viem.parseUnits('2000000', 18)],
        account
    })
    hash = await walletClient.writeContract(sim.request)
    await publicClient.waitForTransactionReceipt({ hash })
    console.log('mint done', hash)



    hash = await walletClient.deployContract({
        abi: serviceJson.abi,
        account,
        args: [],
        bytecode: serviceJson.bytecode as `0x${string}`
    })
    tx = await publicClient.waitForTransactionReceipt({ hash })
    console.log('service address:', tx.contractAddress)
    SERVICE_ADDR = tx.contractAddress as `0x${string}`

    sim = await publicClient.simulateContract({
        address: SERVICE_ADDR as `0x${string}`,
        abi: serviceJson.abi,
        functionName: 'createPair',
        args: [USDT_ADDR, MEME_ADDR],
        account
    })
    hash = await walletClient.writeContract(sim.request)
    await publicClient.waitForTransactionReceipt({ hash })
    console.log('createPair done', hash)
    


    USDT_MEME_ADDR = await publicClient.readContract({
        address: SERVICE_ADDR as `0x${string}`,
        abi: serviceJson.abi,
        functionName: 'getTrade',
        args: [USDT_ADDR, MEME_ADDR],
        account
    }) as string
    console.log('USDT_MEME_ADDR =', USDT_MEME_ADDR)
    
    MEME_USDT_ADDR = await publicClient.readContract({
        address: SERVICE_ADDR as `0x${string}`,
        abi: serviceJson.abi,
        functionName: 'getTrade',
        args: [MEME_ADDR, USDT_ADDR],
        account
    }) as string
    console.log('MEME_USDT_ADDR =', MEME_USDT_ADDR)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });