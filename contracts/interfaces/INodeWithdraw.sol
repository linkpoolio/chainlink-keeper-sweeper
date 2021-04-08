// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

interface IFactory {
    function withdraw(uint256[] calldata oracleIdxs) external;

    function withdrawable() external view returns (uint256[] memory);

    function minToWithdraw() external view returns (uint256);
}

interface IFluxAggregator {
    function withdrawablePayment(address _oracle) external view returns (uint256);

    function withdrawPayment(
        address _oracle,
        address _recipient,
        uint256 _amount
    ) external;

    function transferAdmin(address _oracle, address _newAdmin) external;

    function acceptAdmin(address _oracle) external;
}

interface IOffchainAggregator {
    function owedPayment(address _transmitter) external view returns (uint256);

    function withdrawPayment(address _transmitter) external;

    function transferPayeeship(address _transmitter, address _proposed) external;

    function acceptPayeeship(address _transmitter) external;
}

interface IOracle {
    function withdrawable() external view returns (uint256);

    function withdraw(address _recipient, uint256 _amount) external;

    function transferOwnership(address _newOwner) external;
}
