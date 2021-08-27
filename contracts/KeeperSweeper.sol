// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IERC677.sol";
import "./interfaces/ISweeper.sol";

/**
 * @title KeeperSweeper
 * @dev Handles withdrawing of node rewards from Chainlink contracts.
 */
contract KeeperSweeper is Ownable {
    using SafeERC20 for IERC677;

    address[] public sweepers;

    address public rewardsWallet;
    IERC677 public rewardsToken;

    uint public minRewardsForPayment;
    uint public batchSize;

    event Withdraw(address indexed sender, uint amount);

    constructor(
        address _rewardsToken,
        address _rewardsWallet,
        uint _minRewardsForPayment,
        uint _batchSize
    ) {
        rewardsToken = IERC677(_rewardsToken);
        rewardsWallet = _rewardsWallet;
        minRewardsForPayment = _minRewardsForPayment;
        batchSize = _batchSize;
    }

    /**
     * @dev returns withdrawable amount from all contracts
     * @return total withdrawable balance
     **/
    function withdrawable() external view returns (uint[][] memory) {
        uint[][] memory _withdrawable = new uint[][](sweepers.length);
        for (uint i = 0; i < sweepers.length; i++) {
            _withdrawable[i] = ISweeper(sweepers[i]).withdrawable();
        }
        return _withdrawable;
    }

    /**
     * @dev returns summed withdrawable amount in next batch
     * @return withdrawable amount
     **/
    function batchWithdrawable() external view returns (uint) {
        uint totalRewards;
        uint batch = 0;

        for (uint i = 0; i < sweepers.length && batch < batchSize; i++) {
            ISweeper sweeper = ISweeper(sweepers[i]);
            uint withdrawableBalance = sweeper.withdrawableBalance();
            uint minToWithdraw = sweeper.minToWithdraw();
            uint[] memory canWithdraw = sweeper.withdrawable();

            for (uint j = 0; j < canWithdraw.length && batch < batchSize; j++) {
                if (canWithdraw[j] >= minToWithdraw) {
                    totalRewards += canWithdraw[j];
                    batch++;
                }
            }

            if (withdrawableBalance > minToWithdraw) {
                totalRewards += withdrawableBalance;
            }
        }

        return totalRewards;
    }

    /**
     * @dev returns whether or not rewards should be withdrawn and the indexes to withdraw from
     * @return whether to perform upkeep and calldata to use
     **/
    function checkUpkeep(bytes calldata _checkData) external view returns (bool, bytes memory) {
        uint[][] memory performData = new uint[][](sweepers.length);
        uint totalRewards;
        uint batch = 0;

        for (uint i = 0; i < sweepers.length && batch < batchSize; i++) {
            ISweeper sweeper = ISweeper(sweepers[i]);
            uint withdrawableBalance = sweeper.withdrawableBalance();
            uint minToWithdraw = sweeper.minToWithdraw();
            uint[] memory canWithdraw = sweeper.withdrawable();

            uint canWithdrawCount;
            for (uint j = 0; j < canWithdraw.length && batch < batchSize; j++) {
                if (canWithdraw[j] >= minToWithdraw) {
                    canWithdrawCount++;
                    batch++;
                }
            }

            if (canWithdrawCount == 0 && withdrawableBalance >= minToWithdraw) {
                performData[i] = new uint[](1);
                performData[i][0] = 0;
            } else {
                performData[i] = new uint[](canWithdrawCount);

                uint addedCount;
                for (uint j = 0; j < canWithdraw.length && addedCount < canWithdrawCount; j++) {
                    if (canWithdraw[j] >= minToWithdraw) {
                        totalRewards += canWithdraw[j];
                        performData[i][addedCount++] = j;
                    }
                }
            }

            if (withdrawableBalance >= minToWithdraw) {
                totalRewards += withdrawableBalance;
            }
        }

        return (totalRewards >= minRewardsForPayment, abi.encode(performData));
    }

    /**
     * @dev withdraw rewards for selected contracts if rewards >= minRewardsForPayment
     * @param _performData indexes of the contracts
     **/
    function performUpkeep(bytes calldata _performData) external {
        _withdraw(_performData);

        uint rewards = rewardsToken.balanceOf(address(this));
        require(rewards >= minRewardsForPayment, "Rewards must be >= minRewardsForPayment");

        rewardsToken.transferAndCall(rewardsWallet, rewards, "0x00");
        emit Withdraw(msg.sender, rewards);
    }

    /**
     * @dev withdraw rewards for selected contracts
     * @param _sweeperIdxs indexes of the contracts
     **/
    function withdraw(uint[][] calldata _sweeperIdxs) external {
        _withdraw(abi.encode(_sweeperIdxs));

        uint rewards = rewardsToken.balanceOf(address(this));
        require(rewards > 0, "Rewards must be > 0");

        rewardsToken.transferAndCall(rewardsWallet, rewards, "0x00");
        emit Withdraw(msg.sender, rewards);
    }

    /**
     * @dev adds sweeper address
     * @param _sweeper address to add
     **/
    function addSweeper(address _sweeper) external onlyOwner() {
        sweepers.push(_sweeper);
    }

    /**
     * @dev removes sweeper address
     * @param _index index of sweeper to remove
     **/
    function removeSweeper(uint _index) external onlyOwner() {
        require(_index < sweepers.length, "Sweeper does not exist");
        sweepers[_index] = sweepers[sweepers.length - 1];
        delete sweepers[sweepers.length - 1];
    }

    /**
     * @dev sets minimum amount of rewards needed to receive payment on withdraw
     * @param _minRewardsForPayment amount to set
     **/
    function setMinRewardsForPayment(uint _minRewardsForPayment) external onlyOwner() {
        minRewardsForPayment = _minRewardsForPayment;
    }

    /**
     * @dev sets maximum batch size for withdrawals
     * @param _batchSize amount to set
     **/
    function setBatchSize(uint _batchSize) external onlyOwner() {
        batchSize = _batchSize;
    }

    /**
     * @dev withdraw rewards for selected contracts
     * @param _sweeperIdxs indexes of the contracts
     **/
    function _withdraw(bytes memory _sweeperIdxs) private {
        uint[][] memory sweeperIdxs = abi.decode(_sweeperIdxs, (uint[][]));
        require(sweeperIdxs.length <= sweepers.length, "SweeperIdxs must be <= sweepers length");

        for (uint i = 0; i < sweeperIdxs.length; i++) {
            if (sweeperIdxs[i].length > 0) {
                ISweeper(sweepers[i]).withdraw(sweeperIdxs[i]);
            }
        }
    }
}
