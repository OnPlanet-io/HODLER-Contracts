// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {PMLibrary} from "../library/PMLibrary.sol";

interface IRewardCampaign {
    function investTokens(address onBehalf, uint256 amount, PMLibrary.InvestmentType _type) external;
    function claimTokensAndReward(uint256 _tokenId) external;  
    function getTokenData(uint256 _tokenId) external view returns(PMLibrary.TokenData memory);
    function getProjectInfo() external view returns ( PMLibrary.PoolFullInfo memory poolFullInfo);
}