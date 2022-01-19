// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

interface IOffchainAggregator {
    function owedPayment(address _transmitter) external view returns (uint);

    function withdrawPayment(address _transmitter) external;

    function transferPayeeship(address _transmitter, address _proposed) external;

    function acceptPayeeship(address _transmitter) external;
}
