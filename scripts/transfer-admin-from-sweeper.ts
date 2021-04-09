import { ethers } from 'hardhat'

const sweeperTypes = ['Oracle', 'FluxAggregator', 'OffchainAggregator']

async function main() {
  console.log('**** Transferring admin ****\n')

  const sweeperType = process.argv[2]
  const newAdmin = process.argv[3]

  if (!sweeperTypes.includes(sweeperType)) {
    throw `Invalid sweeper type`
  }

  const sweeper = await ethers.getContract(`${sweeperType}Sweeper`)
  const addedContracts = await sweeper.getContracts()
  const idxs = addedContracts.map((_contract, index) => index)

  for (let i = 0; i < idxs.length; i += 50) {
    await sweeper.transferAdmin(idxs.slice(i, i + 50), newAdmin)
  }

  console.log(`Admin transferred for ${idxs.length} contracts\n`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
