import { ethers } from 'hardhat'
import { config } from '../config/deploy'

async function main() {
  console.log('**** Setting up test environment ****\n')

  const Oracle = await ethers.getContractFactory('ExampleOracle')
  const FluxAggregator = await ethers.getContractFactory('ExampleFluxAggregator')
  const OffchainAggregator = await ethers.getContractFactory('ExampleOffchainAggregator')

  const linkToken = await ethers.getContract('ERC677')
  const oracleSweeper = await ethers.getContract('OracleSweeper')
  const fluxSweeper = await ethers.getContract('FluxAggregatorSweeper')
  const ocrSweeper = await ethers.getContract('OffchainAggregatorSweeper')

  const oracles = []
  const fluxAggregators = []
  const offchainAggregators = []

  for (let i = 0; i < 10; i++) {
    let oracle = await Oracle.deploy(linkToken.address)
    await oracle.transferOwnership(oracleSweeper.address)
    oracles.push(oracle)

    fluxAggregators.push(
      await FluxAggregator.deploy(
        linkToken.address,
        [config.FluxAggregatorSweeper.oracle],
        [fluxSweeper.address]
      )
    )
    offchainAggregators.push(
      await OffchainAggregator.deploy(
        linkToken.address,
        [config.OffchainAggregatorSweeper.transmitter],
        [ocrSweeper.address]
      )
    )
  }

  await oracleSweeper.addContracts(oracles.map((oracle) => oracle.address))
  await fluxSweeper.addContracts(fluxAggregators.map((flux) => flux.address))
  await ocrSweeper.addContracts(offchainAggregators.map((ocr) => ocr.address))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
