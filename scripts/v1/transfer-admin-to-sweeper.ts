import { ethers } from 'hardhat'
import { ethGas } from '../../api/ethGas'

const sweeperTypes = ['Oracle', 'FluxAggregator', 'OffchainAggregator']

const transferOracle = async (oracle, sweeper) => {
  let gasPrice = await ethGas.get('')

  try {
    let tx = await oracle.transferOwnership(sweeper.address, {
      gasPrice: gasPrice.data.data.rapid + 10000000000,
    })
    await tx.wait()
  } catch (error) {
    return false
  }
  return true
}

const transferFluxAggregator = async (fluxAggregator, sweeper, nodeAddress) => {
  let gasPrice = await ethGas.get('')

  try {
    let tx = await fluxAggregator.transferAdmin(nodeAddress, sweeper.address, {
      gasPrice: gasPrice.data.data.rapid + 10000000000,
    })
    await tx.wait()
  } catch (error) {
    return false
  }
  return true
}

const transferOffchainAggregator = async (offchainAggregator, sweeper, nodeAddress) => {
  let gasPrice = await ethGas.get('')

  try {
    let tx = await offchainAggregator.transferPayeeship(nodeAddress, sweeper.address, {
      gasPrice: gasPrice.data.data.rapid + 10000000000,
    })
    await tx.wait()
  } catch (error) {
    return false
  }
  return true
}

async function main() {
  console.log('**** Transferring admin ****\n')

  const sweeperType = process.argv[2]

  if (!sweeperTypes.includes(sweeperType)) {
    throw `Invalid sweeper type`
  }

  const sweeper = await ethers.getContract(`${sweeperType}Sweeper`)
  const addedContracts = await sweeper.getContracts()

  let transferAdmin
  let nodeAddress
  if (sweeperType === 'Oracle') {
    transferAdmin = transferOracle
  } else if (sweeperType === 'FluxAggregator') {
    transferAdmin = transferFluxAggregator
    nodeAddress = await sweeper.oracle()
  } else if (sweeperType === 'OffchainAggregator') {
    transferAdmin = transferOffchainAggregator
    nodeAddress = await sweeper.transmitter()
  }

  const idxsToAccept = []
  for (let i = 0; i < addedContracts.length; i++) {
    let contract = await ethers.getContractAt(sweeperType, addedContracts[i])

    let txSuccess = await transferAdmin(contract, sweeper, nodeAddress)

    if (txSuccess) {
      idxsToAccept.push(i)
    }
  }

  if (sweeperType !== 'Oracle') {
    for (let i = 0; i < idxsToAccept.length; i += 30) {
      let gasPrice = await ethGas.get('')

      let tx = await sweeper.acceptAdmin(idxsToAccept.slice(i, i + 30), {
        gasPrice: gasPrice.data.data.rapid + 10000000000,
      })
      await tx.wait()
    }
  }

  console.log(`Admin transferred for ${idxsToAccept.length} contracts\n`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
