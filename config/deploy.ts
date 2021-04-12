export const config = {
  Keep3rSweeper: {
    rewardsWallet: '0x240BaE5A27233Fd3aC5440B5a598467725F7D1cd',
    minRewardsForPayment: 1000,
    batchSize: 30,
  },
  FluxAggregatorSweeper: {
    minToWithdraw: 100,
    oracle: '0x240BaE5A27233Fd3aC5440B5a598467725F7D1cd',
  },
  OffchainAggregatorSweeper: {
    minToWithdraw: 100,
    transmitter: '0x240BaE5A27233Fd3aC5440B5a598467725F7D1cd',
  },
  OracleSweeper: {
    minToWithdraw: 100,
  },
}
