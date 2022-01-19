// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Sweeper
 * @dev Base sweeper contract that other sweeper contracts should inherit from
 */
abstract contract Sweeper is Ownable {
    uint public minToWithdraw;

    address[] public contracts;
    address keeperSweeper;

    modifier onlyKeeperSweeper() {
        require(keeperSweeper == msg.sender, "KeeperSweeper only");
        _;
    }

    constructor(address _keeperSweeper, uint _minToWithdraw) {
        keeperSweeper = _keeperSweeper;
        minToWithdraw = _minToWithdraw;
    }

    /**
     * @dev returns current list of contracts
     * @return list of contracts
     **/
    function getContracts() external view returns (address[] memory) {
        return contracts;
    }

    /**
     * @dev withdraws rewards from contracts
     * @param _contractIdxs indexes corresponding to the contracts
     **/
    function withdraw(uint[] calldata _contractIdxs) external virtual onlyKeeperSweeper() {
        require(_contractIdxs.length <= contracts.length, "contractIdxs length must be <= contracts length");
        _withdraw(_contractIdxs);
    }

    /**
     * @dev returns the withdrawable amount for each contract
     * @return withdrawable balance of each contract
     **/
    function withdrawable() external view virtual returns (uint[] memory);

    /**
     * @dev returns the withdrawable balance in this contract
     * @return withdrawable balance in this contract
     **/
    function withdrawableBalance() external view virtual returns (uint) {
        return 0;
    }

    /**
     * @dev transfers admin to new address for selected contracts
     * @param _contractIdxs indexes corresponsing to contracts
     * @param _newAdmin address to transfer admin to
     **/
    function transferAdmin(uint[] calldata _contractIdxs, address _newAdmin) external onlyOwner() {
        require(_contractIdxs.length <= contracts.length, "contractIdxs length must be <= contracts length");
        _transferAdmin(_contractIdxs, _newAdmin);
    }

    /**
     * @dev accepts admin transfer for selected contracts
     * @param _contractIdxs indexes corresponsing to contracts
     **/
    function acceptAdmin(uint[] calldata _contractIdxs) external onlyOwner() {
        require(_contractIdxs.length <= contracts.length, "contractIdxs length must be <= contracts length");
        _acceptAdmin(_contractIdxs);
    }

    /**
     * @dev sets the minimum amount needed to withdraw for each contract
     * @param _minToWithdraw amount to set
     **/
    function setMinToWithdraw(uint _minToWithdraw) external onlyOwner() {
        minToWithdraw = _minToWithdraw;
    }

    /**
     * @dev adds contract addresses
     * @param _contracts contracts to add
     **/
    function addContracts(address[] calldata _contracts) external onlyOwner() {
        for (uint i = 0; i < _contracts.length; i++) {
            contracts.push(_contracts[i]);
        }
    }

    /**
     * @dev removes contract address
     * @param _index index of contract to remove
     **/
    function removeContract(uint _index) external onlyOwner() {
        require(_index < contracts.length, "Contract does not exist");

        contracts[_index] = contracts[contracts.length - 1];
        delete contracts[contracts.length - 1];
    }

    /**
     * @dev sets keeperSweeper address
     * @param _keeperSweeper address to set
     **/
    function setKeeperSweeper(address _keeperSweeper) external onlyOwner() {
        keeperSweeper = _keeperSweeper;
    }

    /**
     * @dev withdraws rewards from contracts
     * @param _contractIdxs indexes corresponding to the contracts
     **/
    function _withdraw(uint[] calldata _contractIdxs) internal virtual;

    /**
     * @dev transfers admin to new address for selected contracts
     * @param _contractIdxs indexes corresponsing to contracts
     * @param _newAdmin address to transfer admin to
     **/
    function _transferAdmin(uint[] calldata _contractIdxs, address _newAdmin) internal virtual;

    /**
     * @dev accepts admin transfer for selected contracts
     * @param _contractIdxs indexes corresponsing to contracts
     **/
    function _acceptAdmin(uint[] calldata _contractIdxs) internal virtual {}
}
