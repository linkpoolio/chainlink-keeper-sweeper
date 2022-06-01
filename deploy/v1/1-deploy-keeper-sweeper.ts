import { ethers } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { config } from '../../config/v1/deploy'

module.exports = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const { rewardsWallet, minRewardsForPayment, batchSize } = config.KeeperSweeper

  let linkToken: any = await ethers.getContractOrNull('LinkToken')
  if (!linkToken) {
    await deploy('LinkToken', {
      from: deployer,
      log: true,
      args: ['Chainlink', 'LINK', 1000000000],
    })
    linkToken = await ethers.getContract('LinkToken')
  }

  await deploy('KeeperSweeper', {
    from: deployer,
    log: true,
    args: [
      linkToken.address,
      rewardsWallet,
      ethers.utils.parseEther(minRewardsForPayment.toString()),
      batchSize,
    ],
  })
}

module.exports.tags = ['V1-KeeperSweeper']
