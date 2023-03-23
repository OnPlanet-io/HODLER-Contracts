import axios from "axios";
import { ContractReceipt } from "ethers";
import { deployments, ethers, getChainId } from "hardhat";
import { CampaignFeeManager, ERC20Token, MembershipFeeManager, PMMembershipManager, StakingPoolFactory, StakingPool__factory, StakingToken } from "../typechain-types";
import { network } from "hardhat";
import { PMTeamManager, PMTeamManagerInterface } from "../typechain-types/contracts/CreatorContract/PMTeamManager";

async function main() {

    const [deployer] = await ethers.getSigners();

    const storeCampaignInDB = async (
        chianId: string,
        campaignId: string,
        campaignAddress: string,
        category: number,
        campaignName: string,
        campaignSymbol: string,
        rewardTokenAddress: string,
        rewardTokenName: string,
        rewardTokenSymbol: string,
        profileType: 0 | 1 | 2,
        profileId: string,
        image_12_months: string,
        image_6_months: string,
        image_3_months: string,
        maxAPY: string,
        startingTime: string,
        profile: {
            aboutCampaign: string,
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
            category,
            campaignName,
            campaignSymbol,
            rewardTokenAddress,
            rewardTokenName,
            rewardTokenSymbol,
            profileType,
            profileId,
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

    const startATeam = async (address: string): Promise<string> => {

        const MembershipFeeManager = await deployments.get("MembershipFeeManager");
        const membershipFeeManager = new ethers.Contract(
            MembershipFeeManager.address,
            MembershipFeeManager.abi,
            deployer
        ) as MembershipFeeManager;

        const fee = await membershipFeeManager.getMembershipFee(3);


        const PMTeamManager = await deployments.get("PMTeamManager");
        const PMTeamManagerContract = new ethers.Contract(
            PMTeamManager.address,
            PMTeamManager.abi,
            deployer
        ) as PMTeamManager;

        const txx2 = await PMTeamManagerContract.createATeam(address, { value: fee });

        let receipt: ContractReceipt = await txx2.wait();
        const xxxx: any = receipt.events?.filter((x) => {
            return x.event == "TeamCreated";
        });

        const teamIdx = xxxx[0].args.teamId.toString();

        const newTeam = await axios.post("http://localhost:3000/api/teamProfile/addTeamProfile", {
            inputId: {
                chianId: "31337",
                teamId: teamIdx,
            },
        });

        console.log("New Team created with Id: ", teamIdx);
        return teamIdx;

    }

    const becomeAPremiumMember = async (address: string) => {

        const PMMembership = await deployments.get("PMMembership");
        const PMMembershipContract = new ethers.Contract(
            PMMembership.address,
            PMMembership.abi,
            deployer
        ) as PMMembership;

        await PMMembershipContract.getPremiumMembership(address);
        const newUser = await axios.post("http://localhost:3000/api/userProfile/addUserProfile", {
            inputId: {
                chianId: "31337",
                userAddress: address,
            },
        });
        console.log("Premium Membership Assinged");
    }




    const CampaignFeeManager = await deployments.get("CampaignFeeManager");
    const campaignFeeManager = new ethers.Contract(
        CampaignFeeManager.address,
        CampaignFeeManager.abi,
        deployer
    ) as CampaignFeeManager;

    const silverFee = await campaignFeeManager.getCampaignFee(1);
    const goldFee = await campaignFeeManager.getCampaignFee(1);
    const diamondFee = await campaignFeeManager.getCampaignFee(2);


    const StakingPoolFactory = await deployments.get("StakingPoolFactory");
    const stakingPoolFactory = new ethers.Contract(
        StakingPoolFactory.address,
        StakingPoolFactory.abi,
        deployer
    ) as StakingPoolFactory;


    console.log("STARTED!");

    // await becomeAPremiumMember(deployer.address);
    let teamId = await startATeam(deployer.address);

    for (let i = 1; i <= 2; i++) {
        console.log("creating pool # :", i)

        // // First pool
        {
            const StakingToken = await deployments.get("StakingToken");
            const stakingToken = new ethers.Contract(
                StakingToken.address,
                StakingToken.abi,
                deployer
            ) as StakingToken;

            // Start A pool
            const name = await stakingToken.name();
            const symbol = await stakingToken.symbol();
            const decimals = await stakingToken.decimals();
            const decimalsFactor = String(10 ** decimals);
            const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);
            await stakingToken.mint(tokens);
            await stakingToken.approve(stakingPoolFactory.address, tokens);

            let latestBlock = await ethers.provider.getBlock("latest");

            const teamDescription = "The best project ever, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages."
            const projectDescription = "The best project ever, It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web."
            const projectCover = "https://i.insider.com/61b36ebb40ffe000194c9caa?width=700"
            const projectAvatar = "https://cryptopunks.app/cryptopunks/cryptopunk2243.png"

            const tx = await stakingPoolFactory.createAStakingPool(
                // projectInfo
                {
                    category: 0,
                    projectName: "Random Campagin 1",
                    projectSymbol: "RC1",
                    tokenAddress: stakingToken.address,
                    tokenDecimals: decimals,
                    tokenSymbol: symbol,
                    profileType: 1,
                    profileId: teamId
                },
                // rewardPoolInfo
                {
                    startedAt: latestBlock.timestamp + 5000,
                    poolAmount: tokens,
                },
                // images
                {
                    image_3_months: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzr20AXRdZT7i_4kfSxrNlv7VRL3KATCSds4NQcLKiTOf5u0zPeBL6mFCh5iPRedmVDo4&usqp=CAU",
                    image_6_months: "https://pbs.twimg.com/media/E7ALfy6WYAkIRmU.png",
                    image_12_months: "https://pbs.twimg.com/media/FAyaKtYXoAMghTY.png",
                },
                { value: silverFee }
            );

            let receipt: ContractReceipt = await tx.wait(1);
            const xxxx: any = receipt.events?.filter((x) => {
                return x.event == "Poolcreated";
            });

            // Store data on DB

            const chainId = await getChainId();

            await storeCampaignInDB(
                chainId.toString(),
                xxxx[0].args.poolId.toString(),
                xxxx[0].args.poolAddress,
                0,
                "Random Campagin 1",
                "RC1",
                stakingToken.address,
                name,
                symbol,
                0,
                "0",
                "https://pbs.twimg.com/media/FAyaKtYXoAMghTY.png",
                "https://pbs.twimg.com/media/E7ALfy6WYAkIRmU.png",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzr20AXRdZT7i_4kfSxrNlv7VRL3KATCSds4NQcLKiTOf5u0zPeBL6mFCh5iPRedmVDo4&usqp=CAU",
                "180",
                (latestBlock.timestamp + 5000).toString(),
                {
                    aboutCampaign: projectDescription,
                    profilePic: projectAvatar,
                    coverPic: projectCover,
                    socials: {
                        website: "adf",
                        discord: "adsf",
                        instagram: "asdf",
                        tiktok: "Adsf",
                        twitch: "Adf",
                        twitter: "adf",
                        youTube: "Asdf"
                    }
                }
            )

            let stakingPoolAddress = xxxx[0].args.poolAddress;
            const StakingPool: StakingPool__factory = await ethers.getContractFactory(
                "StakingPool"
            );
            const stakingPool = StakingPool.attach(stakingPoolAddress);

            await network.provider.send("evm_increaseTime", [5000]);
            await network.provider.send("evm_mine");

            await stakingToken.connect(deployer).mint(ethers.utils.parseEther("3000"));
            await stakingToken
                .connect(deployer)
                .approve(stakingPool.address, ethers.utils.parseEther("3000"));
            await stakingPool
                .connect(deployer)
                .stakeTokens(ethers.utils.parseEther("500"), 0);
            await stakingPool
                .connect(deployer)
                .stakeTokens(ethers.utils.parseEther("1000"), 1);
            await stakingPool
                .connect(deployer)
                .stakeTokens(ethers.utils.parseEther("1500"), 2);


        }

        // Second pool
        {
            const ERC20Token = await deployments.get("ERC20Token");
            const erc20Token = new ethers.Contract(
                ERC20Token.address,
                ERC20Token.abi,
                deployer
            ) as ERC20Token;

            const name = await erc20Token.name();
            const symbol = await erc20Token.symbol();
            const decimals = await erc20Token.decimals();
            const decimalsFactor = String(10 ** decimals);
            const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);

            await erc20Token.mint(tokens);
            await erc20Token.approve(stakingPoolFactory.address, tokens);

            let latestBlock = await ethers.provider.getBlock("latest");

            const teamDescription = "The best project ever, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages."
            const projectDescription = "The best project ever, It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web."
            const projectCover = "https://i.insider.com/61b36ebb40ffe000194c9caa?width=700"
            const projectAvatar = "https://cryptopunks.app/cryptopunks/cryptopunk2243.png"


            const tx = await stakingPoolFactory.createAStakingPool(
                // projectInfo
                {
                    category: 1,
                    projectName: "Random Campagin 2",
                    projectSymbol: "RC2",
                    tokenAddress: erc20Token.address,
                    tokenDecimals: decimals,
                    tokenSymbol: symbol,
                    profileType: 1,
                    profileId: teamId

                },
                // rewardPoolInfo
                {
                    startedAt: latestBlock.timestamp + 20000,
                    poolAmount: tokens,
                },
                // images
                {
                    image_3_months:
                        "https://thumbor.forbes.com/thumbor/fit-in/900x510/https://www.forbes.com/advisor/in/wp-content/uploads/2022/03/monkey-g412399084_1280.jpg",
                    image_6_months:
                        "https://img.freepik.com/premium-vector/mutant-ape-yacht-club-nft-artwork-collection-set-unique-bored-monkey-character-nfts-variant_361671-259.jpg?w=2000",
                    image_12_months:
                        "https://www.artnews.com/wp-content/uploads/2022/01/unnamed-2.png?w=631",
                },
                { value: goldFee }

            );

            let receipt: ContractReceipt = await tx.wait(1);
            const xxxx: any = receipt.events?.filter((x) => {
                return x.event == "Poolcreated";
            });

            const chainId = await getChainId();

            await storeCampaignInDB(
                chainId.toString(),
                xxxx[0].args.poolId.toString(),
                xxxx[0].args.poolAddress,
                1,
                "Random Campagin 2",
                "RC2",
                erc20Token.address,
                name,
                symbol,
                0,
                "0",
                "https://www.artnews.com/wp-content/uploads/2022/01/unnamed-2.png?w=631",
                "https://img.freepik.com/premium-vector/mutant-ape-yacht-club-nft-artwork-collection-set-unique-bored-monkey-character-nfts-variant_361671-259.jpg?w=2000",
                "https://thumbor.forbes.com/thumbor/fit-in/900x510/https://www.forbes.com/advisor/in/wp-content/uploads/2022/03/monkey-g412399084_1280.jpg",
                "180",
                (latestBlock.timestamp + 5000).toString(),
                {
                    aboutCampaign: projectDescription,
                    profilePic: projectAvatar,
                    coverPic: projectCover,
                    socials: {
                        website: "adf",
                        discord: "adsf",
                        instagram: "asdf",
                        tiktok: "Adsf",
                        twitch: "Adf",
                        twitter: "adf",
                        youTube: "Asdf"
                    }
                }
            )

        }

        // Third pool
        {
            const ERC20Token = await deployments.get("ERC20Token");
            const erc20Token = new ethers.Contract(
                ERC20Token.address,
                ERC20Token.abi,
                deployer
            ) as ERC20Token;

            const name = await erc20Token.name();
            const symbol = await erc20Token.symbol();
            const decimals = await erc20Token.decimals();
            const decimalsFactor = String(10 ** decimals);
            const tokens = ethers.BigNumber.from("1000000").mul(decimalsFactor);

            await erc20Token.mint(tokens);
            await erc20Token.approve(stakingPoolFactory.address, tokens);

            let latestBlock = await ethers.provider.getBlock("latest");

            const teamDescription = "The best project ever, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages."
            const projectDescription = "The best project ever, It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web."
            const projectCover = "https://i.insider.com/61b36ebb40ffe000194c9caa?width=700"
            const projectAvatar = "https://cryptopunks.app/cryptopunks/cryptopunk2243.png"

            const tx = await stakingPoolFactory.createAStakingPool(
                // projectInfo
                {
                    category: 2,
                    projectName: "Random Campagin 3",
                    projectSymbol: "RC3",
                    tokenAddress: erc20Token.address,
                    tokenDecimals: decimals,
                    tokenSymbol: symbol,
                    profileType: 1,
                    profileId: teamId

                },
                // rewardPoolInfo
                {
                    startedAt: latestBlock.timestamp + 100000,
                    poolAmount: tokens,
                },
                // images
                {
                    image_3_months:
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5FIufU99N5SDS2X8IVrPVICzPNgFxsecn_ZmmoJYsknvrQF9wOKxZxc4uWZAyqA55Ujk&usqp=CAU",
                    image_6_months:
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9lrh8oM20JW_89pg1Y4avBs2Ilq2D4HXGEySarDJ9lXIUoK3UdyDxkisz36V6Ase1UEU&usqp=CAU",
                    image_12_months:
                        "https://images.saatchiart.com/saatchi/14817/art/8722672/7786191-FLFQKBZP-7.jpg",
                },
                { value: diamondFee }
            );


            let receipt: ContractReceipt = await tx.wait(1);
            const xxxx: any = receipt.events?.filter((x) => {
                return x.event == "Poolcreated";
            });


            const chainId = await getChainId();

            await storeCampaignInDB(
                chainId.toString(),
                xxxx[0].args.poolId.toString(),
                xxxx[0].args.poolAddress,
                2,
                "Random Campagin 3",
                "RC3",
                erc20Token.address,
                name,
                symbol,
                0,
                "0",
                "https://images.saatchiart.com/saatchi/14817/art/8722672/7786191-FLFQKBZP-7.jpg",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9lrh8oM20JW_89pg1Y4avBs2Ilq2D4HXGEySarDJ9lXIUoK3UdyDxkisz36V6Ase1UEU&usqp=CAU",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5FIufU99N5SDS2X8IVrPVICzPNgFxsecn_ZmmoJYsknvrQF9wOKxZxc4uWZAyqA55Ujk&usqp=CAU",
                "180",
                (latestBlock.timestamp + 100000).toString(),
                {
                    aboutCampaign: projectDescription,
                    profilePic: projectAvatar,
                    coverPic: projectCover,
                    socials: {
                        website: "adf",
                        discord: "adsf",
                        instagram: "asdf",
                        tiktok: "Adsf",
                        twitch: "Adf",
                        twitter: "adf",
                        youTube: "Asdf"
                    }
                }
            )

        }

    }

    console.log("DONE!");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
