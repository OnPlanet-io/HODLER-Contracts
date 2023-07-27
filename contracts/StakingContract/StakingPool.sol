// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {StakingLibrary} from "../library/StakingLibrary.sol";

import {ICreatorContract} from "../interfaces/ICreatorContract.sol";
import {ICreatorManager} from "../interfaces/ICreatorManager.sol";
import {ICampaignFeeManager} from "../interfaces/ICampaignFeeManager.sol";

// import "hardhat/console.sol";

contract StakingPool is ERC721Enumerable {

    error StakingPool__POOL_NOT_STARTED();
    error StakingPool__NOT_ENOUGH_REWARD_IN_POOL();
    error StakingPool__NOT_AUTHERIZED();
    error StakingPool__NOTHING_TO_UNSTAKE();
    error StakingPool__ALREADY_UNSTAKED();
    error StakingPool__INSUFFICIENT_FUNDS();
    error StakingPool__FAILED_TO_TRANSFER_BNBS();
    error StakingPool__FAILED_TO_TRANSFER_TOEKNS();
    error StakingPool__FAILED_TO_TRANSFER_ORIGNAL_TOEKNS();
    error StakingPool__FAILED_TO_TRANSFER_REWARD_TOEKNS();
    error StakingPool__NO_CREATOR_CONTRACT_FOUND();
    error StakingPool__NOT_A_VALID_STAKING_TYPE();

    uint256 internal constant ONE_DAY = 24 * 60 * 60;
    StakingLibrary.PoolInfo private s_poolInfo;
    StakingLibrary.ProjectInfo private s_projectInfo;
    StakingLibrary.RewardPoolInfo private s_rewardPoolInfo;

    ICreatorManager private immutable s_creatorManager;
    address private immutable s_campaignFeeManager;
    StakingLibrary.NFTData private s_nftData;

    struct StakingCategeroy {
        uint256 duration;
        uint256 rewardPC;
        string image;
    }

    mapping(StakingLibrary.StakingType => StakingCategeroy) private s_stakingInfo;
    mapping(uint256 => StakingLibrary.TokenData) private s_tokenData;

    event JoinedPool(
        uint256 poolId,
        uint256 tokenId,
        address user,
        uint256 contribution,
        uint8 category
    );


    event ExitedPool(
        uint256 id,
        address creator,
        uint256 contribution,
        uint8 category,
        uint256 redeemableReward
    );

    constructor(
        uint256 _poolId,
        StakingLibrary.ProjectInfo memory _projectInfo,
        StakingLibrary.RewardPoolInfo memory _rewardPoolInfo,
        StakingLibrary.NFTData memory _nftData,
        address _creatorManager,
        address _campaignFeeManager,
        address _ownerOfProject
    ) ERC721(_projectInfo.projectName, _projectInfo.projectSymbol) {

        s_stakingInfo[StakingLibrary.StakingType.ONE_MONTH].duration = 30 * ONE_DAY;
        s_stakingInfo[StakingLibrary.StakingType.ONE_MONTH].rewardPC = _nftData.APY_1_months;
        s_stakingInfo[StakingLibrary.StakingType.ONE_MONTH].image = _nftData.image_1_months;

        s_stakingInfo[StakingLibrary.StakingType.THREE_MONTH].duration = 90 * ONE_DAY;
        s_stakingInfo[StakingLibrary.StakingType.THREE_MONTH].rewardPC = _nftData.APY_3_months;
        s_stakingInfo[StakingLibrary.StakingType.THREE_MONTH].image = _nftData.image_3_months;

        s_stakingInfo[StakingLibrary.StakingType.SIX_MONTH].duration = 180 * ONE_DAY;
        s_stakingInfo[StakingLibrary.StakingType.SIX_MONTH].rewardPC = _nftData.APY_6_months;
        s_stakingInfo[StakingLibrary.StakingType.SIX_MONTH].image = _nftData.image_6_months;

        s_stakingInfo[StakingLibrary.StakingType.NINE_MONTH].duration = 270 * ONE_DAY;
        s_stakingInfo[StakingLibrary.StakingType.NINE_MONTH].rewardPC = _nftData.APY_9_months;
        s_stakingInfo[StakingLibrary.StakingType.NINE_MONTH].image = _nftData.image_9_months;

        s_stakingInfo[StakingLibrary.StakingType.TWELVE_MONTH].duration = 365 * ONE_DAY;
        s_stakingInfo[StakingLibrary.StakingType.TWELVE_MONTH].rewardPC = _nftData.APY_12_months;
        s_stakingInfo[StakingLibrary.StakingType.TWELVE_MONTH].image = _nftData.image_12_months;

        s_projectInfo = _projectInfo;
        s_rewardPoolInfo = _rewardPoolInfo;
        s_nftData = _nftData;

        s_poolInfo.poolId = _poolId;
        s_poolInfo.poolOwner = _ownerOfProject;
        s_poolInfo.poolAddress = address(this);
        s_poolInfo.remainingPool = _rewardPoolInfo.poolAmount;

        s_creatorManager = ICreatorManager(_creatorManager);
        s_campaignFeeManager = _campaignFeeManager;
    }

    /// @notice The main function to stake tokens
    function stakeTokens(
        address onBehalf,
        uint256 amount,
        StakingLibrary.StakingType stakingType
    ) public {
        StakingLibrary.PoolInfo memory poolInfo = s_poolInfo;
        StakingLibrary.RewardPoolInfo memory rewardPoolInfo = s_rewardPoolInfo;
        StakingLibrary.ProjectInfo memory projectInfo = s_projectInfo;
        StakingCategeroy memory category = s_stakingInfo[stakingType];

        // Check if pool has been started
        if (block.timestamp < rewardPoolInfo.startedAt) {
            revert StakingPool__POOL_NOT_STARTED();
        }

        // Check if category is valid
        if (category.rewardPC == 0) {
            revert StakingPool__NOT_A_VALID_STAKING_TYPE();
        }

        // Calculate reward of this person
        uint256 reward = (amount * category.rewardPC) / 100;

        // Check if pool has enough space to give this reward
        if (poolInfo.remainingPool < reward) {
            revert StakingPool__NOT_ENOUGH_REWARD_IN_POOL();
        }

        // Update the remianing reward pool
        s_poolInfo.remainingPool -= reward;
        // Update the total staked tokens variable
        s_poolInfo.totalTokensStaked += amount;
        // update totalParicipants
        s_poolInfo.totalParicipants++;
        // Update the tokenID
        uint256 tokenId = ++s_poolInfo.tokenCounter;

        //Check if user has a creator contract
        address creator = s_creatorManager.getCreatorAddressOfUser(onBehalf);

        // Not already a creator then create one
        if (creator == address(0)) {
            creator = s_creatorManager.createACreator(onBehalf);
        }

        // Record the staking entry
        s_tokenData[tokenId] = StakingLibrary.TokenData({
            poolAddress: address(this),
            poolId: poolInfo.poolId,
            tokenStaked: amount,
            tokenAddress: projectInfo.tokenAddress,
            owner: address(onBehalf),
            creator: address(creator),
            tokenId: tokenId,
            tokenUri: category.image,
            stakingType: stakingType,
            stakingTime: block.timestamp,
            unlockTime: block.timestamp + category.duration,
            expectedReward: reward,
            isUnskated: false,
            redeemedReward: 0,
            pcReceived: 0
        });

        bool transfered = IERC20(projectInfo.tokenAddress).transferFrom(
            msg.sender,
            address(creator),
            amount
        );
        if (!transfered) {
            revert StakingPool__FAILED_TO_TRANSFER_TOEKNS();
        }

        // Mint An NFT to the creator contract with token detials
        _safeMint(
            creator,
            tokenId,
            abi.encodePacked(address(this))
        );

        emit JoinedPool(
            poolInfo.poolId,
            tokenId,
            onBehalf,
            amount,
            uint8(stakingType)
        );
    }

    /// @notice unstakeTokens can only be called by creator contract of the token holder.
    function unstakeTokens(uint256 tokenId) public payable {
        StakingLibrary.TokenData memory tokenData = s_tokenData[tokenId];

        if (msg.sender != tokenData.owner) {
            revert StakingPool__NOT_AUTHERIZED();
        }

        /// @notice Calculating the reward after pelanty;
        (
            uint256 redeemableReward,
            uint8 pcReceived,
            uint256 fee
        ) = findRedeemableReward(
                tokenData.expectedReward,
                tokenData.stakingTime,
                tokenData.unlockTime
            );

        if (msg.value < fee) {
            revert StakingPool__INSUFFICIENT_FUNDS();
        }

        if (tokenData.expectedReward == 0) {
            revert StakingPool__NOTHING_TO_UNSTAKE();
        }

        if (tokenData.isUnskated) {
            revert StakingPool__ALREADY_UNSTAKED();
        }

        s_tokenData[tokenId].isUnskated = true;
        s_tokenData[tokenId].redeemedReward = redeemableReward;
        s_tokenData[tokenId].pcReceived = pcReceived;

        uint256 leftoverReward = tokenData.expectedReward - redeemableReward;

        // Update the remianing reward pool
        s_poolInfo.remainingPool += leftoverReward;

        // Transfer fee to FeeManager
        (bool sent, ) = payable(s_campaignFeeManager).call{value: msg.value}(
            ""
        );
        if (!sent) {
            revert StakingPool__FAILED_TO_TRANSFER_BNBS();
        }

        _burn(tokenId);

        // Move tokens back to the user
        address creator = s_creatorManager.getCreatorAddressOfUser(msg.sender);
        bool transfered = ICreatorContract(creator).sendTokensBackToOwner(
            address(this),
            tokenId
        );
        if (!transfered) {
            revert StakingPool__FAILED_TO_TRANSFER_ORIGNAL_TOEKNS();
        }

        transfered = IERC20(tokenData.tokenAddress).transfer(
            tokenData.owner,
            redeemableReward
        );
        if (!transfered) {
            revert StakingPool__FAILED_TO_TRANSFER_REWARD_TOEKNS();
        }

        emit ExitedPool(
            tokenData.poolId,
            msg.sender,
            tokenData.tokenStaked,
            uint8(tokenData.stakingType),
            redeemableReward
        );
    }

    /// @notice - penalties (50% completion -> 30% reward, 80% completion -> 50% reward, 100% completion -> 100% reward)
    /// @notice an internal function to compute redeemable reward after pelanties.
    function findRedeemableReward(
        uint256 _expectedReward,
        uint256 _stakingTime,
        uint256 _unlockTime
    )
        public
        view
        returns (uint256 redeemableReward, uint8 pcReceived, uint256 fee)
    {
        ICampaignFeeManager campaignFeeManager = ICampaignFeeManager(
            s_campaignFeeManager
        );

        // Either 90 days, 180 days or 365 days.
        uint256 stakingPeriod = _unlockTime - _stakingTime;
        uint256 durationCompleted = block.timestamp - _stakingTime;
        uint256 pcCompleted = (durationCompleted * 100) / stakingPeriod;

        if (pcCompleted < 50) {
            pcReceived = 0;
            redeemableReward = 0;
            fee = campaignFeeManager.getUnstakingFee(
                StakingLibrary.UnstakingCategories.REWARD_0pc
            );
        } else if (pcCompleted >= 50 && pcCompleted < 80) {
            pcReceived = 30;
            redeemableReward = (_expectedReward * pcReceived) / 100;
            fee = campaignFeeManager.getUnstakingFee(
                StakingLibrary.UnstakingCategories.REWARD_30pc
            );
        } else if (pcCompleted >= 80 && pcCompleted < 100) {
            pcReceived = 50;
            redeemableReward = (_expectedReward * 50) / 100;
            fee = campaignFeeManager.getUnstakingFee(
                StakingLibrary.UnstakingCategories.REWARD_50pc
            );
        } else {
            pcReceived = 100;
            redeemableReward = _expectedReward;
            fee = campaignFeeManager.getUnstakingFee(
                StakingLibrary.UnstakingCategories.REWARD_100pc
            );
        }
    }

    function checkTokenReward(
        uint256 tokenId
    )
        external
        view
        returns (
            uint256 expectedReward,
            uint256 redeemableReward,
            uint8 pcReceived,
            uint256 fee
        )
    {
        StakingLibrary.TokenData memory tokenData = s_tokenData[tokenId];
        expectedReward = tokenData.expectedReward;
        (redeemableReward, pcReceived, fee) = findRedeemableReward(
            tokenData.expectedReward,
            tokenData.stakingTime,
            tokenData.unlockTime
        );
    }

    /// @notice Getter functions
    function getProjectInfo()
        external
        view
        returns (StakingLibrary.PoolFullInfo memory)
    {
        return
            StakingLibrary.PoolFullInfo(
                s_poolInfo,
                s_projectInfo,
                s_rewardPoolInfo,
                s_nftData
            );
    }

    function getTokenData(
        uint256 tokenId
    ) external view returns (StakingLibrary.TokenData memory) {
        return s_tokenData[tokenId];
    }

    function getUserTokens(
        address user
    ) external view returns (
        StakingLibrary.TokenData[] memory
        ) {

        address creator = s_creatorManager.getCreatorAddressOfUser(user);
        if (creator == address(0)) {
            revert StakingPool__NO_CREATOR_CONTRACT_FOUND();
        }

        uint256 userBalance = balanceOf(creator);
        StakingLibrary.TokenData[]
            memory tokensData = new StakingLibrary.TokenData[](userBalance);
            for (uint256 i = 0; i < userBalance; i++) {
                uint256 tokenId = tokenOfOwnerByIndex(creator, i);
                StakingLibrary.TokenData memory data = s_tokenData[tokenId];
                tokensData[i] = data;
            }

        return (tokensData);
    }
}
