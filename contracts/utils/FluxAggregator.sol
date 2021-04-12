// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FluxAggregator {
    IERC20 public token;
    address[] public oracles;
    mapping(address => address) private admins;

    constructor(
        address _token,
        address[] memory _oracles,
        address[] memory _oracleAdmins
    ) {
        require(_oracles.length == _oracleAdmins.length, "Each oracle must have 1 admin");
        token = IERC20(_token);
        oracles = _oracles;
        for (uint8 i = 0; i < oracles.length; i++) {
            admins[oracles[i]] = _oracleAdmins[i];
        }
    }

    function withdrawablePayment(address _oracle) external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function withdrawPayment(
        address _oracle,
        address _recipient,
        uint256 _amount
    ) external {
        require(msg.sender == admins[_oracle], "Must be oracle admin");
        require(token.balanceOf(address(this)) >= _amount, "Insufficient balance");
        token.transfer(_recipient, _amount);
    }

    function getAdmin(address _oracle) external view returns (address) {
        return admins[_oracle];
    }

    function transferAdmin(address _oracle, address _newAdmin) external {
        require(msg.sender == admins[_oracle], "Must be admin");
        admins[_oracle] = _newAdmin;
    }

    function acceptAdmin(address _oracle) external {}
}
