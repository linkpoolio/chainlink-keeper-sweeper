import { ethers } from 'hardhat'
import { ethGas } from '../../api/ethGas'
import { addedFeeds } from './data/addedFeeds'
import { convertToWei, exportAddedFeeds } from './utils/helpers'

let network
let migratedFeeds = []

async function main() {
  console.log('**** Migrating ****\n')

  network = await ethers.provider.getNetwork()

  const oldSweeperAddress = process.argv[2]
  const newSweeperAddress = process.argv[3]

  const newSweeper = await ethers.getContractAt('OCASweeper', newSweeperAddress)
  const oldSweeper = await ethers.getContractAt('OffchainAggregatorSweeper', oldSweeperAddress)

  const oldFeeds = await oldSweeper.getContracts()
  const feedsToMigrate = oldFeeds.filter(
    (address) =>
      !addedFeeds[network.chainId].find(
        (addedAddress) => addedAddress.toLowerCase() === address.toLowerCase()
      )
  )
  const idxsToMigrate = Array.from(Array(oldFeeds.length)).map((v, i) => i)

  for (let i = 0; i < feedsToMigrate.length; i += 30) {
    let gasPrice = await ethGas.get('')
    let tx = await oldSweeper.transferAdmin(idxsToMigrate.slice(i, i + 30), newSweeper.address, {
      maxFeePerGas: convertToWei(gasPrice.data.fastest) + 10000000000,
    })
    await tx.wait()

    gasPrice = await ethGas.get('')
    tx = await newSweeper.acceptPayeeship(feedsToMigrate.slice(i, i + 30), {
      maxFeePerGas: convertToWei(gasPrice.data.fastest) + 10000000000,
    })
    await tx.wait()

    migratedFeeds = migratedFeeds.concat(feedsToMigrate.slice(i, i + 30))
  }

  console.log(`Migrated ${migratedFeeds.length} feeds\n`)
}

main()
  .then(() => {
    exportAddedFeeds(migratedFeeds, addedFeeds, network)
    process.exit(0)
  })
  .catch((error) => {
    exportAddedFeeds(migratedFeeds, addedFeeds, network)
    console.error(error)
    process.exit(1)
  })
