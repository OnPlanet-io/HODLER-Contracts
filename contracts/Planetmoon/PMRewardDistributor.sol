// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../library/StakingLibrary.sol";
import "../interfaces/IUniswapV2Router02.sol";
import "../interfaces/IStakingPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// import "hardhat/console.sol";

error NOT_ENOUGH_BALANCE();
error CONTRACT_IS_PAUSED();

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

contract PMRewardDistributor is Ownable {

    AggregatorV3Interface internal priceFeed = AggregatorV3Interface(0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE); // BNB Chain Mainnet BNB/USD
    // AggregatorV3Interface internal priceFeed = AggregatorV3Interface(0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e);  // Goerli ETH/USD

    IUniswapV2Router02 public uniswapV2Router = IUniswapV2Router02(0x10ED43C718714eb63d5aA57B78B54704E256024E); //Pancakeswap router mainnet - BSC
    // IUniswapV2Router02 public uniswapV2Router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D); //Uniswap router goerli testnet - ETH

    event Received(address, uint);
    event RewardApplied(address, address, uint256, uint8);

    address public giveAwayManager;
    bool public pause = true;
    uint256 public totalRewardDistributed;

    constructor( address _giveAwayManager ){
        giveAwayManager = _giveAwayManager;
    }

    modifier onlyGiveAwayManager(){
        require(msg.sender == giveAwayManager, "No Authorized");
        _;
    }

    function distributeReward(address winner, uint8 prizeUSD) public onlyGiveAwayManager {

        if(pause){
            revert CONTRACT_IS_PAUSED();
        }


        uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());

        uint256 prizeBNB = priceOfOneUSD * prizeUSD;
        totalRewardDistributed = totalRewardDistributed + prizeBNB;

        uint256 totalBalance = address(this).balance;

        if(totalBalance <  prizeBNB){
            revert NOT_ENOUGH_BALANCE();
        }
        payable(winner).transfer(prizeBNB);

    }

    function applyRewardToACampaing(address campaign, address user, uint8 amountUSD, StakingLibrary.StakingType _type) public onlyGiveAwayManager {

        if(pause){
            revert CONTRACT_IS_PAUSED();
        }


        uint256 priceOfOneUSD = uint256(getLatestPriceOfOneUSD());

        uint256 amount = priceOfOneUSD * amountUSD;
        totalRewardDistributed = totalRewardDistributed + amount;

        uint256 totalBalance = address(this).balance;

        if(totalBalance <  amount){
            revert NOT_ENOUGH_BALANCE();
        }

        // find the token of the campaign
        StakingLibrary.PoolFullInfo memory poolFullInfo = IStakingPool(campaign).getProjectInfo();
        address tokenAddress = poolFullInfo.projectInfo.tokenAddress;

        // Buy tokens from open market
        uint256 boughtTokens = swapETHForTokensNoFee(tokenAddress, address(this), amount);

        // Approve tokens to the staking pool
        IERC20(tokenAddress).approve(campaign, boughtTokens);

        // Stake tokens on uers behalf
        IStakingPool(campaign).stakeTokens(user, boughtTokens, _type);

        emit RewardApplied(campaign, user, boughtTokens, uint8(_type));

    }

    function swapETHForTokensNoFee(
        address tokenAddress,
        address toAddress,
        uint256 amount
    ) private returns (uint256) {
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

    function getLatestPriceOfOneUSD() public view returns (int price) {

        // this is the price of 1 Eth in USDs  => 1 ETh = price USDs
        // Find price of 1 USD => 1 USD = 1/price ETH

        (, price,,,) = priceFeed.latestRoundData();
        int ONE_ETH = 1 ether;
        price = (ONE_ETH * 10**8)/price;

        // price = int(756881949122395); 
    }

    /* Admin Functions */

    function emergencyWithdraw() public onlyOwner{
        uint256 totalBalance = address(this).balance;
        require(totalBalance > 0, "No balance avaialble for withdraw");
        payable(owner()).transfer(totalBalance);
    }

    function changePauseStatus(bool action) public onlyOwner {
        pause = action;
    }

    function setRouter(IUniswapV2Router02 _uniswapV2Router) public onlyOwner {
        uniswapV2Router = _uniswapV2Router;
    }

    function updateGiveAwayManager(address _giveAwayManager) public onlyOwner {
        giveAwayManager = _giveAwayManager;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

}
