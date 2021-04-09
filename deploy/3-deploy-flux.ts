import { ethers } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { config } from '../config/deploy'

module.exports = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const { minToWithdraw, oracle } = config.FluxAggregatorSweeper

  const keep3rSweeper = await ethers.getContract('Keep3rSweeper')

  await deploy('FluxAggregatorSweeper', {
    from: deployer,
    log: true,
    args: [keep3rSweeper.address, ethers.utils.parseEther(minToWithdraw.toString()), oracle],
  })
}

module.exports.tags = ['FluxAggregatorSweeper']
