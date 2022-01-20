import { ethers } from 'hardhat'
import { Signer, Contract } from 'ethers'
import { toEther, assertThrowsAsync } from '../utils/helpers'
const { assert } = require('chai')

describe('RevenueSplit', () => {
  let token: Contract
  let revenueSplit: Contract
  let accounts: Signer[]
  let account0: string
  let rewardsPool: string
  let ownerWallet: string

  before(async () => {
    accounts = await ethers.getSigners()
    account0 = await accounts[0].getAddress()
    rewardsPool = await accounts[1].getAddress()
    ownerWallet = await accounts[2].getAddress()

    const Token = await ethers.getContractFactory('contracts/v2/mock/LinkToken.sol:LinkToken')
    token = await Token.deploy('Chainlink', 'LINK', 1000000000)

    const ProfitMarginFeed = await ethers.getContractFactory('ProfitMarginFeed')
    const profitMarginFeed = await ProfitMarginFeed.deploy(4000)

    const RevenueSplit = await ethers.getContractFactory('RevenueSplit')
    revenueSplit = await RevenueSplit.deploy(
      token.address,
      rewardsPool,
      ownerWallet,
      profitMarginFeed.address,
      2000,
      toEther(100)
    )
  })

  it('should be able to check available rewards', async () => {
    await token.transfer(revenueSplit.address, toEther(100))

    assert.equal(
      ethers.utils.formatEther(await revenueSplit.availableRewards()),
      '100.0',
      'Available rewards should be 100'
    )
  })

  it('should be able to distribute rewards', async () => {
    await revenueSplit.distributeRewards()

    assert.equal(
      ethers.utils.formatEther(await token.balanceOf(rewardsPool)),
      '8.0',
      'RewardsPool balance should be 8'
    )
    assert.equal(
      ethers.utils.formatEther(await token.balanceOf(ownerWallet)),
      '92.0',
      'OwnerWallet balance should be 92'
    )
  })

  it('should not be able to distribute rewards when availableRewards is 0', async () => {
    await assertThrowsAsync(async () => {
      await revenueSplit.distributeRewards()
    }, 'revert')
  })

  it('checkUpkeep should return whether or not min distribution threshold is met', async () => {
    await token.transfer(revenueSplit.address, toEther(99))
    assert.equal((await revenueSplit.checkUpkeep('0x00'))[0], false, 'Threshold should not be met')

    await token.transfer(revenueSplit.address, toEther(101))
    assert.equal((await revenueSplit.checkUpkeep('0x00'))[0], true, 'Threshold should be met')
  })

  it('should be able to distribute rewards as a keeper', async () => {
    await revenueSplit.performUpkeep('0x00')

    assert.equal(
      ethers.utils.formatEther(await token.balanceOf(rewardsPool)),
      '24.0',
      'RewardsPool balance should be 24'
    )
    assert.equal(
      ethers.utils.formatEther(await token.balanceOf(ownerWallet)),
      '276.0',
      'OwnerWallet balance should be 276'
    )
  })

  it('should not be able to distribute rewards as a keeper if min threshold is not met', async () => {
    await token.transfer(revenueSplit.address, toEther(99))

    await assertThrowsAsync(async () => {
      await revenueSplit.performUpkeep('0x00')
    }, 'revert')
  })

  it('should be able to update config variables', async () => {
    const a1 = '0x0000000000000000000000000000000000000001'
    const a2 = '0x0000000000000000000000000000000000000002'
    const a3 = '0x0000000000000000000000000000000000000003'

    await revenueSplit.setRewardsPool(a1)
    await revenueSplit.setOwnerWallet(a2)
    await revenueSplit.setProfitMarginFeed(a3)
    await revenueSplit.setRewardsPoolProfitShare(500)

    assert.equal(await revenueSplit.rewardsPool(), a1, 'New adddress should be set')
    assert.equal(await revenueSplit.ownerWallet(), a2, 'New adddress should be set')
    assert.equal(await revenueSplit.profitMarginFeed(), a3, 'New adddress should be set')
    assert.equal(await revenueSplit.rewardsPoolProfitShare(), 500, 'New value should be set')
  })

  it('only owner should be able to update config variables', async () => {
    await assertThrowsAsync(async () => {
      await revenueSplit.connect(accounts[1]).setRewardsPool(account0)
    }, 'revert')
    await assertThrowsAsync(async () => {
      await revenueSplit.connect(accounts[1]).setOwnerWallet(account0)
    }, 'revert')
    await assertThrowsAsync(async () => {
      await revenueSplit.connect(accounts[1]).setProfitMarginFeed(account0)
    }, 'revert')
    await assertThrowsAsync(async () => {
      await revenueSplit.connect(accounts[1]).setRewardsPoolProfitShare(100)
    }, 'revert')
  })
})
