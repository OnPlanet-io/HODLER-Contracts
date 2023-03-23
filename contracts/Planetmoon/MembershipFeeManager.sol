// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../library/StakingLibrary.sol";
import "../interfaces/IUniswapV2Router02.sol";

import "hardhat/console.sol";

contract MembershipFeeManager is Ownable {
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

    AggregatorV3Interface internal priceFeed = AggregatorV3Interface(0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE);
    // AggregatorV3Interface internal priceFeed = AggregatorV3Interface(0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e);

    IUniswapV2Router02 public uniswapV2Router = IUniswapV2Router02(0x10ED43C718714eb63d5aA57B78B54704E256024E); //Pancakeswap router mainnet - BSC
    // IUniswapV2Router02 public uniswapV2Router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D); //Uniswap router goerli testnet - ETH

    mapping (StakingLibrary.MembershipCategories => uint256) public membershipFee;
    
    enum FeesType {USD, BNB}

    event Received(address, uint);
    
    FeeDistributionScheme public feeDistributionScheme;
    struct FeeDistributionScheme {
        uint8 buyBackAndburn;
        uint8 rewardPool;
        uint8 corporate;
    }

    FeeDistributionWallets public feeDistributionWallets;
    struct FeeDistributionWallets {
        address payable buyBackAndburn;
        address payable rewardPool;
        address payable corporate;
        address buyBackReceiver;

    }

    constructor( uint256 regular, uint256 upgrade, uint256 premium, uint256 team) {
        membershipFee[StakingLibrary.MembershipCategories.REGULAR] = regular;
        membershipFee[StakingLibrary.MembershipCategories.UPGRAGE] = upgrade;
        membershipFee[StakingLibrary.MembershipCategories.PREMIUIM] = premium;
        membershipFee[StakingLibrary.MembershipCategories.TEAM] = team;
    }

    function getMembershipFee(StakingLibrary.MembershipCategories category) public view returns (uint256){
        uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());
        return membershipFee[category] * priceOfOneUSD;
    }

    function getAllFees(FeesType feeType) public view returns (
        uint256 regular,
        uint256 upgrade,
        uint256 premium,
        uint256 team
    ){
            regular = membershipFee[StakingLibrary.MembershipCategories.REGULAR];
            upgrade = membershipFee[StakingLibrary.MembershipCategories.UPGRAGE];
            premium = membershipFee[StakingLibrary.MembershipCategories.PREMIUIM];
            team = membershipFee[StakingLibrary.MembershipCategories.TEAM];

            if(feeType == FeesType.BNB){
                uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());
                regular = regular * priceOfOneUSD;
                upgrade = upgrade * priceOfOneUSD;
                premium = premium * priceOfOneUSD;
                team = team * priceOfOneUSD;
            }

    }

    function setMembershipFee(uint256 regular, uint256 upgrade, uint256 premium, uint256 team) public onlyOwner {
        membershipFee[StakingLibrary.MembershipCategories.REGULAR] = regular;
        membershipFee[StakingLibrary.MembershipCategories.UPGRAGE] = upgrade;
        membershipFee[StakingLibrary.MembershipCategories.PREMIUIM] = premium;
        membershipFee[StakingLibrary.MembershipCategories.TEAM] = team;
    }

    function setDistributionScheme(uint8 buyBackAndburn, uint8 rewardPool, uint8 corporate ) public onlyOwner {
        feeDistributionScheme.buyBackAndburn = buyBackAndburn;
        feeDistributionScheme.rewardPool = rewardPool;
        feeDistributionScheme.corporate = corporate;
    }

    function setFeeDistributionWallets(address buyBackAndburn, address rewardPool, address corporate, address buyBackReceiver) public onlyOwner {
        feeDistributionWallets.buyBackAndburn = payable(buyBackAndburn);
        feeDistributionWallets.rewardPool = payable(rewardPool);
        feeDistributionWallets.corporate = payable(corporate);
        feeDistributionWallets.buyBackReceiver = buyBackReceiver;
        
    }

    function SplitFunds() public onlyOwner {

        require(
            feeDistributionWallets.buyBackAndburn != address(0) && 
            feeDistributionWallets.rewardPool != address(0) && 
            feeDistributionWallets.corporate != address(0) &&
            feeDistributionWallets.buyBackReceiver != address(0),
            "Distribution wallets are not being set" 
        );

        uint256 totalBalance = address(this).balance;
        require(totalBalance > 0, "No balance avaialble for split");

        uint256 corporateShare =  (totalBalance * feeDistributionScheme.corporate) / 100;
        uint256 rewardPoolShare =  (totalBalance * feeDistributionScheme.rewardPool) / 100;
        uint256 buyBackAndBurnShare =  totalBalance - corporateShare - rewardPoolShare;

        feeDistributionWallets.corporate.transfer(corporateShare);
        feeDistributionWallets.rewardPool.transfer(rewardPoolShare);
        swapETHForTokensNoFee(feeDistributionWallets.buyBackAndburn, feeDistributionWallets.buyBackReceiver, buyBackAndBurnShare);
        
    }

    function emergencyWithdraw() public onlyOwner {
        uint256 totalBalance = address(this).balance;
        require(totalBalance > 0, "No balance avaialble for withdraw");
        payable(owner()).transfer(totalBalance);
    }

    function setRouter(IUniswapV2Router02 _uniswapV2Router) public onlyOwner {
        uniswapV2Router = _uniswapV2Router;
    }

    function swapETHForTokensNoFee(
        address tokenAddress,
        address toAddress,
        uint256 amount
    ) private {
        // generate the uniswap pair path of token -> weth
        address[] memory path = new address[](2);
        path[0] = uniswapV2Router.WETH();
        path[1] = tokenAddress;

        uniswapV2Router.swapExactETHForTokens{
            value: amount
        }(
            0, // accept any amount of Tokens
            path,
            toAddress, // The contract
            block.timestamp + 500
        );      

    }

    function getLatestPriceOfOneUSD() public pure returns (int price) {

        // this is the price of 1 Eth in USDs  => 1 ETh = price USDs
        // Find price of 1 USD => 1 USD = 1/price ETH

        // (, int price,,,) = priceFeed.latestRoundData();
        // int ONE_ETH = 1 ether;
        // price = (ONE_ETH * 10**8)/price;
        price = int(756881949122395); 

    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

}
