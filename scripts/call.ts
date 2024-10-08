import * as viem from 'viem'
import { createPublicClient, createWalletClient, http } from 'viem'
import { lineaSepolia, bsc } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'


async function main() {
    const pk = '0x' + process.env.ETH_PK_0 as string
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

    const gasPrice = await publicClient.getGasPrice()
    console.log('gasPrice:', gasPrice)

    const walletClient = createWalletClient({
        account,
        chain: lineaSepolia,
        transport: http()
    })

    const hash = await walletClient.sendTransaction({
        account, 
        to: '0x3E5Ac0Ca2f9285592fAAf835F648a943B456Ea47',
        value: 0n,
        data: '0x70f5150500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000162000000000001f2c96e402c9199682d5ded26d3771c6b192c01af000000000000000000000000000000000000000000000878b53a593f3f51e2d50000000003685623db5188db62923ce6a8168e17d4f3d1793e000000000000000044f3fef3a30000000000000000000000007ab1a9b4f0f384a7dbf5490d38d3e378db368895000000000000000000000000000000000000000000000a96e288ef8f0efc0000f2c96e402c9199682d5ded26d3771c6b192c01af000000000000000044a9059cbb0000000000000000000000007edaf26b40f07ee0110255bb2084af3196d1db8f000000000000000000000000000000000000000000000a96e288ef8f0efc0000bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c000000000000000044a9059cbb0000000000000000000000007edaf26b40f07ee0110255bb2084af3196d1db8f0000000000000000000000000000000000000000000000000000000000000000',
        nonce: 3,
        gasPrice: gasPrice * 10n
    })

    console.log('done, hash:', hash)
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });