// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import {IOracle} from "./interfaces/INodeWithdraw.sol";
import "./BaseWithdraw.sol";

/**
 * @title OracleWithdraw
 * @dev Handles withdrawing of rewards from oracle Chainlink contracts.
 */
contract OracleWithdraw is BaseWithdraw {
    constructor(address _nodeRewards, uint256 _minToWithdraw) BaseWithdraw(_nodeRewards, _minToWithdraw) {}

    /**
     * @dev returns the withdrawable amount for each oracle
     * @return withdrawable balance of each oracle
     **/
    function withdrawable() external view override returns (uint256[] memory) {
        uint256[] memory _withdrawable = new uint256[](contracts.length);
        for (uint i = 0; i < contracts.length; i++) {
            _withdrawable[i] = IOracle(contracts[i]).withdrawable();
        }
        return _withdrawable;
    }

    /**
     * @dev withdraws rewards from oracles
     * @param _contractIdxs indexes corresponding to the oracles
     **/
    function _withdraw(uint256[] calldata _contractIdxs) internal override {
        for (uint i = 0; i < _contractIdxs.length; i++) {
            require(_contractIdxs[i] < contracts.length, "contractIdx must be < contracts length");
            IOracle oracle = IOracle(contracts[_contractIdxs[i]]);
            uint256 amount = oracle.withdrawable();
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
    function _transferAdmin(uint256[] calldata _contractIdxs, address _newAdmin) internal override {
        for (uint i = 0; i < _contractIdxs.length; i++) {
            require(_contractIdxs[i] < contracts.length, "contractIdx must be < contracts length");
            IOracle(contracts[_contractIdxs[i]]).transferOwnership(_newAdmin);
        }
    }
}
