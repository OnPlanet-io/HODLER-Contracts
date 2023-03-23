// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
// import "../library/StakingLibrary.sol";

interface IStakingPoolFactory  {

    function getPoolByID(uint256 id) external view returns (address);

}