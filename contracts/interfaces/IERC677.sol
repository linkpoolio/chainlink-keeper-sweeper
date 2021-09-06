// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC677 is IERC20 {
    function transferAndCall(
        address _to,
        uint _value,
        bytes calldata _data
    ) external returns (bool success);
}
