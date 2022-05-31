// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./interfaces/IERC677Receiver.sol";
import "./interfaces/IERC677.sol";

contract LinkToken is IERC677, ERC20 {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint totalSupply
    ) ERC20(tokenName, tokenSymbol) {
        _mint(msg.sender, totalSupply * (10**uint(decimals())));
    }

    function transferAndCall(
        address _to,
        uint _value,
        bytes calldata _data
    ) public override returns (bool success) {
        super.transfer(_to, _value);
        if (isContract(_to)) {
            contractFallback(_to, _value, _data);
        }
        return true;
    }

    function contractFallback(
        address _to,
        uint _value,
        bytes calldata _data
    ) private {
        ERC677Receiver receiver = ERC677Receiver(_to);
        receiver.onTokenTransfer(msg.sender, _value, _data);
    }

    function isContract(address _addr) private view returns (bool hasCode) {
        uint length;
        assembly {
            length := extcodesize(_addr)
        }
        return length > 0;
    }
}
