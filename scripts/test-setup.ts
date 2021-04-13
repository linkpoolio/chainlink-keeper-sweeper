import { ethers } from 'hardhat'
import { config } from '../config/deploy'

async function main() {
  console.log('**** Setting up test environment ****\n')

  const Oracle = await ethers.getContractFactory('Oracle')
  const FluxAggregator = await ethers.getContractFactory('FluxAggregator')
  const OffchainAggregator = await ethers.getContractFactory('OffchainAggregator')

  const linkToken = await ethers.getContract('LinkToken')
  const oracleSweeper = await ethers.getContract('OracleSweeper')
  const fluxSweeper = await ethers.getContract('FluxAggregatorSweeper')
  const ocrSweeper = await ethers.getContract('OffchainAggregatorSweeper')

  const oracles = []
  const fluxAggregators = []
  const offchainAggregators = []

  for (let i = 0; i < 10; i++) {
    let oracle = await Oracle.deploy(linkToken.address)
    await oracle.transferOwnership(oracleSweeper.address)
    await linkToken.transfer(oracle.address, ethers.utils.parseEther('100'))
    oracles.push(oracle.address)

    let fluxAggregator = await FluxAggregator.deploy(
      linkToken.address,
      [config.FluxAggregatorSweeper.oracle],
      [fluxSweeper.address]
    )
    await linkToken.transfer(fluxAggregator.address, ethers.utils.parseEther('100'))
    fluxAggregators.push(fluxAggregator.address)

    let offchainAggregator = await OffchainAggregator.deploy(
      linkToken.address,
      [config.OffchainAggregatorSweeper.transmitter],
      [ocrSweeper.address]
    )
    await linkToken.transfer(offchainAggregator.address, ethers.utils.parseEther('100'))
    offchainAggregators.push(offchainAggregator.address)
  }

  await oracleSweeper.addContracts(oracles)
  await fluxSweeper.addContracts(fluxAggregators)
  await ocrSweeper.addContracts(offchainAggregators)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
