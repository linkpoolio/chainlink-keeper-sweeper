import { ethers } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { config } from '../config/deploy'

module.exports = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const { minToWithdraw, oracle } = config.FluxAggregatorWithdraw

  const nodeRewards = await ethers.getContract('NodeRewards')

  await deploy('FluxAggregatorWithdraw', {
    from: deployer,
    log: true,
    args: [nodeRewards.address, ethers.utils.parseEther(minToWithdraw.toString()), oracle],
  })
}

module.exports.tags = ['Flux']
