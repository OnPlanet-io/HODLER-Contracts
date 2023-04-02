import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CampaignFeeManager, MembershipFeeManager, PMMembershipManager, PMRewardDistributor, PMTeamManager, StakingPoolFactory } from "../typechain-types";
import varify from "../utils/varify";
// import {verify} from "../utils/verify"


module.exports = async ({ getNamedAccounts, deployments }: HardhatRuntimeEnvironment) => {
    
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const [master] = await ethers.getSigners();

    const chainId = network.config.chainId;

    console.log("chainId: ", chainId);
    console.log("deployer: ", deployer);

    const ownerShipTo = "0xE813d775f33a97BDA25D71240525C724423D4Cd0";

    if (chainId == 31337) {
        const StakingToken = await deploy("StakingToken", {
            from: deployer,
            args: [],
            log: true,
        })

        const ERC20Token = await deploy("ERC20Token", {
            from: deployer,
            args: [],
            log: true,
        })

        const ERC721Token = await deploy("ERC721Token", {
            from: deployer,
            args: [],
            log: true,
        })

        const CreatorManager = await deploy("CreatorManager", {
            from: deployer,
            args: [],
            log: true,
        })

        const CampaignFeeManager = await deploy("CampaignFeeManager", {
            from: deployer,
            args: [
                "100", "125", "400", // silver, gold, diamond
                "3", "2", "2", "0" // reward_0pc, reward_30pc, reward_50pc, reward_100pc   
            ],
            log: true,
        })

        const MembershipFeeManager = await deploy("MembershipFeeManager", {
            from: deployer,
            args: [ "3", "2", "5", "8"],
            log: true,
        })

        const PMMembershipManager = await deploy("PMMembershipManager", {
            from: deployer,
            args: [MembershipFeeManager.address],
            log: true,
        })

        const PMTeamManager = await deploy("PMTeamManager", {
            from: deployer,
            args: [MembershipFeeManager.address],
            log: true,
        })

        const StakingPoolFactory = await deploy("StakingPoolFactory", {
            from: deployer,
            args: [
                CampaignFeeManager.address,
                PMMembershipManager.address,
                PMTeamManager.address,
                CreatorManager.address
            ],
            log: true,
        })

        // const CreatorManagerContract = await ethers.getContractAt("CreatorManager", CreatorManager.address);
        // await CreatorManagerContract.setStakingPoolManager(StakingPoolFactory.address);

        const CreatorContract = await deploy("CreatorContract", {
            from: deployer,
            args: [deployer],
            log: true,
        })

        const PMRewardDistributor = await deploy("PMRewardDistributor", {
            from: deployer,
            args: [deployer]
        })


        const accounts = await ethers.getSigners();
        
        await accounts[0].sendTransaction({
            to: PMRewardDistributor.address,
            value: ethers.utils.parseEther("0.1"), // Sends exactly 1.0 ether
        });



        const campaignFeeManager = new Contract(CampaignFeeManager.address, CampaignFeeManager.abi, master) as CampaignFeeManager;
        await campaignFeeManager.transferOwnership(ownerShipTo);

        const membershipFeeManager = new Contract(MembershipFeeManager.address, MembershipFeeManager.abi, master) as MembershipFeeManager;
        await membershipFeeManager.transferOwnership(ownerShipTo);

        const pmMembershipManager = new Contract(PMMembershipManager.address, PMMembershipManager.abi, master) as PMMembershipManager;
        await pmMembershipManager.transferOwnership(ownerShipTo);

        const pmTeamManager = new Contract(PMTeamManager.address, PMTeamManager.abi, master) as PMTeamManager;
        await pmTeamManager.transferOwnership(ownerShipTo);

        const stakingPoolFactory = new Contract(StakingPoolFactory.address, StakingPoolFactory.abi, master) as StakingPoolFactory;
        await stakingPoolFactory.transferOwnership(ownerShipTo);

        const pmRewardDistributor = new Contract(PMRewardDistributor.address, PMRewardDistributor.abi, master) as PMRewardDistributor;
        await pmRewardDistributor.transferOwnership(ownerShipTo);



    }
    else {

        const CreatorManager = await deploy("CreatorManager", {
            from: deployer,
            args: [],
            log: true,
        })


        const campaignFeeManagerArgs = [
            "0", "0", "0", // silver, gold, diamond
            "0", "0", "0", "0" // reward_0pc, reward_30pc, reward_50pc, reward_100pc   

            // "100", "125", "400", // silver, gold, diamond
            // "3", "2", "2", "0" // reward_0pc, reward_30pc, reward_50pc, reward_100pc   
        ]
        const CampaignFeeManager = await deploy("CampaignFeeManager", {
            from: deployer,
            args: campaignFeeManagerArgs,
            log: true,
        })

        const membershipFeeManagerAgrs = [
            "0","0","0","0" //"3", "2", "5", "8"
        ]
        const MembershipFeeManager = await deploy("MembershipFeeManager", {
            from: deployer,
            args: membershipFeeManagerAgrs,
            log: true,
        })


        const PMMembershipManager = await deploy("PMMembershipManager", {
            from: deployer,
            args: [MembershipFeeManager.address],
            log: true,
        })

        const PMTeamManager = await deploy("PMTeamManager", {
            from: deployer,
            args: [MembershipFeeManager.address],
            log: true,
        })

        const stakingPoolFactoryArgs = [
            CampaignFeeManager.address,
            PMMembershipManager.address,
            PMTeamManager.address,
            CreatorManager.address
        ]
        const StakingPoolFactory = await deploy("StakingPoolFactory", {
            from: deployer,
            args: stakingPoolFactoryArgs,
            log: true,
        })

        const PMRewardDistributorArgs = [deployer]
        const PMRewardDistributor = await deploy("PMRewardDistributor", {
            from: deployer,
            args: PMRewardDistributorArgs,
            log: true,
        })

        // const accounts = await ethers.getSigners();
        
        // await accounts[0].sendTransaction({
        //     to: PMRewardDistributor.address,
        //     value: ethers.utils.parseEther("0.1"), // Sends exactly 1.0 ether
        // });

        // await varify(CreatorManager.address, []);
        // await varify(StakingPoolFactory.address, stakingPoolFactoryArgs);
        
        // await varify(CampaignFeeManager.address, campaignFeeManagerArgs);
        // await varify(MembershipFeeManager.address, membershipFeeManagerAgrs);
        // await varify(PMMembershipManager.address, [MembershipFeeManager.address]);

        // await varify(PMTeamManager.address, [MembershipFeeManager.address]);
        // await varify(PMRewardDistributor.address, PMRewardDistributorArgs);

        const campaignFeeManager = new Contract(CampaignFeeManager.address, CampaignFeeManager.abi, master) as CampaignFeeManager;
        await campaignFeeManager.transferOwnership(ownerShipTo);

        const membershipFeeManager = new Contract(MembershipFeeManager.address, MembershipFeeManager.abi, master) as MembershipFeeManager;
        await membershipFeeManager.transferOwnership(ownerShipTo);

        const pmMembershipManager = new Contract(PMMembershipManager.address, PMMembershipManager.abi, master) as PMMembershipManager;
        await pmMembershipManager.transferOwnership(ownerShipTo);

        const pmTeamManager = new Contract(PMTeamManager.address, PMTeamManager.abi, master) as PMTeamManager;
        await pmTeamManager.transferOwnership(ownerShipTo);

        const stakingPoolFactory = new Contract(StakingPoolFactory.address, StakingPoolFactory.abi, master) as StakingPoolFactory;
        await stakingPoolFactory.transferOwnership(ownerShipTo);

        const pmRewardDistributor = new Contract(PMRewardDistributor.address, PMRewardDistributor.abi, master) as PMRewardDistributor;
        await pmRewardDistributor.transferOwnership(ownerShipTo);
        
    }


}