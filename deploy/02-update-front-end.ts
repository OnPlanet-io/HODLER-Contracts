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

    if (chainId === 31337) {

        const CreatorContract = await deployments.get("CreatorContract");
        const CreatorManager = await deployments.get("CreatorManager");
        const StakingPoolFactory = await deployments.get("StakingPoolFactory");
        const StakingPool = await deployments.getArtifact("StakingPool");
        const PMTeamManager = await deployments.getArtifact("PMTeamManager");
        const PMMembershipManager = await deployments.getArtifact("PMMembershipManager");
        const CampaignFeeManager = await deployments.getArtifact("CampaignFeeManager");
        const MembershipFeeManager = await deployments.getArtifact("MembershipFeeManager");

        
        //helpers
        const StakingToken = await deployments.get("StakingToken");
        const ERC20Token = await deployments.get("ERC20Token");
        const ERC721Token = await deployments.get("ERC721Token");

        fs.writeFileSync(frontEndAbiFile, JSON.stringify({

            CreatorManager: CreatorManager.abi,
            CreatorContract: CreatorContract.abi,
            StakingPoolFactory: StakingPoolFactory.abi,
            StakingPool: StakingPool.abi,
            PMMembershipManager: PMMembershipManager.abi,
            PMTeamManager: PMTeamManager.abi,
            CampaignFeeManager: CampaignFeeManager.abi,
            MembershipFeeManager: MembershipFeeManager.abi,

            StakingToken: StakingToken.abi,
            ERC721Token: ERC721Token.abi,
            ERC20Token: ERC20Token.abi

        }))

    }
}

async function updateContractAddresses() {

    const chainId = network.config.chainId;

    if (chainId === 31337) {
        const CreatorManager = await deployments.get("CreatorManager");
        const StakingPoolFactory = await deployments.get("StakingPoolFactory");
        const PMMembershipManager = await deployments.get("PMMembershipManager");
        const PMTeamManager = await deployments.get("PMTeamManager");
        const CampaignFeeManager = await deployments.get("CampaignFeeManager");
        const MembershipFeeManager = await deployments.get("MembershipFeeManager");


        const StakingToken = await deployments.get("StakingToken");
        const ERC721Token = await deployments.get("ERC721Token");
        const ERC20Token = await deployments.get("ERC20Token");
        // const onPlanet = await deployments.get("onPlanet");

        let contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))

        contractAddresses[chainId] = {
            CreatorManager: CreatorManager.address,
            StakingPoolFactory: StakingPoolFactory.address,
            PMMembershipManager: PMMembershipManager.address,
            PMTeamManager: PMTeamManager.address,
            CampaignFeeManager: CampaignFeeManager.address,
            MembershipFeeManager: MembershipFeeManager.address, 

            StakingToken: StakingToken.address,
            ERC721Token: ERC721Token.address,
            ERC20Token: ERC20Token.address,
            chainId: chainId
        }

        fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))

    }

    else if(chainId === 5 || chainId === 56 ) {

        const CreatorManager = await deployments.get("CreatorManager");
        const StakingPoolFactory = await deployments.get("StakingPoolFactory");
        const PMMembershipManager = await deployments.get("PMMembershipManager");
        const PMTeamManager = await deployments.get("PMTeamManager");
        const CampaignFeeManager = await deployments.get("CampaignFeeManager");
        const MembershipFeeManager = await deployments.get("MembershipFeeManager");

        let contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))

        contractAddresses[chainId] = {
            CreatorManager: CreatorManager.address,
            StakingPoolFactory: StakingPoolFactory.address,
            PMMembershipManager: PMMembershipManager.address,
            PMTeamManager: PMTeamManager.address,
            CampaignFeeManager: CampaignFeeManager.address,
            MembershipFeeManager: MembershipFeeManager.address,
            chainId: chainId
        }

        fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))

    }






}

module.exports.tags = ["all", "frontend"]