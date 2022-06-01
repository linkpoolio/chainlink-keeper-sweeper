import { ethers } from 'hardhat'
import { Contract } from 'ethers'

let account0: string
let token: Contract
let ocaSweeper: Contract
let ocaFeeds: string[]

async function setup() {
  const accounts = await ethers.getSigners()
  account0 = await accounts[0].getAddress()
  const transmitter = await accounts[1].getAddress()
  const rewardsPool = await accounts[2].getAddress()
  const ownerWallet = await accounts[3].getAddress()

  const Token = await ethers.getContractFactory('LinkToken')
  token = await Token.deploy('Chainlink', 'LINK', 1000000000)

  const ProfitMarginFeed = await ethers.getContractFactory('ProfitMarginFeed')
  const profitMarginFeed = await ProfitMarginFeed.deploy(4000)

  const OCASweeper = await ethers.getContractFactory('OCASweeper')
  ocaSweeper = await OCASweeper.deploy(
    token.address,
    rewardsPool,
    ownerWallet,
    profitMarginFeed.address,
    2000,
    ethers.utils.parseEther('100'),
    transmitter
  )

  const OCAFeed = await ethers.getContractFactory('OffchainAggregator')
  ocaFeeds = []
  for (let i = 0; i < 30; i++) {
    let feed = await OCAFeed.deploy(token.address, [transmitter], [account0])
    await feed.transferPayeeship(transmitter, ocaSweeper.address)
    ocaFeeds.push(feed.address)
  }

  await token.transfer(ocaSweeper.address, ethers.utils.parseEther('200'))
}

async function main() {
  await setup()
  console.log('**** GAS ESTIMATES ****\n')

  console.log(
    'distributeRewards -> ',
    (await ocaSweeper.estimateGas.distributeRewards()).toNumber().toLocaleString()
  )

  console.log(
    'performUpkeep -> ',
    (await ocaSweeper.estimateGas.performUpkeep('0x00')).toNumber().toLocaleString()
  )

  console.log(
    'acceptPayeeship (30 feeds) -> ',
    (await ocaSweeper.estimateGas.acceptPayeeship(ocaFeeds)).toNumber().toLocaleString()
  )

  await ocaSweeper.acceptPayeeship(ocaFeeds)

  console.log(
    'transferPayeeship (30 feeds) -> ',
    (await ocaSweeper.estimateGas.transferPayeeship(ocaFeeds, account0)).toNumber().toLocaleString()
  )

  console.log('\n')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
