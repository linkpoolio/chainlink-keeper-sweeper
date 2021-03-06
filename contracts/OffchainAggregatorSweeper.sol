// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

import "./interfaces/IERC677.sol";
import "./interfaces/IOffchainAggregator.sol";
import "./Sweeper.sol";

/**
 * @title OffchainAggregatorSweeper
 * @dev Handles withdrawing of rewards from OCR Chainlink contracts.
 */
contract OffchainAggregatorSweeper is Sweeper {
    IERC677 public token;
    address public transmitter;

    constructor(
        address _keeperSweeper,
        uint _minToWithdraw,
        address _transmitter,
        address _token
    ) Sweeper(_keeperSweeper, _minToWithdraw) {
        transmitter = _transmitter;
        token = IERC677(_token);
    }

    /**
     * @dev returns withdrawable amount for each offchain aggregator
     * @return withdrawable balance of each offchain aggregator
     **/
    function withdrawable() external view override returns (uint[] memory) {
        uint[] memory _withdrawable = new uint[](contracts.length);
        for (uint i = 0; i < contracts.length; i++) {
            _withdrawable[i] = IOffchainAggregator(contracts[i]).owedPayment(transmitter);
        }
        return _withdrawable;
    }

    /**
     * @dev returns the withdrawable balance in this contract
     * @return withdrawable balance in this contract
     **/
    function withdrawableBalance() external view override returns (uint) {
        return token.balanceOf(address(this));
    }

    /**
     * @dev withdraw rewards from offchain aggregators
     * @param _contractIdxs indexes corresponding to the offchain aggregators
     **/
    function _withdraw(uint[] calldata _contractIdxs) internal override {
        for (uint i = 0; i < _contractIdxs.length; i++) {
            require(_contractIdxs[i] < contracts.length, "contractIdx must be < contracts length");
            IOffchainAggregator aggregator = IOffchainAggregator(contracts[_contractIdxs[i]]);
            if (aggregator.owedPayment(transmitter) >= minToWithdraw) {
                aggregator.withdrawPayment(transmitter);
            }
        }
        if (token.balanceOf(address(this)) > 0) {
            token.transfer(keeperSweeper, token.balanceOf(address(this)));
        }
    }

    /**
     * @dev transfers admin to new address for selected offchain aggregators
     * @param _contractIdxs indexes corresponsing to offchain aggregators
     * @param _newAdmin address to transfer admin to
     **/
    function _transferAdmin(uint[] calldata _contractIdxs, address _newAdmin) internal override {
        for (uint i = 0; i < _contractIdxs.length; i++) {
            require(_contractIdxs[i] < contracts.length, "contractIdx must be < contracts length");
            IOffchainAggregator(contracts[_contractIdxs[i]]).transferPayeeship(transmitter, _newAdmin);
        }
    }

    /**
     * @dev accepts payeeship for offchain aggregators
     * @param _contractIdxs indexes corresponding to the offchain aggregators
     **/
    function _acceptAdmin(uint[] calldata _contractIdxs) internal override {
        for (uint i = 0; i < _contractIdxs.length; i++) {
            require(_contractIdxs[i] < contracts.length, "contractIdx must be < contracts length");
            IOffchainAggregator(contracts[_contractIdxs[i]]).acceptPayeeship(transmitter);
        }
    }
}
