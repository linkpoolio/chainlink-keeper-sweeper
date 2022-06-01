import { ethers } from 'hardhat'

const transferAmount = () => {
  return ethers.utils.parseEther((Math.random() * 50).toFixed(0))
}

async function main() {
  console.log('**** Depositing tokens ****\n')

  const linkToken = await ethers.getContract('LinkToken')
  const oracleSweeper = await ethers.getContract('OracleSweeper')
  const fluxSweeper = await ethers.getContract('FluxAggregatorSweeper')
  const ocrSweeper = await ethers.getContract('OffchainAggregatorSweeper')

  const oracles = await oracleSweeper.getContracts()
  const fluxAggregators = await fluxSweeper.getContracts()
  const offchainAggregators = await ocrSweeper.getContracts()

  for (let i = 0; i < oracles.length; i++) {
    await linkToken.transfer(oracles[i], transferAmount())
  }

  for (let i = 0; i < fluxAggregators.length; i++) {
    await linkToken.transfer(fluxAggregators[i], transferAmount())
  }

  for (let i = 0; i < offchainAggregators.length; i++) {
    await linkToken.transfer(offchainAggregators[i], transferAmount())
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
