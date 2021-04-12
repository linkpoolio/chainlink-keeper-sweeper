import { ethers } from 'hardhat'

const sweeperTypes = ['Oracle', 'FluxAggregator', 'OffchainAggregator']

const transferOracle = async (oracle, sweeper) => {
  await oracle.transferOwnership(sweeper.address)
}

const transferFluxAggregator = async (fluxAggregator, sweeper, nodeAddress) => {
  await fluxAggregator.transferAdmin(nodeAddress, sweeper.address)
}

const transferOffchainAggregator = async (offchainAggregator, sweeper, nodeAddress) => {
  await offchainAggregator.transferPayeeship(nodeAddress, sweeper.address)
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
    await transferAdmin(contract, sweeper, nodeAddress)
  }

  if (sweeperType !== 'Oracle') {
    for (let i = 0; i < idxs.length; i += 50) {
      await sweeper.acceptAdmin([0])
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
