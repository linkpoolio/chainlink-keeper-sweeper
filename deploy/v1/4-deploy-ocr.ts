import { ethers } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { config } from '../config/v1/deploy'

module.exports = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const { minToWithdraw, transmitter } = config.OffchainAggregatorSweeper

  const linkToken = await ethers.getContract('LinkToken')
  const keeperSweeper = await ethers.getContract('KeeperSweeper')

  const sweeper = await deploy('OffchainAggregatorSweeper', {
    from: deployer,
    log: true,
    args: [
      keeperSweeper.address,
      ethers.utils.parseEther(minToWithdraw.toString()),
      transmitter,
      linkToken.address,
    ],
  })

  const tx = await keeperSweeper.addSweeper(sweeper.address)
  await tx.wait()
}

module.exports.tags = ['V1-OffchainAggregatorSweeper']
