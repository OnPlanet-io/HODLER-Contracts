


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

    const ERC20Token = await deployments.get("ERC20Token");
    const erc20Token = new ethers.Contract(
      ERC20Token.address,
      ERC20Token.abi,
      deployer
    ) as ERC20Token;

    // const StakingPoolFactory = await deployments.get("StakingPoolFactory");
    // const StakingPoolFactory = await ethers.getContractFactory("StakingPoolFactory");
    // const stakingPoolFactory = StakingPoolFactory.attach("0xb4D4792F92e7AEF9DF50C4120695bB37A406ce58");

    // const ERC20Token = await ethers.getContractFactory("ERC20Token");
    // const erc20Token = ERC20Token.attach("0x48553A048D143A226c0684c1fbF7aC9301397f87");

    // console.log("erc20Token: ", await erc20Token.name())


    console.log("deployer: ", deployer.address);
    console.log("deployer: ", (await deployer.getBalance()).toString());

    const symbol = await erc20Token.symbol();
    const decimals = await erc20Token.decimals();
    const decimalsFactor = String(10 ** decimals);
    const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);

    console.log("Tokens: ", tokens.toString())
    await erc20Token.mint(tokens);
    console.log("Tokens minted")
    await erc20Token.approve(stakingPoolFactory.address, tokens);
    console.log("Tokens Approved")

    let latestBlock = await ethers.provider.getBlock("latest");
    
    console.log("Started");

    const tx = await stakingPoolFactory.createAStakingPool(
        // projectInfo
        {
            projectName: "Staking Pool 3",
            projectSymbol: "SP3",
            tokenAddress: erc20Token.address,
            tokenDecimals: decimals,
            tokenSymbol: symbol,
            teamDescription:
                "The best project ever, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.",
            projectDescription:
                "The best project ever, It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web.",
            projectCover:
                "https://visionarymarketing.com/wp-content/uploads/2022/02/art-nfts-auction-2021-esther-barend.jpg",
            projectAvatar:
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOLAJ_oytgRk4ur0V8zL5bAeBZV2oBVt2QFuZKF18Y13oEHAIQAonjUwvZ4U2bp8_shmA&usqp=CAU",
            socialHandles: {
                website: "www.google.com",
                twitter: "ImranKhanPTI",
                facebook: "",
                telegram: "",
                discord: "",
            },
        },
        // rewardPoolInfo
        {
            startedAt: latestBlock.timestamp + 1000,
            poolAmount: tokens,
        },
        // images
        {
            image_3_months:
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5FIufU99N5SDS2X8IVrPVICzPNgFxsecn_ZmmoJYsknvrQF9wOKxZxc4uWZAyqA55Ujk&usqp=CAU",
            image_6_months:
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9lrh8oM20JW_89pg1Y4avBs2Ilq2D4HXGEySarDJ9lXIUoK3UdyDxkisz36V6Ase1UEU&usqp=CAU",
            image_12_months:
                "https://images.saatchiart.com/saatchi/14817/art/8722672/7786191-FLFQKBZP-7.jpg",
        }
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
