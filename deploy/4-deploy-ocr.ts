import { ethers } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { config } from '../config/deploy'

module.exports = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const { minToWithdraw, transmitter } = config.OffchainAggregatorSweeper

  const linkToken = await ethers.getContract('ERC677')
  const keep3rSweeper = await ethers.getContract('Keep3rSweeper')

  const sweeper = await deploy('OffchainAggregatorSweeper', {
    from: deployer,
    log: true,
    args: [
      keep3rSweeper.address,
      ethers.utils.parseEther(minToWithdraw.toString()),
      transmitter,
      linkToken.address,
    ],
  })

  await keep3rSweeper.addSweeper(sweeper.address)
}

module.exports.tags = ['OffchainAggregatorSweeper']
