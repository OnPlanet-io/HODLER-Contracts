// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {StakingLibrary} from "../library/StakingLibrary.sol";
import {IUniswapV2Router02} from "../interfaces/IUniswapV2Router02.sol";
import {PriceFeed} from "./PriceFeed.sol";
import {SwapETHForTokens} from "./SwapETHForTokens.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {IUniswapV2Router02} from "../interfaces/IUniswapV2Router02.sol";

// import "hardhat/console.sol";

contract MembershipFeeManager is Ownable, PriceFeed, SwapETHForTokens {
    mapping(StakingLibrary.MembershipCategories category => uint256 fee) private s_membershipFee;
    FeeDistributionShares private s_feeDistributionShares;
    FeeDistributionWallets private s_feeDistributionWallets;

    event Received(address, uint);

    struct FeeDistributionShares {
        uint8 buyBackAndburn;
        uint8 rewardPool;
        uint8 corporate;
    }

    struct FeeDistributionWallets {
        address payable rewardPool;
        address payable corporate;
        address buyBackAndburnToken;
        address buyBackReceiver;
    }

    constructor(uint256 member, uint256 team) {
        s_membershipFee[StakingLibrary.MembershipCategories.MEMBER] = member;
        s_membershipFee[StakingLibrary.MembershipCategories.TEAM] = team;
    }

    function getMembershipFee(
        StakingLibrary.MembershipCategories category
    ) public view returns (uint256) {
        uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());
        return s_membershipFee[category] * priceOfOneUSD;
    }

    function getAllFees(
        StakingLibrary.FeesType feeType
    ) public view returns (uint256 member, uint256 team) {
        member = s_membershipFee[StakingLibrary.MembershipCategories.MEMBER];
        team = s_membershipFee[StakingLibrary.MembershipCategories.TEAM];

        if (feeType == StakingLibrary.FeesType.BNB) {
            uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());
            member = member * priceOfOneUSD;
            team = team * priceOfOneUSD;
        }
    }

    function getDistributionShares()
        public
        view
        returns (uint8 buyBackAndburn, uint8 rewardPool, uint8 corporate)
    {
        buyBackAndburn = s_feeDistributionShares.buyBackAndburn;
        rewardPool = s_feeDistributionShares.rewardPool;
        corporate = s_feeDistributionShares.corporate;
    }

    function getDistributionWallets()
        public
        view
        returns (
            address rewardPool,
            address corporate,
            address buyBackAndburnToken,
            address buyBackReceiver
        )
    {
        rewardPool = s_feeDistributionWallets.rewardPool;
        corporate = s_feeDistributionWallets.corporate;
        buyBackAndburnToken = s_feeDistributionWallets.buyBackAndburnToken;
        buyBackReceiver = s_feeDistributionWallets.buyBackReceiver;
    }

    function setMembershipFee(uint256 member, uint256 team) public onlyOwner {
        s_membershipFee[StakingLibrary.MembershipCategories.MEMBER] = member;
        s_membershipFee[StakingLibrary.MembershipCategories.TEAM] = team;
    }

    function setFeeDistributionShares(
        uint8 buyBackAndburn,
        uint8 rewardPool,
        uint8 corporate
    ) public onlyOwner {
        require(
            corporate > 0 &&
                rewardPool > 0 &&
                buyBackAndburn + rewardPool + corporate == 100,
            "Distribution fees are not adding up to 100pc"
        );

        s_feeDistributionShares.buyBackAndburn = buyBackAndburn;
        s_feeDistributionShares.rewardPool = rewardPool;
        s_feeDistributionShares.corporate = corporate;
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

        s_feeDistributionWallets.rewardPool = payable(rewardPool);
        s_feeDistributionWallets.corporate = payable(corporate);
        s_feeDistributionWallets.buyBackAndburnToken = buyBackAndburnToken;
        s_feeDistributionWallets.buyBackReceiver = buyBackReceiver;
    }

    function splitFunds() public onlyOwner {
        FeeDistributionWallets memory wallets = s_feeDistributionWallets;
        FeeDistributionShares memory fees = s_feeDistributionShares;

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

        uint256 corporateShare = (totalBalance * fees.corporate) / 100;
        uint256 rewardPoolShare = (totalBalance * fees.rewardPool) / 100;
        uint256 buyBackAndBurnShare = totalBalance -
            corporateShare -
            rewardPoolShare;

        wallets.corporate.transfer(corporateShare);
        wallets.rewardPool.transfer(rewardPoolShare);
        if (buyBackAndBurnShare > 0) {
            swapETHForTokens(
                wallets.buyBackAndburnToken,
                wallets.buyBackReceiver,
                buyBackAndBurnShare
            );
        }
    }

    function emergencyWithdraw() public onlyOwner {
        uint256 totalBalance = address(this).balance;
        require(totalBalance > 0, "No balance avaialble for withdraw");
        payable(owner()).transfer(totalBalance);
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
