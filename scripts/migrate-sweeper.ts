import { ethers } from 'hardhat'
import { ethGas } from '../api/ethGas'

const sweeperTypes = ['Oracle', 'FluxAggregator', 'OffchainAggregator']

async function main() {
  console.log('**** Migrating ****\n')

  const sweeperType = process.argv[2]
  const oldSweeperAddress = process.argv[3]

  if (!sweeperTypes.includes(sweeperType)) {
    throw `Invalid sweeper type`
  }

  const sweeper = await ethers.getContract(`${sweeperType}Sweeper`)
  const addedContracts = await sweeper.getContracts()

  const oldSweeper = await ethers.getContractAt(`${sweeperType}Sweeper`, oldSweeperAddress)
  const oldContracts = await oldSweeper.getContracts()
  const contractsToMigrate = oldContracts.filter(
    (address) =>
      !addedContracts.find((addedAddress) => addedAddress.toLowerCase() === address.toLowerCase())
  )

  for (let i = 0; i < contractsToMigrate.length; i += 30) {
    let gasPrice = await ethGas.get('')

    let tx = await sweeper.addContracts(contractsToMigrate.slice(i, i + 30), {
      gasPrice: gasPrice.data.data.rapid + 10000000000,
    })
    await tx.wait()
  }

  const idxsToMigrate = Array.from(Array(oldContracts.length)).map((v, i) => i)
  for (let i = 0; i < idxsToMigrate.length; i += 30) {
    let gasPrice = await ethGas.get('')

    let tx = await oldSweeper.transferAdmin(idxsToMigrate.slice(i, i + 30), sweeper.address, {
      gasPrice: gasPrice.data.data.rapid + 10000000000,
    })
    await tx.wait()
  }

  for (let i = 0; i < idxsToMigrate.length; i += 30) {
    let gasPrice = await ethGas.get('')

    let tx = await sweeper.acceptAdmin(idxsToMigrate.slice(i, i + 30), {
      gasPrice: gasPrice.data.data.rapid + 10000000000,
    })
    await tx.wait()
  }

  console.log(`Migrated ${oldContracts.length} contracts\n`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
