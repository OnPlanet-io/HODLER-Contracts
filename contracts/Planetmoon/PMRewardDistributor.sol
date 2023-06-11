// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../library/StakingLibrary.sol";
import "../interfaces/IUniswapV2Router02.sol";
import "../interfaces/IStakingPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PriceFeed.sol";
import "./SwapETHForTokens.sol";

// import "hardhat/console.sol";

error NOT_ENOUGH_BALANCE();
error CONTRACT_IS_PAUSED();

contract PMRewardDistributor is Ownable, PriceFeed, SwapETHForTokens {

    event Received(address, uint);
    event RewardApplied(address, address, uint256, uint8);

    address public giveAwayManager;
    bool public pause = true;
    uint256 public totalRewardDistributed;

    constructor( address _giveAwayManager ){
        giveAwayManager = _giveAwayManager;
    }

    modifier onlyGiveAwayManager(){
        require(msg.sender == giveAwayManager, "No Authorized");
        _;
    }

    function distributeReward(address winner, uint8 prizeUSD) public onlyGiveAwayManager {

        if(pause){
            revert CONTRACT_IS_PAUSED();
        }


        uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());

        uint256 prizeBNB = priceOfOneUSD * prizeUSD;
        totalRewardDistributed = totalRewardDistributed + prizeBNB;

        uint256 totalBalance = address(this).balance;

        if(totalBalance <  prizeBNB){
            revert NOT_ENOUGH_BALANCE();
        }
        payable(winner).transfer(prizeBNB);

    }

    function applyRewardToACampaing(address campaign, address user, uint8 amountUSD, StakingLibrary.StakingType _type) public onlyGiveAwayManager {

        if(pause){
            revert CONTRACT_IS_PAUSED();
        }


        uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());

        uint256 amount = priceOfOneUSD * amountUSD;
        totalRewardDistributed = totalRewardDistributed + amount;

        uint256 totalBalance = address(this).balance;

        if(totalBalance <  amount){
            revert NOT_ENOUGH_BALANCE();
        }

        // find the token of the campaign
        StakingLibrary.PoolFullInfo memory poolFullInfo = IStakingPool(campaign).getProjectInfo();
        address tokenAddress = poolFullInfo.projectInfo.tokenAddress;

        // Buy tokens from open market
        uint256 boughtTokens = swapETHForTokens(tokenAddress, address(this), amount);

        // Approve tokens to the staking pool
        IERC20(tokenAddress).approve(campaign, boughtTokens);

        // Stake tokens on uers behalf
        IStakingPool(campaign).stakeTokens(user, boughtTokens, _type);

        emit RewardApplied(campaign, user, boughtTokens, uint8(_type));

    }

    /* Admin Functions */

    function emergencyWithdraw() public onlyOwner{
        uint256 totalBalance = address(this).balance;
        require(totalBalance > 0, "No balance avaialble for withdraw");
        payable(owner()).transfer(totalBalance);
    }

    function changePauseStatus(bool action) public onlyOwner {
        pause = action;
    }

    function updateGiveAwayManager(address _giveAwayManager) public onlyOwner {
        giveAwayManager = _giveAwayManager;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

}
