// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IUniswapV2Router02.sol";

contract SwapETHForTokens is Ownable {

    IUniswapV2Router02 public uniswapV2Router = IUniswapV2Router02(0x10ED43C718714eb63d5aA57B78B54704E256024E); //Pancakeswap router mainnet - BSC
    // IUniswapV2Router02 public uniswapV2Router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D); //Uniswap router goerli testnet - ETH

    function setRouter(IUniswapV2Router02 _uniswapV2Router) public onlyOwner {
        uniswapV2Router = _uniswapV2Router;
    }

    function swapETHForTokens(
        address tokenAddress,
        address toAddress,
        uint256 amount
    ) internal returns (uint256) {
        // generate the uniswap pair path of token -> weth
        address[] memory path = new address[](2);
        path[0] = uniswapV2Router.WETH();
        path[1] = tokenAddress;

        uint[] memory amounts = uniswapV2Router.swapExactETHForTokens{
            value: amount
        }(
            0, // accept any amount of Tokens
            path,
            toAddress, // The contract
            block.timestamp + 500
        );
        uint256 boughtTokens = amounts[amounts.length - 1];
        return boughtTokens;
    }

}
