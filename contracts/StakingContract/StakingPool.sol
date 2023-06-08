// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "../library/StakingLibrary.sol";
import "../interfaces/ICreatorManager.sol";
import "../interfaces/ICreatorContract.sol";
import "../interfaces/ICampaignFeeManager.sol";

// import "hardhat/console.sol";

error POOL_NOT_STARTED();
error NOT_ENOUGH_REWARD();
error NOT_AUTHERIZED();
error NOTHING_TO_UNSTAKE();
error ALREADY_UNSTAKED();
error INSUFFICIENT_FUNDS();
error FAILED_TO_TRANSFER_BNBS();
error FAILED_TO_TRANSFER_TOEKNS();
error FAILED_TO_TRANSFER_ORIGNAL_TOEKNS();
error FAILED_TO_TRANSFER_REWARD_TOEKNS();
error NO_CREATOR_CONTRACT_FOUND();
error NOT_A_VALID_STAKING_TYPE();


contract StakingPool is ERC721Enumerable {
   
    uint256 internal constant ONE_DAY = 24*60*60;
    address public creatorManager;
    address payable public campaignFeeManager;

    StakingLibrary.PoolInfo private poolInfo;
    StakingLibrary.ProjectInfo private projectInfo;
    StakingLibrary.NFTData private nftData;
    StakingLibrary.RewardPoolInfo private rewardPoolInfo;

    struct StakingCategeroy {
        uint256 duration;
        uint256 rewardPC;
        string image;
    }

    mapping (StakingLibrary.StakingType => StakingCategeroy) private stakingInfo;
    mapping (uint256 => StakingLibrary.TokenData) private tokenData;

    constructor (
        uint256 _poolId,
        StakingLibrary.ProjectInfo memory _projectInfo,
        StakingLibrary.RewardPoolInfo memory _rewardPoolInfo,
        StakingLibrary.NFTData memory _nftData,
        address _creatorManager,
        address payable _campaignFeeManager,
        address _ownerOfProject
        ) 
        ERC721(_projectInfo.projectName, _projectInfo.projectSymbol) {

        stakingInfo[StakingLibrary.StakingType.ONE_MONTH] = 
            StakingCategeroy(30*ONE_DAY, _nftData.APY_1_months, _nftData.image_1_months);
    
        stakingInfo[StakingLibrary.StakingType.THREE_MONTH] = 
            StakingCategeroy(90*ONE_DAY, _nftData.APY_3_months, _nftData.image_3_months);

        stakingInfo[StakingLibrary.StakingType.SIX_MONTH] = 
            StakingCategeroy(180*ONE_DAY, _nftData.APY_6_months, _nftData.image_6_months);

        stakingInfo[StakingLibrary.StakingType.NINE_MONTH] = 
            StakingCategeroy(270*ONE_DAY, _nftData.APY_9_months, _nftData.image_9_months);

        stakingInfo[StakingLibrary.StakingType.TWELVE_MONTH] = 
            StakingCategeroy(365*ONE_DAY, _nftData.APY_12_months, _nftData.image_12_months);

        projectInfo = _projectInfo;
        rewardPoolInfo = _rewardPoolInfo;
        nftData = _nftData;

        poolInfo.poolId = _poolId;
        poolInfo.poolAddress = address(this);
        poolInfo.remainingPool = _rewardPoolInfo.poolAmount;
        poolInfo.poolOwner = _ownerOfProject;

        creatorManager = _creatorManager;
        campaignFeeManager = _campaignFeeManager;

    }

    /// @notice The main function to stake tokens
    function stakeTokens(address onBehalf, uint256 amount, StakingLibrary.StakingType _type) public {

        // Check if pool has been started 
        if(block.timestamp < rewardPoolInfo.startedAt){
            revert POOL_NOT_STARTED();
        }

        // Get Staking type info
        StakingCategeroy memory category = stakingInfo[_type];

        // Check if category is valid 
        if(category.rewardPC == 0){
            revert NOT_A_VALID_STAKING_TYPE();
        }

        // Calculate reward of this person
        uint256 reward = amount * category.rewardPC / 100;

        // Check if pool has enough space to give this reward
        if(poolInfo.remainingPool < reward){
            revert NOT_ENOUGH_REWARD();
        }

        // Update the remianing reward pool
        poolInfo.remainingPool -= reward;
        // Update the total staked tokens variable
        poolInfo.totalTokensStaked += amount;
        // update totalParicipants
        poolInfo.totalParicipants++;
        // Update the tokenID
        poolInfo.tokenCounter++;

        // tokenUri
        string memory tokenUri = stakingInfo[_type].image;

        //Check if user has a creator contract
        address creator = ICreatorManager(creatorManager).creatorAddress(onBehalf);

        // Not already a creator then create one
        if(creator == address(0)){
            creator = ICreatorManager(creatorManager).createACreator(onBehalf);
        }

        // Record the staking entry
        tokenData[poolInfo.tokenCounter] = StakingLibrary.TokenData(
            address(this),                          //poolAddress
            poolInfo.poolId,                        //poolId
            amount,                                 //tokenStaked
            projectInfo.tokenAddress,               //tokenAddress
            address(onBehalf),                      //owner
            address(creator),                       //creator
            poolInfo.tokenCounter,                  //tokenID
            tokenUri,                               //tokenUri
            uint8(_type),                           //stakingType;
            block.timestamp,                        //stakingTime
            block.timestamp + category.duration,    //unlockTime
            reward,                                 //expectedReward
            false,                                  //isUnskated
            0,                                      //redeemedReward
            0                                       //pcReceived
        );


        bool transfered = IERC20(projectInfo.tokenAddress).transferFrom(msg.sender, address(creator), amount);
        if(!transfered){
            revert FAILED_TO_TRANSFER_TOEKNS();
        }

        // Mint An NFT to the creator contract with token detials
        _safeMint(creator, poolInfo.tokenCounter, abi.encodePacked(address(this)));

        emit JoinedPool(poolInfo.poolId, poolInfo.tokenCounter, onBehalf, amount, uint8(_type));
        

    }

    /// @notice unstakeTokens can only be called by creator contract of the token holder. 
    function unstakeTokens(uint256 _tokenId) public payable {

        StakingLibrary.TokenData memory _tokenData = tokenData[_tokenId];
        
        // Only owner of the token should be able to withdraw
        if(msg.sender != _tokenData.owner){
            revert NOT_AUTHERIZED();
        }
        // require(_tokenData.expectedReward > 0, "Nothing to unstaked");
        if(_tokenData.expectedReward == 0){
            revert NOTHING_TO_UNSTAKE();
        }

        // require(!_tokenData.isUnskated, "Already unstaked");
        if(_tokenData.isUnskated){
            revert ALREADY_UNSTAKED();
        }

        tokenData[_tokenId].isUnskated = true;

        /// @notice Calculating the reward after pelanty;
        (uint256 redeemableReward, uint8 pcReceived, uint256 fee) = findRedeemableReward(_tokenData.expectedReward, _tokenData.stakingTime, _tokenData.unlockTime);

        tokenData[_tokenId].redeemedReward = redeemableReward;
        tokenData[_tokenId].pcReceived = pcReceived;

        uint256 leftoverReward = _tokenData.expectedReward - redeemableReward;

        // Update the remianing reward pool
        poolInfo.remainingPool += leftoverReward;


        if(msg.value < fee){
            revert INSUFFICIENT_FUNDS();
        }

        // Transfer fee to FeeManager
        (bool sent,) = campaignFeeManager.call{value: msg.value}("");
        if(!sent){
            revert FAILED_TO_TRANSFER_BNBS();
        }

        // Move tokens back to the user
        address creator = ICreatorManager(creatorManager).creatorAddress(msg.sender);        
        bool transfered = ICreatorContract(creator).sendTokensBackToOwner(address(this), _tokenId);
        if(!transfered){
            revert FAILED_TO_TRANSFER_ORIGNAL_TOEKNS();
        }

        transfered = IERC20(projectInfo.tokenAddress).transfer(_tokenData.owner, redeemableReward);
        if(!transfered){
            revert FAILED_TO_TRANSFER_REWARD_TOEKNS();
        }

        _burn(_tokenData.tokenId);
        if(balanceOf(creator) == 0) {
            ICreatorContract(creator).removePoolAddress(address(this));
        }

        emit ExitedPool(poolInfo.poolId, msg.sender, _tokenData.tokenStaked, uint8(_tokenData.stakingType), redeemableReward);

    }
    
    /// @notice - penalties (50% completion -> 30% reward, 80% completion -> 50% reward, 100% completion -> 100% reward)
    /// @notice an internal function to compute redeemable reward after pelanties.
    function findRedeemableReward(
        uint256 _expectedReward, uint256 _stakingTime, uint256 _unlockTime
        ) public view returns(uint256 redeemableReward, uint8 pcReceived, uint256 fee) {
        
        // Either 90 days, 180 days or 365 days. 
        uint256 stakingPeriod = _unlockTime - _stakingTime;
        uint256 durationCompleted = block.timestamp - _stakingTime;
        uint256 pcCompleted = (durationCompleted * 100) / stakingPeriod;
        

        if(pcCompleted < 50 ){
            pcReceived = 0;
            redeemableReward = 0;
            fee = ICampaignFeeManager(campaignFeeManager).getUnstakingFee(StakingLibrary.UnstakingCategories.REWARD_0pc);
        }
        else if(pcCompleted >= 50 && pcCompleted < 80 ){
            pcReceived = 30;
            redeemableReward = (_expectedReward * pcReceived) / 100;
            fee = ICampaignFeeManager(campaignFeeManager).getUnstakingFee(StakingLibrary.UnstakingCategories.REWARD_30pc);
        }
        else if(pcCompleted >= 80 && pcCompleted < 100){
            pcReceived = 50;
            redeemableReward = (_expectedReward * 50) / 100;
            fee = ICampaignFeeManager(campaignFeeManager).getUnstakingFee(StakingLibrary.UnstakingCategories.REWARD_50pc);
        }
        else {
            pcReceived = 100;
            redeemableReward = _expectedReward;
            fee = ICampaignFeeManager(campaignFeeManager).getUnstakingFee(StakingLibrary.UnstakingCategories.REWARD_100pc);
        }

    }

    function checkTokenReward(uint256 _tokenId) public view returns (
        uint256 expectedReward, 
        uint256 redeemableReward,
        uint8 pcReceived,
        uint256 fee
        ) {
        StakingLibrary.TokenData memory _tokenData = tokenData[_tokenId];
        expectedReward = _tokenData.expectedReward;
        (redeemableReward,pcReceived,fee) = findRedeemableReward(_tokenData.expectedReward, _tokenData.stakingTime, _tokenData.unlockTime);
    }
    
    /// @notice Getter functions
    function getProjectInfo() public view returns (
        StakingLibrary.PoolFullInfo memory
    ){
        return StakingLibrary.PoolFullInfo(poolInfo, projectInfo, rewardPoolInfo, nftData);
    }

    function getTokenData(uint256 _tokenId) public view returns(StakingLibrary.TokenData memory){
        return tokenData[_tokenId];
    }

    function getUserTokens(address _user) public view returns (
        // StakingLibrary.ProjectInfo memory, StakingLibrary.TokenData[] memory ) {
        StakingLibrary.TokenData[] memory ) {
        
        address creator = ICreatorManager(creatorManager).creatorAddress(_user);
        if(creator == address(0)){
            revert NO_CREATOR_CONTRACT_FOUND();
        }

        uint256 myBalance = balanceOf(creator);
        StakingLibrary.TokenData[] memory tokensData = new StakingLibrary.TokenData[](myBalance);
        for(uint256 i = 0; i < myBalance; i++){
            uint256 tokenId = tokenOfOwnerByIndex(creator, i);
            StakingLibrary.TokenData memory data = tokenData[tokenId];
            tokensData[i] = data;
        }

        // return (projectInfo, tokensData);
        return (tokensData);
    
    }
    
    event JoinedPool(uint poolId, uint tokenId, address user, uint contribution, uint8 category);
    event ExitedPool(uint id, address creator, uint contribution, uint8 category, uint redeemableReward);

}