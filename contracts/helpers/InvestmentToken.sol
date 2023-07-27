// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract InvestmentToken is ERC20{
    constructor() ERC20("Staking Token", "ST"){}

    function mint(uint amount) public {
        _mint(msg.sender, amount);
    }
}
