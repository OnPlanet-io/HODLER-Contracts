// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {PMLibrary} from "../library/PMLibrary.sol";
import {IRewardCampaign} from "../interfaces/IRewardCampaign.sol";

// import "hardhat/console.sol";

contract CreatorContract is ERC721Holder {
    error CreatorContract__NOT_AUTHERIZED();

    EnumerableSet.AddressSet private s_myPoolAddresses;

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory data
    ) public virtual override returns (bytes4) {
        // onERC721Received(address operator, address from, uint256 tokenId, bytes data) → bytes4

        address poolAddress;
        assembly {
            poolAddress := mload(add(data, 20))
        }

        if (!EnumerableSet.contains(s_myPoolAddresses, poolAddress)) {
            EnumerableSet.add(s_myPoolAddresses, poolAddress);
        }

        return this.onERC721Received.selector;
    }

    function sendTokensBackToOwner(
        address rewardPool,
        uint256 tokenId
    ) public returns (bool transfered) {
        PMLibrary.TokenData memory token = IRewardCampaign(rewardPool)
            .getTokenData(tokenId);

        if (msg.sender != token.poolAddress) {
            revert CreatorContract__NOT_AUTHERIZED();
        }

        transfered = IERC20(token.tokenAddress).transfer(
            token.owner,
            token.tokenInvested
        );

        if (IERC721(rewardPool).balanceOf(address(this)) == 0) {
            EnumerableSet.remove(s_myPoolAddresses, rewardPool);
        }
    }

    function getPoolAddresses() public view returns (address[] memory) {
        return EnumerableSet.values(s_myPoolAddresses);
    }
}
