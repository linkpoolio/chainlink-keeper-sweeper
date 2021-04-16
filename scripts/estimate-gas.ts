import { deployments, ethers } from 'hardhat'
import { Contract } from 'ethers'
import { config } from '../config/deploy'

let keeperSweeper: Contract
let linkToken: Contract
let fluxAggregatorSweeper: Contract
let contracts: string[]

async function setup() {
  await deployments.fixture()

  linkToken = await ethers.getContract('LinkToken')
  keeperSweeper = await ethers.getContract('KeeperSweeper')
  const oracleSweeper = await ethers.getContract('OracleSweeper')
  fluxAggregatorSweeper = await ethers.getContract('FluxAggregatorSweeper')
  const offchainAggregatorSweeper = await ethers.getContract('OffchainAggregatorSweeper')

  const Oracle = await ethers.getContractFactory('Oracle')
  const FluxAggregator = await ethers.getContractFactory('FluxAggregator')
  const OffchainAggregator = await ethers.getContractFactory('OffchainAggregator')

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
      [fluxAggregatorSweeper.address]
    )
    await linkToken.transfer(fluxAggregator.address, ethers.utils.parseEther('100'))
    fluxAggregators.push(fluxAggregator.address)

    let offchainAggregator = await OffchainAggregator.deploy(
      linkToken.address,
      [config.OffchainAggregatorSweeper.transmitter],
      [offchainAggregatorSweeper.address]
    )
    await linkToken.transfer(offchainAggregator.address, ethers.utils.parseEther('100'))
    offchainAggregators.push(offchainAggregator.address)
  }

  contracts = oracles.concat(fluxAggregators).concat(offchainAggregators)

  await oracleSweeper.addContracts(oracles)
  await fluxAggregatorSweeper.addContracts(fluxAggregators)
  await offchainAggregatorSweeper.addContracts(offchainAggregators)
}

async function main() {
  await setup()
  console.log('**** GAS ESTIMATES ****\n')

  let checkUpkeep = await keeperSweeper.checkUpkeep('0x00')
  let toWithdraw = ethers.utils.defaultAbiCoder.decode(['uint256[][]'], checkUpkeep[1])[0]

  console.log(
    'withdraw rewards (30 contracts) -> ',
    (await keeperSweeper.estimateGas.withdraw(toWithdraw)).toNumber().toLocaleString()
  )

  await keeperSweeper.withdraw(toWithdraw)
  await linkToken.transfer(contracts[0], ethers.utils.parseEther('100'))

  console.log(
    'withdraw rewards (1 contract) -> ',
    (await keeperSweeper.estimateGas.withdraw([[0], [], []])).toNumber().toLocaleString()
  )

  console.log(
    'add contracts to sweeper (30 contracts) -> ',
    (await fluxAggregatorSweeper.estimateGas.addContracts(contracts.slice(0, 30)))
      .toNumber()
      .toLocaleString(),
    '\n'
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
