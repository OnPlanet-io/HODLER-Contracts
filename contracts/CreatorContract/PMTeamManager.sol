// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

import {IMembershipFeeManager} from "../interfaces/IMembershipFeeManager.sol";
import {PMLibrary} from "../library/PMLibrary.sol";

// import "hardhat/console.sol";

contract PMTeamManager is ERC721Enumerable, Ownable {
    error PMTeamManager__INSUFFICIENT_FUNDS();
    error PMTeamManager__FAILED_TO_TRANSFER_BNBS();
    error PMTeamManager__NOT_OWNER_OF_TEAM();
    error PMTeamManager__TOKEN_DONT_EXIST();
    error PMTeamManager__CONTRACT_IS_PAUSED();
    error PMTeamManager__OUT_OF_RANGE();

    using Counters for Counters.Counter;
    Counters.Counter private s_tokenIdCounter;
    bool private s_isPaused = false;
    address payable private s_membershipFeeManager;
    string private constant uri =
        "https://bafkreiaftkut5zfxzfffa7elss6tu3bluwjp2kli4zaqwm2qlpp7u7jbr4.ipfs.nftstorage.link";

    mapping(uint256 => Team) private s_team;

    struct Team {
        uint256 teamId;
        uint256 inceptionDate;
        address[] members;
    }

    event TeamCreated(uint256 teamId, uint256 createdAt);

    constructor(
        address _membershipFeeManager
    ) ERC721("PlanetMoon Team Manager", "PTM") {
        s_membershipFeeManager = payable(_membershipFeeManager);
    }

    function createATeam(address to) public payable {
        if (s_isPaused) {
            revert PMTeamManager__CONTRACT_IS_PAUSED();
        }

        uint256 fee = IMembershipFeeManager(s_membershipFeeManager)
            .getMembershipFee(PMLibrary.MembershipCategories.TEAM);

        if (msg.value < fee) {
            revert PMTeamManager__INSUFFICIENT_FUNDS();
        }

        s_tokenIdCounter.increment();
        uint256 tokenId = s_tokenIdCounter.current();
        s_team[tokenId].teamId = tokenId;
        s_team[tokenId].members.push(to);
        uint256 createdAt = block.timestamp;
        s_team[tokenId].inceptionDate = createdAt;

        _safeMint(to, tokenId);

        // Transfer fee to FeeManager
        (bool sent, ) = s_membershipFeeManager.call{value: msg.value}("");
        if (!sent) {
            revert PMTeamManager__FAILED_TO_TRANSFER_BNBS();
        }

        emit TeamCreated(tokenId, createdAt);
    }

    function updateTeamMembers(
        uint256 tokenId,
        address[] memory members
    ) public {
        if (ownerOf(tokenId) != msg.sender) {
            revert PMTeamManager__NOT_OWNER_OF_TEAM();
        }

        s_team[tokenId].members = members;
    }

    function getTeamData(uint tokenId) public view returns (Team memory) {
        if (!_exists(tokenId)) {
            revert PMTeamManager__TOKEN_DONT_EXIST();
        }
        return s_team[tokenId];
    }

    function getTeamsDataByRange(
        uint256 from,
        uint256 length
    ) public view returns (Team[] memory) {
        if (from > s_tokenIdCounter.current()) {
            revert PMTeamManager__OUT_OF_RANGE();
        }

        if (from < length) {
            length = from;
        }

        Team[] memory fullData = new Team[](length);
        uint8 index = 0;

        for (uint256 i = from; i > from - length; i--) {
            fullData[index] = s_team[i];
            index++;
        }
        return fullData;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        if (!_exists(tokenId)) {
            revert PMTeamManager__TOKEN_DONT_EXIST();
        }

        return uri;
    }

    function isPaused() external view returns (bool) {
        return s_isPaused;
    }

    function getMemberShipFeeManager() external view returns (address) {
        return s_membershipFeeManager;
    }

    function totalSupply() public view override returns (uint256) {
        return s_tokenIdCounter.current();
    }

    /* Admin Functions */

    function updateMembershipFeeManager(
        address _membershipFeeManager
    ) public onlyOwner {
        s_membershipFeeManager = payable(_membershipFeeManager);
    }

    function changePauseStatus(bool action) public onlyOwner {
        s_isPaused = action;
    }
}
