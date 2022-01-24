import { ethers } from 'hardhat'
import { ethGas } from '../../api/ethGas'

async function main() {
  console.log('**** Sweeping rewards ****\n')

  const keeperSweeper = await ethers.getContract('KeeperSweeper')
  const linkToken = await ethers.getContract('LinkToken')

  const rewardsWallet = await keeperSweeper.rewardsWallet()
  const startingBalance = await linkToken.balanceOf(rewardsWallet)

  let checkUpkeep = await keeperSweeper.checkUpkeep('0x00')

  while (checkUpkeep[0]) {
    let toWithdraw = ethers.utils.defaultAbiCoder.decode(['uint256[][]'], checkUpkeep[1])[0]

    let gasPrice = await ethGas.get('')
    let gas = (await keeperSweeper.estimateGas.withdraw(toWithdraw)).toNumber()

    let tx = await keeperSweeper.withdraw(toWithdraw, {
      gasPrice: gasPrice.data.data.rapid + 10000000000,
      gasLimit: gas + 100000,
    })
    await tx.wait()

    checkUpkeep = await keeperSweeper.checkUpkeep('0x00')
  }

  const endingBalance = await linkToken.balanceOf(rewardsWallet)
  console.log(`${ethers.utils.formatEther(endingBalance.sub(startingBalance))} tokens withdrawn\n`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
