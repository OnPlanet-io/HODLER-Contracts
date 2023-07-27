// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {PMLibrary} from "../library/PMLibrary.sol";
import {IUniswapV2Router02} from "../interfaces/IUniswapV2Router02.sol";
import {IRewardCampaign} from "../interfaces/IRewardCampaign.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {PriceFeed} from "./PriceFeed.sol";
import {SwapETHForTokens} from "./SwapETHForTokens.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {IUniswapV2Router02} from "../interfaces/IUniswapV2Router02.sol";

// import "hardhat/console.sol";

contract PMRewardDistributor is Ownable, PriceFeed, SwapETHForTokens {

    error PMRewardDistributor__NOT_ENOUGH_BALANCE();
    error PMRewardDistributor__CONTRACT_IS_PAUSED();

    address private s_giveAwayManager;
    bool private s_isPaused = true;
    uint256 private s_totalRewardDistributed;

    event Received(address, uint);
    event RewardApplied(address, address, uint256, uint8);

    constructor(address _giveAwayManager) {
        s_giveAwayManager = _giveAwayManager;
    }

    modifier onlyGiveAwayManager() {
        require(msg.sender == s_giveAwayManager, "Not Authorized");
        _;
    }

    function getGiveAwayManager() external view returns (address) {
        return s_giveAwayManager;
    }

    function getTotalRewardDistributed() external view returns (uint256) {
        return s_totalRewardDistributed;
    }

    function isPaused() external view returns (bool) {
        return s_isPaused;
    }

    function distributeReward(
        address winner,
        uint8 prizeUSD
    ) external onlyGiveAwayManager {
        if (s_isPaused) {
            revert PMRewardDistributor__CONTRACT_IS_PAUSED();
        }

        uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());

        uint256 prizeBNB = priceOfOneUSD * prizeUSD;
        s_totalRewardDistributed += prizeBNB;

        uint256 totalBalance = address(this).balance;

        if (totalBalance < prizeBNB) {
            revert PMRewardDistributor__NOT_ENOUGH_BALANCE();
        }
        payable(winner).transfer(prizeBNB);
    }

    function applyRewardToACampaing(
        address campaign,
        address user,
        uint8 amountUSD,
        PMLibrary.InvestmentType _type
    ) external onlyGiveAwayManager {
        if (s_isPaused) {
            revert PMRewardDistributor__CONTRACT_IS_PAUSED();
        }

        uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());

        uint256 amount = priceOfOneUSD * amountUSD;
        s_totalRewardDistributed += amount;

        uint256 totalBalance = address(this).balance;

        if (totalBalance < amount) {
            revert PMRewardDistributor__NOT_ENOUGH_BALANCE();
        }

        // find the token of the campaign
        PMLibrary.PoolFullInfo memory poolFullInfo = IRewardCampaign(campaign)
            .getProjectInfo();
        address tokenAddress = poolFullInfo.projectInfo.tokenAddress;

        // Buy tokens from open market
        uint256 boughtTokens = swapETHForTokens(
            tokenAddress,
            address(this),
            amount
        );

        // Approve tokens to the investment pool
        IERC20(tokenAddress).approve(campaign, boughtTokens);

        // Invest tokens on uers behalf
        IRewardCampaign(campaign).investTokens(user, boughtTokens, _type);

        emit RewardApplied(campaign, user, boughtTokens, uint8(_type));
    }

    /* Admin Functions */

    function emergencyWithdraw() external onlyOwner {
        uint256 totalBalance = address(this).balance;
        require(totalBalance > 0, "No balance avaialble for withdraw");
        payable(owner()).transfer(totalBalance);
    }

    function changePauseStatus(bool action) external onlyOwner {
        s_isPaused = action;
    }



    function updateGiveAwayManager(
        address _giveAwayManager
    ) external onlyOwner {
        s_giveAwayManager = _giveAwayManager;
    }

    function updateRouter(
        IUniswapV2Router02 _uniswapV2Router
    ) public onlyOwner {
        uniswapV2Router = _uniswapV2Router;
    }

    function updatePriceFeed(
        AggregatorV3Interface _priceFeed
    ) public onlyOwner {
        priceFeed = _priceFeed;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}
