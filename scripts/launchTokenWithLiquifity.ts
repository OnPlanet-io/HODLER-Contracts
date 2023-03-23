import { deployments, ethers } from "hardhat";
import { Token, Token__factory, UniswapV2Router02, UniswapV2Router02__factory } from "../typechain-types";

async function main() {

  const [deployer, user1, user2] = await ethers.getSigners();
  const { deploy, log } = deployments

  const ray = "0x4afFdd6608c1c04D2E4F7C77804a08a9f293209f";
  const jenna = "0x71a9Bc3e234bAaA7AaD4C1CEbc36033d1b521771";
  const ali = deployer.address;
  const router_goerli = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const edge = "0x6Fb08a7d994570a16322c1eA2d8D9936719761B9";

  const amount = 1_000_000_000; 

  console.log("Staring: ", ali)


  // const Token1 = await deploy('Token', {
  //   from: deployer.address,
  //   args: ["Faux Finance Token", "FAUXT"],
  //   log: true
  // });
  
  // console.log("token deployed: ", Token1.address)

  const Token1: Token__factory = await ethers.getContractFactory('Token');
  let token1: Token = Token1.attach("0xfcA0CcEDAaC3850Be9b03E5833e015A90fffb6aa");
  
  // let token1 = new ethers.Contract(Token1.address, Token1.abi, deployer) as Token;
  await token1.mintToSomeone(edge, amount);

  // const UniswapV2Router02: UniswapV2Router02__factory = await ethers.getContractFactory('UniswapV2Router02');
  // let router = UniswapV2Router02.attach("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D") as UniswapV2Router02;
  
  // let latestBlock = await ethers.provider.getBlock("latest")

  // await token1.approve(router.address, ethers.utils.parseEther("10000"))
  // console.log("Token approved to", router.address);

  

  // await router.addLiquidityETH(
  //     token1.address,
  //     ethers.utils.parseEther("10000"),
  //     0,
  //     0,
  //     deployer.address,
  //     1677704839 + 36000,
  //     { value: ethers.utils.parseEther("0.01") }
  // )

  // console.log("Liquidity provided")


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


    // onPlanet dummy
    // 0x4afFdd6608c1c04D2E4F7C77804a08a9f293209f




//     [Yesterday 12:34 PM] Ray
// Project Name: ACME Labs
// Project Symbol: ACME
// Team Profile: RASH
// Short Description: ACME Labs is the source for all things crypto.  From custom NFTs to Token Launches, our team can help your team succeed.  Built upon the ACME token, our record of sucess speaks for itself.  And now, we're offering a limited time staking opportunity for the public.  Come join the token for all your needs. 

// Project Name: Bojinga
// Project Symbol: BJA
// Team Profile: RASH
// Short Description: Bojinga aims to be the fastest growning DEX on the Binanace Chain.  With over 10,000,000 transactions already flawlessly processed in beta, we are letting the public get in on the ground floor with our PlanetMoon hosted giveaway.  Simply stake your tokens on PlanetMoon and we'll match your bag, token for token! 

// Project Name: Ozkar    
// Project Symbol: OZ                                
// Team Profile: RASH
// Short Description: You've heard the hype, you did the research, now get the rewards. IYKYK. OZ+PlanetMoon 

// Project Name: Faux Finance
// Project Symbol: FAUX
// Team Profile: RASH
// Short Description: Faux creates digital services make DeFi easy for everyone. The on-ramp to the crypto world, Faux aims to provide security, ease-of-acess and digital literacy to all mankind.  Faux is here today and for the next billion users.

