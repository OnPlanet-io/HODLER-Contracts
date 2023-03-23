import axios from "axios";
import { ContractReceipt } from "ethers";
import { deployments, ethers, getChainId, network } from "hardhat";
import { ERC20Token, PMTeamManager, StakingPoolFactory, StakingToken } from "../typechain-types";

async function main() {

    const [deployer] = await ethers.getSigners();

    const PMTeamManager = await deployments.get("PMTeamManager");
    const teamManager = new ethers.Contract(
        PMTeamManager.address,
        PMTeamManager.abi,
        deployer
    ) as PMTeamManager;


    console.log("STARTED!");

    const chainId = await getChainId();
    console.log("chainId: ", chainId);

    if (chainId === "31337") {

        for(let i=0; i < 6; i++){
            const tx =  await teamManager.safeMint(deployer.address);
            
            let receipt: ContractReceipt = await tx.wait();
            const xxxx: any = receipt.events?.filter((x) => { return x.event == "TeamCreated" })
            let teamId = xxxx[0].args.teamId;
            
            
            const newTeam = await axios.post("http://localhost:3000/api/teamProfile/addTeamProfile", {
                inputId: {
                    chianId: chainId.toString(),
                    teamId: teamId.toString()
                }
            })
    
            console.log("Team created: ", teamId.toString());
            
        }
    }
  

    console.log("DONE!");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
