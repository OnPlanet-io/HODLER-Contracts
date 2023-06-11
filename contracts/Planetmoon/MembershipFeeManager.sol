// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../library/StakingLibrary.sol";
import "../interfaces/IUniswapV2Router02.sol";
import "./PriceFeed.sol";
import "./SwapETHForTokens.sol";

// import "hardhat/console.sol";

contract MembershipFeeManager is Ownable, PriceFeed, SwapETHForTokens {

    mapping (StakingLibrary.MembershipCategories => uint256) public membershipFee;
    
    enum FeesType {USD, BNB}

    event Received(address, uint);
    
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

    constructor( uint256 regular, uint256 upgrade, uint256 premium, uint256 team) {
        membershipFee[StakingLibrary.MembershipCategories.REGULAR] = regular;
        membershipFee[StakingLibrary.MembershipCategories.UPGRAGE] = upgrade;
        membershipFee[StakingLibrary.MembershipCategories.PREMIUIM] = premium;
        membershipFee[StakingLibrary.MembershipCategories.TEAM] = team;
    }

    function getMembershipFee(StakingLibrary.MembershipCategories category) public view returns (uint256){
        uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());
        return membershipFee[category] * priceOfOneUSD;
    }

    function getAllFees(FeesType feeType) public view returns (
        uint256 regular,
        uint256 upgrade,
        uint256 premium,
        uint256 team
    ){
            regular = membershipFee[StakingLibrary.MembershipCategories.REGULAR];
            upgrade = membershipFee[StakingLibrary.MembershipCategories.UPGRAGE];
            premium = membershipFee[StakingLibrary.MembershipCategories.PREMIUIM];
            team = membershipFee[StakingLibrary.MembershipCategories.TEAM];

            if(feeType == FeesType.BNB){
                uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());
                regular = regular * priceOfOneUSD;
                upgrade = upgrade * priceOfOneUSD;
                premium = premium * priceOfOneUSD;
                team = team * priceOfOneUSD;
            }

    }

    function setMembershipFee(uint256 regular, uint256 upgrade, uint256 premium, uint256 team) public onlyOwner {
        membershipFee[StakingLibrary.MembershipCategories.REGULAR] = regular;
        membershipFee[StakingLibrary.MembershipCategories.UPGRAGE] = upgrade;
        membershipFee[StakingLibrary.MembershipCategories.PREMIUIM] = premium;
        membershipFee[StakingLibrary.MembershipCategories.TEAM] = team;
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

    function setFeeDistributionWallets(
        address rewardPool, 
        address corporate, 
        address buyBackAndburnToken, 
        address buyBackReceiver
        ) public onlyOwner {
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
