// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
* Network: Goerli
* Aggregator: ETH/USD
* Address: 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
*/


/**
* Network: BNB Chain Mainnet
* Aggregator: BNB/USD
* Address: 0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE
*/

contract PriceFeed {

    // AggregatorV3Interface internal priceFeed = AggregatorV3Interface(0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE); // BNB Chain Mainnet BNB/USD
    // AggregatorV3Interface internal priceFeed = AggregatorV3Interface(0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e);  // Goerli ETH/USD
    AggregatorV3Interface internal priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);  // Sepolia ETH/USD

    function getLatestPriceOfOneUSD() public view returns (int price) {

        // this is the price of 1 Eth in USDs  => 1 ETh = price USDs
        // Find price of 1 USD => 1 USD = 1/price ETH

        (, price,,,) = priceFeed.latestRoundData();
        int ONE_ETH = 1 ether;
        price = (ONE_ETH * 10**8)/price;

        // price = int(756881949122395); 

    }

}
