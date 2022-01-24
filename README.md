# Chainlink Keeper Sweeper

This repository contains contracts and scripts that automate the process of distributing rewards from Chainlink Offchain Aggregator contracts.

## Install

```
yarn
```

Installs dependencies.

## Setup

Before you can get started you will have to set some things up:

1. Inside `hardhat.config.ts` you should add a provider url to the `networks` object for each network you would like to use
2. You should also replace `accounts[0]` with the private key of the address you will be using for contract deployments and running scripts
3. The default network used when deploying or running scripts is `localhost` so if you would like to use different network you should set the environment variable `HARDHAT_NETWORK` to a network listed in the `networks` object

To enable scripts to send transactions, you must also set the environment variable `ETH_GAS_STATION_API_KEY` which you can find [here](https://docs.ethgasstation.info/). All scripts use the fastest gas price from Eth Gas Station + 10Gwei to ensure transactions don't stall.

## Deployment

In order to deploy the Offchain Aggregator Sweeper (`OCASweeper`), you must first set the constructor arguments in `config/v2/deploy.ts`.

It can then be deployed with:

```
yarn deploy-oca-sweeper
```

## Adding feeds to OCASweeper

To transfer feeds to `OCASweeper`, you must first set the environment variables `ACCESS_KEY_ID` and `SECRET_KEY` which you can find [here](https://docs.linkpool.io/docs/market_api_keys).

Next, you should initiate the transfer of payeeship using:

```
yarn transfer-feeds
```

This will query the [Chainlink Market](https://market.link/?network=1) for all of the `OffchainAggregator` feeds associated with the `transmitter` set in `OCASweeper` and initiate a transfer of payeeship to `OCASweeper` for each feed if it has not already been transferred or initiated. Once transfer is initiated for a feed, the feed address will be exported to `scripts/v2/data/feedTransfers.ts`.

Lastly, you should accept payeeship through `OCASweeper` using:

```
yarn accept-feeds
```

This will take all the feeds listed in `scripts/v2/data/feedTransfers.ts` and accept payeeship, completing the transfer of payeeship to `OCASweeper`. Once transfer is completed for a feed, the feed address will be added to `scripts/v2/data/addedFeeds.{networkName}.ts` and removed from `scripts/v2/data/feedTransfers.ts`.
