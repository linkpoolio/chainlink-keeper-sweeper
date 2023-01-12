import { ethers } from 'hardhat'

const sweeperTypes = ['FluxAggregator', 'OffchainAggregator']

async function main() {
  console.log('**** Accepting admin transfers ****\n')

  const sweeperType = process.argv[2]

  if (!sweeperTypes.includes(sweeperType)) {
    throw `Invalid sweeper type`
  }

  const sweeper = await ethers.getContract(`${sweeperType}Sweeper`)
  const contracts = await sweeper.getContracts()

  if (sweeperType == 'FluxAggregator') {
    const oracle = await sweeper.oracle()

    for (let i = 0; i < contracts.length; i++) {
      let tx = await (await ethers.getContractAt(sweeperType, contracts[i])).acceptAdmin(oracle)
      await tx.wait()
      console.log('Accepted contract', i)
    }
  } else {
    const transmitter = await sweeper.transmitter()

    for (let i = 0; i < contracts.length; i++) {
      let tx = await (await ethers.getContractAt(sweeperType, contracts[i])).acceptPayeeship(
        transmitter
      )
      await tx.wait()
      console.log('Accepted contract', i)
    }
  }

  console.log(`Admin accepted for ${contracts.length} contracts\n`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
