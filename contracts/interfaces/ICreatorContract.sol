// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface ICreatorContract  {
    function sendTokensBackToOwner(address rewardPool, uint256 tokenId) external returns (bool);
    function removePoolAddress(address _poolAddress) external;
}