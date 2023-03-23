// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;


interface ICreatorManager  {

    function creatorAddress(address user) external view returns (address);
    function createACreator(address user) external returns (address);
    function walletAddress(address creator) external view returns (address);

}