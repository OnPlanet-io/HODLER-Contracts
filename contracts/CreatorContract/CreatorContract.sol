// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../library/StakingLibrary.sol";
import "../interfaces/IStakingPool.sol";

// import "hardhat/console.sol";

error NOT_AUTHERIZED();

contract CreatorContract is ERC721Holder, Ownable {
    
    EnumerableSet.AddressSet private myPoolAddresses;

    constructor(address _owner){
        transferOwnership(_owner);
    }

    function onERC721Received(address, address, uint256, bytes memory data) public virtual override returns (bytes4) {
        // onERC721Received(address operator, address from, uint256 tokenId, bytes data) → bytes4

        address poolAddress;
        assembly {
            poolAddress := mload(add(data,20))
        } 

        if(!EnumerableSet.contains(myPoolAddresses, poolAddress)){
            EnumerableSet.add(myPoolAddresses, poolAddress);
        }

        return this.onERC721Received.selector;
        
    }

    function sendTokensBackToOwner(address stakingPool, uint256 _tokenId) public returns (bool transfered) {

        StakingLibrary.TokenData memory token = IStakingPool(stakingPool).getTokenData(_tokenId);
        if(msg.sender != token.poolAddress ){
            revert NOT_AUTHERIZED();
        }

        transfered = IERC20(token.tokenAddress).transfer(owner(), token.tokenStaked);

        if(IERC721(stakingPool).balanceOf(address(this)) == 0) {
            EnumerableSet.remove(myPoolAddresses, stakingPool);
        }

    }

    // function removePoolAddress(address _poolAddress) public {
    //     require( tx.origin == owner(), "Not Authorized" );
    //     EnumerableSet.remove(myPoolAddresses, _poolAddress);
    // }

    function getPoolAddresses() public view returns(address[] memory) {
        return EnumerableSet.values(myPoolAddresses);
    }

}