// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {PMLibrary} from "../library/PMLibrary.sol";
import {IUniswapV2Router02} from "../interfaces/IUniswapV2Router02.sol";
import {PriceFeed} from "./PriceFeed.sol";
import {SwapETHForTokens} from "./SwapETHForTokens.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {IUniswapV2Router02} from "../interfaces/IUniswapV2Router02.sol";

// import "hardhat/console.sol";

contract CampaignFeeManager is Ownable, PriceFeed, SwapETHForTokens {
    mapping(PMLibrary.CampaignCategories category => uint256 fee)
        private s_campaingFee;
    mapping(PMLibrary.UnstakingCategories category => uint256 fee)
        private s_unStakingFee;

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

    constructor(
        uint256 silver,
        uint256 gold,
        uint256 diamond,
        uint256 reward_0pc,
        uint256 reward_30pc,
        uint256 reward_50pc,
        uint256 reward_100pc
    ) {
        s_campaingFee[PMLibrary.CampaignCategories.SILVER] = silver;
        s_campaingFee[PMLibrary.CampaignCategories.GOLD] = gold;
        s_campaingFee[PMLibrary.CampaignCategories.DIAMOND] = diamond;

        s_unStakingFee[
            PMLibrary.UnstakingCategories.REWARD_0pc
        ] = reward_0pc;
        s_unStakingFee[
            PMLibrary.UnstakingCategories.REWARD_30pc
        ] = reward_30pc;
        s_unStakingFee[
            PMLibrary.UnstakingCategories.REWARD_50pc
        ] = reward_50pc;
        s_unStakingFee[
            PMLibrary.UnstakingCategories.REWARD_100pc
        ] = reward_100pc;
    }

    function getCampaignFee(
        PMLibrary.CampaignCategories category
    ) public view returns (uint256) {
        uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());
        return s_campaingFee[category] * priceOfOneUSD;
    }

    function getAllCampaignFees(
        PMLibrary.FeesType feeType
    ) public view returns (uint256 silver, uint256 gold, uint256 diamond) {
        silver = s_campaingFee[PMLibrary.CampaignCategories.SILVER];
        gold = s_campaingFee[PMLibrary.CampaignCategories.GOLD];
        diamond = s_campaingFee[PMLibrary.CampaignCategories.DIAMOND];

        if (feeType == PMLibrary.FeesType.BNB) {
            uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());
            silver = silver * priceOfOneUSD;
            gold = gold * priceOfOneUSD;
            diamond = diamond * priceOfOneUSD;
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

    function setCampaignFees(
        uint256 silver,
        uint256 gold,
        uint256 diamond
    ) public onlyOwner {
        s_campaingFee[PMLibrary.CampaignCategories.SILVER] = silver;
        s_campaingFee[PMLibrary.CampaignCategories.GOLD] = gold;
        s_campaingFee[PMLibrary.CampaignCategories.DIAMOND] = diamond;
    }

    function getUnstakingFee(
        PMLibrary.UnstakingCategories category
    ) public view returns (uint256) {
        uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());
        return s_unStakingFee[category] * priceOfOneUSD;
    }

    function getAllUnstakingFees(
        PMLibrary.FeesType feeType
    )
        public
        view
        returns (
            uint256 reward_0pc,
            uint256 reward_30pc,
            uint256 reward_50pc,
            uint256 reward_100pc
        )
    {
        reward_0pc = s_unStakingFee[
            PMLibrary.UnstakingCategories.REWARD_0pc
        ];
        reward_30pc = s_unStakingFee[
            PMLibrary.UnstakingCategories.REWARD_30pc
        ];
        reward_50pc = s_unStakingFee[
            PMLibrary.UnstakingCategories.REWARD_50pc
        ];
        reward_100pc = s_unStakingFee[
            PMLibrary.UnstakingCategories.REWARD_100pc
        ];

        if (feeType == PMLibrary.FeesType.BNB) {
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
        s_unStakingFee[
            PMLibrary.UnstakingCategories.REWARD_0pc
        ] = reward_0pc;
        s_unStakingFee[
            PMLibrary.UnstakingCategories.REWARD_30pc
        ] = reward_30pc;
        s_unStakingFee[
            PMLibrary.UnstakingCategories.REWARD_50pc
        ] = reward_50pc;
        s_unStakingFee[
            PMLibrary.UnstakingCategories.REWARD_100pc
        ] = reward_100pc;
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

    function SplitFunds() public onlyOwner {
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
