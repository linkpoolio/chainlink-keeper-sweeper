// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.14;

import "./ProfitMarginProxy.sol";
import "./interfaces/IOffchainAggregator.sol";

/**
 * @title OCASweeper
 * @dev Handles distribution of revenue for Offchain Aggregators.
 */
contract OCASweeper is ProfitMarginProxy {
    address public transmitter;

    constructor(
        address _rewardsToken,
        address _rewardsPool,
        address _ownerWallet,
        address _profitMarginFeed,
        uint _rewardsPoolProfitShare,
        uint _minRewardsForDistribution,
        address _transmitter
    )
        ProfitMarginProxy(
            _rewardsToken,
            _rewardsPool,
            _ownerWallet,
            _profitMarginFeed,
            _rewardsPoolProfitShare,
            _minRewardsForDistribution
        )
    {
        transmitter = _transmitter;
    }

    /**
     * @dev transfers payeeship to new address for selected OCA feeds
     * @param _contracts OCA feeds to transfer payeeship for
     * @param _newPayee address to transfer payeeship to
     **/
    function transferPayeeship(address[] calldata _contracts, address _newPayee) external onlyOwner {
        for (uint i = 0; i < _contracts.length; i++) {
            IOffchainAggregator(_contracts[i]).transferPayeeship(transmitter, _newPayee);
        }
    }

    /**
     * @dev accepts payeeship for selected OCA feeds
     * @param _contracts OCA feeds to accept payeeship for
     **/
    function acceptPayeeship(address[] calldata _contracts) external onlyOwner {
        for (uint i = 0; i < _contracts.length; i++) {
            IOffchainAggregator(_contracts[i]).acceptPayeeship(transmitter);
        }
    }

    /**
     * @dev sets a new transmitter address
     * @param _transmitter address to set
     **/
    function setTransmitter(address _transmitter) external onlyOwner {
        transmitter = _transmitter;
    }
}
