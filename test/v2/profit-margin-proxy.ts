import { ethers } from 'hardhat'
import { Signer, Contract } from 'ethers'
import { toEther, assertThrowsAsync } from '../utils/helpers'
const { assert } = require('chai')

describe('ProfitMarginProxy', () => {
  let token: Contract
  let profitMarginProxy: Contract
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

    const ProfitMarginProxy = await ethers.getContractFactory('ProfitMarginProxy')
    profitMarginProxy = await ProfitMarginProxy.deploy(
      token.address,
      rewardsPool,
      ownerWallet,
      profitMarginFeed.address,
      2000,
      toEther(100)
    )
  })

  it('should be able to check available rewards', async () => {
    await token.transfer(profitMarginProxy.address, toEther(100))

    assert.equal(
      ethers.utils.formatEther(await profitMarginProxy.availableRewards()),
      '100.0',
      'Available rewards should be 100'
    )
  })

  it('should be able to distribute rewards', async () => {
    await profitMarginProxy.distributeRewards()

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
      await profitMarginProxy.distributeRewards()
    }, 'revert')
  })

  it('checkUpkeep should return whether or not min distribution threshold is met', async () => {
    await token.transfer(profitMarginProxy.address, toEther(99))
    assert.equal(
      (await profitMarginProxy.checkUpkeep('0x00'))[0],
      false,
      'Threshold should not be met'
    )

    await token.transfer(profitMarginProxy.address, toEther(101))
    assert.equal((await profitMarginProxy.checkUpkeep('0x00'))[0], true, 'Threshold should be met')
  })

  it('should be able to distribute rewards as a keeper', async () => {
    await profitMarginProxy.performUpkeep('0x00')

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
    await token.transfer(profitMarginProxy.address, toEther(99))

    await assertThrowsAsync(async () => {
      await profitMarginProxy.performUpkeep('0x00')
    }, 'revert')
  })

  it('should be able to update config variables', async () => {
    const a1 = '0x0000000000000000000000000000000000000001'
    const a2 = '0x0000000000000000000000000000000000000002'
    const a3 = '0x0000000000000000000000000000000000000003'

    await profitMarginProxy.setRewardsPool(a1)
    await profitMarginProxy.setOwnerWallet(a2)
    await profitMarginProxy.setProfitMarginFeed(a3)
    await profitMarginProxy.setRewardsPoolProfitShare(500)

    assert.equal(await profitMarginProxy.rewardsPool(), a1, 'New adddress should be set')
    assert.equal(await profitMarginProxy.ownerWallet(), a2, 'New adddress should be set')
    assert.equal(await profitMarginProxy.profitMarginFeed(), a3, 'New adddress should be set')
    assert.equal(await profitMarginProxy.rewardsPoolProfitShare(), 500, 'New value should be set')
  })

  it('only owner should be able to update config variables', async () => {
    await assertThrowsAsync(async () => {
      await profitMarginProxy.connect(accounts[1]).setRewardsPool(account0)
    }, 'revert')
    await assertThrowsAsync(async () => {
      await profitMarginProxy.connect(accounts[1]).setOwnerWallet(account0)
    }, 'revert')
    await assertThrowsAsync(async () => {
      await profitMarginProxy.connect(accounts[1]).setProfitMarginFeed(account0)
    }, 'revert')
    await assertThrowsAsync(async () => {
      await profitMarginProxy.connect(accounts[1]).setRewardsPoolProfitShare(100)
    }, 'revert')
  })
})
