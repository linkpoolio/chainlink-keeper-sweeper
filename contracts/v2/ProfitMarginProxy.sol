// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "./interfaces/IERC677.sol";

/**
 * @title ProfitMarginProxy
 * @dev Handles distribution of revenue based on profit margins.
 */
contract ProfitMarginProxy is Ownable {
    IERC677 public rewardsToken;
    address public ownerWallet;
    address public rewardsPool;

    AggregatorV3Interface public profitMarginFeed;
    uint public rewardsPoolProfitShare;

    uint public minRewardsForDistribution;

    event RewardsDistributed(address indexed sender, uint totalAmount, uint rewardsPoolAmount, uint ownerAmount);

    constructor(
        address _rewardsToken,
        address _rewardsPool,
        address _ownerWallet,
        address _profitMarginFeed,
        uint _rewardsPoolProfitShare,
        uint _minRewardsForDistribution
    ) {
        rewardsToken = IERC677(_rewardsToken);
        rewardsPool = _rewardsPool;
        ownerWallet = _ownerWallet;
        profitMarginFeed = AggregatorV3Interface(_profitMarginFeed);
        rewardsPoolProfitShare = _rewardsPoolProfitShare;
        minRewardsForDistribution = _minRewardsForDistribution;
    }

    /**
     * @dev returns the amount of available rewards
     * @return amount of rewards
     **/
    function availableRewards() public view returns (uint) {
        return rewardsToken.balanceOf(address(this));
    }

    /**
     * @dev returns whether or not rewards should be distributed
     * @return whether to perform upkeep
     **/
    function checkUpkeep(bytes calldata _checkData) external view returns (bool, bytes memory) {
        return (availableRewards() >= minRewardsForDistribution, "0x00");
    }

    /**
     * @dev distributes rewards if rewards >= minRewardsForDistribution
     **/
    function performUpkeep(bytes calldata _performData) external {
        uint rewards = availableRewards();
        require(rewards >= minRewardsForDistribution, "Rewards must be >= minRewardsForDistribution");
        _distributeRewards(rewards);
    }

    /**
     * @dev distributes rewards if there are any
     **/
    function distributeRewards() external {
        uint rewards = availableRewards();
        require(rewards > 0, "No rewards to distribute");
        _distributeRewards(rewards);
    }

    /**
     * @dev sets the rewardsPool address
     * @param _rewardsPool address to set
     **/
    function setRewardsPool(address _rewardsPool) external onlyOwner {
        require(_rewardsPool != address(0), "Address cannot be 0x0");
        rewardsPool = _rewardsPool;
    }

    /**
     * @dev sets the ownerWallet address (not to be confused with the contract owner)
     * @param _ownerWallet address to set
     **/
    function setOwnerWallet(address _ownerWallet) external onlyOwner {
        require(_ownerWallet != address(0), "Address cannot be 0x0");
        ownerWallet = _ownerWallet;
    }

    /**
     * @dev sets the address of the profit margin feed used to calculate distribution amounts (if set to 0x0, profit margin will always be 100%)
     * @param _profitMarginFeed address to set
     **/
    function setProfitMarginFeed(address _profitMarginFeed) external onlyOwner {
        profitMarginFeed = AggregatorV3Interface(_profitMarginFeed);
    }

    /**
     * @dev sets the percentage of profits the rewardsPool receives (ownerWallet receives the rest)
     * @param _rewardsPoolProfitShare percentage to set (2500 = 25%)
     **/
    function setRewardsPoolProfitShare(uint _rewardsPoolProfitShare) external onlyOwner {
        require(
            _rewardsPoolProfitShare >= 100 && _rewardsPoolProfitShare <= 8000,
            "Profit share percentage must be >= 1% and <= 80%"
        );
        rewardsPoolProfitShare = _rewardsPoolProfitShare;
    }

    /**
     * @dev sets the minimum amount of rewards needed for distribtuin by a keeper
     * @param _minRewardsForDistribution amount to set
     **/
    function setMinRewardsForDistribution(uint _minRewardsForDistribution) external onlyOwner {
        minRewardsForDistribution = _minRewardsForDistribution;
    }

    /**
     * @dev distributes rewards
     * @param _amount amount of rewards to distribute
     **/
    function _distributeRewards(uint _amount) private {
        int profitMargin = 10000;

        if (address(profitMarginFeed) != address(0)) {
            (, profitMargin, , , ) = profitMarginFeed.latestRoundData();
        }

        uint rewardsPoolAmount;
        uint profit;
        if (profitMargin > 0) {
            profit = (_amount * uint(profitMargin)) / 10000;
            rewardsPoolAmount = (profit * rewardsPoolProfitShare) / 10000;
            rewardsToken.transferAndCall(rewardsPool, rewardsPoolAmount, "0x00");
        }

        uint ownerAmount = rewardsToken.balanceOf(address(this));
        rewardsToken.transferAndCall(ownerWallet, ownerAmount, "0x00");

        emit RewardsDistributed(msg.sender, _amount, rewardsPoolAmount, ownerAmount);
    }
}
