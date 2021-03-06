// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

import "./interfaces/IOracle.sol";
import "./Sweeper.sol";

/**
 * @title OracleSweeper
 * @dev Handles withdrawing of rewards from oracle Chainlink contracts.
 */
contract OracleSweeper is Sweeper {
    constructor(address _keeperSweeper, uint _minToWithdraw) Sweeper(_keeperSweeper, _minToWithdraw) {}

    /**
     * @dev returns the withdrawable amount for each oracle
     * @return withdrawable balance of each oracle
     **/
    function withdrawable() external view override returns (uint[] memory) {
        uint[] memory _withdrawable = new uint[](contracts.length);
        for (uint i = 0; i < contracts.length; i++) {
            _withdrawable[i] = IOracle(contracts[i]).withdrawable();
        }
        return _withdrawable;
    }

    /**
     * @dev withdraws rewards from oracles
     * @param _contractIdxs indexes corresponding to the oracles
     **/
    function _withdraw(uint[] calldata _contractIdxs) internal override {
        for (uint i = 0; i < _contractIdxs.length; i++) {
            require(_contractIdxs[i] < contracts.length, "contractIdx must be < contracts length");
            IOracle oracle = IOracle(contracts[_contractIdxs[i]]);
            uint amount = oracle.withdrawable();
            if (amount >= minToWithdraw) {
                oracle.withdraw(msg.sender, amount);
            }
        }
    }

    /**
     * @dev transfers admin to new address for selected oracles
     * @param _contractIdxs indexes corresponsing to oracles
     * @param _newAdmin address to transfer admin to
     **/
    function _transferAdmin(uint[] calldata _contractIdxs, address _newAdmin) internal override {
        for (uint i = 0; i < _contractIdxs.length; i++) {
            require(_contractIdxs[i] < contracts.length, "contractIdx must be < contracts length");
            IOracle(contracts[_contractIdxs[i]]).transferOwnership(_newAdmin);
        }
    }
}
