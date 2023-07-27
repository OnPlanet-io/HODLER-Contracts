// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {CreatorContract} from "./CreatorContract.sol";

// import {console} from "hardhat/console.sol";

contract CreatorManager {
    error CreatorManager__ALREADY_EXIST();
    error CreatorManager__NOT_EXIST();

    uint256 private s_creatorsCount;
    mapping(address user => CreatorContract creator) private s_creatorAddress;
    mapping(address creator => address user) private s_walletAddress;

    event CreatorCreated(address user, address creator);

    function createACreator(address user) public returns (address) {
        if (address(s_creatorAddress[user]) != address(0)) {
            revert CreatorManager__ALREADY_EXIST();
        }

        CreatorContract newCreator = new CreatorContract();
        s_creatorAddress[user] = newCreator;
        s_walletAddress[address(newCreator)] = user;
        s_creatorsCount++;

        emit CreatorCreated(user, address(newCreator));

        return address(newCreator);
    }

    function getCreatorAddressOfUser(
        address user
    ) external view returns (address) {
        return address(s_creatorAddress[user]);
    }

    function getWalletAddressOfCreator(
        address creator
    ) external view returns (address) {
        if (address(s_walletAddress[creator]) == address(0)) {
            revert CreatorManager__NOT_EXIST();
        }

        return address(s_walletAddress[creator]);
    }

    function getPoolAddressesOfCreator(
        address user
    ) external view returns (address[] memory) {
        address creator = address(s_creatorAddress[user]);
        if (creator == address(0)) {
            revert CreatorManager__NOT_EXIST();
        }
        return CreatorContract(creator).getPoolAddresses();
    }
}
