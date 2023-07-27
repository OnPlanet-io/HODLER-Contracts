// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IPMMembershipManager  {
    function balanceOf(address owner) external view returns (uint256 balance);
    function isMember(address user) external view returns (bool);
}