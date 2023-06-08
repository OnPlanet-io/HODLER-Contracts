// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../library/StakingLibrary.sol";

interface ICampaignFeeManager  {
   

    function getCampaignFee(StakingLibrary.CampaignCategories category) external view returns (uint256);
    function getUnstakingFee(StakingLibrary.UnstakingCategories category) external view returns (uint256);


}