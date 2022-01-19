// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

interface ISweeper {
    function withdraw(uint[] calldata oracleIdxs) external;

    function withdrawable() external view returns (uint[] memory);

    function withdrawableBalance() external view returns (uint);

    function minToWithdraw() external view returns (uint);
}
