// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol){}

    function mint(uint amount) public {
        _mint(msg.sender, amount * (10**18));
    }

    function mintToSomeone(address _address, uint amount) public {
        _mint(_address, amount * (10**18));
    }
}
