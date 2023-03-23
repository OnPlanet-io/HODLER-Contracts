// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../library/StakingLibrary.sol";

interface IStakingPool is IERC721 {
    
    function stakeTokens(address onBehalf, uint256 amount, StakingLibrary.StakingType _type) external;
    function unstakeTokens(uint256 _tokenId) external;  
    function getTokenData(uint256 _tokenId) external view returns(StakingLibrary.TokenData memory);
    function getProjectInfo() external view returns ( StakingLibrary.PoolFullInfo memory poolFullInfo);

}