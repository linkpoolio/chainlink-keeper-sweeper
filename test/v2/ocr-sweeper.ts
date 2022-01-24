import { ethers } from 'hardhat'
import { Signer, Contract } from 'ethers'
import { toEther, assertThrowsAsync } from '../utils/helpers'
const { assert } = require('chai')

describe('OCRSweeper', () => {
  let token: Contract
  let ocrSweeper: Contract
  let accounts: Signer[]
  let account0: string
  let transmitter: string
  let rewardsPool: string
  let ownerWallet: string
  let ocrFeeds: string[]

  before(async () => {
    accounts = await ethers.getSigners()
    account0 = await accounts[0].getAddress()
    transmitter = await accounts[1].getAddress()
    rewardsPool = await accounts[2].getAddress()
    ownerWallet = await accounts[3].getAddress()

    const Token = await ethers.getContractFactory('Token')
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
      toEther(100),
      transmitter
    )

    const OCRFeed = await ethers.getContractFactory('OCAggregator')
    ocrFeeds = []
    for (let i = 0; i < 10; i++) {
      let feed = await OCRFeed.deploy(token.address, [transmitter], [account0])
      await feed.transferPayeeship(transmitter, ocrSweeper.address)
      ocrFeeds.push(feed.address)
    }
  })

  it('only owner should be able to accept payeeship', async () => {
    await assertThrowsAsync(async () => {
      await ocrSweeper.connect(accounts[4]).acceptPayeeship(ocrFeeds)
    }, 'revert')
  })

  it('should be able to accept payeeship', async () => {
    await ocrSweeper.acceptPayeeship(ocrFeeds)
    for (let i = 0; i < ocrFeeds.length; i++) {
      let feed = await ethers.getContractAt('OCAggregator', ocrFeeds[i])
      assert.equal(await feed.payees(transmitter), ocrSweeper.address, 'OCRSweeper should be payee')
    }
  })

  it('only owner should be able to transfer payeeship', async () => {
    await assertThrowsAsync(async () => {
      await ocrSweeper.connect(accounts[4]).transferPayeeship(ocrFeeds, account0)
    }, 'revert')
  })

  it('should be able to transfer payeeship', async () => {
    await ocrSweeper.transferPayeeship(ocrFeeds, account0)
    for (let i = 0; i < ocrFeeds.length; i++) {
      let feed = await ethers.getContractAt('OCAggregator', ocrFeeds[i])
      await feed.acceptPayeeship(transmitter)
      assert.equal(await feed.payees(transmitter), account0, 'Account0 should be payee')
    }
  })

  it('only owner should be able to set transmitter', async () => {
    await assertThrowsAsync(async () => {
      await ocrSweeper.connect(accounts[4]).setTransmitter(account0)
    }, 'revert')
  })

  it('should be able to set transmitter', async () => {
    await ocrSweeper.setTransmitter(account0)
    assert.equal(await ocrSweeper.transmitter(), account0, 'Account0 should be transmitter')
  })
})
