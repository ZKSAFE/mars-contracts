import hre from 'hardhat'
import * as viem from 'viem'
import { abi as factoryAbi, } from '../artifacts/contracts/MarsFactory.sol/MarsFactory.json'
import { bytecode as pairBytecode  } from '../artifacts/contracts/MarsPair.sol/MarsPair.json'


describe('Factory test', function () {

    let accounts:any
    let publicClient:any
    let token:any
    let usdt:any
    let factory:any

    before(async function () {
        accounts = await hre.viem.getWalletClients()
        publicClient = await hre.viem.getPublicClient()
        console.log('account0:', accounts[0].account.address)
    })
    

    it('deploy', async function () {
        token = await hre.viem.deployContract('MockERC20', ['TEST WETH', 'WETH'])
        console.log('token deployed:', token.address)
        await token.write.mint([accounts[0].account.address, viem.parseUnits('1000', 18)])
        await token.write.mint([accounts[1].account.address, viem.parseUnits('1000', 18)])
        
        usdt = await hre.viem.deployContract('MockERC20', ['TEST USDT', 'USDT'])
        console.log('usdt deployed:', usdt.address)
        await usdt.write.setDecimals([6])
        await usdt.write.mint([accounts[0].account.address, viem.parseUnits('1000', 6)])
        await usdt.write.mint([accounts[1].account.address, viem.parseUnits('1000', 6)])

        factory = await hre.viem.deployContract('MarsFactory', [])
        console.log('MarsFactory deployed:', factory.address)
    })


    it('createPair', async function () {
        //3 ways of computing pair address before created
        //1: contract compute pair address
        let predictedAddr = await factory.read.computePairAddr([token.address, usdt.address])
        console.log('read contract predictedAddr:', predictedAddr)

        //2: simulate createPair, the result is pair address
        const { result } = await publicClient.simulateContract({
            address: factory.address,
            abi: factoryAbi,
            functionName: 'createPair',
            args: [token.address, usdt.address],
            account: accounts[0].account
        })
        console.log('simulate pair address:', result)

        //3: local compute pair address
        let constructorParams = viem.encodeAbiParameters(
            [
              { type: 'address' },
              { type: 'address' },
              { type: 'uint8' },
              { type: 'address' }
            ],
            [token.address, usdt.address, 100, accounts[0].account.address]
        )
        let bytecodeHash = viem.keccak256(
            viem.encodePacked(
                ['bytes', 'bytes'],
                [pairBytecode as `0x${string}`, constructorParams]
            )
        )
        let salt = viem.keccak256(
            viem.encodePacked(
                ['address', 'address'], 
                [token.address, usdt.address]
            )
        )
        let computeAddr = viem.getContractAddress({
            bytecodeHash,
            from: factory.address,
            opcode: 'CREATE2', 
            salt
        })
        console.log('local computeAddr:', computeAddr)


        await factory.write.createPair([token.address, usdt.address])
        console.log('createPair done')

        let hasPair = await factory.read.hasPair([predictedAddr])
        console.log('hasPair:', hasPair)
    })


    
})