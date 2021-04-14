import { ethers } from 'hardhat'
import { market } from '../api/market'
import { ethGasStation } from '../api/ethGasStation'

const sweeperTypes = ['Oracle', 'FluxAggregator', 'OffchainAggregator']

const addOracle = async (addedContracts, oracleAddress) => {
  return !addedContracts.includes(oracleAddress.toLowerCase()) ? [oracleAddress] : []
}

const addFeeds = async (sweeperType, addedContracts, oracleOrWalletAddress) => {
  const feedTypeName = sweeperType === 'FluxAggregator' ? 'FLUX_AGGREGATOR' : 'OFFCHAIN_AGGREGATOR'
  const params =
    sweeperType === 'FluxAggregator'
      ? { oracleAddress: [oracleOrWalletAddress] }
      : { walletAddress: [oracleOrWalletAddress] }

  const totalFeeds = (
    await market.get('feeds', {
      params: { networkId: 1, ...params },
    })
  ).data.totalCount

  const feedsToAdd = []
  for (let i = 1; (i - 1) * 50 < totalFeeds; i++) {
    let response = await market.get('feeds', {
      params: { networkId: 1, size: 50, page: i, ...params },
    })

    response.data.data.forEach((feed) => {
      if (
        !addedContracts.includes(feed.contractAddress.toLowerCase()) &&
        feed.type.name === feedTypeName
      ) {
        feedsToAdd.push(feed.contractAddress)
      }
    })
  }

  return feedsToAdd
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
    toAdd = await addOracle(addedContracts, oracleOrWalletAddress)
  } else {
    toAdd = await addFeeds(sweeperType, addedContracts, oracleOrWalletAddress)
  }

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
