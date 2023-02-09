import { ethers } from 'hardhat'

const sweeperTypes = ['FluxAggregator', 'OffchainAggregator']

async function main() {
  console.log('**** Removing contracts ****\n')

  const sweeperType = process.argv[2]

  if (!sweeperTypes.includes(sweeperType)) {
    throw `Invalid sweeper type`
  }

  const sweeper = await ethers.getContract(`${sweeperType}Sweeper`)
  const contracts = await sweeper.getContracts()
  const idxs = contracts.map((_contract, index) => index)

  for (let i = 0; i < idxs.length; i++) {
    let tx = await sweeper.removeContract(i)
    await tx.wait()
    console.log('Contract', i, 'Removed')
  }

  console.log(`${idxs.length} Contracts Removed\n`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
