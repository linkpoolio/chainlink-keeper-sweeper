// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Oracle is Ownable {
    IERC20 token;

    constructor(address _token) {
        token = IERC20(_token);
    }

    function withdrawable() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function withdraw(address _recipient, uint256 _amount) external onlyOwner() {
        require(token.balanceOf(address(this)) >= _amount, "Insufficient balance");
        token.transfer(_recipient, _amount);
    }
}
