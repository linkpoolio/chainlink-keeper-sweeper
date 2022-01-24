import { ethers } from 'hardhat'
import { Contract } from 'ethers'

let account0: string
let token: Contract
let ocrSweeper: Contract
let ocrFeeds: string[]

async function setup() {
  const accounts = await ethers.getSigners()
  account0 = await accounts[0].getAddress()
  const transmitter = await accounts[1].getAddress()
  const rewardsPool = await accounts[2].getAddress()
  const ownerWallet = await accounts[3].getAddress()

  const Token = await ethers.getContractFactory('contracts/v2/mock/LinkToken.sol:LinkToken')
  token = await Token.deploy('Chainlink', 'LINK', 1000000000)

  const ProfitMarginFeed = await ethers.getContractFactory('ProfitMarginFeed')
  const profitMarginFeed = await ProfitMarginFeed.deploy(4000)

  const OCRSweeper = await ethers.getContractFactory('OCRSweeper')
  ocrSweeper = await OCRSweeper.deploy(
    token.address,
    rewardsPool,
    ownerWallet,
    profitMarginFeed.address,
    2000,
    ethers.utils.parseEther('100'),
    transmitter
  )

  const OCRFeed = await ethers.getContractFactory('OCAggregator')
  ocrFeeds = []
  for (let i = 0; i < 30; i++) {
    let feed = await OCRFeed.deploy(token.address, [transmitter], [account0])
    await feed.transferPayeeship(transmitter, ocrSweeper.address)
    ocrFeeds.push(feed.address)
  }

  token.transfer(ocrSweeper.address, ethers.utils.parseEther('200'))
}

async function main() {
  await setup()
  console.log('**** GAS ESTIMATES ****\n')

  console.log(
    'distributeRewards -> ',
    (await ocrSweeper.estimateGas.distributeRewards()).toNumber().toLocaleString()
  )

  console.log(
    'performUpkeep -> ',
    (await ocrSweeper.estimateGas.performUpkeep('0x00')).toNumber().toLocaleString()
  )

  console.log(
    'acceptPayeeship (30 feeds) -> ',
    (await ocrSweeper.estimateGas.acceptPayeeship(ocrFeeds)).toNumber().toLocaleString()
  )

  await ocrSweeper.acceptPayeeship(ocrFeeds)

  console.log(
    'transferPayeeship (30 feeds) -> ',
    (await ocrSweeper.estimateGas.transferPayeeship(ocrFeeds, account0)).toNumber().toLocaleString()
  )

  console.log('\n')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
