import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { network, ethers } from "hardhat";

import { BigNumber, ContractReceipt } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


import { StakingPool__factory, PMTeamManager, PMTeamManager__factory, PMMembershipManager__factory, Token__factory, PMRewardDistributor__factory, PMRewardDistributor } from "../typechain-types";
import { UniswapV2Factory__factory, UniswapV2Pair__factory, UniswapV2Router02__factory, WETH9__factory } from "../typechain-types";
import { PMMembershipManager } from "../typechain-types";
import { StakingPoolFactory__factory, StakingPoolFactory } from "../typechain-types";
import { CreatorManager__factory, CreatorManager } from "../typechain-types";
import { StakingToken, StakingToken__factory } from "../typechain-types";
import { CampaignFeeManager, CampaignFeeManager__factory } from "../typechain-types";
import { MembershipFeeManager, MembershipFeeManager__factory } from "../typechain-types";


let creatorManager: CreatorManager;
let stakingToken: StakingToken;
let stakingPoolFactory: StakingPoolFactory;
let pmMembershipManager: PMMembershipManager;
let pmTeamManager: PMTeamManager;
let campaignFeeManager: CampaignFeeManager;
let membershipFeeManager: MembershipFeeManager;
let pmRewardDistributor: PMRewardDistributor;

const ONE_MINUTE = time.duration.minutes(1);
const ONE_DAY = time.duration.days(1);

let deployer: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress, user3: SignerWithAddress, user4: SignerWithAddress, user5: SignerWithAddress, user6: SignerWithAddress;
let rewardPool: SignerWithAddress, corporate: SignerWithAddress, rewardManger: SignerWithAddress;

const enum CampaignCategory { SILVER, GOLD, DIAMOND };
const enum Association { NONE, TEAM, USER };
const enum MembershipCategory { REGULAR, UPGRADE, PREMIUM, TEAM };
const enum UnstakingCategory { REWARD_0PC, REWARD_30PC, REWARD_50PC, REWARD_100PC };
const enum FeesType { USD, BNB }
const enum StakingType { ONE_MONTH, THREE_MONTH, SIX_MONTH, NINE_MONTH, TWELVE_MONTH };

const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD"

