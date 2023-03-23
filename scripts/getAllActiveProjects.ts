// import { deployments, ethers, network } from "hardhat";
// import { Auxilary, ERC20Token, StakingPoolFactory, StakingToken } from "../typechain-types";
// import { time } from "@nomicfoundation/hardhat-network-helpers";

// async function main() {

//     const [deployer] = await ethers.getSigners();


//     const StakingPoolFactory = await deployments.get("StakingPoolFactory");
//     const stakingPoolFactory = new ethers.Contract(
//         StakingPoolFactory.address,
//         StakingPoolFactory.abi,
//         deployer
//     ) as StakingPoolFactory;


//     console.log("Total projects",  (await stakingPoolFactory.projectsCount()).toString())


//     const Auxilary = await deployments.get("Auxilary");
//     const auxilary = new ethers.Contract(
//         Auxilary.address,
//         Auxilary.abi,
//         deployer
//     ) as Auxilary;

//     const ONE_MINUTE = time.duration.minutes(1);
//     await network.provider.send("evm_increaseTime", [5000 * ONE_MINUTE]);
//     await network.provider.send("evm_mine");

//     let latestBlock = await ethers.provider.getBlock("latest");

//     const allActiveProjects = await auxilary.getActiveProjectsDetailsBulk(20, 20);
//     // console.log("allActiveProjects: ", allActiveProjects);
//     allActiveProjects.map((project: any) => {
//         console.log("Block time: ", latestBlock.timestamp)
//         console.log("startedAt: ", project.rewardPoolInfo.startedAt.toString() + "\n" );


//     })


//     // const StakingPoolFactory = await deployments.get("StakingPoolFactory");
//     // const stakingPoolFactory = new ethers.Contract(
//     //     StakingPoolFactory.address,
//     //     StakingPoolFactory.abi,
//     //     deployer
//     // ) as StakingPoolFactory;


//     // console.log("STARTED!");

//     // for (let i = 1; i <= 4; i++) {
//     //     console.log("creating pool # :", i)

//     //     // // First pool
//     //     {
//     //         const StakingToken = await deployments.get("StakingToken");
//     //         const stakingToken = new ethers.Contract(
//     //             StakingToken.address,
//     //             StakingToken.abi,
//     //             deployer
//     //         ) as StakingToken;

//     //         // Start A pool
//     //         const symbol = await stakingToken.symbol();
//     //         const decimals = await stakingToken.decimals();
//     //         const decimalsFactor = String(10 ** decimals);
//     //         const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);
//     //         await stakingToken.mint(tokens);
//     //         await stakingToken.approve(stakingPoolFactory.address, tokens);

//     //         let latestBlock = await ethers.provider.getBlock("latest");

//     //         const tx = await stakingPoolFactory.createAStakingPool(
//     //             // projectInfo
//     //             {
//     //                 projectName: "Awesome Staking Pool",
//     //                 projectSymbol: "ASP",
//     //                 tokenAddress: stakingToken.address,
//     //                 tokenDecimals: decimals,
//     //                 tokenSymbol: symbol,
//     //                 teamDescription:
//     //                     "The best project ever, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.",
//     //                 projectDescription:
//     //                     "The best project ever, It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web.",
//     //                 projectCover: "https://i.insider.com/61b36ebb40ffe000194c9caa?width=700",
//     //                 projectAvatar: "https://cryptopunks.app/cryptopunks/cryptopunk2243.png",
//     //                 socialHandles: {
//     //                     website: "www.google.com",
//     //                     twitter: "VitalikButerin",
//     //                     facebook: "",
//     //                     telegram: "",
//     //                     discord: "",
//     //                 },
//     //             },
//     //             // rewardPoolInfo
//     //             {
//     //                 startedAt: latestBlock.timestamp + 500000,
//     //                 poolAmount: tokens,
//     //             },
//     //             // images
//     //             {
//     //                 image_3_months: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzr20AXRdZT7i_4kfSxrNlv7VRL3KATCSds4NQcLKiTOf5u0zPeBL6mFCh5iPRedmVDo4&usqp=CAU",
//     //                 image_6_months: "https://pbs.twimg.com/media/E7ALfy6WYAkIRmU.png",
//     //                 image_12_months: "https://pbs.twimg.com/media/FAyaKtYXoAMghTY.png",
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


//     // }

//     // // // First pool
//     // {
//     //     const StakingToken = await deployments.get("StakingToken");
//     //     const stakingToken = new ethers.Contract(
//     //         StakingToken.address,
//     //         StakingToken.abi,
//     //         deployer
//     //     ) as StakingToken;

//     //     // Start A pool
//     //     const symbol = await stakingToken.symbol();
//     //     const decimals = await stakingToken.decimals();
//     //     const decimalsFactor = String(10 ** decimals);
//     //     const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);
//     //     await stakingToken.mint(tokens);
//     //     await stakingToken.approve(stakingPoolFactory.address, tokens);

//     //     let latestBlock = await ethers.provider.getBlock("latest");

//     //     const tx = await stakingPoolFactory.createAStakingPool(
//     //         // projectInfo
//     //         {
//     //             projectName: "Awesome Staking Pool",
//     //             projectSymbol: "ASP",
//     //             tokenAddress: stakingToken.address,
//     //             tokenDecimals: decimals,
//     //             tokenSymbol: symbol,
//     //             teamDescription:
//     //                 "The best project ever, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.",
//     //             projectDescription:
//     //                 "The best project ever, It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web.",
//     //             projectCover: "https://i.insider.com/61b36ebb40ffe000194c9caa?width=700",
//     //             projectAvatar: "https://cryptopunks.app/cryptopunks/cryptopunk2243.png",
//     //             socialHandles: {
//     //                 website: "www.google.com",
//     //                 twitter: "VitalikButerin",
//     //                 facebook: "",
//     //                 telegram: "",
//     //                 discord: "",
//     //             },
//     //         },
//     //         // rewardPoolInfo
//     //         {
//     //             startedAt: latestBlock.timestamp + 500000,
//     //             poolAmount: tokens,
//     //         },
//     //         // images
//     //         {
//     //             image_3_months: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzr20AXRdZT7i_4kfSxrNlv7VRL3KATCSds4NQcLKiTOf5u0zPeBL6mFCh5iPRedmVDo4&usqp=CAU",
//     //             image_6_months: "https://pbs.twimg.com/media/E7ALfy6WYAkIRmU.png",
//     //             image_12_months: "https://pbs.twimg.com/media/FAyaKtYXoAMghTY.png",
//     //         }
//     //     );

//     // }


//     // console.log("DONE!");










// }

// main().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });
