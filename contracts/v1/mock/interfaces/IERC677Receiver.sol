// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

interface ERC677Receiver {
    function onTokenTransfer(
        address _sender,
        uint _value,
        bytes calldata _data
    ) external;
}
