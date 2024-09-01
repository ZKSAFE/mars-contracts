# 前端对接说明文档

### 核心概念
Mars protocol的设计是为了实现0后端，全部操作通过前端调用智能合约即可完成，在使用前，有3个重要的概念需要理解：

#### 1.MonoTrade
MonoTrade是单向的交易合约，交易所可以有很多个交易对，每个交易对由2个MonoTrade组成。举个例子，有一个MonoTrade，token0是MEME，token1是USDT，那么挂单只能把token1（USDT）转入合约，也就是只能挂买单；吃单只能把token0（MEME）转入合约，也就是只能吃买单。如果想挂卖单，那么需要另一个MonoTrade，token0是USDT，token1是MEME，那么挂单把token1（MEME）转入合约，也就是挂了卖单，吃单同理。合约里不分买和卖，由前端自行推算出是买还是卖，跟uniswap同理。

#### 2.价格
合约里面存储的不是价格，而是tokenIn，tokenOut，意思是用户转入多少tokenIn进来，想要拿到多少tokenOut回去，这两个数值相除就是价格。

#### 3.订单排序
MonoTrade的订单列表永远按照价格排序。为了实现这点，在挂单时候需要传入beforeOrderId，即插入的位置，由前端计算出该位置，传给合约校验，位置不对会报错。为了帮助前端计算出beforeOrderId，TradeService里有findBeforeOrderId()


### 准备工作
测试合约现已部署到以下地址：

#### linea_sepolia 2024/9/1
USDT_ADDR: 0xd6b0cd180639d9464f51a0ecb816a22add26f701<br>
MEME_ADDR: 0x89491dd50edbee8caae912cba162a6b2c6ac69ce<br>
SERVICE_ADDR: 0x2d90e99d7ff0f7ad75e94bfceae21ebfdbadad84<br>
USDT_MEME_ADDR: 0x566137bC9A4a28214B4407dd6dE8bff291C4C21F<br>
MEME_USDT_ADDR: 0x9aA120dCA5fDeED7e26ceCA5346dC7ff0b6684Aa<br>

[演示代码](../scripts/docs.ts) 使用`viem@2.13.8`，初始代码如下：

```javascripts
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

    //to do...
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

```


### 读取合约
#### 查看MonoTrade合约地址
每个交易对由2个MonoTrade合约组成，再次强调，合约里不分买和卖，一般认为，挂稳定币的就是买单MonoTrade，挂其他Token的就是卖单MonoTrade。也有挂ETH的是买单，挂MEME的是卖单，由前端自行判断。

```javascripts
let tradeAddr = await publicClient.readContract({
    address: SERVICE_ADDR as `0x${string}`,
    abi: serviceJson.abi,
    args: [MEME_ADDR, USDT_ADDR],
    functionName: 'getTrade',
})
console.log('MEME_USDT_ADDR:', tradeAddr)
```

token0是MEME，token1是USDT，所以这是一个挂买单的MonoTrade，挂卖单的可以这样获取：

```javascripts
let tradeAddr = await publicClient.readContract({
    address: SERVICE_ADDR as `0x${string}`,
    abi: serviceJson.abi,
    args: [USDT_ADDR, MEME_ADDR],
    functionName: 'getTrade',
})
console.log('USDT_MEME_ADDR:', tradeAddr)
```

args里把USDT_ADDR放前面，MEME_ADDR放后面，就得到token0是USDT、token1是MEME的MonoTrade。也就是挂MEME卖单的。

如果交易对没有创建，返回0x0000000000000000000000000000000000000000


#### 查看挂单

```javascripts
let fromOrderId = 0
let num = 5
let orderArr = await publicClient.readContract({
    address: SERVICE_ADDR as `0x${string}`,
    abi: serviceJson.abi,
    args: [USDT_MEME_ADDR, fromOrderId, num],
    functionName: 'getOrderList',
})
console.log('orderArr:', orderArr)
```

这里MonoTrade地址传的是USDT_MEME_ADDR，说明这是个挂MEME单的，一般认为是MEME的卖单，查看MEME的买单可以这样获取：

```javascripts
let fromOrderId = 0
let num = 5
let orderArr = await publicClient.readContract({
    address: SERVICE_ADDR as `0x${string}`,
    abi: serviceJson.abi,
    args: [MEME_USDT_ADDR, fromOrderId, num],
    functionName: 'getOrderList',
})
console.log('orderArr:', orderArr)
```

把USDT_MEME_ADDR替换为MEME_USDT_ADDR即可。

args里的fromOrderId、num表示返回的第一个订单的OrderId就是fromOrderId，一共返回num个订单。如果传入的fromOrderId为0，那么就从最靠前的订单开始。

返回的数据格式如下：

```javascripts
orderArr: [
    {
        orderId: 1,
        amountIn: 100000000000000000000n,
        amountOut: 100000000n,
        progress: 0
    },
    ...
]
```

返回的orderArr是按价格排序的，越靠前的价格越好（对买单来说，越靠前价格越高；对卖单来说，越靠前价格越低），该排序跟OrderId没有关系，OrderId仅在该MonoTrade是唯一的，不同的MonoTrade里的OrderId会重复。如果后面没有订单可以返回了，返回的OrderId为0。

progress表示订单的进度，最大值是type(uint32).max，0表示一点都没成交，1 ～ type(uint32).max-1 表示部分成交，达到最大值表示完全成交。

注意这个订单列表是用户的每一个挂单，价格没有去重，需要前端合并价格一样的订单。


#### 查看当前价格
在查看挂单的基础上，获取的最靠前的订单的价格，即当前的价格。所以会有2个价格，买单的和卖单的，两者取平均值即可。


#### 查看用户的挂单

```javascripts
let lastIndex = 0
let num = 10
let userOrderArr = await publicClient.readContract({
    address: SERVICE_ADDR as `0x${string}`,
    abi: serviceJson.abi,
    args: [account.address, lastIndex, num],
    functionName: 'getUserOrders',
})
console.log('userOrderArr:', userOrderArr)
```

args里的lastIndex、num表示从用户的第几个挂单开始，往前返回num个订单。如果传入的lastIndex为0，那么从用户最近的订单开始。

返回的数据格式如下：

```javascripts
userOrderArr: [
  {
    index: 7,
    trade: '0x566137bC9A4a28214B4407dd6dE8bff291C4C21F',
    token0: '0xD6B0cD180639D9464f51A0ECb816A22ADd26f701',
    token1: '0x89491dd50EdbEE8CaAE912cbA162a6b2C6aC69ce',
    orderId: 4,
    createTime: 1725165097,
    amountIn: 100000000000000000000n,
    amountOut: 130000000n,
    progress: 0,
    isRemoved: false
  },
  ...
]
```

返回的userOrderArr是按时间排序的，从今到古。index是用户下的第几个单，不局限于某个MonoTrade，是全局的，所以返回的trade表示是哪个MonoTrade。amountIn是转了多少个token1进去，amountOut是想要多少个token0回来。如果后面没有订单了，返回的订单index为0。

orderId不是全局的，不同的MonoTrade可能有同样的orderId。

isRemoved，如果完全成交了，那么订单自动移除，标记为true，或者订单被用户取消了，也会标记为true。