// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OffchainAggregator {
    IERC20 public token;
    address[] public transmitters;
    mapping(address => address) public payees;
    mapping(address => address) public proposedPayees;

    constructor(
        address _token,
        address[] memory _transmitters,
        address[] memory _payees
    ) {
        require(_transmitters.length == _payees.length, "Each oracle must have 1 payee");
        token = IERC20(_token);
        transmitters = _transmitters;
        for (uint8 i = 0; i < transmitters.length; i++) {
            payees[transmitters[i]] = _payees[i];
        }
    }

    function transferPayeeship(address _transmitter, address _proposed) external {
        require(msg.sender == payees[_transmitter], "only current payee can update");
        proposedPayees[_transmitter] = _proposed;
    }

    function acceptPayeeship(address _transmitter) external {
        address proposed = proposedPayees[_transmitter];
        require(msg.sender == proposed, "Only proposed payee can accept");
        payees[_transmitter] = proposed;
    }
}
