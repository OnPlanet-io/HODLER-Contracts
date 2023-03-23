import { ethers, network } from "hardhat";
import { Contract } from "hardhat/internal/hardhat-network/stack-traces/model";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ContractReceipt } from "ethers";
import axios from "axios";

//import { minutes } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration";

// function sleep(ms: number) {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }

const storeInDB = async (
  chianId: string,
  campaignId: string,
  campaignAddress: string,
  campaignName: string,
  campaignSymbol: string,
  rewardTokenAddress: string,
  rewardTokenName: string,
  rewardTokenSymbol: string,
  image_12_months: string,
  image_6_months: string,
  image_3_months: string,
  maxAPY: string,
  startingTime: string,
  profile: {
    aboutCampaign: string,
    aboutTeam: string,
    profilePic: string,
    coverPic: string,
    socials: {
      website: string,
      discord: string,
      instagram: string,
      tiktok: string,
      twitch: string,
      twitter: string,
      youTube: string
    }
  }

) => {
  // Store data on DB


  const input = {
    chianId,
    campaignId,
    campaignAddress,
    campaignName,
    campaignSymbol,
    rewardTokenAddress,
    rewardTokenName,
    rewardTokenSymbol,
    image_12_months,
    image_6_months,
    image_3_months,
    maxAPY,
    startingTime,
    profile
  }

  const dbRes = await axios.post("http://localhost:3000/api/rewardCampaign/addRewardCampaign",
    { input }
  )

  console.log("campaignId stored successfully: ", campaignId);

}

