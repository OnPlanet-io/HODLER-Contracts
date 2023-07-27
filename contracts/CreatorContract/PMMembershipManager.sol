// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

import {PMLibrary} from "../library/PMLibrary.sol";
import {IMembershipFeeManager} from "../interfaces/IMembershipFeeManager.sol";

import "hardhat/console.sol";

contract PMMembershipManager is
    ERC721("PlanetMoon Membership Manager", "PMM"),
    Ownable
{
    error PMMembershipManager__ALREADY_A_MEMBER();
    error PMMembershipManager__INSUFFICIENT_FUNDS();
    error PMMembershipManager__FAILED_TO_TRANSFER_BNBS();
    error PMMembershipManager__TOKEN_DONT_EXIST();
    error PMMembershipManager__CONTRACT_IS_PAUSED();
    error PMMembershipManager__OUT_OF_RANGE();
    error PMMembershipManager__TOKEN_TRANSFER_IS_BLOCKED();

    using Counters for Counters.Counter;
    Counters.Counter private s_tokenIdCounter;
    address payable private s_membershipFeeManager;
    mapping(address => User) private s_user;
    bool private s_isPaused = false;
    string private constant uri =
        "https://bafkreic6jbedhzggcaowb6jj5zflhxz4bnuk7l3lhjqktclxii3pll3py4.ipfs.nftstorage.link/";

    struct User {
        uint256 memberId;
        uint256 memberSince;
    }

    constructor(address _membershipFeeManager) {
        s_membershipFeeManager = payable(_membershipFeeManager);
    }

    function becomeMember(address to) public payable {
        if (s_isPaused) {
            revert PMMembershipManager__CONTRACT_IS_PAUSED();
        }

        if (balanceOf(to) > 0) {
            revert PMMembershipManager__ALREADY_A_MEMBER();
        }

        uint256 fee = IMembershipFeeManager(s_membershipFeeManager)
            .getMembershipFee(PMLibrary.MembershipCategories.MEMBER);

        if (msg.value < fee) {
            revert PMMembershipManager__INSUFFICIENT_FUNDS();
        }

        s_tokenIdCounter.increment();
        uint256 tokenId = s_tokenIdCounter.current();

        s_user[to].memberSince = block.timestamp;
        s_user[to].memberId = tokenId;

        _safeMint(to, tokenId);

        (bool sent, ) = s_membershipFeeManager.call{value: msg.value}("");
        if (!sent) {
            revert PMMembershipManager__FAILED_TO_TRANSFER_BNBS();
        }
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {

        if(from != address(0)) {
            revert PMMembershipManager__TOKEN_TRANSFER_IS_BLOCKED();
        }

        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function getUserData(address user) public view returns (User memory) {
        return s_user[user];
    }

    function getUserDataByRange(
        uint256 from,
        uint256 length
    ) public view returns (User[] memory) {
        if (from > s_tokenIdCounter.current()) {
            revert PMMembershipManager__OUT_OF_RANGE();
        }

        if (from < length) {
            length = from;
        }

        User[] memory fullData = new User[](length);
        uint8 index = 0;

        for (uint256 i = from; i > from - length; i--) {
            fullData[index] = s_user[ownerOf(i)];
            index++;
        }
        return fullData;
    }

    function getMemberShipFeeManager() external view returns (address) {
        return s_membershipFeeManager;
    }

    function totalSupply() external view returns (uint256) {
        return s_tokenIdCounter.current();
    }

    function tokenURI( uint256 tokenId ) public view override returns (string memory) {
        if (!_exists(tokenId)) {
            revert PMMembershipManager__TOKEN_DONT_EXIST();
        }

        return uri;
    }

    function isMember(address user) external view returns (bool) {
        return balanceOf(user) > 0;
    }

    function isPaused() external view returns (bool) {
        return s_isPaused;
    }

    /* Admin Functions */

    function updateMembershipFeeManager(
        address _membershipFeeManager
    ) external onlyOwner {
        s_membershipFeeManager = payable(_membershipFeeManager);
    }

    function giveAwayMembership(address[] memory to) external onlyOwner {
        for (uint8 i = 0; i < to.length; i++) {
            if (balanceOf(to[i]) == 0) {
                s_tokenIdCounter.increment();
                uint256 tokenId = s_tokenIdCounter.current();
                s_user[to[i]] = User({
                    memberSince: block.timestamp,
                    memberId: tokenId
                });
                _safeMint(to[i], tokenId);
            }
        }
    }

    function changePauseStatus(bool action) public onlyOwner {
        s_isPaused = action;
    }
}

// string public regularURI = "https://bafkreifrj2c6ds4j4onfxmoelibfyhwf6xrccroh2tf7ej55lrplbggi6a.ipfs.nftstorage.link";
// premiumMembership = "https://bafkreifihh4pd5r7kq6zig7oy6dzm7avtkhphetq6qsjzmdufzv5mumhjy.ipfs.nftstorage.link";
