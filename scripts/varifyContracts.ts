import { deployments } from "hardhat";
import varify from "../utils/varify";


async function main() {



    // const CreatorManager = await deploy("CreatorManager", {
    //     from: deployer,
    //     args: [],
    //     log: true,
    // })

    // const campaignFeeManagerArgs = [
    //     // "100", "200", "400", // silver, gold, diamond
    //     // "3", "2", "2", "0" // reward_0pc, reward_30pc, reward_50pc, reward_100pc   

    //     "0", "0", "0", // silver, gold, diamond
    //     "3", "2", "2", "0" // reward_0pc, reward_30pc, reward_50pc, reward_100pc   
    // ]
    // const CampaignFeeManager = await deploy("CampaignFeeManager", {
    //     from: deployer,
    //     args: campaignFeeManagerArgs,
    //     log: true,
    // })

    // const membershipFeeManagerAgrs = [
    //     "5", "8" //"5", "8"
    // ]
    // const MembershipFeeManager = await deploy("MembershipFeeManager", {
    //     // nonce: await getNonce(),
    //     from: deployer,
    //     args: membershipFeeManagerAgrs,
    //     log: true,
    // })

    // const PMMembershipManager = await deploy("PMMembershipManager", {
    //     from: deployer,
    //     args: [MembershipFeeManager.address],
    //     log: true,
    // })

    // const PMTeamManager = await deploy("PMTeamManager", {
    //     from: deployer,
    //     args: [MembershipFeeManager.address],
    //     log: true,
    // })

    // const RewardCampaignFactoryArgs = [
    //     CampaignFeeManager.address,
    //     PMMembershipManager.address,
    //     PMTeamManager.address,
    //     CreatorManager.address
    // ]
    // const RewardCampaignFactory = await deploy("RewardCampaignFactory", {
    //     from: deployer,
    //     args: RewardCampaignFactoryArgs,
    //     log: true,
    // })

    // const PMRewardDistributorArgs = [giveAwayManager]
    // const PMRewardDistributor = await deploy("PMRewardDistributor", {
    //     from: deployer,
    //     args: PMRewardDistributorArgs,
    //     log: true,
    // })



    const CreatorManager = await deployments.get("CreatorManager");
    const RewardCampaignFactory = await deployments.get("RewardCampaignFactory");
    const PMMembershipManager = await deployments.get("PMMembershipManager");
    const PMTeamManager = await deployments.get("PMTeamManager");

    const CampaignFeeManager = await deployments.get("CampaignFeeManager");
    const MembershipFeeManager = await deployments.get("MembershipFeeManager");
    const PMRewardDistributor = await deployments.get("PMRewardDistributor");


    await varify(CreatorManager.address, []);

    const RewardCampaignFactoryArgs = [
        CampaignFeeManager.address,
        PMMembershipManager.address,
        PMTeamManager.address,
        CreatorManager.address
    ]
    await varify(RewardCampaignFactory.address, RewardCampaignFactoryArgs);

    const campaignFeeManagerArgs = [
        "0", "0", "0", // silver, gold, diamond
        "3", "2", "2", "0" // reward_0pc, reward_30pc, reward_50pc, reward_100pc   
    ]
    await varify(CampaignFeeManager.address, campaignFeeManagerArgs);

    const membershipFeeManagerAgrs = [
        "5","8" //"5", "8"
    ]
    await varify(MembershipFeeManager.address, membershipFeeManagerAgrs);
    await varify(PMMembershipManager.address, [MembershipFeeManager.address]);

    await varify(PMTeamManager.address, [MembershipFeeManager.address]);

    const giveAwayManager = "0x49EB9ac3e28a22A90D73e3F7B27Bc76628b2442B";
    const PMRewardDistributorArgs = [giveAwayManager]
    await varify(PMRewardDistributor.address, PMRewardDistributorArgs);


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
