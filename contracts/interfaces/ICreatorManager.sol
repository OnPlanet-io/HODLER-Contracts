// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface ICreatorManager  {
    function createACreator(address user) external returns (address);
    function getCreatorAddressOfUser(address user) external view returns (address);
    function getWalletAddressOfCreator(address creator) external view returns (address);
}