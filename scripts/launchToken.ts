import { deployments, ethers } from "hardhat";
import { Token } from "../typechain-types";

async function main() {

  const [deployer, user1, user2] = await ethers.getSigners();
  const { deploy, log } = deployments

  const ray = "0x4afFdd6608c1c04D2E4F7C77804a08a9f293209f";
  const jenna = "0x71a9Bc3e234bAaA7AaD4C1CEbc36033d1b521771";
  const ali = deployer.address;

  // 0x4afFdd6608c1c04D2E4F7C77804a08a9f293209f

  const amount = 1_000_000_000; 

  const Token1 = await deploy("Token", {
    from: deployer.address,
    args: ["ACME", "ACME"],
    log: true,
  })

  // const Token2 = await deploy("Token", {
  //   from: deployer.address,
  //   args: ["EverGreen DAO", "EGC"],
  //   log: true,
  // })

  // const Token3 = await deploy("Token", {
  //   from: deployer.address,
  //   args: ["Atomic Clock", "TIME"],
  //   log: true,
  // })


  // console.log(Token1.address);
  // console.log(Token2.address);
  // console.log(Token3.address);

  
  let token1 = new ethers.Contract(Token1.address, Token1.abi, deployer) as Token;
  await token1.mintToSomeone(ray, amount);
  
  console.log("Token 1 minted", Token1.address);

  // let token2 = new ethers.Contract(Token2.address, Token2.abi, deployer) as Token;
  // await token2.mintToSomeone(ray, amount);
  // console.log("Token 2 minted", Token2.address);
  // let token3 = new ethers.Contract(Token3.address, Token3.abi, deployer) as Token;
  // await token3.mintToSomeone(ray, amount);
  // console.log("Token 3 minted", Token3.address);

      

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


    // onPlanet dummy
    // 0x4afFdd6608c1c04D2E4F7C77804a08a9f293209f
