// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.11;

import "./RevenueSplit.sol";
import "./interfaces/IOffchainAggregator.sol";

/**
 * @title OCRSweeper
 * @dev Handles distribution of revenue for OCR feeds.
 */
contract OCRSweeper is RevenueSplit {
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
        RevenueSplit(
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
     * @dev transfers payeeship to new address for selected OCR feeds
     * @param _contracts OCR feeds to transfer payeeship for
     * @param _newPayee address to transfer payeeship to
     **/
    function transferPayeeship(address[] calldata _contracts, address _newPayee) external onlyOwner {
        for (uint i = 0; i < _contracts.length; i++) {
            IOffchainAggregator(_contracts[i]).transferPayeeship(transmitter, _newPayee);
        }
    }

    /**
     * @dev accepts payeeship for selected OCR feeds
     * @param _contracts OCR feeds to accept payeeship for
     **/
    function acceptPayeeship(address[] calldata _contracts) external onlyOwner {
        for (uint i = 0; i < _contracts.length; i++) {
            IOffchainAggregator(_contracts[i]).acceptPayeeship(transmitter);
        }
    }
}
