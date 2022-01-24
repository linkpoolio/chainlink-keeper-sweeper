import { ethers } from 'hardhat'
import { ethGas } from '../../api/ethGas'
import { addedFeeds } from './data/addedFeeds'
import { feedTransfers } from './data/feedTransfers'
import { convertToWei, exportAddedFeeds, exportFeedTransfers } from './utils/helpers'

let network
let newlyAddedFeeds = []

async function main() {
  console.log('**** Accepting feed payeeships ****\n')

  network = await ethers.provider.getNetwork()
  const ocrSweeper = await ethers.getContract(`OCRSweeper`)

  for (let i = 0; i < feedTransfers.length; i += 40) {
    let gasPrice = await ethGas.get('')
    let tx = await ocrSweeper.acceptPayeeship(feedTransfers.slice(i, i + 40), {
      maxFeePerGas: convertToWei(gasPrice.data.fastest) + 10000000000,
    })
    await tx.wait()

    newlyAddedFeeds = newlyAddedFeeds.concat(feedTransfers.slice(i, i + 40))
  }

  console.log(`Payeeship transfer accepted for ${newlyAddedFeeds.length} feeds\n`)
}

main()
  .then(() => {
    exportAddedFeeds(newlyAddedFeeds, addedFeeds, network)
    exportFeedTransfers(
      feedTransfers.filter(
        (transfer) =>
          !newlyAddedFeeds.find((added) => added.toLowerCase() === transfer.toLowerCase())
      )
    )
    process.exit(0)
  })
  .catch((error) => {
    exportAddedFeeds(newlyAddedFeeds, addedFeeds, network)
    exportFeedTransfers(
      feedTransfers.filter(
        (transfer) =>
          !newlyAddedFeeds.find((added) => added.toLowerCase() === transfer.toLowerCase())
      )
    )
    console.error(error)
    process.exit(1)
  })
