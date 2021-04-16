# Chainlink Keeper Sweeper

This repository contains contracts and scripts that automate the process of withdrawing rewards from Chainlink contracts.

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

## Deployment

This repo contains 4 contracts that you can deploy depending on your needs. The first contract, `KeeperSweeper` is the main controller which must be deployed while the others are optional contracts that can be deployed depending on the type of Chainlink contract you want to withdraw from. The constructor arguments for all contracts are located in `config/deploy.ts`. The fields are already filled with recommended values but the addresses should be modified for your own Chainlink node.

The main controller can be deployed with:

```
yarn deploy-keeper-sweeper
```

### Oracle

To withdraw from `Oracle` contracts, deploy `OracleSweeper` using:

```
yarn deploy-oracle-sweeper
```

### FluxAggregator

To withdraw from `FluxAggregator` contracts, deploy `FluxAggregatorSweeper` using:

```
yarn deploy-flux-sweeper
```

### OffchainAggregator

To withdraw from `OffchainAggregator` contracts, deploy `OffchainAggregatorSweeper` using:

```
yarn deploy-ocr-sweeper
```

## Adding Chainlink contracts

In order to automate withdrawal from contracts, they must be added to a sweeper. For adding `FluxAggregator` and `OffchainAggregator` contracts, you must set the environment variables `ACCESS_KEY_ID` and `SECRET_KEY` which you can find [here](https://docs.linkpool.io/docs/market_api_keys).

### Oracle

New `Oracle` contracts can be added to `OracleSweeper` using:

```
yarn sweeper-add-contracts Oracle <oracleAddress>
```

This will add `oracleAddress` to `OracleSweeper` if not already added.

### FluxAggregator

New `FluxAggregator` contracts can be added to `FluxAggregatorSweeper` using:

```
yarn sweeper-add-contracts FluxAggregator <walletAddress>
```

This will query the [Chainlink Market](https://market.link/?network=1) for all of the `FluxAggregator` feeds associated with `walletAddress` and add them to `FluxAggregatorSweeper` if not already added.

### OffchainAggregator

New `OffchainAggregator` contracts can be added to a `OffchainAggregatorSweeper` using:

```
yarn sweeper-add-contracts OffchainAggregator <walletAddress>
```

This will query the [Chainlink Market](https://market.link/?network=1) for all of the `OffchainAggregator` feeds associated with `walletAddress` and add them to `OffchainAggregatorSweeper` if not already added.

## Tranferring Admin to Sweepers

In order for a sweeper to be able to withdraw from contracts, admin privilieges must be transferred to the sweeper. The following scripts will transfer and accept admin privileges for all contracts that have been added to the respective sweeper. If the script is cancelled, when running again it will transfer admin for all contracts again even if it partially completed the last time.

### Oracle

```
yarn transfer-admin-to-sweeper Oracle
```

This will transfer ownership for all contracts added to `OracleSweeper`.

### FluxAggregator

```
yarn transfer-admin-to-sweeper FluxAggregator
```

This will transfer and accept admin for all contracts added to `FluxAggregatorSweeper`.

### OffchainAggregator

```
yarn transfer-admin-to-sweeper OffchainAggregator
```

This will transfer and accept payeeship for all contracts added to `OffchainAggregatorSweeper`.

## Withdrawing Rewards

The controller contract implements the Chainlink Keeper interface which is the recommended way to automate withdrawals but rewards can also be withdrawn manually using:

```
yarn sweep
```

This will continuously batch withdrawals by calling `checkUpKeep()` and `withdraw()` until there is nothing left to withdraw or the remaining balance is below the minimum threshold.
