import { ethers } from 'hardhat'

const sweeperTypes = ['FluxAggregator', 'OffchainAggregator']

async function main() {
  console.log('**** Transferring admin ****\n')

  const sweeperType = process.argv[2]
  const newAdmin = process.argv[3]

  if (!sweeperTypes.includes(sweeperType)) {
    throw `Invalid sweeper type`
  }

  const sweeper = await ethers.getContract(`${sweeperType}Sweeper`)
  const contracts = await sweeper.getContracts()
  const idxs = contracts.map((_contract, index) => index)

  for (let i = 0; i < idxs.length; i += 30) {
    let tx = await sweeper.transferAdmin(idxs.slice(i, i + 30), newAdmin)
    await tx.wait()
    console.log(`Admin transferred for contracts`, i, '-', Math.min(i + 29, contracts.length - 1))
  }

  console.log(`Admin transferred for ${idxs.length} contracts\n`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
