// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IStakingPoolFactory  {
    function getPoolByID(uint256 id) external view returns (address);
}