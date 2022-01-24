import { ethers } from 'hardhat'
import { Signer, Contract } from 'ethers'
import { toEther, assertThrowsAsync } from '../utils/helpers'
const { assert } = require('chai')

describe('OCASweeper', () => {
  let token: Contract
  let ocaSweeper: Contract
  let accounts: Signer[]
  let account0: string
  let transmitter: string
  let rewardsPool: string
  let ownerWallet: string
  let ocaFeeds: string[]

  before(async () => {
    accounts = await ethers.getSigners()
    account0 = await accounts[0].getAddress()
    transmitter = await accounts[1].getAddress()
    rewardsPool = await accounts[2].getAddress()
    ownerWallet = await accounts[3].getAddress()

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
      toEther(100),
      transmitter
    )

    const OCAFeed = await ethers.getContractFactory('OffchainAggregator')
    ocaFeeds = []
    for (let i = 0; i < 10; i++) {
      let feed = await OCAFeed.deploy(token.address, [transmitter], [account0])
      await feed.transferPayeeship(transmitter, ocaSweeper.address)
      ocaFeeds.push(feed.address)
    }
  })

  it('only owner should be able to accept payeeship', async () => {
    await assertThrowsAsync(async () => {
      await ocaSweeper.connect(accounts[4]).acceptPayeeship(ocaFeeds)
    }, 'revert')
  })

  it('should be able to accept payeeship', async () => {
    await ocaSweeper.acceptPayeeship(ocaFeeds)
    for (let i = 0; i < ocaFeeds.length; i++) {
      let feed = await ethers.getContractAt('OffchainAggregator', ocaFeeds[i])
      assert.equal(await feed.payees(transmitter), ocaSweeper.address, 'OCASweeper should be payee')
    }
  })

  it('only owner should be able to transfer payeeship', async () => {
    await assertThrowsAsync(async () => {
      await ocaSweeper.connect(accounts[4]).transferPayeeship(ocaFeeds, account0)
    }, 'revert')
  })

  it('should be able to transfer payeeship', async () => {
    await ocaSweeper.transferPayeeship(ocaFeeds, account0)
    for (let i = 0; i < ocaFeeds.length; i++) {
      let feed = await ethers.getContractAt('OffchainAggregator', ocaFeeds[i])
      await feed.acceptPayeeship(transmitter)
      assert.equal(await feed.payees(transmitter), account0, 'Account0 should be payee')
    }
  })

  it('only owner should be able to set transmitter', async () => {
    await assertThrowsAsync(async () => {
      await ocaSweeper.connect(accounts[4]).setTransmitter(account0)
    }, 'revert')
  })

  it('should be able to set transmitter', async () => {
    await ocaSweeper.setTransmitter(account0)
    assert.equal(await ocaSweeper.transmitter(), account0, 'Account0 should be transmitter')
  })
})
