// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.6;

interface ISweeper {
    function withdraw(uint256[] calldata oracleIdxs) external;

    function withdrawable() external view returns (uint256[] memory);

    function minToWithdraw() external view returns (uint256);
}
