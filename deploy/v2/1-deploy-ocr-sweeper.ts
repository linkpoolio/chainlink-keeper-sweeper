import { ethers } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { config } from '../../config/v2/deploy'

module.exports = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  let linkToken: any = await ethers.getContractOrNull('LinkToken')
  if (!linkToken) {
    await deploy('Token', {
      from: deployer,
      log: true,
      args: ['Chainlink', 'LINK', 1000000000],
    })
    linkToken = await ethers.getContract('Token')
  }

  await deploy('OCRSweeper', {
    from: deployer,
    log: true,
    args: [linkToken.address, ...Object.values(config.OCRSweeper)],
  })
}

module.exports.tags = ['V2-OCRSweeper']
