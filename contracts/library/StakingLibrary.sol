// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

library StakingLibrary {

    enum UnstakingCategories {
        REWARD_0pc,
        REWARD_30pc,
        REWARD_50pc,
        REWARD_100pc
    }

    enum MembershipCategories {
        REGULAR,
        UPGRAGE,
        PREMIUIM,
        TEAM
    }

    enum CampaignCategories {
        SILVER,
        GOLD,
        DIAMOND
    }

    struct PoolInfo {
        uint256 poolId;
        address poolAddress;
        uint256 remainingPool;
        uint256 totalTokensStaked;
        uint256 totalParicipants;
        uint256 tokenCounter;
        address poolOwner;
    }

    enum ProfileType {NONE, TEAM, USER}
    
    enum StakingType {THREE_MONTH, SIX_MONTH, TWELVE_MONTH}

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

    struct Images {
        string image_3_months;
        string image_6_months;
        string image_12_months;
    }
       
    struct TokenData {
        address poolAddress;
        uint256 poolId;
        uint256 tokenStaked;
        address tokenAddress;
        address owner;
        address creator;
        uint256 tokenId;
        string tokenUri;
        uint8 stakingType;
        uint256 stakingTime;
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
        Images images;
    }

    struct UserDetail {
        uint256 memberSince;
        uint256 memberId;
        bool isPremium;
    }




}


