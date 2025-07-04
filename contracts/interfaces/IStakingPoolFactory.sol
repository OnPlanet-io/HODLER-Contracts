// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IRewardCampaignFactory  {
    function getPoolByID(uint256 id) external view returns (address);
}