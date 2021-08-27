// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

interface IOracle {
    function withdrawable() external view returns (uint);

    function withdraw(address _recipient, uint _amount) external;

    function transferOwnership(address _newOwner) external;
}
