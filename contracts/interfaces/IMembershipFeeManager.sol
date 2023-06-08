// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../library/StakingLibrary.sol";

interface IMembershipFeeManager  {

    function getMembershipFee(StakingLibrary.MembershipCategories category) external view returns (uint256);

}