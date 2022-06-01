import { ethers } from 'hardhat'
import { market } from '../../api/market'
import { ethGas } from '../../api/ethGas'
import { addedFeeds } from './data/addedFeeds'
import { feedTransfers } from './data/feedTransfers'
import { convertToWei, exportFeedTransfers } from './utils/helpers'

let network
let newFeedTransfers = []

const getFeedsToTransfer = async (walletAddress, network) => {
  const networkId = network.chainId === 7777 ? 1 : network.chainId
  const excludeFeeds = addedFeeds[networkId].concat(feedTransfers)

  const totalFeeds = (
    await market.get('feeds', {
      params: { networkId },
    })
  ).data.totalCount

  let feedsToAdd = []
  for (let i = 1; (i - 1) * 50 < totalFeeds; i++) {
    let response = await market.get('feeds', {
      params: { networkId, size: 50, page: i },
    })

    let feeds = response.data.data

    feeds = feeds.filter(
      (feed) =>
        feed.type.name === 'OFFCHAIN_AGGREGATOR' &&
        feed.walletAddresses
          ?.map((address) => address.toLowerCase())
          .includes(walletAddress.toLowerCase())
    )

    feedsToAdd = feedsToAdd.concat(feeds)
  }

  return feedsToAdd
    .map((feed) => feed.contractAddress)
    .filter(
      (address) =>
        !excludeFeeds.find(
          (excludeAddress) => excludeAddress.toLowerCase() === address.toLowerCase()
        )
    )
}

async function main() {
  console.log('**** Transferring feed payseeships ****\n')

  network = await ethers.provider.getNetwork()

  const walletAddress = process.argv[2]
  const ocaSweeper = await ethers.getContract(`OCASweeper`)
  const transmitter = await ocaSweeper.transmitter()
  const feedsToTransfer = await getFeedsToTransfer(walletAddress, network)

  for (let i = 0; i < feedsToTransfer.length; i++) {
    let feed = await ethers.getContractAt('OffchainAggregator', feedsToTransfer[i])

    let gasPrice = await ethGas.get('')
    let tx = await feed.transferPayeeship(transmitter, ocaSweeper.address, {
      maxFeePerGas: convertToWei(gasPrice.data.fastest) + 10000000000,
    })
    await tx.wait()

    newFeedTransfers.push(feedsToTransfer[i])
  }

  console.log(`Payeeship transfer initiated for ${newFeedTransfers.length} feeds \n`)
}

main()
  .then(() => {
    exportFeedTransfers(feedTransfers.concat(newFeedTransfers))
    process.exit(0)
  })
  .catch((error) => {
    exportFeedTransfers(feedTransfers.concat(newFeedTransfers))
    console.error(error)
    process.exit(1)
  })
