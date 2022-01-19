// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

interface IFluxAggregator {
    function withdrawablePayment(address _oracle) external view returns (uint);

    function withdrawPayment(
        address _oracle,
        address _recipient,
        uint _amount
    ) external;

    function transferAdmin(address _oracle, address _newAdmin) external;

    function acceptAdmin(address _oracle) external;
}