describe("Planet Moon Test Stack", function () {

    const startAStakingPool = async (type: CampaignCategory, user: SignerWithAddress = user1) => {

        const campaignFee = await campaignFeeManager.getCampaignFee(type);

        const tokens = "1000";
        const decimals = stakingToken.decimals();
        const symbol = stakingToken.symbol();

        await stakingToken.connect(user).mint(ethers.utils.parseEther(tokens));
        await stakingToken.connect(user).approve(stakingPoolFactory.address, ethers.utils.parseEther(tokens));

        let latestBlock = await ethers.provider.getBlock("latest");

        const tx = await stakingPoolFactory.connect(user).createAStakingPool(
            // projectInfo 
            {
                category: type,
                projectName: "Awesome Staking Pool",
                projectSymbol: "ASP",
                tokenAddress: stakingToken.address,
                tokenDecimals: decimals,
                tokenSymbol: symbol,
                profileType: Association.NONE,
                profileId: 0
            },
            // rewardPoolInfo
            {
                startedAt: latestBlock.timestamp + 15 * 60 * 1000,
                poolAmount: ethers.utils.parseEther(tokens)
            },
            // images
            {
                image_1_months: "image_1_months",
                image_3_months: "image_3_months",
                image_6_months: "image_6_months",
                image_9_months: "image_9_months",
                image_12_months: "image_12_months",
                APY_1_months: 10,
                APY_3_months: 30,
                APY_6_months: 50,
                APY_9_months: 60,
                APY_12_months: 80,
            },
            {
                value: campaignFee
            }

        );

        let receipt: ContractReceipt = await tx.wait();
        const xxxx: any = receipt.events?.filter((x) => { return x.event == "Poolcreated" })
        let stakingPoolAddress = xxxx[0].args.poolAddress;
        let poolId = xxxx[0].args.poolId;

        const StakingPool = await ethers.getContractFactory("StakingPool") as StakingPool__factory;
        return {
            poolContract: StakingPool.attach(stakingPoolAddress),
            poolId: poolId as BigNumber
        };

    }

    const launchOPAndProvideLiquidity = async () => {

        const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory") as UniswapV2Factory__factory;
        const UniswapV2Pair = await ethers.getContractFactory('UniswapV2Pair') as UniswapV2Pair__factory;
        const UniswapV2Router02 = await ethers.getContractFactory('UniswapV2Router02') as UniswapV2Router02__factory;
        const WETH = await ethers.getContractFactory('WETH9') as WETH9__factory;
        const BuyBackToken = await ethers.getContractFactory("Token") as Token__factory;

        let myWETH = await WETH.deploy();
        let factory = await UniswapV2Factory.deploy(deployer.address);
        let router = await UniswapV2Router02.deploy(factory.address, myWETH.address);

        await campaignFeeManager.setRouter(router.address);
        await membershipFeeManager.setRouter(router.address);

        let buyBackToken = await BuyBackToken.deploy("BuyBackToken", "BBT");

        await factory.createPair(myWETH.address, buyBackToken.address);
        const uniswapV2PairAddress = await factory.getPair(myWETH.address, buyBackToken.address);
        let uniswapV2Pair = UniswapV2Pair.attach(uniswapV2PairAddress);


        // Provide liquidity and start trading;
        let latestBlock = await ethers.provider.getBlock("latest")

        await buyBackToken.mint(ethers.utils.parseEther("100"));
        await buyBackToken.approve(router.address, ethers.utils.parseEther("100"))
        await router.addLiquidityETH(
            buyBackToken.address,
            ethers.utils.parseEther("100"),
            0,
            0,
            deployer.address,
            latestBlock.timestamp + 60,
            { value: ethers.utils.parseEther("100") }
        )


        return { router, uniswapV2Pair, buyBackToken }
    }

    const provideLiquidity = async () => {

        const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory") as UniswapV2Factory__factory;
        const UniswapV2Pair = await ethers.getContractFactory('UniswapV2Pair') as UniswapV2Pair__factory;
        const UniswapV2Router02 = await ethers.getContractFactory('UniswapV2Router02') as UniswapV2Router02__factory;
        const WETH = await ethers.getContractFactory('WETH9') as WETH9__factory;

        let myWETH = await WETH.deploy();
        let factory = await UniswapV2Factory.deploy(deployer.address);
        let router = await UniswapV2Router02.deploy(factory.address, myWETH.address);

        await pmRewardDistributor.setRouter(router.address);

        await factory.createPair(myWETH.address, stakingToken.address);
        const uniswapV2PairAddress = await factory.getPair(myWETH.address, stakingToken.address);
        let uniswapV2Pair = UniswapV2Pair.attach(uniswapV2PairAddress);


        // Provide liquidity and start trading;
        let latestBlock = await ethers.provider.getBlock("latest");

        await stakingToken.mint(ethers.utils.parseEther("100"));
        await stakingToken.approve(router.address, ethers.utils.parseEther("100"))
        await router.addLiquidityETH(
            stakingToken.address,
            ethers.utils.parseEther("100"),
            0,
            0,
            deployer.address,
            latestBlock.timestamp + 60,
            { value: ethers.utils.parseEther("1") }
        )


        return { router, uniswapV2Pair, stakingToken }
    }

    beforeEach(async () => {

        [deployer, user1, user2, user3, user4, user5, user6, rewardPool, corporate, rewardManger] = await ethers.getSigners();

        const StakingToken = await ethers.getContractFactory("StakingToken") as StakingToken__factory;
        stakingToken = await StakingToken.deploy();

        const CreatorManager = await ethers.getContractFactory("CreatorManager") as CreatorManager__factory;
        creatorManager = await CreatorManager.deploy();

        const CampaignFeeManager = await ethers.getContractFactory("CampaignFeeManager") as CampaignFeeManager__factory;
        campaignFeeManager = await CampaignFeeManager.deploy(
            "100", "125", "400", // silver, gold, diamond
            "3", "2", "2", "0" // reward_0pc, reward_30pc, reward_50pc, reward_100pc   
        );

        const MembershipFeeManager = await ethers.getContractFactory("MembershipFeeManager") as MembershipFeeManager__factory;
        membershipFeeManager = await MembershipFeeManager.deploy(
            "3", "2", "5", "8"
        );

        const PMMembershipManager = await ethers.getContractFactory("PMMembershipManager") as PMMembershipManager__factory;
        pmMembershipManager = await PMMembershipManager.deploy(membershipFeeManager.address);

        const PMTeamManager = await ethers.getContractFactory("PMTeamManager") as PMTeamManager__factory;
        pmTeamManager = await PMTeamManager.deploy(membershipFeeManager.address);

        const StakingPoolFactory = await ethers.getContractFactory("StakingPoolFactory") as StakingPoolFactory__factory;
        stakingPoolFactory = await StakingPoolFactory.deploy(campaignFeeManager.address, pmMembershipManager.address, pmTeamManager.address, creatorManager.address);

        const PMRewardDistributor = await ethers.getContractFactory("PMRewardDistributor") as PMRewardDistributor__factory;
        pmRewardDistributor = await PMRewardDistributor.deploy(rewardManger.address);


    })

    describe("Memberships Management", () => {

        describe("Membership Manager", () => {

            it("deploying alright", () => {
                expect(pmMembershipManager.address).is.properAddress
            })

            it("Name and Symbol are correct", async () => {
                expect(await pmMembershipManager.name()).is.equal("PlanetMoon Membership Manager");
                expect(await pmMembershipManager.symbol()).is.equal("PMM");
            })

            it("Only owner can assign giveaway memberships", async () => {

                await expect(pmMembershipManager.connect(user1).giveAwayMembership([user1.address, user2.address]))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await expect(() => pmMembershipManager.giveAwayMembership([user1.address, user2.address]))
                    .to.changeEtherBalances([deployer, membershipFeeManager], [0, 0]);

                expect(await pmMembershipManager.totalSupply()).to.equal(2);
                expect((await pmMembershipManager.getUserTokenData(user1.address)).isPremium).to.equal(true);
                expect((await pmMembershipManager.getUserTokenData(user2.address)).isPremium).to.equal(true);

            })

            it("Giveaway memberships works for already members as well", async () => {

                await expect(pmMembershipManager.connect(user1).giveAwayMembership([user1.address, user2.address]))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await expect(() => pmMembershipManager.giveAwayMembership([user1.address]))
                    .to.changeEtherBalances([deployer, membershipFeeManager], [0, 0]);
                await pmMembershipManager.giveAwayMembership([user1.address, user2.address]);
                await pmMembershipManager.giveAwayMembership([user2.address, user3.address]);

                expect(await pmMembershipManager.totalSupply()).to.equal(3);
                expect((await pmMembershipManager.getUserTokenData(user1.address)).isPremium).to.equal(true);
                expect((await pmMembershipManager.getUserTokenData(user2.address)).isPremium).to.equal(true);
                expect((await pmMembershipManager.getUserTokenData(user3.address)).isPremium).to.equal(true);

            })


            it("Token URIs works fine", async () => {

                const regularFee = await membershipFeeManager.getMembershipFee(MembershipCategory.REGULAR);
                const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);

                await pmMembershipManager.becomeMember(user1.address, { value: regularFee });
                await pmMembershipManager.becomePremiumMember(user2.address, { value: premiumFee });

                const regularURI = await pmMembershipManager.regularURI();
                const premiumURI = await pmMembershipManager.premiumURI();

                expect(await pmMembershipManager.tokenURI(1)).to.equal(regularURI);
                expect(await pmMembershipManager.tokenURI(2)).to.equal(premiumURI);

            })

            it("only owner can update MembershipFee Manager address", async () => {

                await expect(pmMembershipManager.connect(user1).updateMembershipFeeManager(DEAD_ADDRESS))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await pmMembershipManager.updateMembershipFeeManager(DEAD_ADDRESS);
                expect(await pmMembershipManager.membershipFeeManager()).to.be.equal(DEAD_ADDRESS);

            })

            it("only owner can change the pause status of membershipManager of the contract", async () => {

                await expect(pmMembershipManager.connect(user1).changePauseStatus(true))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await pmMembershipManager.changePauseStatus(true);

            })

        })

        describe("Team Manager", () => {

            it("deploying alright", () => {
                expect(pmTeamManager.address).is.properAddress
            })

            it("Name and Symbol are correct", async () => {
                expect(await pmTeamManager.name()).is.equal("PlanetMoon Team Manager");
                expect(await pmTeamManager.symbol()).is.equal("PTM");
            })

            it("only owner can update MembershipFee Manager address", async () => {

                await expect(pmTeamManager.connect(user1).updateMembershipFeeManager(DEAD_ADDRESS))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await pmTeamManager.updateMembershipFeeManager(DEAD_ADDRESS);
                expect(await pmTeamManager.membershipFeeManager()).to.be.equal(DEAD_ADDRESS);

            })

            it("Anyone can read Team Data by token id", async () => {

                const teamFee = await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM);

                await expect(pmTeamManager.connect(user1).createATeam(user1.address)).to.be.rejectedWith("INSUFFICIENT_FUNDS");

                await expect(() => pmTeamManager.connect(user1).createATeam(user1.address, { value: teamFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [teamFee.mul(-1), teamFee]);

                const teamData = await pmTeamManager.getTeamData("1");
                expect(teamData.teamId).to.be.equal("1");
                expect(teamData.members).to.be.contains(user1.address);
                expect(teamData.inceptionDate).to.be.greaterThan(0);

                expect(await pmTeamManager.totalSupply()).to.equal(1);
                await expect(pmTeamManager.getTeamData("2")).to.be.rejectedWith("TOKEN_DONT_EXIST");
                // expect((await pmTeamManager.getTeamData("1")).teamId).to.be.equal("1");
                // await expect(pmTeamManager.getTeamData("2")).to.be.rejectedWith("TOKEN_DONT_EXIST");
                // expect((await pmTeamManager.getTeamData("1")).teamId).to.be.equal("1");
                // await expect(pmTeamManager.getTeamData("2")).to.be.rejectedWith("TOKEN_DONT_EXIST");


            })

            it("Onwer team admin can update the team members with right token Id", async () => {

                const teamFee = await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM);
                await expect(() => pmTeamManager.connect(user1).createATeam(user1.address, { value: teamFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [teamFee.mul(-1), teamFee]);

                await expect(pmTeamManager.connect(user2).updateTeamMembers(1, [user1.address, user2.address, user3.address]))
                    .to.be.rejectedWith("NOT_OWNER_OF_TEAM");

                await expect(pmTeamManager.connect(user1).updateTeamMembers(2, [user1.address, user2.address, user3.address]))
                    .to.be.rejectedWith("ERC721: invalid token ID");

                await pmTeamManager.connect(user1).updateTeamMembers(1, [user1.address, user2.address, user3.address])

                const teamData = await pmTeamManager.getTeamData("1");
                expect(teamData.members).to.be.contains(user1.address);
                expect(teamData.members).to.be.contains(user2.address);
                expect(teamData.members).to.be.contains(user3.address);

            })

            it("Token URIs works fine", async () => {

                const teamFee = await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM);
                await expect(() => pmTeamManager.connect(user1).createATeam(user1.address, { value: teamFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [teamFee.mul(-1), teamFee]);

                const teamTokenURI = await pmTeamManager.teamTokenURI();
                expect(await pmTeamManager.tokenURI(1)).to.equal(teamTokenURI);

            })

            it("only owner can change the pause status of teamManager of the contract", async () => {

                await expect(pmTeamManager.connect(user1).changePauseStatus(true))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await pmTeamManager.changePauseStatus(true);

            })


        })

        describe("Membership Fee Manager", () => {

            it("Membership Fees fetching works fine in both USD and BNB formats", async () => {

                const allFeesUSD = await membershipFeeManager.getAllFees(FeesType.USD);
                expect(allFeesUSD.regular).to.equal("3");
                expect(allFeesUSD.upgrade).to.equal("2");
                expect(allFeesUSD.premium).to.equal("5");
                expect(allFeesUSD.team).to.equal("8");

                const allFeesBNB = await membershipFeeManager.getAllFees(FeesType.BNB);
                const latestPriceOfOneUSD = await membershipFeeManager.getLatestPriceOfOneUSD();
                expect(allFeesBNB.regular).to.equal(latestPriceOfOneUSD.mul(allFeesUSD.regular));
                expect(allFeesBNB.upgrade).to.equal(latestPriceOfOneUSD.mul(allFeesUSD.upgrade));
                expect(allFeesBNB.premium).to.equal(latestPriceOfOneUSD.mul(allFeesUSD.premium));
                expect(allFeesBNB.team).to.equal(latestPriceOfOneUSD.mul(allFeesUSD.team));


                expect(await membershipFeeManager.getMembershipFee(MembershipCategory.REGULAR))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.regular));
                expect(await membershipFeeManager.getMembershipFee(MembershipCategory.UPGRADE))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.upgrade));
                expect(await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.premium));
                expect(await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.team));

            })

            it("Only Owner can update the fees", async () => {

                await expect(membershipFeeManager.connect(user1).setMembershipFee("0", "0", "0", "0"))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await membershipFeeManager.setMembershipFee("0", "0", "0", "0");
                const allFeesUSD = await membershipFeeManager.getAllFees(FeesType.USD);
                expect(allFeesUSD.regular).to.equal("0");
                expect(allFeesUSD.upgrade).to.equal("0");
                expect(allFeesUSD.premium).to.equal("0");
                expect(allFeesUSD.team).to.equal("0");


                const allFeesBNB = await membershipFeeManager.getAllFees(FeesType.BNB);
                expect(allFeesBNB.regular).to.equal("0");
                expect(allFeesBNB.upgrade).to.equal("0");
                expect(allFeesBNB.premium).to.equal("0");
                expect(allFeesBNB.team).to.equal("0");


                expect(await membershipFeeManager.getMembershipFee(MembershipCategory.REGULAR)).to.equal("0");
                expect(await membershipFeeManager.getMembershipFee(MembershipCategory.UPGRADE)).to.equal("0");
                expect(await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM)).to.equal("0");
                expect(await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM)).to.equal("0");

            })

            it("Only Owner can update the distribution scheme and addresses", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await expect(membershipFeeManager.connect(user1).setDistributionScheme(20, 20, 60))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await expect(membershipFeeManager.connect(user1).setFeeDistributionWallets(
                    buyBackToken.address,
                    rewardPool.address,
                    corporate.address,
                    DEAD_ADDRESS
                )).to.be.rejectedWith("Ownable: caller is not the owner");

                await membershipFeeManager.setDistributionScheme(20, 20, 60);
                await membershipFeeManager.setFeeDistributionWallets(
                    buyBackToken.address,
                    rewardPool.address,
                    corporate.address,
                    DEAD_ADDRESS
                );

            })

            it("Anyone can read the distribution scheme and addresses", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await membershipFeeManager.setDistributionScheme(20, 20, 60);
                await membershipFeeManager.setFeeDistributionWallets(
                    buyBackToken.address,
                    rewardPool.address,
                    corporate.address,
                    DEAD_ADDRESS
                );

                const feeDistributionScheme = await membershipFeeManager.feeDistributionScheme();
                expect(feeDistributionScheme.buyBackAndburn).be.equal(20);
                expect(feeDistributionScheme.rewardPool).be.equal(20);
                expect(feeDistributionScheme.corporate).be.equal(60);

                const feeDistributionWallets = await membershipFeeManager.feeDistributionWallets();
                expect(feeDistributionWallets.buyBackAndburn).be.equal(buyBackToken.address);
                expect(feeDistributionWallets.rewardPool).be.equal(rewardPool.address);
                expect(feeDistributionWallets.corporate).be.equal(corporate.address);
                expect(feeDistributionWallets.buyBackReceiver).be.equal(DEAD_ADDRESS);

            })

            it("Only Owner can update the router address for buyingback", async () => {

                await expect(membershipFeeManager.connect(user1).setRouter(DEAD_ADDRESS))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await membershipFeeManager.setRouter(DEAD_ADDRESS);
                expect(await membershipFeeManager.uniswapV2Router()).to.be.equal(DEAD_ADDRESS);

            })

            it("Only owner can distribute the funds", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await user1.sendTransaction({
                    to: membershipFeeManager.address,
                    value: ethers.utils.parseEther("5")
                });

                await membershipFeeManager.setDistributionScheme(20, 20, 60);
                await membershipFeeManager.setFeeDistributionWallets(
                    buyBackToken.address,
                    rewardPool.address,
                    corporate.address,
                    DEAD_ADDRESS
                );

                await expect(membershipFeeManager.connect(user1).SplitFunds())
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await expect(() => membershipFeeManager.SplitFunds())
                    .to.changeEtherBalances(
                        [membershipFeeManager],
                        [ethers.utils.parseEther("5").mul(-1)]
                    );

            })

            it("Membership Fees are distributing as expectation", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await user1.sendTransaction({
                    to: membershipFeeManager.address,
                    value: ethers.utils.parseEther("5")
                });

                const balanceOfMembershipFeeManager = await ethers.provider.getBalance(membershipFeeManager.address);

                await membershipFeeManager.setDistributionScheme(20, 20, 60);
                await membershipFeeManager.setFeeDistributionWallets(
                    buyBackToken.address,
                    rewardPool.address,
                    corporate.address,
                    DEAD_ADDRESS
                );

                const rewardPoolShare = balanceOfMembershipFeeManager.mul(20).div(100);
                const corporateShare = balanceOfMembershipFeeManager.mul(60).div(100);
                // const burnShare = balanceOfCampaignFeeManager.mul(20).div(100);

                await expect(() => membershipFeeManager.SplitFunds())
                    .to.changeEtherBalances(
                        [
                            membershipFeeManager,
                            rewardPool,
                            corporate
                        ],
                        [
                            balanceOfMembershipFeeManager.mul(-1),
                            rewardPoolShare,
                            corporateShare
                        ]);

                expect((await buyBackToken.balanceOf(DEAD_ADDRESS)).toString()).not.be.equal(0);



            })

            it("Only owner can drain the contract in case of emergency", async () => {

                await user1.sendTransaction({
                    to: membershipFeeManager.address,
                    value: ethers.utils.parseEther("5")
                });

                await expect(membershipFeeManager.connect(user1).emergencyWithdraw())
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await expect(() => membershipFeeManager.emergencyWithdraw())
                    .to.changeEtherBalances(
                        [membershipFeeManager],
                        [ethers.utils.parseEther("5").mul(-1)]
                    );

                expect(await ethers.provider.getBalance(membershipFeeManager.address)).to.be.equal("0");

            })

        })

        describe("Memberships/Teams and Membership Fee Manager combined", () => {

            it("Anyone can become a regular member by paying fee", async () => {

                const regularFee = await membershipFeeManager.getMembershipFee(MembershipCategory.REGULAR);
                await expect(() => pmMembershipManager.connect(user1).becomeMember(user1.address, { value: regularFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [regularFee.mul(-1), regularFee]);

            })

            it("Can't transfer membership token because they are soulbound", async () => {

                const regularFee = await membershipFeeManager.getMembershipFee(MembershipCategory.REGULAR);
                const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);

                await expect(() => pmMembershipManager.connect(user1).becomeMember(user1.address, { value: regularFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [regularFee.mul(-1), regularFee]);

                await expect(() => pmMembershipManager.connect(user2).becomeMember(user2.address, { value: premiumFee }))
                    .to.changeEtherBalances([user2, membershipFeeManager], [premiumFee.mul(-1), premiumFee]);

                await expect(pmMembershipManager.connect(user1).transferFrom(user1.address, user3.address, 1)).to.be.rejectedWith("Err: token transfer is BLOCKED");
                await expect(pmMembershipManager.connect(user2).transferFrom(user2.address, user3.address, 2)).to.be.rejectedWith("Err: token transfer is BLOCKED");

            })

            it("Can't become a member without paying fee", async () => {

                const regularFee = await membershipFeeManager.getMembershipFee(MembershipCategory.REGULAR);
                const upgradeFee = await membershipFeeManager.getMembershipFee(MembershipCategory.UPGRADE);
                const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);

                await expect(pmMembershipManager.connect(user1).upgradeToPremium(user1.address)).to.be.rejectedWith("NOT_A_MEMBER");
                await expect(pmMembershipManager.connect(user1).becomeMember(user1.address)).to.be.rejectedWith("INSUFFICIENT_FUNDS");

                await expect(() => pmMembershipManager.connect(user1).becomeMember(user1.address, { value: regularFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [regularFee.mul(-1), regularFee]);

                await expect(() => pmMembershipManager.connect(user1).upgradeToPremium(user1.address, { value: upgradeFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [upgradeFee.mul(-1), upgradeFee]);

                await expect(pmMembershipManager.connect(user1).upgradeToPremium(user1.address)).to.be.rejectedWith("ALREADY_A_PREMIUM_MEMBER");
                await expect(pmMembershipManager.connect(user1).becomeMember(user1.address)).to.be.rejectedWith("ALREADY_A_MEMBER");

                await expect(() => pmMembershipManager.connect(user2).becomePremiumMember(user2.address, { value: premiumFee }))
                    .to.changeEtherBalances([user2, membershipFeeManager], [premiumFee.mul(-1), premiumFee]);


                // // Check if these tokens are soulbound
                await expect(pmMembershipManager.connect(user1).transferFrom(user1.address, user2.address, 1)).to.be.rejectedWith("Err: token transfer is BLOCKED");


            })

            it("Can only upgrade to premium from regular membership", async () => {

                const regularFee = await membershipFeeManager.getMembershipFee(MembershipCategory.REGULAR);
                const upgradeFee = await membershipFeeManager.getMembershipFee(MembershipCategory.UPGRADE);

                await expect(() => pmMembershipManager.connect(user1).becomeMember(user1.address, { value: regularFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [regularFee.mul(-1), regularFee]);

                await expect(pmMembershipManager.connect(user1).becomeMember(user1.address)).to.be.rejectedWith("ALREADY_A_MEMBER");
                await expect(pmMembershipManager.connect(user1).becomePremiumMember(user1.address)).to.be.rejectedWith("ALREADY_A_MEMBER");

                await expect(() => pmMembershipManager.connect(user1).upgradeToPremium(user1.address, { value: upgradeFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [upgradeFee.mul(-1), upgradeFee]);

            })

            it("Can't create a team without paying fee", async () => {

                const teamFee = await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM);

                await expect(pmTeamManager.connect(user1).createATeam(user1.address)).to.be.rejectedWith("INSUFFICIENT_FUNDS");

                await expect(() => pmTeamManager.connect(user1).createATeam(user1.address, { value: teamFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [teamFee.mul(-1), teamFee]);

            })

            it("No one can create a team if teamManager contract is paused", async () => {

                const teamFee = await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM);

                await pmTeamManager.changePauseStatus(true);

                await expect(pmTeamManager.connect(user1).createATeam(user1.address, { value: teamFee }))
                    .to.be.rejectedWith("CONTRACT_IS_PAUSED");

                await pmTeamManager.changePauseStatus(false);

                await expect(() => pmTeamManager.connect(user1).createATeam(user1.address, { value: teamFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [teamFee.mul(-1), teamFee]);


            })

            it("No one can become regular member if membershipManager contract is paused", async () => {

                const regularFee = await membershipFeeManager.getMembershipFee(MembershipCategory.REGULAR);

                await pmMembershipManager.changePauseStatus(true);

                await expect(pmMembershipManager.connect(user1).becomeMember(user1.address, { value: regularFee }))
                    .to.be.rejectedWith("CONTRACT_IS_PAUSED");

                await pmMembershipManager.changePauseStatus(false);

                await expect(() => pmMembershipManager.connect(user1).becomeMember(user1.address, { value: regularFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [regularFee.mul(-1), regularFee]);


            })

            it("No one can become premium member if membershipManager contract is paused", async () => {

                const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);

                await pmMembershipManager.changePauseStatus(true);

                await expect(pmMembershipManager.connect(user1).becomePremiumMember(user1.address, { value: premiumFee }))
                    .to.be.rejectedWith("CONTRACT_IS_PAUSED");

                await pmMembershipManager.changePauseStatus(false);

                await expect(() => pmMembershipManager.connect(user1).becomePremiumMember(user1.address, { value: premiumFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [premiumFee.mul(-1), premiumFee]);


            })

        })

    })

    describe("Campaigns Management", () => {

        describe("Staking pools Factory", () => {

            it("deploying alright", () => {
                expect(stakingPoolFactory.address).is.properAddress
            })

            it("only owner can change the pause status of pool factory contract", async () => {

                await expect(stakingPoolFactory.connect(user1).changePauseStatus(true))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await stakingPoolFactory.changePauseStatus(true);

            })

            it("No one can create the campaign if contract is paused", async () => {

                const regularFee = await membershipFeeManager.getMembershipFee(MembershipCategory.REGULAR);
                const upgradeFee = await membershipFeeManager.getMembershipFee(MembershipCategory.UPGRADE);

                // Create a campaign with a regular + upgraded member
                await expect(startAStakingPool(CampaignCategory.SILVER, user2)).to.be.rejectedWith("NOT_PREMIUM_OR_TEAM");

                await expect(() => pmMembershipManager.connect(user2).becomeMember(user2.address, { value: regularFee }))
                    .to.changeEtherBalances([user2, membershipFeeManager], [regularFee.mul(-1), regularFee]);

                await expect(startAStakingPool(CampaignCategory.SILVER, user2)).to.be.rejectedWith("NOT_PREMIUM_OR_TEAM");

                await expect(() => pmMembershipManager.connect(user2).upgradeToPremium(user2.address, { value: upgradeFee }))
                    .to.changeEtherBalances([user2, membershipFeeManager], [upgradeFee.mul(-1), upgradeFee]);

                const { poolId } = await startAStakingPool(CampaignCategory.SILVER, user2);
                expect(poolId).not.be.equal(0);



                await stakingPoolFactory.connect(deployer).changePauseStatus(true);
                await expect(startAStakingPool(CampaignCategory.SILVER, user2)).to.be.rejectedWith("CONTRACT_IS_PAUSED");
                await stakingPoolFactory.connect(deployer).changePauseStatus(false);

                const { poolId: poolId2 } = await startAStakingPool(CampaignCategory.SILVER, user2);
                expect(poolId2).not.be.equal(0);


            })

            it("Non-members and regular members can't create campaigns", async () => {

                const regularFee = await membershipFeeManager.getMembershipFee(MembershipCategory.REGULAR);
                const upgradeFee = await membershipFeeManager.getMembershipFee(MembershipCategory.UPGRADE);

                // Create a campaign with a regular + upgraded member
                await expect(startAStakingPool(CampaignCategory.SILVER, user2)).to.be.rejectedWith("NOT_PREMIUM_OR_TEAM");

                await expect(() => pmMembershipManager.connect(user2).becomeMember(user2.address, { value: regularFee }))
                    .to.changeEtherBalances([user2, membershipFeeManager], [regularFee.mul(-1), regularFee]);

                await expect(startAStakingPool(CampaignCategory.SILVER, user2)).to.be.rejectedWith("NOT_PREMIUM_OR_TEAM");

                await expect(() => pmMembershipManager.connect(user2).upgradeToPremium(user2.address, { value: upgradeFee }))
                    .to.changeEtherBalances([user2, membershipFeeManager], [upgradeFee.mul(-1), upgradeFee]);

                const { poolId: poolId2 } = await startAStakingPool(CampaignCategory.SILVER, user2);
                expect(poolId2).not.be.equal(0);

            })

            it("Premium members can create campaigns", async () => {

                const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);

                // Create a campaign with a premium member
                await expect(startAStakingPool(CampaignCategory.SILVER, user3)).to.be.rejectedWith("NOT_PREMIUM_OR_TEAM");

                await expect(() => pmMembershipManager.connect(user3).becomePremiumMember(user3.address, { value: premiumFee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [premiumFee.mul(-1), premiumFee]);

                const { poolId: poolId3 } = await startAStakingPool(CampaignCategory.SILVER, user3);
                expect(poolId3).not.be.equal(0);


            })

            it("Teams can create campaigns", async () => {

                const teamFee = await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM);

                // Create a campaign with a team
                await expect(startAStakingPool(CampaignCategory.SILVER)).to.be.rejectedWith("NOT_PREMIUM_OR_TEAM");

                await expect(() => pmTeamManager.connect(user1).createATeam(user1.address, { value: teamFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [teamFee.mul(-1), teamFee]);

                const { poolId } = await startAStakingPool(CampaignCategory.GOLD);
                expect(poolId).not.be.equal(0);

            })

            it("Can't create a campaign with a wrong team id", async () => {

                const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                const teamFee = await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM);

                await expect(() => pmTeamManager.connect(user2).createATeam(user2.address, { value: teamFee }))
                    .to.changeEtherBalances([user2, membershipFeeManager], [teamFee.mul(-1), teamFee]);

                await expect(() => pmMembershipManager.connect(user3).becomePremiumMember(user3.address, { value: premiumFee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [premiumFee.mul(-1), premiumFee]);

                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategory.SILVER);

                const tokens = "1000";
                const decimals = stakingToken.decimals();
                const symbol = stakingToken.symbol();
                await stakingToken.connect(user3).mint(ethers.utils.parseEther(tokens));
                await stakingToken.connect(user3).approve(stakingPoolFactory.address, ethers.utils.parseEther(tokens));

                let latestBlock = await ethers.provider.getBlock("latest");

                await expect(
                    stakingPoolFactory.connect(user3).createAStakingPool(
                        // projectInfo 
                        {
                            category: CampaignCategory.SILVER,
                            projectName: "Awesome Staking Pool",
                            projectSymbol: "ASP",
                            tokenAddress: stakingToken.address,
                            tokenDecimals: decimals,
                            tokenSymbol: symbol,
                            profileType: Association.TEAM,
                            profileId: 1
                        },
                        // rewardPoolInfo
                        {
                            startedAt: latestBlock.timestamp + 15 * 60 * 1000,
                            poolAmount: ethers.utils.parseEther(tokens)
                        },
                        // images
                        {
                            image_1_months: "image_1_months",
                            image_3_months: "image_3_months",
                            image_6_months: "image_6_months",
                            image_9_months: "image_9_months",
                            image_12_months: "image_12_months",
                            APY_1_months: 10,
                            APY_3_months: 30,
                            APY_6_months: 50,
                            APY_9_months: 60,
                            APY_12_months: 80,
                        },
                        {
                            value: campaignFee
                        }
                    )
                ).to.rejectedWith("NOT_OWNER_OF_TEAM");

            })

            it("Can't create a campaign without paying fee", async () => {

                const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);

                await expect(() => pmMembershipManager.connect(user3).becomePremiumMember(user3.address, { value: premiumFee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [premiumFee.mul(-1), premiumFee]);

                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategory.SILVER);

                const tokens = "1000";
                const decimals = stakingToken.decimals();
                const symbol = stakingToken.symbol();
                await stakingToken.connect(user3).mint(ethers.utils.parseEther(tokens));
                await stakingToken.connect(user3).approve(stakingPoolFactory.address, ethers.utils.parseEther(tokens));

                let latestBlock = await ethers.provider.getBlock("latest");

                await expect(
                    stakingPoolFactory.connect(user3).createAStakingPool(
                        // projectInfo 
                        {
                            category: CampaignCategory.SILVER,
                            projectName: "Awesome Staking Pool",
                            projectSymbol: "ASP",
                            tokenAddress: stakingToken.address,
                            tokenDecimals: decimals,
                            tokenSymbol: symbol,
                            profileType: Association.NONE,
                            profileId: 0
                        },
                        // rewardPoolInfo
                        {
                            startedAt: latestBlock.timestamp + 15 * 60 * 1000,
                            poolAmount: ethers.utils.parseEther(tokens)
                        },
                        // images
                        {
                            image_1_months: "image_1_months",
                            image_3_months: "image_3_months",
                            image_6_months: "image_6_months",
                            image_9_months: "image_9_months",
                            image_12_months: "image_12_months",
                            APY_1_months: 10,
                            APY_3_months: 30,
                            APY_6_months: 50,
                            APY_9_months: 60,
                            APY_12_months: 80,
                        },
                        {
                            value: campaignFee.sub(1)
                        }
                    )
                ).to.rejectedWith("INSUFFICIENT_FUNDS");

            })

            it("Can't create a campaign with past date", async () => {

                const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);

                await expect(() => pmMembershipManager.connect(user3).becomePremiumMember(user3.address, { value: premiumFee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [premiumFee.mul(-1), premiumFee]);

                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategory.SILVER);

                const tokens = "1000";
                const decimals = stakingToken.decimals();
                const symbol = stakingToken.symbol();
                await stakingToken.connect(user3).mint(ethers.utils.parseEther(tokens));
                await stakingToken.connect(user3).approve(stakingPoolFactory.address, ethers.utils.parseEther(tokens));

                let latestBlock = await ethers.provider.getBlock("latest");

                await expect(
                    stakingPoolFactory.connect(user3).createAStakingPool(
                        // projectInfo 
                        {
                            category: CampaignCategory.SILVER,
                            projectName: "Awesome Staking Pool",
                            projectSymbol: "ASP",
                            tokenAddress: stakingToken.address,
                            tokenDecimals: decimals,
                            tokenSymbol: symbol,
                            profileType: Association.NONE,
                            profileId: 0
                        },
                        // rewardPoolInfo
                        {
                            startedAt: latestBlock.timestamp - 1,
                            poolAmount: ethers.utils.parseEther(tokens)
                        },
                        // images
                        {
                            image_1_months: "image_1_months",
                            image_3_months: "image_3_months",
                            image_6_months: "image_6_months",
                            image_9_months: "image_9_months",
                            image_12_months: "image_12_months",
                            APY_1_months: 10,
                            APY_3_months: 30,
                            APY_6_months: 50,
                            APY_9_months: 60,
                            APY_12_months: 80,
                        },
                        {
                            value: campaignFee
                        }
                    )
                ).to.rejectedWith("START_TIME_SHOULD_BE_FUTURE");



            })

            it("Can't create a campaign with past date", async () => {

                const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);

                await expect(() => pmMembershipManager.connect(user3).becomePremiumMember(user3.address, { value: premiumFee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [premiumFee.mul(-1), premiumFee]);

                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategory.SILVER);

                const tokens = "1000";
                const decimals = stakingToken.decimals();
                const symbol = stakingToken.symbol();

                let latestBlock = await ethers.provider.getBlock("latest");

                await expect(
                    stakingPoolFactory.connect(user3).createAStakingPool(
                        // projectInfo 
                        {
                            category: CampaignCategory.SILVER,
                            projectName: "Awesome Staking Pool",
                            projectSymbol: "ASP",
                            tokenAddress: stakingToken.address,
                            tokenDecimals: decimals,
                            tokenSymbol: symbol,
                            profileType: Association.NONE,
                            profileId: 0
                        },
                        // rewardPoolInfo
                        {
                            startedAt: latestBlock.timestamp + 1,
                            poolAmount: ethers.utils.parseEther(tokens)
                        },
                        // images
                        {
                            image_1_months: "image_1_months",
                            image_3_months: "image_3_months",
                            image_6_months: "image_6_months",
                            image_9_months: "image_9_months",
                            image_12_months: "image_12_months",
                            APY_1_months: 10,
                            APY_3_months: 30,
                            APY_6_months: 50,
                            APY_9_months: 60,
                            APY_12_months: 80,
                        },
                        {
                            value: campaignFee
                        }
                    )
                ).to.rejectedWith("ERC20: insufficient allowance");

            })




        })

        describe("Staking pools", () => {

            describe("Token Staking", () => {

                it("No one can stake tokens if campaign is not started yet", async () => {

                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

                    const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);


                    const tokens = ethers.utils.parseEther("1000");
                    await stakingToken.connect(user2).mint(tokens);
                    await stakingToken.connect(user2).approve(stakingPoolFactory.address, tokens);

                    await expect(
                        poolContract.connect(user2).stakeTokens(user2.address, tokens, StakingType.THREE_MONTH)
                    ).to.rejectedWith("POOL_NOT_STARTED()")

                    await expect(
                        poolContract.connect(user3).stakeTokens(user3.address, tokens, StakingType.THREE_MONTH)
                    ).to.rejectedWith("POOL_NOT_STARTED()")




                })

                it("Anyone with tokens can stake their tokens", async () => {

                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

                    const { poolContract, poolId } = await startAStakingPool(CampaignCategory.DIAMOND, user1);

                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine");

                    const tokens = ethers.utils.parseEther("1000");
                    await stakingToken.connect(user2).mint(tokens);
                    await stakingToken.connect(user2).approve(poolContract.address, tokens);

                    await poolContract.connect(user2).stakeTokens(user2.address, tokens, StakingType.THREE_MONTH);

                    const tokenDataForUser2 = await poolContract.getTokenData("1");
                    expect(tokenDataForUser2.poolAddress).to.be.equal(poolContract.address);
                    expect(tokenDataForUser2.poolId).to.be.equal(poolId);
                    expect(tokenDataForUser2.tokenStaked).to.be.equal(tokens);
                    expect(tokenDataForUser2.tokenAddress).to.be.equal(stakingToken.address);
                    expect(tokenDataForUser2.owner).to.be.equal(user2.address);
                    expect(tokenDataForUser2.stakingType).to.be.equal(StakingType.THREE_MONTH);
                    expect(tokenDataForUser2.isUnskated).to.be.equal(false);

                    await stakingToken.connect(user3).mint(tokens);
                    await stakingToken.connect(user3).approve(poolContract.address, tokens);
                    await poolContract.connect(user3).stakeTokens(user3.address, tokens, StakingType.THREE_MONTH);
                    const tokenDataForUser3 = await poolContract.getTokenData("2");
                    expect(tokenDataForUser3.poolAddress).to.be.equal(poolContract.address);
                    expect(tokenDataForUser3.poolId).to.be.equal(poolId);
                    expect(tokenDataForUser3.tokenStaked).to.be.equal(tokens);
                    expect(tokenDataForUser3.tokenAddress).to.be.equal(stakingToken.address);
                    expect(tokenDataForUser3.owner).to.be.equal(user3.address);
                    expect(tokenDataForUser3.stakingType).to.be.equal(StakingType.THREE_MONTH);
                    expect(tokenDataForUser3.isUnskated).to.be.equal(false);

                })

                it("No one can stake tokens if pool is empty", async () => {

                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

                    const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);
                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine");

                    const tokens = ethers.utils.parseEther("1250");
                    await stakingToken.connect(user2).mint(tokens);
                    await stakingToken.connect(user2).approve(poolContract.address, tokens);

                    await poolContract.connect(user2).stakeTokens(user2.address, tokens, StakingType.TWELVE_MONTH);

                    // console.log("(await poolContract.getProjectInfo()).rewardPoolInfo.poolAmount: ", (await poolContract.getProjectInfo()).rewardPoolInfo.);
                    expect((await poolContract.getProjectInfo()).poolInfo.remainingPool).to.be.equal("0");

                    await stakingToken.connect(user2).mint(tokens);
                    await stakingToken.connect(user2).approve(poolContract.address, tokens);

                    await expect(
                        poolContract.connect(user2).stakeTokens(user2.address, tokens, StakingType.THREE_MONTH)
                    ).to.rejectedWith("NOT_ENOUGH_REWARD()");

                })

            })

            describe("Token Unstaking", () => {

                it("Only owner of the token can unstake his tokens + reward", async () => {

                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

                    const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);
                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp

                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await stakingToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));

                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("1000"), StakingType.THREE_MONTH);

                    await expect(poolContract.connect(user1).unstakeTokens(1, { value: "0" }))
                        .to.be.rejectedWith("NOT_AUTHERIZED");

                });

                it("Owner of the token can unstake his tokens only once", async () => {

                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

                    const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);
                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp

                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await stakingToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));

                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("1000"), StakingType.THREE_MONTH);

                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await stakingToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));
                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("1000"), StakingType.THREE_MONTH);

                    await network.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
                    await network.provider.send("evm_mine");

                    await poolContract.connect(user2).unstakeTokens(1);
                    await poolContract.connect(user2).unstakeTokens(2);

                    // await expect(poolContract.connect(user2).unstakeTokens(1))
                    //     .to.be.rejectedWith("ALREADY_UNSTAKED");

                });

                it("No one can unstake anything with wrong token id", async () => {

                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

                    const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);
                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp

                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await stakingToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));

                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("1000"), StakingType.THREE_MONTH);

                    await expect(poolContract.connect(user2).unstakeTokens(2))
                        .to.be.rejectedWith("NOT_AUTHERIZED");

                });

                it("Early withdrawls with less than 30% time", async () => {

                    // console.log("Unstaking Fees: ", await campaignFeeManager.getAllUnstakingFees(FeesType.BNB));
                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

                    const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);

                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp

                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await stakingToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));

                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("1000"), StakingType.THREE_MONTH);


                    const withdrawData = await poolContract.checkTokenReward(1)

                    await expect(poolContract.connect(user2).unstakeTokens(1, { value: "0" }))
                        .to.be.rejectedWith("INSUFFICIENT_FUNDS");

                    await expect(() => poolContract.connect(user2).unstakeTokens(1, { value: withdrawData.fee }))
                        .to.changeEtherBalances(
                            [
                                user2,
                                campaignFeeManager
                            ],
                            [
                                withdrawData.fee.mul(-1),
                                withdrawData.fee,
                            ]);

                    // const fee = await poolContract.checkTokenReward(1);
                    // console.log("token1_Reward Initially : ", await poolContract.checkTokenReward(1) + "\n");

                    // await network.provider.send("evm_increaseTime", [40]);
                    // await network.provider.send("evm_mine");

                    // console.log("token1_Reward: 40s: ", await poolContract.checkTokenReward(1) + "\n");

                    // await network.provider.send("evm_increaseTime", [20]);
                    // await network.provider.send("evm_mine")

                    // console.log("token1_Reward: 60s: ", await poolContract.checkTokenReward(1) + "\n");

                    // await network.provider.send("evm_increaseTime", [20]);
                    // await network.provider.send("evm_mine")

                    // console.log("token1_Reward: 80s: ", await poolContract.checkTokenReward(1) + "\n");

                    // await network.provider.send("evm_increaseTime", [20]);
                    // await network.provider.send("evm_mine")

                    // console.log("token1_Reward: 100s: ", await poolContract.checkTokenReward(1) + "\n");


                    // console.log("Balance of user1 before: ", (await stakingToken.balanceOf(user2.address)).toString() )
                    // const feeToUnstake = (await poolContract.checkTokenReward(1)).fee
                    // console.log("feeToUnstakeL ", feeToUnstake);
                    // console.log("Balance of user1 after: ", ethers.utils.formatEther(await stakingToken.balanceOf(user2.address)) )


                    // const cc1 = await creatorManager.getCreatorAddress(user1.address);
                    // const tokenData = await poolContract.getTokensData(cc1);
                    // console.log("tokenData: ", tokenData);


                });

                it("Early withdrawls with less than 100% time", async () => {

                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

                    const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);

                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp

                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await stakingToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));

                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("1000"), StakingType.THREE_MONTH);

                    await network.provider.send("evm_increaseTime", [80]);
                    await network.provider.send("evm_mine");

                    const withdrawlData = await poolContract.checkTokenReward(1);

                    await expect(poolContract.connect(user2).unstakeTokens(1, { value: "0" }))
                        .to.be.rejectedWith("INSUFFICIENT_FUNDS");

                    await expect(() => poolContract.connect(user2).unstakeTokens(1, { value: withdrawlData.fee }))
                        .to.changeEtherBalances(
                            [
                                user2,
                                campaignFeeManager
                            ],
                            [
                                withdrawlData.fee.mul(-1),
                                withdrawlData.fee,
                            ]);

                    // console.log("token1_Reward: 40s: ", await poolContract.checkTokenReward(1) + "\n");

                    // await network.provider.send("evm_increaseTime", [20]);
                    // await network.provider.send("evm_mine")

                    // console.log("token1_Reward: 60s: ", await poolContract.checkTokenReward(1) + "\n");

                    // await network.provider.send("evm_increaseTime", [20]);
                    // await network.provider.send("evm_mine")

                    // console.log("token1_Reward: 80s: ", await poolContract.checkTokenReward(1) + "\n");

                    // await network.provider.send("evm_increaseTime", [20]);
                    // await network.provider.send("evm_mine")

                    // console.log("token1_Reward: 100s: ", await poolContract.checkTokenReward(1) + "\n");



                    // console.log("Balance of user1 before: ", (await stakingToken.balanceOf(user2.address)).toString() )
                    // const feeToUnstake = (await poolContract.checkTokenReward(1)).fee
                    // console.log("feeToUnstakeL ", feeToUnstake);
                    // console.log("Balance of user1 after: ", ethers.utils.formatEther(await stakingToken.balanceOf(user2.address)) )


                    // const cc1 = await creatorManager.getCreatorAddress(user1.address);
                    // const tokenData = await poolContract.getTokensData(cc1);
                    // console.log("tokenData: ", tokenData);


                });

                it("No fee for completed time", async () => {

                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

                    const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);

                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp

                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await stakingToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));

                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("1000"), StakingType.THREE_MONTH);

                    await network.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
                    await network.provider.send("evm_mine");

                    await expect(() => poolContract.connect(user2).unstakeTokens(1, { value: "0" }))
                        .to.changeEtherBalances(
                            [user2, campaignFeeManager],
                            ["0", "0"]
                        );


                });

            })

            describe("Tokens information", () => {

                it("Anyone can read all tokens information of any user", async () => {

                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

                    const { poolContract, poolId } = await startAStakingPool(CampaignCategory.DIAMOND, user1);

                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine");

                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("300"));
                    await stakingToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("300"));

                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("100"), StakingType.THREE_MONTH);
                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("100"), StakingType.THREE_MONTH);
                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("100"), StakingType.THREE_MONTH);

                    const allTokens = await poolContract.getUserTokens(user2.address);
                    const [_projectInfo, _tokens] = allTokens;

                    // expect(_projectInfo.tokenAddress).to.be.equal(stakingToken.address);
                    expect(allTokens.length).to.be.equal(3);

                    // expect(tokenDataForUser2.poolAddress).to.be.equal(poolContract.address);
                    // expect(tokenDataForUser2.poolId).to.be.equal(poolId);
                    // expect(tokenDataForUser2.tokenStaked).to.be.equal(tokens);
                    // expect(tokenDataForUser2.tokenAddress).to.be.equal(stakingToken.address);
                    // expect(tokenDataForUser2.owner).to.be.equal(user2.address);
                    // expect(tokenDataForUser2.stakingType).to.be.equal(StakingType.THREE_MONTH);
                    // expect(tokenDataForUser2.isUnskated).to.be.equal(false);

                    // await stakingToken.connect(user3).mint(tokens);
                    // await stakingToken.connect(user3).approve(poolContract.address, tokens);
                    // await poolContract.connect(user3).stakeTokens(user3.address, tokens, StakingType.THREE_MONTH);

                    // const tokenDataForUser3 = await poolContract.getTokenData("2");
                    // expect(tokenDataForUser3.poolAddress).to.be.equal(poolContract.address);
                    // expect(tokenDataForUser3.poolId).to.be.equal(poolId);
                    // expect(tokenDataForUser3.tokenStaked).to.be.equal(tokens);
                    // expect(tokenDataForUser3.tokenAddress).to.be.equal(stakingToken.address);
                    // expect(tokenDataForUser3.owner).to.be.equal(user3.address);
                    // expect(tokenDataForUser3.stakingType).to.be.equal(StakingType.THREE_MONTH);
                    // expect(tokenDataForUser3.isUnskated).to.be.equal(false);

                })

            })
        })

        describe("Campaign Fee Manager", () => {

            it("Campaign Fees fetching works fine in both USD and BNB formats", async () => {

                const allFeesUSD = await campaignFeeManager.getAllCampaignFees(FeesType.USD);
                expect(allFeesUSD.silver).to.equal("100");
                expect(allFeesUSD.gold).to.equal("125");
                expect(allFeesUSD.diamond).to.equal("400");

                // "100", "125", "400", // silver, gold, diamond
                // "3", "2", "2", "0" // reward_0pc, reward_30pc, reward_50pc, reward_100pc   

                const allFeesBNB = await campaignFeeManager.getAllCampaignFees(FeesType.BNB);
                const latestPriceOfOneUSD = await campaignFeeManager.getLatestPriceOfOneUSD();
                expect(allFeesBNB.silver).to.equal(latestPriceOfOneUSD.mul(allFeesUSD.silver));
                expect(allFeesBNB.gold).to.equal(latestPriceOfOneUSD.mul(allFeesUSD.gold));
                expect(allFeesBNB.diamond).to.equal(latestPriceOfOneUSD.mul(allFeesUSD.diamond));

                expect(await campaignFeeManager.getCampaignFee(CampaignCategory.SILVER))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.silver));
                expect(await campaignFeeManager.getCampaignFee(CampaignCategory.GOLD))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.gold));
                expect(await campaignFeeManager.getCampaignFee(CampaignCategory.DIAMOND))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.diamond));

            })

            it("Unstaking Fees fetching works fine in both USD and BNB formats", async () => {

                const allFeesUSD = await campaignFeeManager.getAllUnstakingFees(FeesType.USD);
                expect(allFeesUSD.reward_0pc).to.equal("3");
                expect(allFeesUSD.reward_30pc).to.equal("2");
                expect(allFeesUSD.reward_50pc).to.equal("2");
                expect(allFeesUSD.reward_100pc).to.equal("0");

                const allFeesBNB = await campaignFeeManager.getAllUnstakingFees(FeesType.BNB);
                const latestPriceOfOneUSD = await campaignFeeManager.getLatestPriceOfOneUSD();
                expect(allFeesBNB.reward_0pc).to.equal(latestPriceOfOneUSD.mul("3"));
                expect(allFeesBNB.reward_30pc).to.equal(latestPriceOfOneUSD.mul("2"));
                expect(allFeesBNB.reward_50pc).to.equal(latestPriceOfOneUSD.mul("2"));
                expect(allFeesBNB.reward_100pc).to.equal(latestPriceOfOneUSD.mul("0"));

                expect(await campaignFeeManager.getUnstakingFee(UnstakingCategory.REWARD_0PC))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.reward_0pc));
                expect(await campaignFeeManager.getUnstakingFee(UnstakingCategory.REWARD_30PC))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.reward_30pc));
                expect(await campaignFeeManager.getUnstakingFee(UnstakingCategory.REWARD_50PC))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.reward_50pc));
                expect(await campaignFeeManager.getUnstakingFee(UnstakingCategory.REWARD_100PC))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.reward_100pc));


            })

            it("Only Owner can update campaign fees", async () => {

                await expect(campaignFeeManager.connect(user1).setCampaignFees("0", "0", "0"))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await campaignFeeManager.setCampaignFees("0", "0", "0");
                const allFeesUSD = await campaignFeeManager.getAllCampaignFees(FeesType.USD);
                expect(allFeesUSD.silver).to.equal("0");
                expect(allFeesUSD.gold).to.equal("0");
                expect(allFeesUSD.diamond).to.equal("0");


                const allFeesBNB = await campaignFeeManager.getAllCampaignFees(FeesType.BNB);
                expect(allFeesBNB.silver).to.equal("0");
                expect(allFeesBNB.gold).to.equal("0");
                expect(allFeesBNB.diamond).to.equal("0");


                expect(await campaignFeeManager.getCampaignFee(CampaignCategory.SILVER)).to.equal("0");
                expect(await campaignFeeManager.getCampaignFee(CampaignCategory.GOLD)).to.equal("0");
                expect(await campaignFeeManager.getCampaignFee(CampaignCategory.DIAMOND)).to.equal("0");

            })

            it("Only Owner can update unstaking fees", async () => {

                await expect(campaignFeeManager.connect(user1).setUnstakingFees("0", "0", "0", "0"))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await campaignFeeManager.setUnstakingFees("0", "0", "0", "0");
                const allFeesUSD = await campaignFeeManager.getAllUnstakingFees(FeesType.USD);
                expect(allFeesUSD.reward_0pc).to.equal("0");
                expect(allFeesUSD.reward_30pc).to.equal("0");
                expect(allFeesUSD.reward_50pc).to.equal("0");
                expect(allFeesUSD.reward_100pc).to.equal("0");

                const allFeesBNB = await campaignFeeManager.getAllUnstakingFees(FeesType.BNB);
                expect(allFeesBNB.reward_0pc).to.equal("0");
                expect(allFeesBNB.reward_30pc).to.equal("0");
                expect(allFeesBNB.reward_50pc).to.equal("0");
                expect(allFeesBNB.reward_100pc).to.equal("0");

                expect(await campaignFeeManager.getUnstakingFee(UnstakingCategory.REWARD_0PC)).to.equal("0");
                expect(await campaignFeeManager.getUnstakingFee(UnstakingCategory.REWARD_30PC)).to.equal("0");
                expect(await campaignFeeManager.getUnstakingFee(UnstakingCategory.REWARD_50PC)).to.equal("0");
                expect(await campaignFeeManager.getUnstakingFee(UnstakingCategory.REWARD_100PC)).to.equal("0");

            })

            it("Only Owner can update the distribution scheme and addresses", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await expect(campaignFeeManager.connect(user1).setDistributionScheme(20, 20, 60))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await expect(campaignFeeManager.connect(user1).setFeeDistributionWallets(
                    buyBackToken.address,
                    rewardPool.address,
                    corporate.address,
                    DEAD_ADDRESS
                )).to.be.rejectedWith("Ownable: caller is not the owner");

                await campaignFeeManager.setDistributionScheme(20, 20, 60);
                await campaignFeeManager.setFeeDistributionWallets(
                    buyBackToken.address,
                    rewardPool.address,
                    corporate.address,
                    DEAD_ADDRESS
                );

            })

            it("Anyone can read the distribution scheme and addresses", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await campaignFeeManager.setDistributionScheme(20, 20, 60);
                await campaignFeeManager.setFeeDistributionWallets(
                    buyBackToken.address,
                    rewardPool.address,
                    corporate.address,
                    DEAD_ADDRESS
                );

                const feeDistributionScheme = await campaignFeeManager.feeDistributionScheme();
                expect(feeDistributionScheme.buyBackAndburn).be.equal(20);
                expect(feeDistributionScheme.rewardPool).be.equal(20);
                expect(feeDistributionScheme.corporate).be.equal(60);

                const feeDistributionWallets = await campaignFeeManager.feeDistributionWallets();
                expect(feeDistributionWallets.buyBackAndburn).be.equal(buyBackToken.address);
                expect(feeDistributionWallets.rewardPool).be.equal(rewardPool.address);
                expect(feeDistributionWallets.corporate).be.equal(corporate.address);
                expect(feeDistributionWallets.buyBackReceiver).be.equal(DEAD_ADDRESS);

            })

            it("Only Owner can update the router address for buyingback", async () => {

                await expect(campaignFeeManager.connect(user1).setRouter(DEAD_ADDRESS))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await campaignFeeManager.setRouter(DEAD_ADDRESS);
                expect(await campaignFeeManager.uniswapV2Router()).to.be.equal(DEAD_ADDRESS);

            })

            it("Only owner can distribute the funds", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await user1.sendTransaction({
                    to: campaignFeeManager.address,
                    value: ethers.utils.parseEther("5")
                });

                await campaignFeeManager.setDistributionScheme(20, 20, 60);
                await campaignFeeManager.setFeeDistributionWallets(
                    buyBackToken.address,
                    rewardPool.address,
                    corporate.address,
                    DEAD_ADDRESS
                );

                await expect(campaignFeeManager.connect(user1).SplitFunds())
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await expect(() => campaignFeeManager.SplitFunds())
                    .to.changeEtherBalances(
                        [campaignFeeManager],
                        [ethers.utils.parseEther("5").mul(-1)]
                    );

            })

            it("Campaign Fees are distributing as expectation", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await user1.sendTransaction({
                    to: campaignFeeManager.address,
                    value: ethers.utils.parseEther("5")
                });


                const balanceOfCampaignFeeManager = await ethers.provider.getBalance(campaignFeeManager.address);

                await campaignFeeManager.setDistributionScheme(20, 20, 60);
                await campaignFeeManager.setFeeDistributionWallets(
                    buyBackToken.address,
                    rewardPool.address,
                    corporate.address,
                    DEAD_ADDRESS
                );

                const rewardPoolShare = balanceOfCampaignFeeManager.mul(20).div(100);
                const corporateShare = balanceOfCampaignFeeManager.mul(60).div(100);
                // const burnShare = balanceOfCampaignFeeManager.mul(20).div(100);

                await expect(() => campaignFeeManager.SplitFunds())
                    .to.changeEtherBalances(
                        [
                            campaignFeeManager,
                            rewardPool,
                            corporate
                        ],
                        [
                            balanceOfCampaignFeeManager.mul(-1),
                            rewardPoolShare,
                            corporateShare
                        ]);

                expect((await buyBackToken.balanceOf(DEAD_ADDRESS)).toString()).not.be.equal(0);

            })

            it("Only owner can drain the contract in case of emergency", async () => {

                await user1.sendTransaction({
                    to: campaignFeeManager.address,
                    value: ethers.utils.parseEther("5")
                });

                await expect(campaignFeeManager.connect(user1).emergencyWithdraw())
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await expect(() => campaignFeeManager.emergencyWithdraw())
                    .to.changeEtherBalances(
                        [campaignFeeManager],
                        [ethers.utils.parseEther("5").mul(-1)]
                    );

                expect(await ethers.provider.getBalance(campaignFeeManager.address)).to.be.equal("0");

            })

        })

        describe('Creator', () => {

            describe('Creator Manager', () => {

                it("deploying alright", () => {
                    expect(creatorManager.address).is.properAddress
                })

                it("Anyone can create a creator contract on anyone's behalf", async () => {
                    await creatorManager.createACreator(user1.address);
                    await creatorManager.createACreator(user2.address);
                    await creatorManager.createACreator(user3.address);
                })

                it("If someone's creator contract already exists, then no one can create again", async () => {
                    await creatorManager.createACreator(user1.address);
                    await expect(creatorManager.createACreator(user1.address)).to.rejectedWith("ALREADY_EXIST")
                })

                it("If someone's creator contract exists, then it can be queried", async () => {
                    await creatorManager.createACreator(user1.address);
                    const creatorContract = await creatorManager.getCreatorAddress(user1.address);
                    expect(creatorContract).is.properAddress
                })

                it("If someone's creator contract doesn't exists, then it can't be queried", async () => {

                    await expect(creatorManager.getCreatorAddress(user1.address)).to.rejectedWith("NOT_EXIST")
                    await expect(creatorManager.getCreatorAddress(user2.address)).to.rejectedWith("NOT_EXIST")
                    await expect(creatorManager.getCreatorAddress(user3.address)).to.rejectedWith("NOT_EXIST")

                    await creatorManager.createACreator(user1.address);
                    await creatorManager.createACreator(user2.address);
                    await creatorManager.createACreator(user3.address);

                    expect(await creatorManager.getCreatorAddress(user1.address)).is.properAddress
                    expect(await creatorManager.getCreatorAddress(user2.address)).is.properAddress
                    expect(await creatorManager.getCreatorAddress(user3.address)).is.properAddress

                    await expect(creatorManager.getCreatorAddress(user4.address)).to.rejectedWith("NOT_EXIST")
                    await expect(creatorManager.getCreatorAddress(user5.address)).to.rejectedWith("NOT_EXIST")
                    await expect(creatorManager.getCreatorAddress(user6.address)).to.rejectedWith("NOT_EXIST")

                })

            })

            describe('Staking tokens on Creator Contract', () => {

                it("Staking tokens will automatically deploy a creator contract on user's behalf", async () => {

                    await expect(creatorManager.getCreatorAddress(user1.address)).to.rejectedWith("NOT_EXIST")
                    await expect(creatorManager.getCreatorAddress(user2.address)).to.rejectedWith("NOT_EXIST")
                    await expect(creatorManager.getCreatorAddress(user3.address)).to.rejectedWith("NOT_EXIST")


                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

                    const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);

                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine");

                    const tokens = ethers.utils.parseEther("1000");
                    await stakingToken.connect(user2).mint(tokens);
                    await stakingToken.connect(user2).approve(poolContract.address, tokens);

                    await poolContract.connect(user2).stakeTokens(user2.address, tokens, StakingType.THREE_MONTH);

                    await expect(creatorManager.createACreator(user2.address)).to.rejectedWith("ALREADY_EXIST")

                    const tokenDataForUser = await poolContract.getTokenData("1");
                    expect(await creatorManager.getCreatorAddress(user2.address)).to.be.equal(tokenDataForUser.creator);

                    await expect(creatorManager.getCreatorAddress(user1.address)).to.rejectedWith("NOT_EXIST")
                    await expect(creatorManager.getCreatorAddress(user3.address)).to.rejectedWith("NOT_EXIST")

                })

                it("Staking tokens will automatically tranfer all tokens to creator contract", async () => {

                    await expect(creatorManager.getCreatorAddress(user2.address)).to.rejectedWith("NOT_EXIST")

                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });
                    const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);
                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine");


                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await stakingToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));

                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("1000"), StakingType.THREE_MONTH);

                    const creatorAddress = await creatorManager.getCreatorAddress(user2.address);

                    const tokenDataForUser = await poolContract.getTokenData("1");
                    expect(tokenDataForUser.tokenStaked).to.be.equal(ethers.utils.parseEther("1000"));
                    expect(await stakingToken.balanceOf(creatorAddress)).to.be.equal(ethers.utils.parseEther("1000"));

                })

                it("Staking tokens will automatically add the pool address in the creator contract", async () => {

                    await expect(creatorManager.getCreatorAddress(user2.address)).to.rejectedWith("NOT_EXIST")

                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });
                    const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);
                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine");


                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await stakingToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));
                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("1000"), StakingType.THREE_MONTH);

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(1);


                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await stakingToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));
                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("1000"), StakingType.THREE_MONTH);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(1);
                })

                it("Unstaking tokens will automatically remove the pool address in the creator contract", async () => {

                    await expect(creatorManager.getCreatorAddress(user2.address)).to.rejectedWith("NOT_EXIST")

                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });
                    const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);
                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine");

                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("2000"));
                    await stakingToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("2000"));
                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("1000"), StakingType.THREE_MONTH);
                    await poolContract.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("1000"), StakingType.THREE_MONTH);

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(1);


                    await network.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
                    await network.provider.send("evm_mine");

                    const creator = await creatorManager.getCreatorAddress(user2.address);
                    const CreatorContract = await ethers.getContractFactory("CreatorContract")
                    const creatorContract = CreatorContract.attach(creator);

                    expect(await stakingToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("0"));
                    expect(await stakingToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("2000"));
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.empty;

                    await expect(() => poolContract.connect(user2).unstakeTokens(1))
                        .changeTokenBalances(stakingToken,
                            [user2, poolContract, creatorContract],
                            [
                                ethers.utils.parseEther("1300"),
                                ethers.utils.parseEther("-300"),
                                ethers.utils.parseEther("-1000"),
                            ]
                        )

                    expect(await stakingToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("1300"));
                    expect(await stakingToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("1000"));
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.empty;

                    await expect(() => poolContract.connect(user2).unstakeTokens(2))
                        .changeTokenBalances(stakingToken,
                            [user2, poolContract, creatorContract],
                            [
                                ethers.utils.parseEther("1300"),
                                ethers.utils.parseEther("-300"),
                                ethers.utils.parseEther("-1000"),
                            ]
                        )

                    expect(await stakingToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("2600"));
                    expect(await stakingToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("0"));
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.empty;


                })

                it("Multiple token staking simulation", async () => {

                    await expect(creatorManager.getCreatorAddress(user2.address)).to.rejectedWith("NOT_EXIST");

                    const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                    await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });
                    const { poolContract: poolContract1 } = await startAStakingPool(CampaignCategory.DIAMOND, user1);
                    const { poolContract: poolContract2 } = await startAStakingPool(CampaignCategory.DIAMOND, user1);
                    const { poolContract: poolContract3 } = await startAStakingPool(CampaignCategory.DIAMOND, user1);
                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine");


                    await creatorManager.createACreator(user2.address);
                    const creator = await creatorManager.getCreatorAddress(user2.address);
                    const CreatorContract = await ethers.getContractFactory("CreatorContract")
                    const creatorContract = CreatorContract.attach(creator);

                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("200"));
                    await stakingToken.connect(user2).approve(poolContract1.address, ethers.utils.parseEther("200"));
                    await poolContract1.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("100"), StakingType.THREE_MONTH);
                    await poolContract1.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("100"), StakingType.THREE_MONTH);

                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("200"));
                    await stakingToken.connect(user2).approve(poolContract2.address, ethers.utils.parseEther("200"));
                    await poolContract2.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("100"), StakingType.THREE_MONTH);
                    await poolContract2.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("100"), StakingType.THREE_MONTH);

                    await stakingToken.connect(user2).mint(ethers.utils.parseEther("200"));
                    await stakingToken.connect(user2).approve(poolContract3.address, ethers.utils.parseEther("200"));
                    await poolContract3.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("100"), StakingType.THREE_MONTH);
                    await poolContract3.connect(user2).stakeTokens(user2.address, ethers.utils.parseEther("100"), StakingType.THREE_MONTH);


                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract1.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract2.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract3.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(3);


                    expect(await stakingToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("0"));
                    expect(await stakingToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("600"));

                    await network.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
                    await network.provider.send("evm_mine");

                    await expect(() => poolContract1.connect(user2).unstakeTokens(1))
                        .changeTokenBalances(stakingToken,
                            [user2, poolContract1, creatorContract],
                            [
                                ethers.utils.parseEther("130"),
                                ethers.utils.parseEther("-30"),
                                ethers.utils.parseEther("-100"),
                            ]
                        )

                    expect(await stakingToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("130"));
                    expect(await stakingToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("500"));

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract1.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract2.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract3.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(3);


                    await expect(() => poolContract1.connect(user2).unstakeTokens(2))
                        .changeTokenBalances(stakingToken,
                            [user2, poolContract1, creatorContract],
                            [
                                ethers.utils.parseEther("130"),
                                ethers.utils.parseEther("-30"),
                                ethers.utils.parseEther("-100"),
                            ]
                        )

                    expect(await stakingToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("260"));
                    expect(await stakingToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("400"));

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract1.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract2.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract3.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(2);



                    await expect(poolContract1.connect(user2).unstakeTokens(1)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract1.connect(user2).unstakeTokens(2)).to.rejectedWith("ALREADY_UNSTAKED")

                    await expect(() => poolContract2.connect(user2).unstakeTokens(1))
                        .changeTokenBalances(stakingToken,
                            [user2, poolContract2, creatorContract],
                            [
                                ethers.utils.parseEther("130"),
                                ethers.utils.parseEther("-30"),
                                ethers.utils.parseEther("-100"),
                            ]
                        )

                    expect(await stakingToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("390"));
                    expect(await stakingToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("300"));

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract1.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract2.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract3.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(2);



                    await expect(poolContract1.connect(user2).unstakeTokens(1)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract1.connect(user2).unstakeTokens(2)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract2.connect(user2).unstakeTokens(1)).to.rejectedWith("ALREADY_UNSTAKED")

                    await expect(() => poolContract2.connect(user2).unstakeTokens(2))
                        .changeTokenBalances(stakingToken,
                            [user2, poolContract2, creatorContract],
                            [
                                ethers.utils.parseEther("130"),
                                ethers.utils.parseEther("-30"),
                                ethers.utils.parseEther("-100"),
                            ]
                        )

                    expect(await stakingToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("520"));
                    expect(await stakingToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("200"));

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract1.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract2.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract3.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(1);



                    await expect(poolContract1.connect(user2).unstakeTokens(1)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract1.connect(user2).unstakeTokens(2)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract2.connect(user2).unstakeTokens(1)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract2.connect(user2).unstakeTokens(2)).to.rejectedWith("ALREADY_UNSTAKED")

                    await expect(() => poolContract3.connect(user2).unstakeTokens(1))
                        .changeTokenBalances(stakingToken,
                            [user2, poolContract3, creatorContract],
                            [
                                ethers.utils.parseEther("130"),
                                ethers.utils.parseEther("-30"),
                                ethers.utils.parseEther("-100"),
                            ]
                        )

                    expect(await stakingToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("650"));
                    expect(await stakingToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("100"));

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract1.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract2.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract3.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(1);


                    await expect(poolContract1.connect(user2).unstakeTokens(1)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract1.connect(user2).unstakeTokens(2)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract2.connect(user2).unstakeTokens(1)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract2.connect(user2).unstakeTokens(2)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract3.connect(user2).unstakeTokens(1)).to.rejectedWith("ALREADY_UNSTAKED")


                    await expect(() => poolContract3.connect(user2).unstakeTokens(2))
                        .changeTokenBalances(stakingToken,
                            [user2, poolContract3, creatorContract],
                            [
                                ethers.utils.parseEther("130"),
                                ethers.utils.parseEther("-30"),
                                ethers.utils.parseEther("-100"),
                            ]
                        )

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract1.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract2.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract3.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(0);

                    expect(await stakingToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("780"));
                    expect(await stakingToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("0"));

                    await expect(poolContract1.connect(user2).unstakeTokens(1)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract1.connect(user2).unstakeTokens(2)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract2.connect(user2).unstakeTokens(1)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract2.connect(user2).unstakeTokens(2)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract3.connect(user2).unstakeTokens(1)).to.rejectedWith("ALREADY_UNSTAKED")
                    await expect(poolContract3.connect(user2).unstakeTokens(2)).to.rejectedWith("ALREADY_UNSTAKED")

                })

            })

        })

        describe("Adjustable APY ", () => {

            it("Can create a campaing with only single staking scheme", async () => {

                const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategory.SILVER);

                await expect(() => pmMembershipManager.connect(user3).becomePremiumMember(user3.address, { value: premiumFee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [premiumFee.mul(-1), premiumFee]);

                const tokens = ethers.utils.parseEther("1000");
                const decimals = stakingToken.decimals();
                const symbol = stakingToken.symbol();

                await stakingToken.connect(user3).mint(tokens);
                await stakingToken.connect(user3).approve(stakingPoolFactory.address, tokens);

                let latestBlock = await ethers.provider.getBlock("latest");

                const tx = await stakingPoolFactory.connect(user3).createAStakingPool(
                    // projectInfo 
                    {
                        category: CampaignCategory.SILVER,
                        projectName: "Awesome Staking Pool",
                        projectSymbol: "ASP",
                        tokenAddress: stakingToken.address,
                        tokenDecimals: decimals,
                        tokenSymbol: symbol,
                        profileType: Association.NONE,
                        profileId: 0
                    },
                    // rewardPoolInfo
                    {
                        startedAt: latestBlock.timestamp + 1,
                        poolAmount: tokens
                    },
                    // images
                    {
                        image_1_months: "image_1_months",
                        image_3_months: "image_3_months",
                        image_6_months: "image_6_months",
                        image_9_months: "image_9_months",
                        image_12_months: "image_12_months",
                        APY_1_months: 10,
                        APY_3_months: 0,
                        APY_6_months: 0,
                        APY_9_months: 0,
                        APY_12_months: 0,
                    },
                    {
                        value: campaignFee
                    }
                );

                let receipt: ContractReceipt = await tx.wait();
                const xxxx: any = receipt.events?.filter((x) => { return x.event == "Poolcreated" })
                let stakingPoolAddress = xxxx[0].args.poolAddress;
                let poolId = xxxx[0].args.poolId;
                const StakingPool = await ethers.getContractFactory("StakingPool") as StakingPool__factory;
                const poolContract = StakingPool.attach(stakingPoolAddress);
                

                await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                await network.provider.send("evm_mine");

                const tokensToStake = ethers.utils.parseEther("10000");
                await stakingToken.connect(user2).mint(tokensToStake);
                await stakingToken.connect(user2).approve(poolContract.address, tokensToStake);

                await poolContract.connect(user2).stakeTokens(user2.address, tokensToStake, StakingType.ONE_MONTH);

                const tokenDataForUser2 = await poolContract.getTokenData("1");

                expect(tokenDataForUser2.stakingType).to.be.equal(StakingType.ONE_MONTH);
                expect(tokenDataForUser2.tokenStaked).to.be.equal(tokensToStake);
                expect(tokenDataForUser2.owner).to.be.equal(user2.address);
                expect(tokenDataForUser2.isUnskated).to.be.equal(false);
                

                await expect(
                    poolContract.connect(user2).stakeTokens(user2.address, tokens, StakingType.THREE_MONTH)
                ).to.rejectedWith("NOT_A_VALID_STAKING_TYPE")
                await expect(
                    poolContract.connect(user2).stakeTokens(user2.address, tokens, StakingType.SIX_MONTH)
                ).to.rejectedWith("NOT_A_VALID_STAKING_TYPE")
                await expect(
                    poolContract.connect(user2).stakeTokens(user2.address, tokens, StakingType.NINE_MONTH)
                ).to.rejectedWith("NOT_A_VALID_STAKING_TYPE")
                await expect(
                    poolContract.connect(user2).stakeTokens(user2.address, tokens, StakingType.TWELVE_MONTH)
                ).to.rejectedWith("NOT_A_VALID_STAKING_TYPE")

                await network.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
                await network.provider.send("evm_mine");

                expect(await stakingToken.balanceOf(poolContract.address)).to.be.equal(ethers.utils.parseEther("1000"))
                expect(await stakingToken.balanceOf(user2.address)).to.be.equal(ethers.utils.parseEther("0"))

                await poolContract.connect(user2).unstakeTokens(tokenDataForUser2.tokenId, { value: "0" });

                expect(await stakingToken.balanceOf(poolContract.address)).to.be.equal(ethers.utils.parseEther("0"))
                expect(await stakingToken.balanceOf(user2.address)).to.be.equal(ethers.utils.parseEther("11000"))


                await stakingToken.connect(user2).mint(tokensToStake);
                await stakingToken.connect(user2).approve(poolContract.address, tokensToStake);

                await expect(
                    poolContract.connect(user2).stakeTokens(user2.address, tokensToStake, StakingType.ONE_MONTH)
                ).to.rejectedWith("NOT_ENOUGH_REWARD()");


            })

            it("Can create a campaing with selected staking scheme", async () => {

                const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategory.SILVER);

                await expect(() => pmMembershipManager.connect(user3).becomePremiumMember(user3.address, { value: premiumFee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [premiumFee.mul(-1), premiumFee]);

                const tokens = ethers.utils.parseEther("1000");
                const decimals = stakingToken.decimals();
                const symbol = stakingToken.symbol();

                await stakingToken.connect(user3).mint(tokens);
                await stakingToken.connect(user3).approve(stakingPoolFactory.address, tokens);

                let latestBlock = await ethers.provider.getBlock("latest");

                const tx = await stakingPoolFactory.connect(user3).createAStakingPool(
                    // projectInfo 
                    {
                        category: CampaignCategory.SILVER,
                        projectName: "Awesome Staking Pool",
                        projectSymbol: "ASP",
                        tokenAddress: stakingToken.address,
                        tokenDecimals: decimals,
                        tokenSymbol: symbol,
                        profileType: Association.NONE,
                        profileId: 0
                    },
                    // rewardPoolInfo
                    {
                        startedAt: latestBlock.timestamp + 1,
                        poolAmount: tokens
                    },
                    // images
                    {
                        image_1_months: "image_1_months",
                        image_3_months: "image_3_months",
                        image_6_months: "image_6_months",
                        image_9_months: "image_9_months",
                        image_12_months: "image_12_months",
                        APY_1_months: 10,
                        APY_3_months: 0,
                        APY_6_months: 60,
                        APY_9_months: 0,
                        APY_12_months: 100,
                    },
                    {
                        value: campaignFee
                    }
                );

                let receipt: ContractReceipt = await tx.wait();
                const xxxx: any = receipt.events?.filter((x) => { return x.event == "Poolcreated" })
                let stakingPoolAddress = xxxx[0].args.poolAddress;
                let poolId = xxxx[0].args.poolId;
                const StakingPool = await ethers.getContractFactory("StakingPool") as StakingPool__factory;
                const poolContract = StakingPool.attach(stakingPoolAddress);


                await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                await network.provider.send("evm_mine");

                const tokensToStake = ethers.utils.parseEther("100");
                await stakingToken.connect(user2).mint(tokensToStake.mul("3"));
                await stakingToken.connect(user2).approve(poolContract.address, tokensToStake.mul("3"));

                await poolContract.connect(user2).stakeTokens(user2.address, tokensToStake, StakingType.ONE_MONTH);
                await poolContract.connect(user2).stakeTokens(user2.address, tokensToStake, StakingType.SIX_MONTH);
                await poolContract.connect(user2).stakeTokens(user2.address, tokensToStake, StakingType.TWELVE_MONTH);

                await expect(
                    poolContract.connect(user2).stakeTokens(user2.address, tokens, StakingType.THREE_MONTH)
                ).to.rejectedWith("NOT_A_VALID_STAKING_TYPE");

                await expect(
                    poolContract.connect(user2).stakeTokens(user2.address, tokens, StakingType.NINE_MONTH)
                ).to.rejectedWith("NOT_A_VALID_STAKING_TYPE");

            });

            it("Can create a campaing with all staking scheme", async () => {

                const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategory.SILVER);

                await expect(() => pmMembershipManager.connect(user3).becomePremiumMember(user3.address, { value: premiumFee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [premiumFee.mul(-1), premiumFee]);

                const tokens = ethers.utils.parseEther("1000");
                const decimals = stakingToken.decimals();
                const symbol = stakingToken.symbol();

                await stakingToken.connect(user3).mint(tokens);
                await stakingToken.connect(user3).approve(stakingPoolFactory.address, tokens);

                let latestBlock = await ethers.provider.getBlock("latest");

                const tx = await stakingPoolFactory.connect(user3).createAStakingPool(
                    // projectInfo 
                    {
                        category: CampaignCategory.SILVER,
                        projectName: "Awesome Staking Pool",
                        projectSymbol: "ASP",
                        tokenAddress: stakingToken.address,
                        tokenDecimals: decimals,
                        tokenSymbol: symbol,
                        profileType: Association.NONE,
                        profileId: 0
                    },
                    // rewardPoolInfo
                    {
                        startedAt: latestBlock.timestamp + 1,
                        poolAmount: tokens
                    },
                    // images
                    {
                        image_1_months: "image_1_months",
                        image_3_months: "image_3_months",
                        image_6_months: "image_6_months",
                        image_9_months: "image_9_months",
                        image_12_months: "image_12_months",
                        APY_1_months: 10,
                        APY_3_months: 30,
                        APY_6_months: 60,
                        APY_9_months: 90,
                        APY_12_months: 100,
                    },
                    {
                        value: campaignFee
                    }
                );

                let receipt: ContractReceipt = await tx.wait();
                const xxxx: any = receipt.events?.filter((x) => { return x.event == "Poolcreated" })
                let stakingPoolAddress = xxxx[0].args.poolAddress;
                let poolId = xxxx[0].args.poolId;
                const StakingPool = await ethers.getContractFactory("StakingPool") as StakingPool__factory;
                const poolContract = StakingPool.attach(stakingPoolAddress);


                await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                await network.provider.send("evm_mine");

                const tokensToStake = ethers.utils.parseEther("100");
                await stakingToken.connect(user2).mint(tokensToStake.mul("5"));
                await stakingToken.connect(user2).approve(poolContract.address, tokensToStake.mul("5"));

                await poolContract.connect(user2).stakeTokens(user2.address, tokensToStake, StakingType.ONE_MONTH);
                await poolContract.connect(user2).stakeTokens(user2.address, tokensToStake, StakingType.THREE_MONTH);
                await poolContract.connect(user2).stakeTokens(user2.address, tokensToStake, StakingType.SIX_MONTH);
                await poolContract.connect(user2).stakeTokens(user2.address, tokensToStake, StakingType.NINE_MONTH);
                await poolContract.connect(user2).stakeTokens(user2.address, tokensToStake, StakingType.TWELVE_MONTH);

            })


        })

    })

    describe('Reward Distributor', () => {

        it("deploying alright", () => {
            expect(pmRewardDistributor.address).is.properAddress;
        })

        it("Only Owner can update giveAway Manager address", async () => {
            expect(await pmRewardDistributor.giveAwayManager()).is.equal(rewardManger.address);
            await pmRewardDistributor.updateGiveAwayManager(user1.address);
            expect(await pmRewardDistributor.giveAwayManager()).is.equal(user1.address);
        })

        it("Only Owner can change the pause status of the contract", async () => {
            await expect(pmRewardDistributor.connect(user1).changePauseStatus(false))
                .to.be.rejectedWith("Ownable: caller is not the owner");
        })

        it("Only owner can drain the contract in case of emergency", async () => {

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });

            await expect(pmRewardDistributor.connect(user1).emergencyWithdraw())
                .to.be.rejectedWith("Ownable: caller is not the owner");

            await expect(() => pmRewardDistributor.emergencyWithdraw())
                .to.changeEtherBalances(
                    [pmRewardDistributor],
                    [ethers.utils.parseEther("5").mul(-1)]
                );

            expect(await ethers.provider.getBalance(pmRewardDistributor.address)).to.be.equal("0");

        })

        it("Giveaway manager cannot distributeReward reward if contract is paused", async () => {

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });

            await expect(pmRewardDistributor.connect(user1).distributeReward(user1.address, 1))
                .to.be.rejectedWith("No Authorized");
            await expect(pmRewardDistributor.connect(deployer).distributeReward(user1.address, 1))
                .to.be.rejectedWith("No Authorized");

            await pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 1);


            await pmRewardDistributor.connect(deployer).changePauseStatus(true);

            await expect(pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 1))
                .to.be.rejectedWith("CONTRACT_IS_PAUSED");

            await pmRewardDistributor.connect(deployer).changePauseStatus(false);
            await pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 1);

        })

        it("Only giveaway manager can distributeReward to giveaway winners", async () => {

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });

            await expect(pmRewardDistributor.connect(user1).distributeReward(user1.address, 1))
                .to.be.rejectedWith("No Authorized");
            await expect(pmRewardDistributor.connect(deployer).distributeReward(user1.address, 1))
                .to.be.rejectedWith("No Authorized");

            await pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 1);

            // await expect(() => pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 1))
            //     .to.changeEtherBalances(
            //         [pmRewardDistributor, user1],
            //         [PriceOfOneUSD.mul(-1), PriceOfOneUSD]
            //     );

        })

        it("if balance is not enought then should throw an error on distributeReward", async () => {
            await expect(pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 1))
                .to.be.rejectedWith("NOT_ENOUGH_BALANCE");
        })

        it("Giveaway winner will receive his reward as expected", async () => {

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });

            const PriceOfOneUSD = await pmRewardDistributor.getLatestPriceOfOneUSD();

            await expect(() => pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 1))
                .to.changeEtherBalances(
                    [pmRewardDistributor, user1],
                    [PriceOfOneUSD.mul(-1), PriceOfOneUSD]
                );

        })

        it("Only giveaway manager can apply reward to a campaign", async () => {

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });


            const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
            await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

            const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);

            await expect(pmRewardDistributor.connect(user1)
                .applyRewardToACampaing(poolContract.address, user1.address, 2, StakingType.THREE_MONTH))
                .to.be.rejectedWith("No Authorized");

        })

        it("if balance is not enought then should throw an error on applyRewardToACampaing", async () => {
            const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
            await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

            const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);

            await expect(pmRewardDistributor.connect(rewardManger)
                .applyRewardToACampaing(poolContract.address, user1.address, 2, StakingType.THREE_MONTH))
                .to.be.rejectedWith("NOT_ENOUGH_BALANCE");
        })

        it("if contract is paused then should throw an error on applyRewardToACampaing", async () => {

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });
            await provideLiquidity();

            const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
            await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });

            const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);
            await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
            await network.provider.send("evm_mine");

            const PriceOfOneUSD = await pmRewardDistributor.getLatestPriceOfOneUSD();

            await pmRewardDistributor.connect(deployer).changePauseStatus(true);

            await expect(pmRewardDistributor.connect(rewardManger)
                .applyRewardToACampaing(poolContract.address, user1.address, 2, StakingType.THREE_MONTH))
                .to.be.rejectedWith("CONTRACT_IS_PAUSED");

            await pmRewardDistributor.connect(deployer).changePauseStatus(false);

            await expect(() => pmRewardDistributor.connect(rewardManger).
                applyRewardToACampaing(poolContract.address, user1.address, 2, StakingType.THREE_MONTH))
                .to.changeEtherBalances(
                    [pmRewardDistributor],
                    [PriceOfOneUSD.mul(-2)]
                );

        })

        it("Users can apply Reward To A Campaing", async () => {

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });
            await provideLiquidity();

            const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
            await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });
            const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);
            await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
            await network.provider.send("evm_mine");

            const PriceOfOneUSD = await pmRewardDistributor.getLatestPriceOfOneUSD();

            await expect(() => pmRewardDistributor.connect(rewardManger).
                applyRewardToACampaing(poolContract.address, user1.address, 2, StakingType.THREE_MONTH))
                .to.changeEtherBalances(
                    [pmRewardDistributor],
                    [PriceOfOneUSD.mul(-2)]
                );


            // await pmRewardDistributor.connect(rewardManger).
            //     applyRewardToACampaing(poolContract.address, user1.address, 2, StakingType.THREE_MONTH);

        })

        it("total Reward Distributed is working fine", async () => {

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });
            await provideLiquidity();

            const premiumFee = await membershipFeeManager.getMembershipFee(MembershipCategory.PREMIUM);
            await pmMembershipManager.becomePremiumMember(user1.address, { value: premiumFee });
            const { poolContract } = await startAStakingPool(CampaignCategory.DIAMOND, user1);
            await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
            await network.provider.send("evm_mine");

            const PriceOfOneUSD = await pmRewardDistributor.getLatestPriceOfOneUSD();

            await expect(() => pmRewardDistributor.connect(rewardManger).
                applyRewardToACampaing(poolContract.address, user1.address, 5, StakingType.THREE_MONTH))
                .to.changeEtherBalances(
                    [pmRewardDistributor],
                    [PriceOfOneUSD.mul(-5)]
                );

            await expect(() => pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 5))
                .to.changeEtherBalances(
                    [pmRewardDistributor, user1],
                    [PriceOfOneUSD.mul(-5), PriceOfOneUSD.mul(5)]
                );


            expect(await pmRewardDistributor.totalRewardDistributed()).to.be.equal(PriceOfOneUSD.mul(BigNumber.from("10")));



        })


    })

})

