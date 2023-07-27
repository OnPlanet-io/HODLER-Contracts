// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// import {} "@openzeppelin/contracts/access/Ownable.sol";
import {IUniswapV2Router02} from "../interfaces/IUniswapV2Router02.sol";

contract SwapETHForTokens {

    // IUniswapV2Router02 public uniswapV2Router = IUniswapV2Router02(0x10ED43C718714eb63d5aA57B78B54704E256024E); //Pancakeswap router mainnet - BSC
    // IUniswapV2Router02 public uniswapV2Router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D); //Uniswap router goerli testnet - ETH
    IUniswapV2Router02 public uniswapV2Router = IUniswapV2Router02(0xB26B2De65D07eBB5E54C7F6282424D3be670E1f0); //Uniswap router sepolia testnet - ETH

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
