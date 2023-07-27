// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {StakingLibrary} from "../library/StakingLibrary.sol";
import {IStakingPool} from "../interfaces/IStakingPool.sol";

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
        address stakingPool,
        uint256 _tokenId
    ) public returns (bool transfered) {
        StakingLibrary.TokenData memory token = IStakingPool(stakingPool)
            .getTokenData(_tokenId);

        if (msg.sender != token.poolAddress) {
            revert CreatorContract__NOT_AUTHERIZED();
        }

        transfered = IERC20(token.tokenAddress).transfer(
            token.owner,
            token.tokenStaked
        );

        if (IERC721(stakingPool).balanceOf(address(this)) == 0) {
            EnumerableSet.remove(s_myPoolAddresses, stakingPool);
        }
    }

    function getPoolAddresses() public view returns (address[] memory) {
        return EnumerableSet.values(s_myPoolAddresses);
    }
}
