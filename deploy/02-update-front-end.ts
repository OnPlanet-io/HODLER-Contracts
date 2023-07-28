import { deployments, ethers } from "hardhat"
import { network } from "hardhat";

const fs = require("fs")
const frontEndContractsFile = "./utils/contractAddresses.json"
const frontEndAbiFile = "./utils/abis.json"

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("")
        console.log("Writing to front end...")
        await updateContractAddresses()
        await updateAbi()
        console.log("Front end written!")
    }
}

async function updateAbi() {

    const chainId = network.config.chainId;

    // if(chainId !== 31337) return;

    const CreatorContract = await deployments.getArtifact("CreatorContract");
    const CreatorManager = await deployments.getArtifact("CreatorManager");
    const RewardCampaignFactory = await deployments.getArtifact("RewardCampaignFactory");
    const RewardCampaign = await deployments.getArtifact("RewardCampaign");
    const PMTeamManager = await deployments.getArtifact("PMTeamManager");
    const PMMembershipManager = await deployments.getArtifact("PMMembershipManager");
    const CampaignFeeManager = await deployments.getArtifact("CampaignFeeManager");
    const MembershipFeeManager = await deployments.getArtifact("MembershipFeeManager");
    const PMRewardDistributor = await deployments.getArtifact("PMRewardDistributor");


    //helpers
    // const StakingToken = await deployments.get("StakingToken");
    const ERC20Token = await deployments.getArtifact("ERC20Token");
    const ERC721Token = await deployments.getArtifact("ERC721Token");

    let contractABIs = {
        CreatorManager: CreatorManager.abi,
        CreatorContract: CreatorContract.abi,
        RewardCampaignFactory: RewardCampaignFactory.abi,
        RewardCampaign: RewardCampaign.abi,
        PMMembershipManager: PMMembershipManager.abi,
        PMTeamManager: PMTeamManager.abi,
        CampaignFeeManager: CampaignFeeManager.abi,
        MembershipFeeManager: MembershipFeeManager.abi,
        PMRewardDistributor: PMRewardDistributor.abi,

        // StakingToken: StakingToken.abi,
        ERC721Token: ERC721Token.abi,
        ERC20Token: ERC20Token.abi
    }

    fs.writeFileSync(frontEndAbiFile, JSON.stringify(contractABIs));


}

async function updateContractAddresses() {

    const chainId = network.config.chainId;

    if (chainId) {

        const CreatorManager = await deployments.get("CreatorManager");
        const RewardCampaignFactory = await deployments.get("RewardCampaignFactory");
        const PMMembershipManager = await deployments.get("PMMembershipManager");
        const PMTeamManager = await deployments.get("PMTeamManager");

        const CampaignFeeManager = await deployments.get("CampaignFeeManager");
        const MembershipFeeManager = await deployments.get("MembershipFeeManager");
        const PMRewardDistributor = await deployments.get("PMRewardDistributor");

        let contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))

        contractAddresses[chainId] = {
            CreatorManager: CreatorManager.address,
            RewardCampaignFactory: RewardCampaignFactory.address,
            PMMembershipManager: PMMembershipManager.address,
            PMTeamManager: PMTeamManager.address,
            CampaignFeeManager: CampaignFeeManager.address,
            MembershipFeeManager: MembershipFeeManager.address,
            PMRewardDistributor: PMRewardDistributor.address,
            chainId: chainId
        }

        if (chainId == 31337) {
            const ERC721Token = await deployments.get("ERC721Token");
            const ERC20Token = await deployments.get("ERC20Token");

            contractAddresses[chainId].ERC721Token = ERC721Token.address;
            contractAddresses[chainId].ERC20Token = ERC20Token.address;
        }

        fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))

    }

}

module.exports.tags = ["all", "frontend"]