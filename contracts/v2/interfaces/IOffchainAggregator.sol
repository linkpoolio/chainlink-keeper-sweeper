// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.14;

interface IOffchainAggregator {
    function transferPayeeship(address _transmitter, address _proposed) external;

    function acceptPayeeship(address _transmitter) external;
}
