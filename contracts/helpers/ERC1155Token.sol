// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract ERC1155Token is ERC1155(""){

    uint256 id;

    function mint(address to) public {
        id++;
        _mint(to, id, 1, "ERC1155 Token");
    }

    function mintBatch(address to) public {
        uint256[] memory ids = new uint256[](3);
        (ids[0], ids[1], ids[2]) = (3,4,5);

        uint256[] memory quantity = new uint256[](3);
        (quantity[0], quantity[1], quantity[2]) = (6,7,8);
        
        _mintBatch(to, ids, quantity,"ERC721 Tokens");
    }



}
