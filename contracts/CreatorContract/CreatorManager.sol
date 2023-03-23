// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "hardhat/console.sol";
import "./CreatorContract.sol";


error ALREADY_EXIST();
error NOT_EXIST();

contract CreatorManager {
    

    uint256 creatorsCount;
    mapping (address => CreatorContract) public creatorAddress;
    mapping (address => address) public walletAddress;
    

    function createACreator(address user) public returns (address) {

        if(address(creatorAddress[user]) != address(0) ){
            revert ALREADY_EXIST();
        }

        CreatorContract newCreator = new CreatorContract(user);
        creatorAddress[user] = newCreator;
        walletAddress[address(newCreator)] = user;
        creatorsCount++;

        emit CreatorCreated(user, address(newCreator));

        return address(newCreator);

    }

    function getCreatorAddress(address user) public view returns (address) {

        if(address(creatorAddress[user]) == address(0) ){
            revert NOT_EXIST();
        }

        return address(creatorAddress[user]);
    }

    function getPoolAddressesOfCreator(address user) public view returns(address[] memory) {
        address creator = address(creatorAddress[user]);
        if(creator == address(0) ){
            revert NOT_EXIST();
        }
        return CreatorContract(creator).getPoolAddresses();
    }

    /* Events */
    event CreatorCreated(address user, address creator);
}