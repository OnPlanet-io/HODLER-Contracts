// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract ERC721Token is ERC721Enumerable{
    constructor() ERC721("ERC721 Token", "ERC721"){}
    uint256 id;
    function mint(address to) public {
        id++;
        _safeMint(to, id, "ERC721 Token");
    }
}
