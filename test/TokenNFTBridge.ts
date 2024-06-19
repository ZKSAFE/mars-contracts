import { time, loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import hre from 'hardhat'
import * as viem from 'viem'

async function deploy() {
    const accounts = await hre.viem.getWalletClients()
    const publicClient = await hre.viem.getPublicClient()
    console.log('deployer:', accounts[0].account.address)

    const token = await hre.viem.deployContract('MockERC20', ['Token', 'Token'])
    console.log('token deployed:', token.address)

    const nft = await hre.viem.deployContract('MockERC721', ['NFT', 'NFT'])
    console.log('nft deployed:', nft.address)

    const bridge = await hre.viem.deployContract('TokenNFTBridge', [token.address, nft.address, viem.parseUnits('10', 18)])
    console.log('bridge deployed:', bridge.address)

    return { accounts, publicClient, token, nft, bridge }
}

describe('TokenNFTBridge test', function () {
    it('test 1', async function () {
        const { accounts, publicClient, token, nft, bridge } = await loadFixture(deploy)

        //mint
        await token.write.mint([accounts[0].account.address, viem.parseUnits('100.99', 18)])
        await token.write.mint([accounts[1].account.address, viem.parseUnits('100', 18)])
        await nft.write.mint([accounts[1].account.address, 1n])
        await nft.write.mint([accounts[1].account.address, 2n])
        await nft.write.mint([accounts[1].account.address, 3n])
        console.log('mint done')

        //add liquidity
        await nft.write.transferFrom([accounts[1].account.address, bridge.address, 1n], { account: accounts[1].account })
        await nft.write.transferFrom([accounts[1].account.address, bridge.address, 2n], { account: accounts[1].account })
        console.log('add liquidity done')

        //tokenToNFTs
        await token.write.approve([bridge.address, viem.parseUnits('20', 18)])
        await bridge.write.tokenToNFTs([[1n, 2n]])
        console.log('tokenToNFTs done')
        console.log('account0 token:', viem.formatUnits(await token.read.balanceOf([accounts[0].account.address]), 18))
        console.log('nft #1', await nft.read.ownerOf([1n]))
        console.log('nft #2', await nft.read.ownerOf([2n]))

        //NFTsToToken
        await nft.write.approve([bridge.address, 1n])
        await nft.write.approve([bridge.address, 2n])
        await bridge.write.NFTsToToken([[1n, 2n]])
        console.log('NFTsToToken done')
        console.log('account0 token:', viem.formatUnits(await token.read.balanceOf([accounts[0].account.address]), 18))
        console.log('nft #1', await nft.read.ownerOf([1n]))
        console.log('nft #2', await nft.read.ownerOf([2n]))
    })
})