module.exports = async ({ deployments }: HardhatRuntimeEnvironment) => {
  const [deployer, user1, user2] = await ethers.getSigners();
  const ONE_MINUTE = time.duration.minutes(1);
  const chainId = network.config.chainId;

  // if (chainId == 31337) {

  //   const StakingPoolFactory = await deployments.get("StakingPoolFactory");
  //   const stakingPoolFactory = new ethers.Contract(
  //     StakingPoolFactory.address,
  //     StakingPoolFactory.abi,
  //     deployer
  //   ) as StakingPoolFactory;

  //   // First pool
  //   {
  //     const StakingToken = await deployments.get("StakingToken");
  //     const stakingToken = new ethers.Contract(
  //       StakingToken.address,
  //       StakingToken.abi,
  //       deployer
  //     ) as StakingToken;

  //     // Start A pool
  //     const name = await stakingToken.name();
  //     const symbol = await stakingToken.symbol();
  //     const decimals = await stakingToken.decimals();
  //     const decimalsFactor = String(10 ** decimals);
  //     const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);
  //     await stakingToken.mint(tokens);
  //     await stakingToken.connect(user1).mint(tokens);
  //     await stakingToken.connect(user2).mint(tokens);

  //     await stakingToken.mint(tokens);
  //     await stakingToken.approve(stakingPoolFactory.address, tokens);

  //     let latestBlock = await ethers.provider.getBlock("latest");

  //     const teamDescription = "The best project ever, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages."
  //     const projectDescription = "The best project ever, It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web."
  //     const projectCover = "https://i.insider.com/61b36ebb40ffe000194c9caa?width=700"
  //     const projectAvatar= "https://cryptopunks.app/cryptopunks/cryptopunk2243.png"

  //     const tx = await stakingPoolFactory.createAStakingPool(
  //       // projectInfo
  //       {
  //         projectName: "Awesome Staking Pool",
  //         projectSymbol: "ASP",
  //         tokenAddress: stakingToken.address,
  //         tokenDecimals: decimals,
  //         tokenSymbol: symbol,
  //         // teamDescription,
  //         // projectDescription,
  //         // projectCover,
  //         // projectAvatar,
  //         // socialHandles: {
  //         //   website: "www.google.com",
  //         //   twitter: "VitalikButerin",
  //         //   facebook: "",
  //         //   telegram: "",
  //         //   discord: "",
  //         // },
  //       },
  //       // rewardPoolInfo
  //       {
  //         startedAt: latestBlock.timestamp + 5 * ONE_MINUTE,
  //         poolAmount: tokens,
  //       },
  //       // images
  //       {
  //         image_3_months: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzr20AXRdZT7i_4kfSxrNlv7VRL3KATCSds4NQcLKiTOf5u0zPeBL6mFCh5iPRedmVDo4&usqp=CAU",
  //         image_6_months: "https://pbs.twimg.com/media/E7ALfy6WYAkIRmU.png",
  //         image_12_months: "https://pbs.twimg.com/media/FAyaKtYXoAMghTY.png",
  //       }
  //     );

  //     let receipt: ContractReceipt = await tx.wait(1);
  //     const xxxx: any = receipt.events?.filter((x) => {
  //       return x.event == "Poolcreated";
  //     });
    
  //     await storeInDB(
  //       chainId.toString(),
  //       xxxx[0].args.poolId.toString(),
  //       xxxx[0].args.poolAddress,
  //       "Awesome Staking Pool",
  //       "ASP",
  //       stakingToken.address,
  //       name,
  //       symbol,
  //       "https://pbs.twimg.com/media/FAyaKtYXoAMghTY.png",
  //       "https://pbs.twimg.com/media/E7ALfy6WYAkIRmU.png",
  //       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzr20AXRdZT7i_4kfSxrNlv7VRL3KATCSds4NQcLKiTOf5u0zPeBL6mFCh5iPRedmVDo4&usqp=CAU",
  //       "180",
  //       (latestBlock.timestamp + 10 * ONE_MINUTE).toString(),
  //       {
  //         aboutCampaign: projectDescription,
  //         aboutTeam: teamDescription,
  //         profilePic: projectAvatar,
  //         coverPic: projectCover,
  //         socials: {
  //           website: "adf",
  //           discord: "adsf",
  //           instagram: "asdf",
  //           tiktok: "Adsf",
  //           twitch: "Adf",
  //           twitter: "adf",
  //           youTube: "Asdf"
  //         }
  //       }
  //     )


  //     let stakingPoolAddress = xxxx[0].args.poolAddress;
  //     const StakingPool: StakingPool__factory = await ethers.getContractFactory(
  //       "StakingPool"
  //     );
  //     const stakingPool = StakingPool.attach(stakingPoolAddress);

  //     await network.provider.send("evm_increaseTime", [5 * ONE_MINUTE]);
  //     await network.provider.send("evm_mine");

  //     await stakingToken.connect(deployer).mint(ethers.utils.parseEther("3000"));
  //     await stakingToken
  //       .connect(deployer)
  //       .approve(stakingPool.address, ethers.utils.parseEther("3000"));
  //     await stakingPool
  //       .connect(deployer)
  //       .stakeTokens(ethers.utils.parseEther("500"), 0);
  //     await stakingPool
  //       .connect(deployer)
  //       .stakeTokens(ethers.utils.parseEther("1000"), 1);
  //     await stakingPool
  //       .connect(deployer)
  //       .stakeTokens(ethers.utils.parseEther("1500"), 2);
  //   }

  //   // Second pool
  //   {
  //     const ERC20Token = await deployments.get("ERC20Token");
  //     const erc20Token = new ethers.Contract(
  //       ERC20Token.address,
  //       ERC20Token.abi,
  //       deployer
  //     ) as ERC20Token;

  //     const name = await erc20Token.name();
  //     const symbol = await erc20Token.symbol();
  //     const decimals = await erc20Token.decimals();
  //     const decimalsFactor = String(10 ** decimals);
  //     const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);
  //     await erc20Token.mint(tokens);
  //     await erc20Token.connect(user1).mint(tokens);
  //     await erc20Token.connect(user2).mint(tokens);

  //     await erc20Token.mint(tokens);
  //     await erc20Token.approve(stakingPoolFactory.address, tokens);

  //     let latestBlock = await ethers.provider.getBlock("latest");

  //     const teamDescription = "The best project ever, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages."
  //     const projectDescription = "The best project ever, It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web."
  //     const projectCover = "https://gulfcrypto.ae/wp-content/uploads/2022/04/bored-ape-nft-sothebys-record-sale-gID_4.png"
  //     const projectAvatar= "https://images.theconversation.com/files/417198/original/file-20210820-25-1j3afhs.jpeg?ixlib=rb-1.1.0&q=45&auto=format&w=1200&h=1200.0&fit=crop"


  //     const tx = await stakingPoolFactory.createAStakingPool(
  //       // projectInfo
  //       {
  //         projectName: "Staking Pool 2",
  //         projectSymbol: "SP2",
  //         tokenAddress: erc20Token.address,
  //         tokenDecimals: decimals,
  //         tokenSymbol: symbol,
  //         // teamDescription,
  //         // projectDescription,
  //         // projectCover,
  //         // projectAvatar,
  //         // socialHandles: {
  //         //   website: "www.google.com",
  //         //   twitter: "onPlanetIO",
  //         //   facebook: "",
  //         //   telegram: "",
  //         //   discord: "",
  //         // },
  //       },
  //       // rewardPoolInfo
  //       {
  //         startedAt: latestBlock.timestamp + 2 * ONE_MINUTE,
  //         poolAmount: tokens,
  //       },
  //       // images
  //       {
  //         image_3_months:
  //           "https://thumbor.forbes.com/thumbor/fit-in/900x510/https://www.forbes.com/advisor/in/wp-content/uploads/2022/03/monkey-g412399084_1280.jpg",
  //         image_6_months:
  //           "https://img.freepik.com/premium-vector/mutant-ape-yacht-club-nft-artwork-collection-set-unique-bored-monkey-character-nfts-variant_361671-259.jpg?w=2000",
  //         image_12_months:
  //           "https://www.artnews.com/wp-content/uploads/2022/01/unnamed-2.png?w=631",
  //       }
  //     );

  //     let receipt: ContractReceipt = await tx.wait(1);
  //     const xxxx: any = receipt.events?.filter((x) => {
  //       return x.event == "Poolcreated";
  //     });


  //     // Storing data in the DB

  //     await storeInDB(
  //       chainId.toString(),
  //       xxxx[0].args.poolId.toString(),
  //       xxxx[0].args.poolAddress,
  //       "Staking Pool 2",
  //       "SP2",
  //       erc20Token.address,
  //       name,
  //       symbol,
  //       "https://www.artnews.com/wp-content/uploads/2022/01/unnamed-2.png?w=631",
  //       "https://img.freepik.com/premium-vector/mutant-ape-yacht-club-nft-artwork-collection-set-unique-bored-monkey-character-nfts-variant_361671-259.jpg?w=2000",
  //       "https://thumbor.forbes.com/thumbor/fit-in/900x510/https://www.forbes.com/advisor/in/wp-content/uploads/2022/03/monkey-g412399084_1280.jpg",
  //       "180",
  //       (latestBlock.timestamp + 10 * ONE_MINUTE).toString(),
  //       {
  //         aboutCampaign: projectDescription,
  //         aboutTeam: teamDescription,
  //         profilePic: projectAvatar,
  //         coverPic: projectCover,
  //         socials: {
  //           website: "adf",
  //           discord: "adsf",
  //           instagram: "asdf",
  //           tiktok: "Adsf",
  //           twitch: "Adf",
  //           twitter: "adf",
  //           youTube: "Asdf"
  //         }
  //       }
  //     )

  //     let stakingPoolAddress = xxxx[0].args.poolAddress;
  //     const StakingPool: StakingPool__factory = await ethers.getContractFactory(
  //       "StakingPool"
  //     );
  //     const stakingPool = StakingPool.attach(stakingPoolAddress);

  //     await network.provider.send("evm_increaseTime", [2 * ONE_MINUTE]);
  //     await network.provider.send("evm_mine");

  //     await erc20Token.connect(deployer).mint(ethers.utils.parseEther("3000"));
  //     await erc20Token
  //       .connect(deployer)
  //       .approve(stakingPool.address, ethers.utils.parseEther("3000"));
  //     await stakingPool
  //       .connect(deployer)
  //       .stakeTokens(ethers.utils.parseEther("500"), 0);
  //     await stakingPool
  //       .connect(deployer)
  //       .stakeTokens(ethers.utils.parseEther("1000"), 1);
  //     await stakingPool
  //       .connect(deployer)
  //       .stakeTokens(ethers.utils.parseEther("1500"), 2);
  //   }

  //   // Third pool
  //   {
  //     const ERC20Token = await deployments.get("ERC20Token");
  //     const erc20Token = new ethers.Contract(
  //       ERC20Token.address,
  //       ERC20Token.abi,
  //       deployer
  //     ) as ERC20Token;

  //     const name = await erc20Token.name();
  //     const symbol = await erc20Token.symbol();
  //     const decimals = await erc20Token.decimals();
  //     const decimalsFactor = String(10 ** decimals);
  //     const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);
  //     // await erc20Token.mint(tokens);
  //     // await erc20Token.connect(user1).mint(tokens);
  //     // await erc20Token.connect(user2).mint(tokens);

  //     await erc20Token.mint(tokens);
  //     await erc20Token.approve(stakingPoolFactory.address, tokens);

  //     let latestBlock = await ethers.provider.getBlock("latest");


  //     const teamDescription = "The best project ever, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages."
  //     const projectDescription = "The best project ever, It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web."
  //     const projectCover = "https://visionarymarketing.com/wp-content/uploads/2022/02/art-nfts-auction-2021-esther-barend.jpg"
  //     const projectAvatar= "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOLAJ_oytgRk4ur0V8zL5bAeBZV2oBVt2QFuZKF18Y13oEHAIQAonjUwvZ4U2bp8_shmA&usqp=CAU"


  //     const tx = await stakingPoolFactory.createAStakingPool(
  //       // projectInfo
  //       {
  //         projectName: "Staking Pool 3",
  //         projectSymbol: "SP3",
  //         tokenAddress: erc20Token.address,
  //         tokenDecimals: decimals,
  //         tokenSymbol: symbol,
  //         // teamDescription,
  //         // projectDescription,
  //         // projectCover,
  //         // projectAvatar,
  //         // socialHandles: {
  //         //   website: "www.google.com",
  //         //   twitter: "ImranKhanPTI",
  //         //   facebook: "",
  //         //   telegram: "",
  //         //   discord: "",
  //         // },
  //       },
  //       // rewardPoolInfo
  //       {
  //         startedAt: latestBlock.timestamp + 10 * ONE_MINUTE,
  //         poolAmount: tokens,
  //       },
  //       // images
  //       {
  //         image_3_months:
  //           "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5FIufU99N5SDS2X8IVrPVICzPNgFxsecn_ZmmoJYsknvrQF9wOKxZxc4uWZAyqA55Ujk&usqp=CAU",
  //         image_6_months:
  //           "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9lrh8oM20JW_89pg1Y4avBs2Ilq2D4HXGEySarDJ9lXIUoK3UdyDxkisz36V6Ase1UEU&usqp=CAU",
  //         image_12_months:
  //           "https://images.saatchiart.com/saatchi/14817/art/8722672/7786191-FLFQKBZP-7.jpg",
  //       }
  //     );



  //     let receipt: ContractReceipt = await tx.wait(1);
  //     const xxxx: any = receipt.events?.filter((x) => {
  //       return x.event == "Poolcreated";
  //     });

  //     // Store data on DB

  //     await storeInDB(
  //       chainId.toString(),
  //       xxxx[0].args.poolId.toString(),
  //       xxxx[0].args.poolAddress,
  //       "Staking Pool 2",
  //       "SP2",
  //       erc20Token.address,
  //       name,
  //       symbol,
  //       "https://images.saatchiart.com/saatchi/14817/art/8722672/7786191-FLFQKBZP-7.jpg",
  //       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9lrh8oM20JW_89pg1Y4avBs2Ilq2D4HXGEySarDJ9lXIUoK3UdyDxkisz36V6Ase1UEU&usqp=CAU",
  //       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5FIufU99N5SDS2X8IVrPVICzPNgFxsecn_ZmmoJYsknvrQF9wOKxZxc4uWZAyqA55Ujk&usqp=CAU",
  //       "180",
  //       (latestBlock.timestamp + 10 * ONE_MINUTE).toString(),
  //       {
  //         aboutCampaign: projectDescription,
  //         aboutTeam: teamDescription,
  //         profilePic: projectAvatar,
  //         coverPic: projectCover,
  //         socials: {
  //           website: "adf",
  //           discord: "adsf",
  //           instagram: "asdf",
  //           tiktok: "Adsf",
  //           twitch: "Adf",
  //           twitter: "adf",
  //           youTube: "Asdf"
  //         }
  //       }
  //     )

  //   }


  //   for (let i = 1; i <= 4; i++) {
  //     console.log("creating pool # :", i)

  //     // // First pool
  //     {
  //       const StakingToken = await deployments.get("StakingToken");
  //       const stakingToken = new ethers.Contract(
  //         StakingToken.address,
  //         StakingToken.abi,
  //         deployer
  //       ) as StakingToken;

  //       // Start A pool
  //       const name = await stakingToken.name();
  //       const symbol = await stakingToken.symbol();
  //       const decimals = await stakingToken.decimals();
  //       const decimalsFactor = String(10 ** decimals);
  //       const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);
  //       await stakingToken.mint(tokens);
  //       await stakingToken.approve(stakingPoolFactory.address, tokens);

  //       let latestBlock = await ethers.provider.getBlock("latest");

  //       const teamDescription = "The best project ever, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages."
  //       const projectDescription = "The best project ever, It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web."
  //       const projectCover = "https://i.insider.com/61b36ebb40ffe000194c9caa?width=700"
  //       const projectAvatar= "https://cryptopunks.app/cryptopunks/cryptopunk2243.png"

        
  //       const tx = await stakingPoolFactory.createAStakingPool(
  //         // projectInfo
  //         {
  //           projectName: "Awesome Staking Pool",
  //           projectSymbol: "ASP",
  //           tokenAddress: stakingToken.address,
  //           tokenDecimals: decimals,
  //           tokenSymbol: symbol,
  //           // teamDescription,
  //           // projectDescription,
  //           // projectCover,
  //           // projectAvatar,
  //           //   socialHandles: {
  //           //   website: "www.google.com",
  //           //   twitter: "VitalikButerin",
  //           //   facebook: "",
  //           //   telegram: "",
  //           //   discord: "",
  //           // },
  //         },
  //         // rewardPoolInfo
  //         {
  //           startedAt: latestBlock.timestamp + 500000,
  //           poolAmount: tokens,
  //         },
  //         // images
  //         {
  //           image_3_months: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzr20AXRdZT7i_4kfSxrNlv7VRL3KATCSds4NQcLKiTOf5u0zPeBL6mFCh5iPRedmVDo4&usqp=CAU",
  //           image_6_months: "https://pbs.twimg.com/media/E7ALfy6WYAkIRmU.png",
  //           image_12_months: "https://pbs.twimg.com/media/FAyaKtYXoAMghTY.png",
  //         }
  //       );


  //       let receipt: ContractReceipt = await tx.wait(1);
  //       const xxxx: any = receipt.events?.filter((x) => {
  //         return x.event == "Poolcreated";
  //       });


  //       await storeInDB(
  //         chainId.toString(),
  //         xxxx[0].args.poolId.toString(),
  //         xxxx[0].args.poolAddress,
  //         "Awesome Staking Pool 2",
  //         "ASP2",
  //         stakingToken.address,
  //         name,
  //         symbol,
  //         "https://pbs.twimg.com/media/FAyaKtYXoAMghTY.png",
  //         "https://pbs.twimg.com/media/E7ALfy6WYAkIRmU.png",
  //         "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzr20AXRdZT7i_4kfSxrNlv7VRL3KATCSds4NQcLKiTOf5u0zPeBL6mFCh5iPRedmVDo4&usqp=CAU",
  //         "180",
  //         (latestBlock.timestamp + 10 * ONE_MINUTE).toString(),
  //         {
  //           aboutCampaign: projectDescription,
  //           aboutTeam: teamDescription,
  //           profilePic: projectAvatar,
  //           coverPic: projectCover,
  //           socials: {
  //             website: "adf",
  //             discord: "adsf",
  //             instagram: "asdf",
  //             tiktok: "Adsf",
  //             twitch: "Adf",
  //             twitter: "adf",
  //             youTube: "Asdf"
  //           }
  //         }
  //       )
  
  //     }

  //     //     // Second pool
  //     {
  //       const ERC20Token = await deployments.get("ERC20Token");
  //       const erc20Token = new ethers.Contract(
  //         ERC20Token.address,
  //         ERC20Token.abi,
  //         deployer
  //       ) as ERC20Token;

  //       const name = await erc20Token.name();
  //       const symbol = await erc20Token.symbol();
  //       const decimals = await erc20Token.decimals();
  //       const decimalsFactor = String(10 ** decimals);
  //       const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);

  //       await erc20Token.mint(tokens);
  //       await erc20Token.approve(stakingPoolFactory.address, tokens);

  //       let latestBlock = await ethers.provider.getBlock("latest");

  //       const teamDescription = "The best project ever, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages."
  //       const projectDescription = "The best project ever, It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web."
  //       const projectCover = "https://gulfcrypto.ae/wp-content/uploads/2022/04/bored-ape-nft-sothebys-record-sale-gID_4.png"
  //       const projectAvatar= "https://images.theconversation.com/files/417198/original/file-20210820-25-1j3afhs.jpeg?ixlib=rb-1.1.0&q=45&auto=format&w=1200&h=1200.0&fit=crop"



  //       const tx = await stakingPoolFactory.createAStakingPool(
  //         // projectInfo
  //         {
  //           projectName: "Staking Pool 2",
  //           projectSymbol: "SP2",
  //           tokenAddress: erc20Token.address,
  //           tokenDecimals: decimals,
  //           tokenSymbol: symbol,
  //           // teamDescription,
  //           // projectDescription,
  //           // projectCover,
  //           // projectAvatar,
  //           // socialHandles: {
  //           //   website: "www.google.com",
  //           //   twitter: "onPlanetIO",
  //           //   facebook: "",
  //           //   telegram: "",
  //           //   discord: "",
  //           // },
  //         },
  //         // rewardPoolInfo
  //         {
  //           startedAt: latestBlock.timestamp + 20000,
  //           poolAmount: tokens,
  //         },
  //         // images
  //         {
  //           image_3_months:
  //             "https://thumbor.forbes.com/thumbor/fit-in/900x510/https://www.forbes.com/advisor/in/wp-content/uploads/2022/03/monkey-g412399084_1280.jpg",
  //           image_6_months:
  //             "https://img.freepik.com/premium-vector/mutant-ape-yacht-club-nft-artwork-collection-set-unique-bored-monkey-character-nfts-variant_361671-259.jpg?w=2000",
  //           image_12_months:
  //             "https://www.artnews.com/wp-content/uploads/2022/01/unnamed-2.png?w=631",
  //         }
  //       );

  //       let receipt: ContractReceipt = await tx.wait(1);
  //       const xxxx: any = receipt.events?.filter((x) => {
  //         return x.event == "Poolcreated";
  //       });


  //       await storeInDB(
  //         chainId.toString(),
  //         xxxx[0].args.poolId.toString(),
  //         xxxx[0].args.poolAddress,
  //         "Staking Pool 5",
  //         "ASP2",
  //         erc20Token.address,
  //         name,
  //         symbol,
  //         "https://www.artnews.com/wp-content/uploads/2022/01/unnamed-2.png?w=631",
  //         "https://img.freepik.com/premium-vector/mutant-ape-yacht-club-nft-artwork-collection-set-unique-bored-monkey-character-nfts-variant_361671-259.jpg?w=2000",
  //         "https://thumbor.forbes.com/thumbor/fit-in/900x510/https://www.forbes.com/advisor/in/wp-content/uploads/2022/03/monkey-g412399084_1280.jpg",
  //         "180",
  //         (latestBlock.timestamp + 10 * ONE_MINUTE).toString(),
  //         {
  //           aboutCampaign: projectDescription,
  //           aboutTeam: teamDescription,
  //           profilePic: projectAvatar,
  //           coverPic: projectCover,
  //           socials: {
  //             website: "adf",
  //             discord: "adsf",
  //             instagram: "asdf",
  //             tiktok: "Adsf",
  //             twitch: "Adf",
  //             twitter: "adf",
  //             youTube: "Asdf"
  //           }
  //         }
  //       )
  
  //     }

  //     //     // Third pool
  //     //     {
  //     //         const ERC20Token = await deployments.get("ERC20Token");
  //     //         const erc20Token = new ethers.Contract(
  //     //             ERC20Token.address,
  //     //             ERC20Token.abi,
  //     //             deployer
  //     //         ) as ERC20Token;

  //     //         const symbol = await erc20Token.symbol();
  //     //         const decimals = await erc20Token.decimals();
  //     //         const decimalsFactor = String(10 ** decimals);
  //     //         const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);

  //     //         await erc20Token.mint(tokens);
  //     //         await erc20Token.approve(stakingPoolFactory.address, tokens);

  //     //         let latestBlock = await ethers.provider.getBlock("latest");

  //     //         const tx = await stakingPoolFactory.createAStakingPool(
  //     //             // projectInfo
  //     //             {
  //     //                 projectName: "Staking Pool 3",
  //     //                 projectSymbol: "SP3",
  //     //                 tokenAddress: erc20Token.address,
  //     //                 tokenDecimals: decimals,
  //     //                 tokenSymbol: symbol,
  //     //                 teamDescription:
  //     //                     "The best project ever, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.",
  //     //                 projectDescription:
  //     //                     "The best project ever, It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web.",
  //     //                 projectCover:
  //     //                     "https://visionarymarketing.com/wp-content/uploads/2022/02/art-nfts-auction-2021-esther-barend.jpg",
  //     //                 projectAvatar:
  //     //                     "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOLAJ_oytgRk4ur0V8zL5bAeBZV2oBVt2QFuZKF18Y13oEHAIQAonjUwvZ4U2bp8_shmA&usqp=CAU",
  //     //                 socialHandles: {
  //     //                     website: "www.google.com",
  //     //                     twitter: "ImranKhanPTI",
  //     //                     facebook: "",
  //     //                     telegram: "",
  //     //                     discord: "",
  //     //                 },
  //     //             },
  //     //             // rewardPoolInfo
  //     //             {
  //     //                 startedAt: latestBlock.timestamp + 100000,
  //     //                 poolAmount: tokens,
  //     //             },
  //     //             // images
  //     //             {
  //     //                 image_3_months:
  //     //                     "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5FIufU99N5SDS2X8IVrPVICzPNgFxsecn_ZmmoJYsknvrQF9wOKxZxc4uWZAyqA55Ujk&usqp=CAU",
  //     //                 image_6_months:
  //     //                     "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9lrh8oM20JW_89pg1Y4avBs2Ilq2D4HXGEySarDJ9lXIUoK3UdyDxkisz36V6Ase1UEU&usqp=CAU",
  //     //                 image_12_months:
  //     //                     "https://images.saatchiart.com/saatchi/14817/art/8722672/7786191-FLFQKBZP-7.jpg",
  //     //             }
  //     //         );

  //     //     }

  //     //     // Second pool
  //     //     {
  //     //         const ERC20Token = await deployments.get("ERC20Token");
  //     //         const erc20Token = new ethers.Contract(
  //     //             ERC20Token.address,
  //     //             ERC20Token.abi,
  //     //             deployer
  //     //         ) as ERC20Token;

  //     //         const symbol = await erc20Token.symbol();
  //     //         const decimals = await erc20Token.decimals();
  //     //         const decimalsFactor = String(10 ** decimals);
  //     //         const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);

  //     //         await erc20Token.mint(tokens);
  //     //         await erc20Token.approve(stakingPoolFactory.address, tokens);

  //     //         let latestBlock = await ethers.provider.getBlock("latest");

  //     //         const tx = await stakingPoolFactory.createAStakingPool(
  //     //             // projectInfo
  //     //             {
  //     //                 projectName: "Staking Pool 2",
  //     //                 projectSymbol: "SP2",
  //     //                 tokenAddress: erc20Token.address,
  //     //                 tokenDecimals: decimals,
  //     //                 tokenSymbol: symbol,
  //     //                 teamDescription:
  //     //                     "The best project ever, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.",
  //     //                 projectDescription:
  //     //                     "The best project ever, It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web.",
  //     //                 projectCover: "https://gulfcrypto.ae/wp-content/uploads/2022/04/bored-ape-nft-sothebys-record-sale-gID_4.png",
  //     //                 projectAvatar: "https://images.theconversation.com/files/417198/original/file-20210820-25-1j3afhs.jpeg?ixlib=rb-1.1.0&q=45&auto=format&w=1200&h=1200.0&fit=crop",
  //     //                 socialHandles: {
  //     //                     website: "www.google.com",
  //     //                     twitter: "onPlanetIO",
  //     //                     facebook: "",
  //     //                     telegram: "",
  //     //                     discord: "",
  //     //                 },
  //     //             },
  //     //             // rewardPoolInfo
  //     //             {
  //     //                 startedAt: latestBlock.timestamp + 20000,
  //     //                 poolAmount: tokens,
  //     //             },
  //     //             // images
  //     //             {
  //     //                 image_3_months:
  //     //                     "https://thumbor.forbes.com/thumbor/fit-in/900x510/https://www.forbes.com/advisor/in/wp-content/uploads/2022/03/monkey-g412399084_1280.jpg",
  //     //                 image_6_months:
  //     //                     "https://img.freepik.com/premium-vector/mutant-ape-yacht-club-nft-artwork-collection-set-unique-bored-monkey-character-nfts-variant_361671-259.jpg?w=2000",
  //     //                 image_12_months:
  //     //                     "https://www.artnews.com/wp-content/uploads/2022/01/unnamed-2.png?w=631",
  //     //             }
  //     //         );

  //     //     }


  //   }


  // }

};