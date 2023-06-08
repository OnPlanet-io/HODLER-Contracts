// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

interface IPMTeamManager  {

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);

}