import { ethers } from 'hardhat'
import { Signer, Contract } from 'ethers'
import { toEther, assertThrowsAsync } from './utils/helpers'
const { assert } = require('chai')

describe('NodeRewards', () => {
  let token: Contract
  let offchainAggregator: Contract
  let offchainAggregator2: Contract
  let fluxAggregator: Contract
  let fluxAggregator2: Contract
  let oracle: Contract
  let oracle2: Contract
  let nodeRewards: Contract
  let offchainAggregatorWithdraw: Contract
  let fluxAggregatorWithdraw: Contract
  let oracleWithdraw: Contract
  let accounts: Signer[]
  let factoriesIdxs = [
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

    const NodeRewards = await ethers.getContractFactory('NodeRewards')
    nodeRewards = await NodeRewards.deploy(
      token.address,
      rewardsWallet,
      ethers.utils.parseEther('1000'),
      '10'
    )

    const OracleWithdraw = await ethers.getContractFactory('OracleWithdraw')
    oracleWithdraw = await OracleWithdraw.deploy(nodeRewards.address, ethers.utils.parseEther('5'))

    const Oracle = await ethers.getContractFactory('ExampleOracle')
    oracle = await Oracle.deploy(token.address)
    await oracle.transferOwnership(oracleWithdraw.address)
    oracle2 = await Oracle.deploy(token.address)
    await oracle2.transferOwnership(oracleWithdraw.address)

    const FluxAggregatorWithdraw = await ethers.getContractFactory('FluxAggregatorWithdraw')
    fluxAggregatorWithdraw = await FluxAggregatorWithdraw.deploy(
      nodeRewards.address,
      ethers.utils.parseEther('5'),
      oracle.address
    )

    const FluxAggregator = await ethers.getContractFactory('ExampleFluxAggregator')
    fluxAggregator = await FluxAggregator.deploy(
      token.address,
      [oracle.address],
      [fluxAggregatorWithdraw.address]
    )
    fluxAggregator2 = await FluxAggregator.deploy(
      token.address,
      [oracle.address],
      [fluxAggregatorWithdraw.address]
    )

    const OffchainAggregatorWithdraw = await ethers.getContractFactory('OffchainAggregatorWithdraw')
    offchainAggregatorWithdraw = await OffchainAggregatorWithdraw.deploy(
      nodeRewards.address,
      ethers.utils.parseEther('5'),
      oracle.address,
      token.address
    )

    const OffchainAggregator = await ethers.getContractFactory('ExampleOffchainAggregator')
    offchainAggregator = await OffchainAggregator.deploy(
      token.address,
      [oracle.address],
      [offchainAggregatorWithdraw.address]
    )
    offchainAggregator2 = await OffchainAggregator.deploy(
      token.address,
      [oracle.address],
      [offchainAggregatorWithdraw.address]
    )
  })

  it('should be able to add withdraw contracts', async () => {
    await nodeRewards.addFactory(oracleWithdraw.address)
    await oracleWithdraw.addContracts([oracle.address, oracle2.address])

    await nodeRewards.addFactory(fluxAggregatorWithdraw.address)
    await fluxAggregatorWithdraw.addContracts([fluxAggregator.address, fluxAggregator2.address])

    await nodeRewards.addFactory(offchainAggregatorWithdraw.address)
    await offchainAggregatorWithdraw.addContracts([
      offchainAggregator.address,
      offchainAggregator2.address,
    ])
  })

  it('should be able to fetch contracts list', async () => {
    let contracts = await fluxAggregatorWithdraw.getContracts()
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

    let withdrawable = await nodeRewards.withdrawable()
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
      await nodeRewards.withdraw(factoriesIdxs)
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
      await nodeRewards.withdraw([[0, 1], [0], [0, 1, 2]])
    }, 'revert')
  })

  it('should be able to withdraw rewards', async () => {
    await token.transfer(oracle.address, toEther('500'))
    await token.transfer(fluxAggregator.address, toEther('500'))
    await token.transfer(offchainAggregator.address, toEther('500'))
    await token.transfer(oracle2.address, toEther('500'))
    await token.transfer(fluxAggregator2.address, toEther('500'))
    await token.transfer(offchainAggregator2.address, toEther('500'))

    let withdrawable = await nodeRewards.withdrawable()
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

    await nodeRewards.connect(accounts[4]).withdraw(factoriesIdxs)
    withdrawable = await nodeRewards.withdrawable()

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

    let checkUpkeep = await nodeRewards.checkUpkeep('0x00')
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
    await nodeRewards.connect(accounts[1]).performUpkeep((await nodeRewards.checkUpkeep('0x00'))[1])
    let withdrawable = await nodeRewards.withdrawable()
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

    let checkUpkeep = await nodeRewards.checkUpkeep('0x00')
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
      await nodeRewards.performUpkeep((await nodeRewards.checkUpkeep('0x00'))[1])
    }, 'revert')
  })

  it('withdrawing node rewards == 0 should revert', async () => {
    await nodeRewards.withdraw([[0], [0], [0]])

    await assertThrowsAsync(async () => {
      await nodeRewards.withdraw([[0], [0], [0]])
    }, 'revert')
  })

  it('should be able to change minToWithdraw for OracleWithdraw, FluxAggregatorWithdraw, OffchainAggregatorWithdraw', async () => {
    await oracleWithdraw.setMinToWithdraw(toEther('11'))
    await fluxAggregatorWithdraw.setMinToWithdraw(toEther('11'))
    await offchainAggregatorWithdraw.setMinToWithdraw(toEther('11'))
    await token.transfer(oracle.address, toEther('10'))
    await token.transfer(fluxAggregator.address, toEther('10'))
    await token.transfer(offchainAggregator.address, toEther('10'))
    await token.transfer(oracle2.address, toEther('10'))
    await token.transfer(fluxAggregator2.address, toEther('10'))
    await token.transfer(offchainAggregator2.address, toEther('10'))

    await assertThrowsAsync(async () => {
      await nodeRewards.withdraw(factoriesIdxs)
    }, 'revert')
  })

  it('should be able to change minRewardsForPayment', async () => {
    await assertThrowsAsync(async () => {
      await nodeRewards.performUpkeep((await nodeRewards.checkUpkeep('0x00'))[1])
    }, 'revert')

    await oracleWithdraw.setMinToWithdraw(toEther('1'))
    await fluxAggregatorWithdraw.setMinToWithdraw(toEther('1'))
    await offchainAggregatorWithdraw.setMinToWithdraw(toEther('1'))
    await nodeRewards.setMinRewardsForPayment(toEther('5'))

    await nodeRewards.performUpkeep((await nodeRewards.checkUpkeep('0x00'))[1])

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

    let checkUpkeep = await nodeRewards.checkUpkeep('0x00')
    let performData = ethers.utils.defaultAbiCoder.decode(['uint256[][]'], checkUpkeep[1])[0]

    assert.equal(performData[0].length, '2', 'Length should be 2')
    assert.equal(performData[1].length, '1', 'Length should be 1')
    assert.equal(performData[2].length, '1', 'Length should be 1')

    await nodeRewards.setBatchSize('3')

    checkUpkeep = await nodeRewards.checkUpkeep('0x00')
    performData = ethers.utils.defaultAbiCoder.decode(['uint256[][]'], checkUpkeep[1])[0]

    assert.equal(performData[0].length, '2', 'Length should be 2')
    assert.equal(performData[1].length, '1', 'Length should be 1')
    assert.equal(performData[2].length, '0', 'Length should be 0')

    await nodeRewards.setBatchSize('2')

    checkUpkeep = await nodeRewards.checkUpkeep('0x00')
    performData = ethers.utils.defaultAbiCoder.decode(['uint256[][]'], checkUpkeep[1])[0]

    assert.equal(performData[0].length, '2', 'Length should be 2')
    assert.equal(performData[1].length, '0', 'Length should be 0')
    assert.equal(performData[2].length, '0', 'Length should be 0')
  })

  it('only NodeRewards should be able to withdraw rewards', async () => {
    await assertThrowsAsync(async () => {
      await oracleWithdraw.withdraw([0])
    }, 'revert')
    await assertThrowsAsync(async () => {
      await fluxAggregatorWithdraw.withdraw([0])
    }, 'revert')
    await assertThrowsAsync(async () => {
      await offchainAggregatorWithdraw.withdraw([0])
    }, 'revert')
  })

  it('should be able to transfer admin for all contract types', async () => {
    await token.transfer(oracle.address, toEther('100'))
    await token.transfer(fluxAggregator.address, toEther('100'))
    await token.transfer(offchainAggregator.address, toEther('100'))
    await token.transfer(oracle2.address, toEther('100'))
    await token.transfer(fluxAggregator2.address, toEther('100'))
    await token.transfer(offchainAggregator2.address, toEther('100'))

    await oracleWithdraw.transferAdmin([0, 1], account0)
    await assertThrowsAsync(async () => {
      await nodeRewards.withdraw([[1], [], []])
    }, 'revert')
    await oracle.transferOwnership(oracleWithdraw.address)
    await nodeRewards.withdraw([[0], [], []])

    await fluxAggregatorWithdraw.transferAdmin([0], account0)
    await assertThrowsAsync(async () => {
      await nodeRewards.withdraw([[], [0], []])
    }, 'revert')
    await nodeRewards.withdraw([[], [1], []])
    await fluxAggregator.transferAdmin(oracle.address, fluxAggregatorWithdraw.address)
    await nodeRewards.withdraw([[], [0], []])

    await offchainAggregatorWithdraw.transferAdmin([1], account0)
    await assertThrowsAsync(async () => {
      await nodeRewards.withdraw([[], [], [1]])
    }, 'revert')
    await nodeRewards.withdraw([[], [], [0]])
    await offchainAggregator2.transferPayeeship(oracle.address, offchainAggregatorWithdraw.address)
    await nodeRewards.withdraw([[], [], [1]])
  })

  it('only owner should be able to transfer admin', async () => {
    await assertThrowsAsync(async () => {
      await oracleWithdraw.connect(accounts[1]).transferAdmin([0], account0)
    }, 'revert')

    await assertThrowsAsync(async () => {
      await fluxAggregatorWithdraw.connect(accounts[1]).transferAdmin([0], account0)
    }, 'revert')

    await assertThrowsAsync(async () => {
      await offchainAggregatorWithdraw.connect(accounts[1]).transferAdmin([0], account0)
    }, 'revert')
  })

  it('should be able to remove factories and contracts', async () => {
    await token.transfer(oracle.address, toEther('10'))
    await token.transfer(offchainAggregator.address, toEther('10'))
    await fluxAggregatorWithdraw.removeContract(0)

    await assertThrowsAsync(async () => {
      await nodeRewards.withdraw(factoriesIdxs)
    }, 'revert')

    factoriesIdxs = [[0], []]
    await nodeRewards.withdraw(factoriesIdxs)

    await oracleWithdraw.removeContract(0)
    await offchainAggregatorWithdraw.removeContract(0)

    await nodeRewards.removeFactory(1)
    await nodeRewards.removeFactory(0)
    await nodeRewards.removeFactory(0)
  })
})
