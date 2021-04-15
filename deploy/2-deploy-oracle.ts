import { ethers } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { config } from '../config/deploy'

module.exports = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const { minToWithdraw } = config.OracleSweeper

  const keep3rSweeper = await ethers.getContract('Keep3rSweeper')

  const sweeper = await deploy('OracleSweeper', {
    from: deployer,
    log: true,
    args: [keep3rSweeper.address, ethers.utils.parseEther(minToWithdraw.toString())],
  })

  const tx = await keep3rSweeper.addSweeper(sweeper.address)
  await tx.wait()
}

module.exports.tags = ['OracleSweeper']
