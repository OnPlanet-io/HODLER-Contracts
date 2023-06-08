// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../library/StakingLibrary.sol";

interface IPMMembership  {
   
    function getUserTokenData(address user) external view returns (StakingLibrary.UserDetail memory);
    function balanceOf(address owner) external view returns (uint256 balance);

}