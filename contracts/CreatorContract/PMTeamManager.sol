// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "../interfaces/IMembershipFeeManager.sol";
import "../library/StakingLibrary.sol";

// import "hardhat/console.sol";

error INSUFFICIENT_FUNDS();
error FAILED_TO_TRANSFER_BNBS();
error NOT_OWNER_OF_TEAM();
error TOKEN_DONT_EXIST();
error CONTRACT_IS_PAUSED();

contract PMTeamManager is ERC721Enumerable, Ownable {

    address payable public membershipFeeManager;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;    

    string public teamTokenURI = "https://bafkreiaftkut5zfxzfffa7elss6tu3bluwjp2kli4zaqwm2qlpp7u7jbr4.ipfs.nftstorage.link";
    
    bool public pause = true;

    mapping (uint256 => Team) private team;
    struct Team {
        uint256 teamId;
        address[] members;
        uint256 inceptionDate;
    }

    constructor( address _membershipFeeManager)
    ERC721("PlanetMoon Team Manager", "PTM") {
        membershipFeeManager = payable(_membershipFeeManager);
    }

    function createATeam( address to ) public payable {

        if(pause){
            revert CONTRACT_IS_PAUSED();
        }

        uint256 fee = IMembershipFeeManager(membershipFeeManager)
            .getMembershipFee(StakingLibrary.MembershipCategories.TEAM);
       
        if(msg.value < fee){
            revert INSUFFICIENT_FUNDS();
        }

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        team[tokenId].teamId = tokenId;
        team[tokenId].members.push(to);
        uint256 createdAt = block.timestamp;
        team[tokenId].inceptionDate = createdAt;

        _safeMint(to, tokenId);

        // Transfer fee to FeeManager
        (bool sent,) = membershipFeeManager.call{value: msg.value}("");
        if(!sent){
            revert FAILED_TO_TRANSFER_BNBS();
        }
        

        emit TeamCreated(tokenId, createdAt);
    
    }

    function updateTeamMembers(uint256 tokenId, address[] memory members) public {

        if(ownerOf(tokenId) != msg.sender){
            revert NOT_OWNER_OF_TEAM();
        }
        
        team[tokenId].members = members;
    }

    function getTeamData(uint tokenId) public view returns(Team memory) {

        if(!_exists(tokenId)){
            revert TOKEN_DONT_EXIST();
        }
        return team[tokenId];
    }

    function getTeamsDataByRange(uint256 from, uint256 length) public view returns(Team[] memory) {

        if(from <= length){
            length = from;
        }

        Team[] memory fullData = new Team[](length);
        uint8 index = 0;

        for(uint256 i = from; i > from - length; i--){
            fullData[index] = team[i];
            index++;
        }
        return fullData;


    }

    function tokenURI(uint256 tokenId) public view override returns (string memory){

        if(!_exists(tokenId)){
            revert TOKEN_DONT_EXIST();
        }

        return teamTokenURI;
    }

    /* Admin Functions */

    function updateMembershipFeeManager(address _membershipFeeManager) public onlyOwner {
        membershipFeeManager = payable(_membershipFeeManager);
    }

    function changePauseStatus(bool action) public onlyOwner {
        pause = action;
    }

    event TeamCreated(uint256 teamId, uint256 createdAt);

}