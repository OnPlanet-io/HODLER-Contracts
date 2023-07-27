// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {StakingLibrary} from "../library/StakingLibrary.sol";

interface IMembershipFeeManager  {
    function getMembershipFee(StakingLibrary.MembershipCategories category) external view returns (uint256);
}