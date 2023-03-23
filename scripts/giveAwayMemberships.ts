import { deployments, ethers } from "hardhat";
import { PMMembershipManager, PMMembershipManager__factory, Token, Token__factory, UniswapV2Router02, UniswapV2Router02__factory } from "../typechain-types";

async function main() {

  const [deployer, user1, user2] = await ethers.getSigners();
  const { deploy, log } = deployments

  // const ray = "0x4afFdd6608c1c04D2E4F7C77804a08a9f293209f";
  // const jenna = "0x71a9Bc3e234bAaA7AaD4C1CEbc36033d1b521771";
  // const ali = deployer.address;
  // const router_goerli = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  // const edge = "0x6Fb08a7d994570a16322c1eA2d8D9936719761B9";

  // const amount = 1_000_000_000; 

  // console.log("Staring: ", ali)


  // const Token1 = await deploy('Token', {
  //   from: deployer.address,
  //   args: ["Faux Finance Token", "FAUXT"],
  //   log: true
  // });
  
  // console.log("token deployed: ", Token1.address)

  const PMMembershipManager: PMMembershipManager__factory = await ethers.getContractFactory('PMMembershipManager');
  let pmMembershipManager: PMMembershipManager = PMMembershipManager.attach("0xFC854e79aCbDC48C2DfA9d2b6e5359207747Eac7");
  
  // let token1 = new ethers.Contract(Token1.address, Token1.abi, deployer) as Token;
  
  console.log("Name: ", await pmMembershipManager.name());
  
  const members = [
    "0x7588A6Cd8d70ecf35a005ae6334C2De1E967b6D6",
    "0x4a773eBB20e2E769Ad060a8d686470380fA03f42",
    "0x4c76e50ee509b9c109e7998b3856a12273592187",
    "0xAF128497beb3370F1719F0455377B047146598ae",
    "0xcaB1A3Cc2e4E2F46789d043a208A2D864E4Ab9dB",
    "0x10e1bf9139239735acf4314d9046e95dce245ac4",
    "0xC87A2A21c4e1A084a4EE695aF30b215bCE45f725",
    "0xd278e42e653F63f47398e7Ef8C718711463Aa0f4",
    "0xFd28eCb5fc6dAa7387916FD85F8CC530c8c1B0a2",
    "0xA60fFcB0C3d114a190f683EF42d6564a5483A9b1",
    "0x33292887B783bF4A9E9EA63d7f20355e2D36822c",
    "0x3C3a2d5ca7E596DACc559a2D7F816F93041A0018",
    "0x365ad2cd71c757781548daa9afbcbe8e4976b727",
    "0x84d054adb0e39dba286f2dc80ae8cdc9d848d845",
    "0x104683f018263fF88b12196532F2c73C47d28CB0",
    "0x4EE426E473373B6c7986C34BE72Bc7A6123CbE25",
    "0x2c8349E7aA2BbCC2C3EE5bf9475fd4fB885A8f1f",
    "0xebdca5495292781a238b41c7cf89c5c1e853db70",
    "0x99F19b68B32AaD843C00CABfb9DD2D883BE39A1e",
    "0x44343a5DEB5bbD10687EF58749d52F6E1DcE1C99",
    "0x0a2bf6b603bcb256c370d97830afdaf727ccab54",
    "0x63d84cea99eFB59DBB7A8B7A099161747A740a86",
    "0x86c06BD9Cc28dB9B2ad2570677d0bE70Bc0DebDc",
    "0x352f2fba4a8f7e3d04df34830a0ff759c67f60b1",
    "0xae3fb771caa47fc39e63e35d0c28d66bed7fa49e",
    "0x81c13E6c1dfFD961F7D63100Bc7204ebeaB4366E",
    "0x3023d89F3C3d2D404868683Fe3Eb52688855A8C8",
    "0xd387A014F3D85D2F47f782Fe293915f69E172C85",
    "0x71a237266eb727f7f6b62c17db7f5b2499a2bd82",
    "0x31a1e5d9fff82109ffc52c3d48940b0ac9f182e3",
    "0x40Eed8c533Cd9bbc5995C9564D91CBC545Bc3548",
    "0x539f8faf4fad4e5c8255b26964ffafc06d61745d",
    "0x5fa8290d6a73dc3a3c68ae9bde226c36bcea1ada",
    "0xa025063Bc87e565DaDd446202F1dd2575ACeAE90",
    "0xa2bfE2F2362553a9368fF4867E8a2077D175Ac68",
    "0x4b3a6B51bEb95344aC115BA4F64eDc6D6E63Ab12",
    "0xa585Ad48E0a4AAe58315E2027aE0Cc2C6eA10c69",
    "0x2cff8b0e07b851c8ed9e423eb49b263a4820fb7a",
    "0x9b3BC35EE8F40a3C4232d722Fada7BD804e25B17",
    "0x805C4984425C32810b98De053B2F2b11F264a004",
    "0x741e7621945E3F61390AA75Dd7Eb5A063da38e25",
    "0x7dcbe3a7ea0c3c1fafe9ecd23e23283b1ee5c7ac",
    "0xD2c4366c6C558f3BaB90F55B99D06E18b635C8A3",
    "0xAb71b92417B0CE23a91C93f8Ed78c1079b0B79Ed",
    "0x45D7a0334FB8792879A8f8dAe5C22317d8e02e52",
    "0x0f3a939cc4f7a3788b95eb06f168698437a1a432",
    "0x1e9c475a2863625070f99b9cda667f16d3d14e6c",
    "0xae0e47d763c1b1aadfb0c3d720b1165297cb430d",
    "0x315cb5f8f9bf0cb1c3a24fef05b8d1b7a0914a45"
  ]
  
  let newList: string[] =[];
  
  for(let i=0; i < members.length; i++) {
    const balance = Number((await pmMembershipManager.balanceOf(members[i])).toString())
    console.log(i, balance);

    if(balance === 0 && !newList.includes(members[i])) {
      newList.push(members[i])
    }
  }
  
  console.log("members.length: ", members.length);
  console.log("newList.length: ", newList.length);
  
  // console.log("newList: ", newList);


  // const tx = await pmMembershipManager.giveAwayMembership(newList);
  // console.log("Transaction submitted");
  // await tx.wait(1);
  // console.log("Done");



  



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

