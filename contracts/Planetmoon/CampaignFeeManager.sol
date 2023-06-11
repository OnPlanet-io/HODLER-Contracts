// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../library/StakingLibrary.sol";
import "../interfaces/IUniswapV2Router02.sol";
import "./PriceFeed.sol";
import "./SwapETHForTokens.sol";

// import "hardhat/console.sol";

contract CampaignFeeManager is Ownable, PriceFeed, SwapETHForTokens {

    mapping (StakingLibrary.CampaignCategories => uint256) public campaingFee;
    mapping (StakingLibrary.UnstakingCategories => uint256) public unStakingFee;
    
    event Received(address, uint);
    enum FeesType {USD, BNB}
    
    FeeDistributionShares public feeDistributionShares;
    struct FeeDistributionShares {
        uint8 buyBackAndburn;
        uint8 rewardPool;
        uint8 corporate;
    }

    FeeDistributionWallets public feeDistributionWallets;
    struct FeeDistributionWallets {
        address payable rewardPool;
        address payable corporate;
        address buyBackAndburnToken;
        address buyBackReceiver;
    }

    constructor( 
        uint256 silver, uint256 gold, uint256 diamond,
        uint256 reward_0pc, uint256 reward_30pc, uint256 reward_50pc, uint256 reward_100pc
    ) {

        campaingFee[StakingLibrary.CampaignCategories.SILVER] = silver;
        campaingFee[StakingLibrary.CampaignCategories.GOLD] = gold;
        campaingFee[StakingLibrary.CampaignCategories.DIAMOND] = diamond;

        unStakingFee[StakingLibrary.UnstakingCategories.REWARD_0pc] = reward_0pc;
        unStakingFee[StakingLibrary.UnstakingCategories.REWARD_30pc] = reward_30pc;
        unStakingFee[StakingLibrary.UnstakingCategories.REWARD_50pc] = reward_50pc;
        unStakingFee[StakingLibrary.UnstakingCategories.REWARD_100pc] = reward_100pc;
    }

    function getCampaignFee(StakingLibrary.CampaignCategories category) public view returns (uint256){
        uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());
        return campaingFee[category] * priceOfOneUSD;
    }

    function getAllCampaignFees(FeesType feeType) public view returns (
        uint256 silver,  
        uint256 gold,  
        uint256 diamond
    ){

        silver = campaingFee[StakingLibrary.CampaignCategories.SILVER];
        gold = campaingFee[StakingLibrary.CampaignCategories.GOLD];
        diamond = campaingFee[StakingLibrary.CampaignCategories.DIAMOND];

        if(feeType == FeesType.BNB){
            uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());
            silver = silver * priceOfOneUSD;
            gold = gold * priceOfOneUSD;
            diamond = diamond * priceOfOneUSD;
        }

    }

    function setCampaignFees(uint256 silver, uint256 gold, uint256 diamond) public onlyOwner {
        campaingFee[StakingLibrary.CampaignCategories.SILVER] = silver;
        campaingFee[StakingLibrary.CampaignCategories.GOLD] = gold;
        campaingFee[StakingLibrary.CampaignCategories.DIAMOND] = diamond;
    }

    function getUnstakingFee(StakingLibrary.UnstakingCategories category) public view returns (uint256) {
        uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());
        return unStakingFee[category] * priceOfOneUSD;
    }

    function getAllUnstakingFees(FeesType feeType) public view returns (
        uint256 reward_0pc, 
        uint256 reward_30pc, 
        uint256 reward_50pc, 
        uint256 reward_100pc
    ){

        reward_0pc = unStakingFee[StakingLibrary.UnstakingCategories.REWARD_0pc];
        reward_30pc = unStakingFee[StakingLibrary.UnstakingCategories.REWARD_30pc];
        reward_50pc = unStakingFee[StakingLibrary.UnstakingCategories.REWARD_50pc];
        reward_100pc = unStakingFee[StakingLibrary.UnstakingCategories.REWARD_100pc];

        if(feeType == FeesType.BNB){
            uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());
            reward_0pc = reward_0pc * priceOfOneUSD;
            reward_30pc = reward_30pc * priceOfOneUSD;
            reward_50pc = reward_50pc * priceOfOneUSD;
            reward_100pc = reward_100pc * priceOfOneUSD;
        }

    }

    function setUnstakingFees(
        uint256 reward_0pc, 
        uint256 reward_30pc, 
        uint256 reward_50pc, 
        uint256 reward_100pc
    ) public onlyOwner {
        unStakingFee[StakingLibrary.UnstakingCategories.REWARD_0pc] = reward_0pc;
        unStakingFee[StakingLibrary.UnstakingCategories.REWARD_30pc] = reward_30pc;
        unStakingFee[StakingLibrary.UnstakingCategories.REWARD_50pc] = reward_50pc;
        unStakingFee[StakingLibrary.UnstakingCategories.REWARD_100pc] = reward_100pc;
    }

    function setFeeDistributionShares(uint8 buyBackAndburn, uint8 rewardPool, uint8 corporate ) public onlyOwner {
        require(
            corporate > 0 && 
            rewardPool > 0 &&
            buyBackAndburn + rewardPool + corporate == 100,
            "Distribution fees are not adding up to 100pc" 
        );

        feeDistributionShares.buyBackAndburn = buyBackAndburn;
        feeDistributionShares.rewardPool = rewardPool;
        feeDistributionShares.corporate = corporate;
    }

    function setFeeDistributionWallets(address rewardPool, address corporate, address buyBackAndburnToken, address buyBackReceiver) public onlyOwner {
        
        require(
            rewardPool != address(0) && 
            corporate != address(0) &&
            buyBackAndburnToken != address(0) && 
            buyBackReceiver != address(0),
            "Distribution wallets are not being set properly" 
        );

        feeDistributionWallets.rewardPool = payable(rewardPool);
        feeDistributionWallets.corporate = payable(corporate);
        feeDistributionWallets.buyBackAndburnToken = buyBackAndburnToken;
        feeDistributionWallets.buyBackReceiver = buyBackReceiver;
        
    }

    function SplitFunds() public onlyOwner {

        FeeDistributionWallets memory wallets = feeDistributionWallets;
        FeeDistributionShares memory fees = feeDistributionShares;

        require(
            wallets.rewardPool != address(0) && 
            wallets.corporate != address(0) &&
            wallets.buyBackAndburnToken != address(0) && 
            wallets.buyBackReceiver != address(0),
            "Distribution wallets are not being set properly" 
        );

        require(
            fees.corporate > 0 && 
            fees.rewardPool > 0 &&
            fees.buyBackAndburn + fees.rewardPool + fees.corporate == 100,
            "Distribution fees are not being set properly" 
        );

        uint256 totalBalance = address(this).balance;
        require(totalBalance > 0, "No balance avaialble for split");

        uint256 corporateShare =  (totalBalance * fees.corporate) / 100;
        uint256 rewardPoolShare =  (totalBalance * fees.rewardPool) / 100;
        uint256 buyBackAndBurnShare =  totalBalance - corporateShare - rewardPoolShare;

        wallets.corporate.transfer(corporateShare);
        wallets.rewardPool.transfer(rewardPoolShare);
        if(buyBackAndBurnShare > 0){
            swapETHForTokens(wallets.buyBackAndburnToken, wallets.buyBackReceiver, buyBackAndBurnShare);
        }
        
    }

    function emergencyWithdraw() public onlyOwner {
        uint256 totalBalance = address(this).balance;
        require(totalBalance > 0, "No balance avaialble for withdraw");
        payable(owner()).transfer(totalBalance);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

}
