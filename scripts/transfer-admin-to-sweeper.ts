import { ethers } from 'hardhat'
import { ethGasStation } from '../api/ethGasStation'

const sweeperTypes = ['Oracle', 'FluxAggregator', 'OffchainAggregator']

const transferOracle = async (oracle, sweeper) => {
  return oracle.transferOwnership(sweeper.address)
}

const transferFluxAggregator = async (fluxAggregator, sweeper, nodeAddress) => {
  return fluxAggregator.transferAdmin(nodeAddress, sweeper.address)
}

const transferOffchainAggregator = async (offchainAggregator, sweeper, nodeAddress) => {
  return offchainAggregator.transferPayeeship(nodeAddress, sweeper.address)
}

async function main() {
  console.log('**** Transferring admin ****\n')

  const sweeperType = process.argv[2]

  if (!sweeperTypes.includes(sweeperType)) {
    throw `Invalid sweeper type`
  }

  const sweeper = await ethers.getContract(`${sweeperType}Sweeper`)
  const addedContracts = await sweeper.getContracts()
  const idxs = addedContracts.map((_contract, index) => index)

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

  for (let i = 0; i < addedContracts.length; i++) {
    let contract = await ethers.getContractAt(sweeperType, addedContracts[i])
    let gasPrice = await ethGasStation.get('')
    let tx = await transferAdmin(contract, sweeper, nodeAddress, {
      gasPrice: gasPrice.data.fastest / 10 + 10,
    })
    await tx.wait()
  }

  if (sweeperType !== 'Oracle') {
    for (let i = 0; i < idxs.length; i += 30) {
      let gasPrice = await ethGasStation.get('')
      let tx = await sweeper.acceptAdmin(idxs.slice(i, i + 30), {
        gasPrice: gasPrice.data.fastest / 10 + 10,
      })
      await tx.wait()
    }
  }

  console.log(`Admin transferred for ${addedContracts.length} contracts\n`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
