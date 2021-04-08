import { ethers } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { config } from '../config/deploy'

module.exports = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const { minToWithdraw } = config.OracleWithdraw

  const nodeRewards = await ethers.getContract('NodeRewards')

  await deploy('OracleWithdraw', {
    from: deployer,
    log: true,
    args: [nodeRewards.address, ethers.utils.parseEther(minToWithdraw.toString())],
  })
}

module.exports.tags = ['Oracle']
