import { ethers } from 'hardhat'

async function main() {
  console.log('**** Sweeping rewards ****\n')

  const keep3rSweeper = await ethers.getContract('Keep3rSweeper')
  const linkToken = await ethers.getContract('LinkToken')

  const rewardsWallet = await keep3rSweeper.rewardsWallet()
  const startingBalance = await linkToken.balanceOf(rewardsWallet)

  let checkUpkeep = await keep3rSweeper.checkUpkeep('0x00')

  while (checkUpkeep[0]) {
    let toWithdraw = ethers.utils.defaultAbiCoder.decode(['uint256[][]'], checkUpkeep[1])[0]
    let tx = await keep3rSweeper.withdraw(toWithdraw)
    await tx.wait()
    checkUpkeep = await keep3rSweeper.checkUpkeep('0x00')
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
