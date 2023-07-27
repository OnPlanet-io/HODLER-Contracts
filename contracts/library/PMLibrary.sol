// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

library PMLibrary {
    
    enum ProfileType {
        NONE,
        TEAM,
        USER
    }

    enum InvestmentType {
        ONE_MONTH,
        THREE_MONTH,
        SIX_MONTH,
        NINE_MONTH,
        TWELVE_MONTH
    }

    enum MembershipCategories {
        MEMBER,
        TEAM
    }

    enum ClaimCategories{
        REWARD_0pc,
        REWARD_30pc,
        REWARD_50pc,
        REWARD_100pc
    }

    enum CampaignCategories {
        SILVER,
        GOLD,
        DIAMOND
    }

    enum FeesType {
        USD,
        BNB
    }


    struct PoolInfo {
        uint256 poolId;
        address poolAddress;
        uint256 remainingPool;
        uint256 totalTokensInvested;
        uint256 totalParicipants;
        uint256 tokenCounter;
        address poolOwner;
    }

    struct ProjectInfo {
        CampaignCategories category;
        string projectName;
        string projectSymbol;
        address tokenAddress;
        uint8 tokenDecimals;
        string tokenSymbol;
        ProfileType profileType;
        uint256 profileId;
    }

    struct RewardPoolInfo {
        uint256 startedAt;
        uint256 poolAmount;
    }

    struct NFTData {
        string image_1_months;
        string image_3_months;
        string image_6_months;
        string image_9_months;
        string image_12_months;
        uint8 APY_1_months;
        uint8 APY_3_months;
        uint8 APY_6_months;
        uint8 APY_9_months;
        uint8 APY_12_months;
    }

    struct TokenData {
        address poolAddress;
        uint256 poolId;
        uint256 tokenInvested;
        address tokenAddress;
        address owner;
        address creator;
        uint256 tokenId;
        string tokenUri;
        InvestmentType investmentType;
        uint256 investmentTime;
        uint256 unlockTime;
        uint256 expectedReward;
        bool isUnskated;
        uint256 redeemedReward;
        uint8 pcReceived;
    }

    struct PoolFullInfo {
        PoolInfo poolInfo;
        ProjectInfo projectInfo;
        RewardPoolInfo rewardPoolInfo;
        NFTData nftData;
    }
}
