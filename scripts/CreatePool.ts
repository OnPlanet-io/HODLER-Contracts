


import { isCommunityResourcable } from "@ethersproject/providers";
import { deployments, ethers } from "hardhat";
import { ERC20Token, StakingPoolFactory } from "../typechain-types";
// import StakingPoolFactory from "../deployments/rinkeby/StakingPoolFactory"
async function main() {

    const [deployer] = await ethers.getSigners();


    const StakingPoolFactory = await deployments.get("StakingPoolFactory");
    const stakingPoolFactory = new ethers.Contract(
        StakingPoolFactory.address,
        StakingPoolFactory.abi,
        deployer
    ) as StakingPoolFactory;

    // const ERC20Token = await deployments.get("ERC20Token");
    // const erc20Token = new ethers.Contract(
    //     ERC20Token.address,
    //     ERC20Token.abi,
    //     deployer
    // ) as ERC20Token;

    // const StakingPoolFactory = await deployments.get("StakingPoolFactory");
    // const StakingPoolFactory = await ethers.getContractFactory("StakingPoolFactory");
    // const stakingPoolFactory = StakingPoolFactory.attach("0xb4D4792F92e7AEF9DF50C4120695bB37A406ce58");

    // const ERC20Token = await ethers.getContractFactory("ERC20Token");
    // const erc20Token = ERC20Token.attach("0x48553A048D143A226c0684c1fbF7aC9301397f87");

    // console.log("erc20Token: ", await erc20Token.name())

    
    console.log("StakingPoolFactory address: ", StakingPoolFactory.address);
    console.log("deployer address: ", deployer.address);
    console.log("deployer balance: ", (await deployer.getBalance()).toString());

    // const symbol = await erc20Token.symbol();
    // const decimals = await erc20Token.decimals();
    // const decimalsFactor = String(10 ** decimals);
    // const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);

    // console.log("Tokens: ", tokens.toString())
    // await erc20Token.mint(tokens);
    // console.log("Tokens minted")
    // await erc20Token.approve(stakingPoolFactory.address, tokens);
    // console.log("Tokens Approved")

    // let latestBlock = await ethers.provider.getBlock("latest");

    console.log("Started");

    const tx = await stakingPoolFactory.createAStakingPool(
        {
            category: 0,
            projectName: "Awesome Staking Pool",
            projectSymbol: "ASP",
            tokenAddress: "0x22F839804aD1534886B3950B55a036D8912d393B",
            tokenDecimals: "18",
            tokenSymbol: "FAUXT",
            profileType: "0",
            profileId: "0"
        },
        {
            startedAt: 1682967007,
            poolAmount: 10
        },
        // images
        {
            image_1_months: "image_1_months",
            image_3_months: "image_3_months",
            image_6_months: "image_6_months",
            image_9_months: "image_9_months",
            image_12_months: "image_12_months",
            APY_1_months: 10,
            APY_3_months: 0,
            APY_6_months: 60,
            APY_9_months: 0,
            APY_12_months: 100,
        },
    );

    console.log("Submitted")

    await tx.wait(1);

    console.log("Done")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
