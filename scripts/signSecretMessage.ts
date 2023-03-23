import { deployments, ethers } from "hardhat";

async function main() {

  const [deployer, user1, user2] = await ethers.getSigners();
  const { deploy, log } = deployments

  const message = "planetmoon";
  const singedMessage = await deployer.signMessage(message);

  console.log("singedMessage: ", singedMessage);

  const signer = ethers.utils.verifyMessage(message, singedMessage);
  console.log("signer: ", signer);


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

