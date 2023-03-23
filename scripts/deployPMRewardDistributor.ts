import { deployments, ethers } from "hardhat";
import { PMRewardDistributor, PMRewardDistributor__factory, Token, Token__factory, UniswapV2Router02, UniswapV2Router02__factory } from "../typechain-types";
import varify from "../utils/varify";

async function main() {

  const [deployer, user1, user2] = await ethers.getSigners();
  const { deploy, log } = deployments

  const PMRewardDistributor: PMRewardDistributor__factory = await ethers.getContractFactory('PMRewardDistributor');
  // let pmRewardDistributor: PMRewardDistributor = await PMRewardDistributor.deploy(deployer.address);

  let pmRewardDistributor: PMRewardDistributor = PMRewardDistributor.attach("0xD5b293C1b095f6519a462Ce950fD07FFa612Cc36")

  console.log("pmRewardDistributor: ", pmRewardDistributor.address);

  // await varify(pmRewardDistributor.address, [deployer.address]);

  await deployer.sendTransaction({
    to: pmRewardDistributor.address,
    value: ethers.utils.parseEther("0.1"), // Sends exactly 1.0 ether
  });


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


    // onPlanet dummy
    // 0x4afFdd6608c1c04D2E4F7C77804a08a9f293209f
