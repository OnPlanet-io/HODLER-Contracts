// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

interface IStakingPoolFactory  {

    function getPoolByID(uint256 id) external view returns (address);

}