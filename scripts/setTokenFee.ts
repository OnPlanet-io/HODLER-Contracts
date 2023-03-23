import { deployments, ethers } from "hardhat";

async function main() {

  const [deployer, user1, user2] = await ethers.getSigners();
  const { deploy, log } = deployments

    const PMMembership = await deployments.get("PMMembership");
    const PMMembershipContract = await ethers.getContractAt("PMMembership", PMMembership.address);
    // await PMMembershipContract.updateFee(100, "0x3A27Cb0801CEdA948817BB01B678Cf5EEA12802F")


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

