// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./StakingPool.sol";
import "../library/StakingLibrary.sol";
import "../interfaces/IPMMembership.sol";
import "../interfaces/IPMTeamManager.sol";
import "../interfaces/ICampaignFeeManager.sol";

// import "hardhat/console.sol";

error NOT_PREMIUM_OR_TEAM();
error NOT_OWNER_OF_TEAM();
error START_TIME_SHOULD_BE_FUTURE();
error PROFILE_IS_ALREADY_SET();
error NOT_THE_CAMPAIGN_OWNER();
error FAILED_TO_TRANSFER_TOKENS();
error CONTRACT_IS_PAUSED();

contract StakingPoolFactory is Ownable {

    address payable public campaignFeeManager;
    address public pmMembership;
    address public pmTeamManager;
    address public creatorManager;
    
    uint256 public projectsCount;
    bool public pause = false;

    mapping(address => uint256[]) private poolsOfAUser;
    mapping(uint256 => uint256[]) private poolsOfATeam;

    mapping(address => address[]) private stakingPoolsByToken;
    mapping(uint256 => address) private stakingPoolByID;

    constructor(
        address _campaignFeeManager,
        address _pmMembership, 
        address _pmTeamManager,
        address _creatorManager
        ){
        campaignFeeManager = payable(_campaignFeeManager);
        pmMembership = _pmMembership;
        pmTeamManager = _pmTeamManager;
        creatorManager = _creatorManager;
    }

    function createAStakingPool(
        StakingLibrary.ProjectInfo memory projectInfo,
        StakingLibrary.RewardPoolInfo memory rewardPoolInfo,
        StakingLibrary.Images memory images
        ) public payable {
        
        if(pause){
            revert CONTRACT_IS_PAUSED();
        }

        bool hasTeam = IPMTeamManager(pmTeamManager).balanceOf(msg.sender) > 0;
        bool isPremiumMember = IPMMembership(pmMembership).getUserTokenData(msg.sender).isPremium;

        if(!hasTeam && !isPremiumMember){
            revert NOT_PREMIUM_OR_TEAM();
        }
        
        if(projectInfo.profileType == StakingLibrary.ProfileType.TEAM){
            address ownerOfTeam = IPMTeamManager(pmTeamManager).ownerOf(projectInfo.profileId);
            if(ownerOfTeam != msg.sender) {
                revert NOT_OWNER_OF_TEAM();
            }
        }

        uint256 requiredFee = ICampaignFeeManager(campaignFeeManager).getCampaignFee(projectInfo.category);

        if(msg.value < requiredFee){
            revert INSUFFICIENT_FUNDS();
        }

        if(rewardPoolInfo.startedAt < block.timestamp){
            revert START_TIME_SHOULD_BE_FUTURE();
        }

        projectsCount++;
        
        StakingPool stakingContract = new StakingPool(
            projectsCount, projectInfo, rewardPoolInfo, images, creatorManager, campaignFeeManager, msg.sender
        );


        if(projectInfo.profileType == StakingLibrary.ProfileType.TEAM){
            poolsOfATeam[projectInfo.profileId].push(projectsCount);
        }

        stakingPoolsByToken[projectInfo.tokenAddress].push(address(stakingContract));
        stakingPoolByID[projectsCount] = address(stakingContract);
        poolsOfAUser[msg.sender].push(projectsCount);

        bool transfered = IERC20(projectInfo.tokenAddress)
                            .transferFrom(msg.sender, address(stakingContract), rewardPoolInfo.poolAmount);
        
        if(!transfered){
            revert FAILED_TO_TRANSFER_TOKENS();
        }

        (bool sent,) = campaignFeeManager.call{value: msg.value}("");
        if(!sent){
            revert FAILED_TO_TRANSFER_BNBS();
        }

        emit Poolcreated(projectsCount, address(stakingContract), projectInfo.tokenAddress);

    }

    /* Getter Functions */

    function getPoolsByToken(address token) public view returns (address[] memory) {
        return stakingPoolsByToken[token];
    }

    function getPoolByID(uint256 id) public view returns (address) {
        return stakingPoolByID[id];
    }

    function getPoolIdsOfAUser(address user) public view returns (uint256[] memory) {
        return poolsOfAUser[user];
    }

    function getPoolIdsOfATeam(uint256 teamId) public view returns (uint256[] memory) {
        return poolsOfATeam[teamId];
    }

    /* Admin Functions */

    function changePauseStatus(bool action) public onlyOwner {
        pause = action;
    }

    function updateCampaignFeeManager( address _campaignFeeManager ) public onlyOwner {
        campaignFeeManager = payable(_campaignFeeManager);
    }

    /* Events */
    event Poolcreated(uint256 poolId, address poolAddress, address tokenAddress);

}
