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

#### unichainSepolia 2024/10/15
USDT_ADDR: 0x99b52f524b70cd0c93bd592b1843bf2f49a5fe75<br>
MEME_ADDR: 0x4355d86e90d1646d0b79a362b7e5b29092047bce<br>
SERVICE_ADDR: 0x9260bb1a28a1fd9f8dbd4386577003b51bb07fa6<br>
USDT_MEME_ADDR: 0x03DF076cA486b570a9Fb24bb77F7687B6e64b4Da<br>
MEME_USDT_ADDR: 0x9b16489771c8D3DaD4aA8e09A6B540B0A02D24F6<br>

[演示代码](../scripts/docs.ts) 使用`viem@2.13.8`，初始代码如下：

```javascripts
import * as viem from 'viem'
import { createPublicClient, createWalletClient, http } from 'viem'
import { lineaSepolia, unichainSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as erc20Json from '../artifacts/contracts/mock/MockERC20.sol/MockERC20.json'
import * as serviceJson from '../artifacts/contracts/v2/TradeService.sol/TradeService.json'

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


#### 查看MonoTrade的token信息
推荐用multicall一次获取多个数据：

```javascripts
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
```

返回的数据如下：

```javascripts
trade info: [
  {
    result: '0xD6B0cD180639D9464f51A0ECb816A22ADd26f701',
    status: 'success'
  },
  {
    result: '0x89491dd50EdbEE8CaAE912cbA162a6b2C6aC69ce',
    status: 'success'
  },
  { result: 100, status: 'success' }
]
```

其中，arr[2].result是fee，100表示手续费是1%。

arr[0].result是token0地址，arr[1].result是token1地址，继续获取这两个token的信息：

```javascripts
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
```

返回的数据格式如下：

```javascripts
token detail: [
  { result: 'TEST USDT', status: 'success' },
  { result: 'USDT', status: 'success' },
  { result: 6, status: 'success' },
  { result: 1999740000000n, status: 'success' },
  { result: 'TEST MEME', status: 'success' },
  { result: 'MEME', status: 'success' },
  { result: 18, status: 'success' },
  { result: 1999600000000000000000000n, status: 'success' }
]
```


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


#### 查看用户的挂单和吃单

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

返回的userOrderArr是按时间排序的，从今到古。index是用户下的第几个单，不局限于某个MonoTrade，是全局的，挂单和吃单记录都一起返回。如果后面没有订单了，返回的订单index为0。

如果是userOrder是挂单：
    - trade表示在哪个MonoTrade挂单
    - amountIn是转了多少个token1进去
    - amountOut是想要多少个token0回来
    - orderId是MonoTrade里的，非全局
    - progress表示挂单的成交进度，范围从0～4294967295，0表示未成交，4294967295表示完全成交
    - isRemoved，如果完全成交了，那么订单自动移除，标记为true，或者订单被用户取消了，也会标记为true

如果用户挂单时候的价格能够立即成交，会先吃一部分单，剩下的再挂单，那么也算是挂单，progress一开始就会大于0；如果一开始就完全成交，那么算吃单。

如果userOrder是吃单：
    - trade表示在哪个MonoTrade吃单
    - amountIn是转了多少个token0进去
    - amountOut是成交了多少个token1回来
    - orderId为0，因为没有挂单
    - progress为4294967295，吃单肯定是完全成交
    - isRemoved为true



### 写入合约
在写入合约前，推荐使用publicClient.simulateContract来模拟写入，避免上链失败

假设MEME的买入挂单如下：

- 100USDT 买 100MEME（价格：$1.00）
- 95USDT 买 100MEME（价格：$0.95）
- 90USDT 买 100MEME（价格：¥0.90）

这时候，挂一个$1.00的限价单卖出MEME，如果价格合适会立即跟第一个买单成交（或部分成交），吃完第一个买单，如果价格合适就会继续吃第二个，直到价格不合适，有两种处理方式：

1. 把剩下的MEME按$1.00的价格挂出卖单，即限价单
2. 把剩下的MEME返回给用户，即市价单

#### 限价单
挂一个$1.00的限价单卖出MEME，用120个MEME兑换120个USDT：

```javascripts
let token0In = viem.parseUnits('120', 18)
let token1Want = viem.parseUnits('120', 6)

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

hash = await walletClient.writeContract(sim.request)
console.log('placeLimitOrder done')
```

第一步需要token授权：如果挂单转入的MEME立即成交，即吃单，需要额外支付1%的MEME作为手续费（1%这个数值从合约里读出），所以需要授权token0InWithFee个MEME。

第二步模拟交易，返回的数据格式如下：

```javascripts
sim.result: [ 100000000000000000000n, 100000000n, 1000000000000000000n ]
```

这三个数值对应[ token0Pay, token1Gain, token0Fee ]，意思是：

- token0Pay 转入的token0In，有多少立即成交了
- token1Gain 立即成交了多少token1
- token0Fee 额外的手续费

可以看出，转入的120MEME，有100MEME用来吃单了，立即得到了100USDT，并且额外支付了1MEME作为手续费。

#### 只挂单不吃单（省gas优化）
如果挂的限价单价格匹配不到吃单，就会只挂单不吃单。但是，如果限价单的价格偏离太多，合约里面需要遍历几百个订单才找到合适的挂单位置，导致gas较高，有一个优化的办法，前端先找出这个位置，传给合约，合约不找只校验，就可以节省gas。

```javascripts
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

hash = await walletClient.writeContract(sim.request)
console.log('placeLimitOrder done')
```

第一步需要token授权：由于挂单是0手续费，所以授权的额度等于转入合约挂单的数量。

第二步获取插入的位置，即beforeOrderId。

第三步用beforeOrderId去挂单，如果beforeOrderId不正确，合约会自己从头开始查到合适的位置，消耗较多gas，确保挂单成功。

#### 市价单
流程跟限价单类似，只是调用的placeOrder变成了takeOrder。placeOrder和takeOrder都有吃单，区别在于：

- placeOrder吃完单后，把剩下的挂单
- takeOrder吃完单后，把剩下的返回给用户

```javascripts
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

hash = await walletClient.writeContract(sim.request)
console.log('takeOrder done')
```

返回的数据格式：

```javascripts
sim.result: [ 100000000000000000000n, 100000000n, 1000000000000000000n ]
```

这三个数值对应[ token0Pay, token1Gain, token0Fee ]，也跟限价单一样。