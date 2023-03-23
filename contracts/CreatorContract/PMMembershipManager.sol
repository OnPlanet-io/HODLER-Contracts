// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "../library/StakingLibrary.sol";
import "../interfaces/IMembershipFeeManager.sol";

// import "hardhat/console.sol";

error ALREADY_A_MEMBER();
error INSUFFICIENT_FUNDS();
error FAILED_TO_TRANSFER_BNBS();
error NOT_A_MEMBER();
error ALREADY_A_PREMIUM_MEMBER();
error TOKEN_DONT_EXIST();

contract PMMembershipManager is ERC721, Ownable {

    address payable public membershipFeeManager;
    
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    
    string public regularURI = "https://bafkreifrj2c6ds4j4onfxmoelibfyhwf6xrccroh2tf7ej55lrplbggi6a.ipfs.nftstorage.link";
    string public premiumURI = "https://bafkreifihh4pd5r7kq6zig7oy6dzm7avtkhphetq6qsjzmdufzv5mumhjy.ipfs.nftstorage.link";
    
    mapping (address => StakingLibrary.UserDetail) private userDetail;
    mapping (uint256 => bool) private isPremium;

    constructor( address _membershipFeeManager) ERC721("PlanetMoon Membership Manager", "PMM") {
        membershipFeeManager = payable(_membershipFeeManager);
    }

    function giveAwayMembership(address[] memory to) public onlyOwner {
        
        for(uint8 i = 0; i < to.length; i++ ){
            if(balanceOf(to[i]) == 0){
                _tokenIdCounter.increment();
                uint256 tokenId = _tokenIdCounter.current();
                userDetail[to[i]] = StakingLibrary.UserDetail(block.timestamp, tokenId, true);
                _safeMint(to[i], tokenId);
            }
        }

    }

    function getUserTokenData(address userAddress) public view returns (StakingLibrary.UserDetail memory){
        return userDetail[userAddress];
    }   

    function becomeMember(address to) public payable {

        if(balanceOf(to) > 0){
            revert ALREADY_A_MEMBER();
        }
        
        uint256 fee = IMembershipFeeManager(membershipFeeManager)
            .getMembershipFee(StakingLibrary.MembershipCategories.REGULAR);

        if(msg.value < fee){
            revert INSUFFICIENT_FUNDS();
        }

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        userDetail[to].memberSince = block.timestamp;
        userDetail[to].memberId = tokenId;

        _safeMint(to, tokenId);

        (bool sent,) = membershipFeeManager.call{value: msg.value}("");
        if(!sent){
            revert FAILED_TO_TRANSFER_BNBS();
        }

    
    }

    function upgradeToPremium(address userAddress) public payable {

        if(userDetail[userAddress].memberId == 0){
            revert NOT_A_MEMBER();
        }
        if(userDetail[userAddress].isPremium){
            revert ALREADY_A_PREMIUM_MEMBER();
        }

        uint256 fee = IMembershipFeeManager(membershipFeeManager)
            .getMembershipFee(StakingLibrary.MembershipCategories.UPGRAGE);

        userDetail[userAddress].isPremium = true;

        if(msg.value < fee){
            revert INSUFFICIENT_FUNDS();
        }

        (bool sent,) = membershipFeeManager.call{value: msg.value}("");
        if(!sent){
            revert FAILED_TO_TRANSFER_BNBS();
        }


    }

    function becomePremiumMember(address to) public payable {

        if(balanceOf(to) > 0){
            revert ALREADY_A_MEMBER();
        }

        uint256 fee = IMembershipFeeManager(membershipFeeManager)
            .getMembershipFee(StakingLibrary.MembershipCategories.PREMIUIM);
        
        if(msg.value < fee){
            revert INSUFFICIENT_FUNDS();
        }
        
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        userDetail[to] = StakingLibrary.UserDetail(block.timestamp, tokenId, true);

        _safeMint(to, tokenId);

        (bool sent,) = membershipFeeManager.call{value: msg.value}("");
        if(!sent){
            revert FAILED_TO_TRANSFER_BNBS();
        }


    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function _beforeTokenTransfer( address from, address to, uint256 tokenId, uint256 batchSize ) internal override virtual {
        require(from == address(0), "Err: token transfer is BLOCKED");   
        super._beforeTokenTransfer(from, to, tokenId, batchSize);  
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory){

        if(!_exists(tokenId)){
            revert TOKEN_DONT_EXIST();
        }
        address ownerOfToken = ownerOf(tokenId);

        if(userDetail[ownerOfToken].isPremium){
            return premiumURI;
        }
        else {
            return regularURI;
        }
    }

    function updateMembershipFeeManager(address _membershipFeeManager) public onlyOwner {
        membershipFeeManager = payable(_membershipFeeManager);
    }

}