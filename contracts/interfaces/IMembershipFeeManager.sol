// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {PMLibrary} from "../library/PMLibrary.sol";

interface IMembershipFeeManager  {
    function getMembershipFee(PMLibrary.MembershipCategories category) external view returns (uint256);
}