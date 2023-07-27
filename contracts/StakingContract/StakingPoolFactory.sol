// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {StakingPool} from "./StakingPool.sol";
import {StakingLibrary} from "../library/StakingLibrary.sol";

import {IPMMembershipManager} from "../interfaces/IPMMembershipManager.sol";
import {IPMTeamManager} from "../interfaces/IPMTeamManager.sol";
import {ICampaignFeeManager} from "../interfaces/ICampaignFeeManager.sol";

// import "hardhat/console.sol";

contract StakingPoolFactory is Ownable {

    error StakingPoolFactory__NOT_MEMBER_OR_TEAM();
    error StakingPoolFactory__NOT_OWNER_OF_TEAM();
    error StakingPoolFactory__START_TIME_SHOULD_BE_FUTURE();
    error StakingPoolFactory__FAILED_TO_TRANSFER_TOKENS();
    error StakingPoolFactory__CONTRACT_IS_PAUSED();
    error StakingPoolFactory__FAILED_TO_TRANSFER_BNBS();
    error StakingPoolFactory__INSUFFICIENT_FUNDS();

    using Counters for Counters.Counter;
    Counters.Counter private s_projectsCount;
    bool private s_isPaused = false;

    address private s_campaignFeeManager;
    address private s_pmMembershipManager;
    address private s_pmTeamManager;
    address private s_creatorManager;

    mapping(address userAddress => uint256[] pools) private s_poolsOfAUser;
    mapping(uint256 teamId => uint256[] pools) private s_poolsOfATeam;

    mapping(address tokenAddress => address[] pools) private s_stakingPoolsByToken;
    mapping(uint256 id => address pool) private s_stakingPoolByID;

    event Poolcreated(
        uint256 poolId,
        address poolAddress,
        address tokenAddress
    );

    constructor(        
        address campaignFeeManager,
        address pmMembershipManager,
        address pmTeamManager,
        address creatorManager
    ) {
        s_campaignFeeManager = campaignFeeManager;
        s_pmMembershipManager = pmMembershipManager;
        s_pmTeamManager = pmTeamManager;
        s_creatorManager = creatorManager;
    }

    function createAStakingPool(
        StakingLibrary.ProjectInfo memory projectInfo,
        StakingLibrary.RewardPoolInfo memory rewardPoolInfo,
        StakingLibrary.NFTData memory nftData
    ) public payable {
        if (s_isPaused) {
            revert StakingPoolFactory__CONTRACT_IS_PAUSED();
        }

        bool hasTeam = IPMTeamManager(s_pmTeamManager).balanceOf(
            msg.sender
        ) > 0;
        bool isMember = IPMMembershipManager(s_pmMembershipManager)
            .isMember(msg.sender);

        // To start a campaign, user should be a premium member or he should have a team membership.
        if (!hasTeam && !isMember) {
            revert StakingPoolFactory__NOT_MEMBER_OR_TEAM();
        }

        if (projectInfo.profileType == StakingLibrary.ProfileType.TEAM) {
            address ownerOfTeam = IPMTeamManager(s_pmTeamManager).ownerOf(projectInfo.profileId);
            if (ownerOfTeam != msg.sender) {
                revert StakingPoolFactory__NOT_OWNER_OF_TEAM();
            }
        }

        uint256 requiredFee = ICampaignFeeManager(s_campaignFeeManager).getCampaignFee(projectInfo.category);

        if (msg.value < requiredFee) {
            revert StakingPoolFactory__INSUFFICIENT_FUNDS();
        }

        if (rewardPoolInfo.startedAt < block.timestamp) {
            revert StakingPoolFactory__START_TIME_SHOULD_BE_FUTURE();
        }

        s_projectsCount.increment();
        uint256 newId = s_projectsCount.current();


        StakingPool stakingContract = new StakingPool(
            newId,
            projectInfo,
            rewardPoolInfo,
            nftData,
            s_creatorManager,
            s_campaignFeeManager,
            msg.sender
        );

        if (projectInfo.profileType == StakingLibrary.ProfileType.TEAM) {
            s_poolsOfATeam[projectInfo.profileId].push(newId);
        }

        s_stakingPoolsByToken[projectInfo.tokenAddress].push(
            address(stakingContract)
        );
        s_stakingPoolByID[newId] = address(stakingContract);
        s_poolsOfAUser[msg.sender].push(newId);

        bool transfered = IERC20(projectInfo.tokenAddress).transferFrom(
            msg.sender,
            address(stakingContract),
            rewardPoolInfo.poolAmount
        );

        if (!transfered) {
            revert StakingPoolFactory__FAILED_TO_TRANSFER_TOKENS();
        }

        (bool sent, ) = payable(s_campaignFeeManager).call{
            value: msg.value
        }("");
        if (!sent) {
            revert StakingPoolFactory__FAILED_TO_TRANSFER_BNBS();
        }

        emit Poolcreated(
            newId,
            address(stakingContract),
            projectInfo.tokenAddress
        );
    }

    /* Getter Functions */

    function getPoolsByToken(
        address token
    ) external view returns (address[] memory) {
        return s_stakingPoolsByToken[token];
    }

    function getPoolByID(uint256 id) external view returns (address) {
        return s_stakingPoolByID[id];
    }

    function getPoolIdsOfAUser(
        address user
    ) external view returns (uint256[] memory) {
        return s_poolsOfAUser[user];
    }

    function getPoolIdsOfATeam(
        uint256 teamId
    ) external view returns (uint256[] memory) {
        return s_poolsOfATeam[teamId];
    }

    function isPaused() external view returns (bool) {
        return s_isPaused;
    }

    function getPMAddresses() external view returns (address,address,address,address) {
        return (
            s_campaignFeeManager,
            s_pmMembershipManager,
            s_pmTeamManager,
            s_creatorManager
        );
    }

    /* Admin Functions */

    function changePauseStatus(bool action) external onlyOwner {
        s_isPaused = action;
    }

    // function updatePMAddresses(        
    //     address campaignFeeManager,
    //     address pmMembershipManager,
    //     address pmTeamManager,
    //     address creatorManager
    // ) external onlyOwner {
    //     s_campaignFeeManager = campaignFeeManager;
    //     s_pmMembershipManager = pmMembershipManager;
    //     s_pmTeamManager = pmTeamManager;
    //     s_creatorManager = creatorManager;
    // }

}
