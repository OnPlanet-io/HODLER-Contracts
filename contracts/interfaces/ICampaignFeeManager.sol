// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {PMLibrary} from "../library/PMLibrary.sol";

interface ICampaignFeeManager  {
    function getCampaignFee(PMLibrary.CampaignCategories category) external view returns (uint256);
    function getClaimFee(PMLibrary.ClaimCategories category) external view returns (uint256);
}