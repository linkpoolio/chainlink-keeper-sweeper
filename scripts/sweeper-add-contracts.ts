import { ethers } from 'hardhat'
import { market } from '../api/market'
import { ethGasStation } from '../api/ethGasStation'

const sweeperTypes = ['Oracle', 'FluxAggregator', 'OffchainAggregator']

const addFeeds = async (sweeperType, walletAddress) => {
  const totalFeeds = (
    await market.get('feeds', {
      params: { networkId: 1 },
    })
  ).data.totalCount

  let feedsToAdd = []
  for (let i = 1; (i - 1) * 50 < totalFeeds; i++) {
    let response = await market.get('feeds', {
      params: { networkId: 1, size: 50, page: i },
    })

    let feeds = response.data.data

    if (sweeperType === 'FluxAggregator') {
      feeds = feeds.filter(
        (feed) =>
          feed.type.name === 'FLUX_AGGREGATOR' &&
          feed.walletAddresses
            ?.map((address) => address.toLowerCase())
            .includes(walletAddress.toLowerCase())
      )
    } else if (sweeperType === 'OffchainAggregator') {
      feeds = feeds.filter(
        (feed) =>
          feed.type.name === 'OFFCHAIN_AGGREGATOR' &&
          feed.oracleAddresses
            ?.map((address) => address.toLowerCase())
            .includes(walletAddress.toLowerCase())
      )
    }
    feedsToAdd = feedsToAdd.concat(feeds)
  }

  return feedsToAdd.map((feed) => feed.contractAddress)
}

async function main() {
  console.log('**** Adding contracts ****\n')

  const sweeperType = process.argv[2]
  const oracleOrWalletAddress = process.argv[3]

  if (!sweeperTypes.includes(sweeperType)) {
    throw `Invalid sweeper type`
  }

  const sweeper = await ethers.getContract(`${sweeperType}Sweeper`)
  const addedContracts = (await sweeper.getContracts()).map((feed) => feed.toLowerCase())

  let toAdd = []
  if (sweeperType == 'Oracle') {
    toAdd = [oracleOrWalletAddress]
  } else {
    toAdd = await addFeeds(sweeperType, oracleOrWalletAddress)
  }

  toAdd = toAdd.filter((contract) => !addedContracts.includes(contract.toLowerCase()))

  for (let i = 0; i < toAdd.length; i += 50) {
    let gasPrice = await ethGasStation.get('')
    await sweeper.addContracts(toAdd.slice(i, i + 50), { gasPrice: gasPrice.data.fastest / 10 })
  }

  console.log(`${toAdd.length} new contracts added\n`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
