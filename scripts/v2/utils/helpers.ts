import * as fs from 'fs'

export const exportAddedFeeds = (newFeeds, existingFeeds, network) => {
  fs.writeFileSync(
    `scripts/v2/data/addedFeeds.${network.name == 'unknown' ? 'localhost' : network.name}.ts`,
    'export const addedFeeds = ' +
      JSON.stringify(existingFeeds[network.chainId].concat(newFeeds), null, 1)
  )
}

export const exportFeedTransfers = (feedTransfers) => {
  fs.writeFileSync(
    `scripts/v2/data/feedTransfers.ts`,
    'export const feedTransfers = ' + JSON.stringify(feedTransfers, null, 1)
  )
}

export const convertToWei = (gasPrice) => gasPrice * 100000000
