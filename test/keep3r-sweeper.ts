import { ethers } from 'hardhat'
import { Signer, Contract } from 'ethers'
import { toEther, assertThrowsAsync } from './utils/helpers'
const { assert } = require('chai')

describe('Keep3rSweeper', () => {
  let token: Contract
  let offchainAggregator: Contract
  let offchainAggregator2: Contract
  let fluxAggregator: Contract
  let fluxAggregator2: Contract
  let oracle: Contract
  let oracle2: Contract
  let keep3rSweeper: Contract
  let offchainAggregatorSweeper: Contract
  let fluxAggregatorSweeper: Contract
  let oracleSweeper: Contract
  let accounts: Signer[]
  let sweeperIdxs = [
    [0, 1],
    [0, 1],
    [0, 1],
  ]
  let account0: string
  let rewardsWallet: string

  before(async () => {
    accounts = await ethers.getSigners()
    account0 = await accounts[0].getAddress()
    rewardsWallet = await accounts[2].getAddress()

    const Token = await ethers.getContractFactory('ERC677')
    token = await Token.deploy('Chainlink', 'LINK', '1000000000')

    const Keep3rSweeper = await ethers.getContractFactory('Keep3rSweeper')
    keep3rSweeper = await Keep3rSweeper.deploy(
      token.address,
      rewardsWallet,
      ethers.utils.parseEther('1000'),
      '10'
    )

    const OracleSweeper = await ethers.getContractFactory('OracleSweeper')
    oracleSweeper = await OracleSweeper.deploy(keep3rSweeper.address, ethers.utils.parseEther('5'))

    const Oracle = await ethers.getContractFactory('ExampleOracle')
    oracle = await Oracle.deploy(token.address)
    await oracle.transferOwnership(oracleSweeper.address)
    oracle2 = await Oracle.deploy(token.address)
    await oracle2.transferOwnership(oracleSweeper.address)

    const FluxAggregatorSweeper = await ethers.getContractFactory('FluxAggregatorSweeper')
    fluxAggregatorSweeper = await FluxAggregatorSweeper.deploy(
      keep3rSweeper.address,
      ethers.utils.parseEther('5'),
      oracle.address
    )

    const FluxAggregator = await ethers.getContractFactory('ExampleFluxAggregator')
    fluxAggregator = await FluxAggregator.deploy(
      token.address,
      [oracle.address],
      [fluxAggregatorSweeper.address]
    )
    fluxAggregator2 = await FluxAggregator.deploy(
      token.address,
      [oracle.address],
      [fluxAggregatorSweeper.address]
    )

    const OffchainAggregatorSweeper = await ethers.getContractFactory('OffchainAggregatorSweeper')
    offchainAggregatorSweeper = await OffchainAggregatorSweeper.deploy(
      keep3rSweeper.address,
      ethers.utils.parseEther('5'),
      oracle.address,
      token.address
    )

    const OffchainAggregator = await ethers.getContractFactory('ExampleOffchainAggregator')
    offchainAggregator = await OffchainAggregator.deploy(
      token.address,
      [oracle.address],
      [offchainAggregatorSweeper.address]
    )
    offchainAggregator2 = await OffchainAggregator.deploy(
      token.address,
      [oracle.address],
      [offchainAggregatorSweeper.address]
    )
  })

  it('should be able to add Sweeper contracts', async () => {
    await keep3rSweeper.addSweeper(oracleSweeper.address)
    await oracleSweeper.addContracts([oracle.address, oracle2.address])

    await keep3rSweeper.addSweeper(fluxAggregatorSweeper.address)
    await fluxAggregatorSweeper.addContracts([fluxAggregator.address, fluxAggregator2.address])

    await keep3rSweeper.addSweeper(offchainAggregatorSweeper.address)
    await offchainAggregatorSweeper.addContracts([
      offchainAggregator.address,
      offchainAggregator2.address,
    ])
  })

  it('should be able to fetch contracts list', async () => {
    let contracts = await fluxAggregatorSweeper.getContracts()
    assert.equal(contracts[0], fluxAggregator.address, 'Address should be correct')
    assert.equal(contracts[1], fluxAggregator2.address, 'Address should be correct')
  })

  it('should not be able to withdraw rewards when rewards available are less than minAmountToWithdraw', async () => {
    await token.transfer(oracle.address, toEther('1'))
    await token.transfer(oracle2.address, toEther('1'))
    await token.transfer(fluxAggregator.address, toEther('1'))
    await token.transfer(fluxAggregator2.address, toEther('1'))
    await token.transfer(offchainAggregator.address, toEther('1'))
    await token.transfer(offchainAggregator2.address, toEther('1'))

    let withdrawable = await keep3rSweeper.withdrawable()
    assert.equal(
      ethers.utils.formatEther(withdrawable[0][0]),
      '1.0',
      'Withdrawable amount should be 1'
    )
    assert.equal(
      ethers.utils.formatEther(withdrawable[1][0]),
      '1.0',
      'Withdrawable amount should be 1'
    )
    assert.equal(
      ethers.utils.formatEther(withdrawable[2][0]),
      '1.0',
      'Withdrawable amount should be 1'
    )

    await assertThrowsAsync(async () => {
      await keep3rSweeper.withdraw(sweeperIdxs)
    }, 'revert')
  })

  it('withdrawRewards index out of bounds', async () => {
    await token.transfer(oracle.address, toEther('9'))
    await token.transfer(oracle2.address, toEther('9'))
    await token.transfer(fluxAggregator.address, toEther('9'))
    await token.transfer(fluxAggregator2.address, toEther('9'))
    await token.transfer(offchainAggregator.address, toEther('9'))
    await token.transfer(offchainAggregator2.address, toEther('9'))

    await assertThrowsAsync(async () => {
      await keep3rSweeper.withdraw([[0, 1], [0], [0, 1, 2]])
    }, 'revert')
  })

  it('should be able to withdraw rewards', async () => {
    await token.transfer(oracle.address, toEther('500'))
    await token.transfer(fluxAggregator.address, toEther('500'))
    await token.transfer(offchainAggregator.address, toEther('500'))
    await token.transfer(oracle2.address, toEther('500'))
    await token.transfer(fluxAggregator2.address, toEther('500'))
    await token.transfer(offchainAggregator2.address, toEther('500'))

    let withdrawable = await keep3rSweeper.withdrawable()
    assert.equal(
      ethers.utils.formatEther(withdrawable[0][0]),
      '510.0',
      'Oracle rewards should be 510'
    )
    assert.equal(
      ethers.utils.formatEther(withdrawable[1][0]),
      '510.0',
      'Flux aggregator rewards should be 510'
    )
    assert.equal(
      ethers.utils.formatEther(withdrawable[2][0]),
      '510.0',
      'Offchain aggregator rewards should be 510'
    )
    assert.equal(
      ethers.utils.formatEther(withdrawable[0][1]),
      '510.0',
      'Oracle rewards 2 should be 510'
    )
    assert.equal(
      ethers.utils.formatEther(withdrawable[1][1]),
      '510.0',
      'Flux aggregator 2 rewards should be 510'
    )
    assert.equal(
      ethers.utils.formatEther(withdrawable[2][1]),
      '510.0',
      'Offchain aggregator 2 rewards should be 510'
    )

    await keep3rSweeper.connect(accounts[4]).withdraw(sweeperIdxs)
    withdrawable = await keep3rSweeper.withdrawable()

    assert.equal(ethers.utils.formatEther(withdrawable[0][0]), '0.0', 'Oracle rewards should be 0')
    assert.equal(
      ethers.utils.formatEther(withdrawable[1][0]),
      '0.0',
      'Flux aggregator rewards should be 0'
    )
    assert.equal(
      ethers.utils.formatEther(withdrawable[2][0]),
      '0.0',
      'Offchain aggregator rewards should be 0'
    )
    assert.equal(
      ethers.utils.formatEther(withdrawable[0][1]),
      '0.0',
      'Oracle rewards 2 should be 0'
    )
    assert.equal(
      ethers.utils.formatEther(withdrawable[1][1]),
      '0.0',
      'Flux aggregator 2 rewards should be 0'
    )
    assert.equal(
      ethers.utils.formatEther(withdrawable[2][1]),
      '0.0',
      'Offchain aggregator 2 rewards should be 0'
    )
  })

  it('rewards wallet should show new rewards', async () => {
    assert.equal(
      ethers.utils.formatEther(await token.balanceOf(rewardsWallet)),
      '3060.0',
      'Rewards wallet should contain 3060'
    )
  })

  it('checkUpkeep should return correct upkeepNeeded and performData', async () => {
    await token.transfer(oracle.address, toEther('500'))
    await token.transfer(fluxAggregator.address, toEther('500'))
    await token.transfer(oracle2.address, toEther('500'))
    await token.transfer(offchainAggregator2.address, toEther('500'))

    let checkUpkeep = await keep3rSweeper.checkUpkeep('0x00')
    let performData = ethers.utils.defaultAbiCoder.decode(['uint256[][]'], checkUpkeep[1])[0]

    assert.equal(checkUpkeep[0], true, 'upkeepNeeded should be true')
    assert.equal(performData[0].length, '2', 'length should be correct')
    assert.equal(performData[1].length, '1', 'length should be correct')
    assert.equal(performData[2].length, '1', 'length should be correct')
    assert.equal(performData[0][0], '0', 'index should be correct')
    assert.equal(performData[1][0], '0', 'index should be correct')
    assert.equal(performData[2][0], '1', 'index should be correct')
  })

  it('should be able to withdraw rewards as keeper', async () => {
    await keep3rSweeper
      .connect(accounts[1])
      .performUpkeep((await keep3rSweeper.checkUpkeep('0x00'))[1])
    let withdrawable = await keep3rSweeper.withdrawable()
    assert.equal(ethers.utils.formatEther(withdrawable[0][0]), '0.0', 'Oracle rewards should be 0')
    assert.equal(
      ethers.utils.formatEther(withdrawable[1][0]),
      '0.0',
      'Flux aggregator rewards should be 0'
    )
    assert.equal(
      ethers.utils.formatEther(withdrawable[2][0]),
      '0.0',
      'Offchain aggregator rewards should be 0'
    )
  })

  it('rewards wallet should show new rewards', async () => {
    assert.equal(
      ethers.utils.formatEther(await token.balanceOf(rewardsWallet)),
      '5060.0',
      'Rewards wallet should contain 5060'
    )
  })

  it('checkUpkeep should return correct upkeepNeeded and performData', async () => {
    await token.transfer(fluxAggregator.address, toEther('100'))

    let checkUpkeep = await keep3rSweeper.checkUpkeep('0x00')
    let performData = ethers.utils.defaultAbiCoder.decode(['uint256[][]'], checkUpkeep[1])[0]

    assert.equal(checkUpkeep[0], false, 'upkeepNeeded should be false')
    assert.equal(performData[0].length, '0', 'length should be 0')
    assert.equal(performData[1].length, '1', 'length should be 0')
    assert.equal(performData[2].length, '0', 'length should be 0')
  })

  it('withdrawing node rewards < minRewardsForPayment as a keeper should revert', async () => {
    await token.transfer(oracle.address, toEther('100'))
    await token.transfer(fluxAggregator.address, toEther('100'))
    await token.transfer(offchainAggregator.address, toEther('100'))

    await assertThrowsAsync(async () => {
      await keep3rSweeper.performUpkeep((await keep3rSweeper.checkUpkeep('0x00'))[1])
    }, 'revert')
  })

  it('withdrawing node rewards == 0 should revert', async () => {
    await keep3rSweeper.withdraw([[0], [0], [0]])

    await assertThrowsAsync(async () => {
      await keep3rSweeper.withdraw([[0], [0], [0]])
    }, 'revert')
  })

  it('should be able to change minToWithdraw for OracleSweeper, FluxAggregatorSweeper, OffchainAggregatorSweeper', async () => {
    await oracleSweeper.setMinToWithdraw(toEther('11'))
    await fluxAggregatorSweeper.setMinToWithdraw(toEther('11'))
    await offchainAggregatorSweeper.setMinToWithdraw(toEther('11'))
    await token.transfer(oracle.address, toEther('10'))
    await token.transfer(fluxAggregator.address, toEther('10'))
    await token.transfer(offchainAggregator.address, toEther('10'))
    await token.transfer(oracle2.address, toEther('10'))
    await token.transfer(fluxAggregator2.address, toEther('10'))
    await token.transfer(offchainAggregator2.address, toEther('10'))

    await assertThrowsAsync(async () => {
      await keep3rSweeper.withdraw(sweeperIdxs)
    }, 'revert')
  })

  it('should be able to change minRewardsForPayment', async () => {
    await assertThrowsAsync(async () => {
      await keep3rSweeper.performUpkeep((await keep3rSweeper.checkUpkeep('0x00'))[1])
    }, 'revert')

    await oracleSweeper.setMinToWithdraw(toEther('1'))
    await fluxAggregatorSweeper.setMinToWithdraw(toEther('1'))
    await offchainAggregatorSweeper.setMinToWithdraw(toEther('1'))
    await keep3rSweeper.setMinRewardsForPayment(toEther('5'))

    await keep3rSweeper.performUpkeep((await keep3rSweeper.checkUpkeep('0x00'))[1])

    assert.equal(
      ethers.utils.formatEther(await token.balanceOf(rewardsWallet)),
      '5520.0',
      'Rewards wallet should contain 5520'
    )
  })

  it('batch size limit should be respected', async () => {
    await token.transfer(oracle.address, toEther('10'))
    await token.transfer(oracle2.address, toEther('10'))
    await token.transfer(fluxAggregator.address, toEther('10'))
    await token.transfer(offchainAggregator2.address, toEther('10'))

    let checkUpkeep = await keep3rSweeper.checkUpkeep('0x00')
    let performData = ethers.utils.defaultAbiCoder.decode(['uint256[][]'], checkUpkeep[1])[0]

    assert.equal(performData[0].length, '2', 'Length should be 2')
    assert.equal(performData[1].length, '1', 'Length should be 1')
    assert.equal(performData[2].length, '1', 'Length should be 1')

    await keep3rSweeper.setBatchSize('3')

    checkUpkeep = await keep3rSweeper.checkUpkeep('0x00')
    performData = ethers.utils.defaultAbiCoder.decode(['uint256[][]'], checkUpkeep[1])[0]

    assert.equal(performData[0].length, '2', 'Length should be 2')
    assert.equal(performData[1].length, '1', 'Length should be 1')
    assert.equal(performData[2].length, '0', 'Length should be 0')

    await keep3rSweeper.setBatchSize('2')

    checkUpkeep = await keep3rSweeper.checkUpkeep('0x00')
    performData = ethers.utils.defaultAbiCoder.decode(['uint256[][]'], checkUpkeep[1])[0]

    assert.equal(performData[0].length, '2', 'Length should be 2')
    assert.equal(performData[1].length, '0', 'Length should be 0')
    assert.equal(performData[2].length, '0', 'Length should be 0')
  })

  it('only Keep3rSweeper should be able to withdraw rewards', async () => {
    await assertThrowsAsync(async () => {
      await oracleSweeper.withdraw([0])
    }, 'revert')
    await assertThrowsAsync(async () => {
      await fluxAggregatorSweeper.withdraw([0])
    }, 'revert')
    await assertThrowsAsync(async () => {
      await offchainAggregatorSweeper.withdraw([0])
    }, 'revert')
  })

  it('should be able to transfer admin for all contract types', async () => {
    await token.transfer(oracle.address, toEther('100'))
    await token.transfer(fluxAggregator.address, toEther('100'))
    await token.transfer(offchainAggregator.address, toEther('100'))
    await token.transfer(oracle2.address, toEther('100'))
    await token.transfer(fluxAggregator2.address, toEther('100'))
    await token.transfer(offchainAggregator2.address, toEther('100'))

    await oracleSweeper.transferAdmin([0, 1], account0)
    await assertThrowsAsync(async () => {
      await keep3rSweeper.withdraw([[1], [], []])
    }, 'revert')
    await oracle.transferOwnership(oracleSweeper.address)
    await keep3rSweeper.withdraw([[0], [], []])

    await fluxAggregatorSweeper.transferAdmin([0], account0)
    await assertThrowsAsync(async () => {
      await keep3rSweeper.withdraw([[], [0], []])
    }, 'revert')
    await keep3rSweeper.withdraw([[], [1], []])
    await fluxAggregator.transferAdmin(oracle.address, fluxAggregatorSweeper.address)
    await keep3rSweeper.withdraw([[], [0], []])

    await offchainAggregatorSweeper.transferAdmin([1], account0)
    await assertThrowsAsync(async () => {
      await keep3rSweeper.withdraw([[], [], [1]])
    }, 'revert')
    await keep3rSweeper.withdraw([[], [], [0]])
    await offchainAggregator2.transferPayeeship(oracle.address, offchainAggregatorSweeper.address)
    await keep3rSweeper.withdraw([[], [], [1]])
  })

  it('only owner should be able to transfer admin', async () => {
    await assertThrowsAsync(async () => {
      await oracleSweeper.connect(accounts[1]).transferAdmin([0], account0)
    }, 'revert')

    await assertThrowsAsync(async () => {
      await fluxAggregatorSweeper.connect(accounts[1]).transferAdmin([0], account0)
    }, 'revert')

    await assertThrowsAsync(async () => {
      await offchainAggregatorSweeper.connect(accounts[1]).transferAdmin([0], account0)
    }, 'revert')
  })

  it('should be able to remove sweepers and contracts', async () => {
    await token.transfer(oracle.address, toEther('10'))
    await token.transfer(offchainAggregator.address, toEther('10'))
    await fluxAggregatorSweeper.removeContract(0)

    await assertThrowsAsync(async () => {
      await keep3rSweeper.withdraw(sweeperIdxs)
    }, 'revert')

    sweeperIdxs = [[0], []]
    await keep3rSweeper.withdraw(sweeperIdxs)

    await oracleSweeper.removeContract(0)
    await offchainAggregatorSweeper.removeContract(0)

    await keep3rSweeper.removeSweeper(1)
    await keep3rSweeper.removeSweeper(0)
    await keep3rSweeper.removeSweeper(0)
  })
})
