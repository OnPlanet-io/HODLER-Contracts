import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { network, ethers } from "hardhat";

import { BigNumber, ContractReceipt } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


import { UniswapV2Factory__factory, UniswapV2Pair__factory, UniswapV2Router02__factory, WETH9__factory } from "../typechain-types";
import { Token__factory,  } from "../typechain-types";

import { PMMembershipManager__factory, PMMembershipManager } from "../typechain-types";
import { RewardCampaign__factory, RewardCampaign } from "../typechain-types";
import { RewardCampaignFactory__factory, RewardCampaignFactory } from "../typechain-types";
import { PMTeamManager, PMTeamManager__factory } from "../typechain-types";
import { PMRewardDistributor, PMRewardDistributor__factory } from "../typechain-types";

import { CreatorManager__factory, CreatorManager } from "../typechain-types";
import { InvestmentToken, InvestmentToken__factory } from "../typechain-types";
import { CampaignFeeManager, CampaignFeeManager__factory } from "../typechain-types";
import { MembershipFeeManager, MembershipFeeManager__factory } from "../typechain-types";


let creatorManager: CreatorManager;
let investmentToken: InvestmentToken;
let rewardCampaign: RewardCampaign;
let rewardCampaignFactory: RewardCampaignFactory;
let pmMembershipManager: PMMembershipManager;
let pmTeamManager: PMTeamManager;
let campaignFeeManager: CampaignFeeManager;
let membershipFeeManager: MembershipFeeManager;
let pmRewardDistributor: PMRewardDistributor;

const ONE_MINUTE = time.duration.minutes(1);
const ONE_DAY = time.duration.days(1);

let deployer: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress, user3: SignerWithAddress, user4: SignerWithAddress, user5: SignerWithAddress, user6: SignerWithAddress;
let rewardPool: SignerWithAddress, corporate: SignerWithAddress, rewardManger: SignerWithAddress;

const enum CampaignCategories { SILVER, GOLD, DIAMOND };
const enum Association { NONE, TEAM, USER };
const enum MembershipCategory { MEMBER, TEAM };
const enum FeesType { USD, BNB }
const enum ClaimCategory { REWARD_0PC, REWARD_30PC, REWARD_50PC, REWARD_100PC };
const enum InvestmentType { ONE_MONTH, THREE_MONTH, SIX_MONTH, NINE_MONTH, TWELVE_MONTH };

const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD"
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000"

const MEMBERSHIP_URI = "https://bafkreic6jbedhzggcaowb6jj5zflhxz4bnuk7l3lhjqktclxii3pll3py4.ipfs.nftstorage.link/"

describe("Planet Moon Test Stack", function () {

    const startACampaign = async (type: CampaignCategories, user: SignerWithAddress = user1) => {

        const campaignFee = await campaignFeeManager.getCampaignFee(type);


        const tokens = "1000";
        const decimals = investmentToken.decimals();
        const symbol = investmentToken.symbol();

        await investmentToken.connect(user).mint(ethers.utils.parseEther(tokens));
        await investmentToken.connect(user).approve(rewardCampaignFactory.address, ethers.utils.parseEther(tokens));

        let latestBlock = await ethers.provider.getBlock("latest");

        const tx = await rewardCampaignFactory.connect(user).createARewardCampaign(
            // projectInfo 
            {
                category: type,
                projectName: "Awesome Investment Pool",
                projectSymbol: "ASP",
                tokenAddress: investmentToken.address,
                tokenDecimals: decimals,
                tokenSymbol: symbol,
                profileType: Association.NONE,
                profileId: 0
            },
            // rewardPoolInfo
            {
                startedAt: latestBlock.timestamp + 15 * ONE_MINUTE,
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
        let poolAddress = xxxx[0].args.poolAddress;
        let poolId = xxxx[0].args.poolId;

        const campaign = await ethers.getContractFactory("RewardCampaign") as RewardCampaign__factory;
        return {
            poolContract: campaign.attach(poolAddress),
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

        await campaignFeeManager.updateRouter(router.address);
        await membershipFeeManager.updateRouter(router.address);

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

        await pmRewardDistributor.updateRouter(router.address);

        await factory.createPair(myWETH.address, investmentToken.address);
        const uniswapV2PairAddress = await factory.getPair(myWETH.address, investmentToken.address);
        let uniswapV2Pair = UniswapV2Pair.attach(uniswapV2PairAddress);


        // Provide liquidity and start trading;
        let latestBlock = await ethers.provider.getBlock("latest");

        await investmentToken.mint(ethers.utils.parseEther("100"));
        await investmentToken.approve(router.address, ethers.utils.parseEther("100"))
        await router.addLiquidityETH(
            investmentToken.address,
            ethers.utils.parseEther("100"),
            0,
            0,
            deployer.address,
            latestBlock.timestamp + 60,
            { value: ethers.utils.parseEther("1") }
        )


        return { router, uniswapV2Pair, investmentToken }
    }

    const passTime = async (duration: number) => {
        await network.provider.send("evm_increaseTime", [duration]);
        await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp
    }

    beforeEach(async () => {

        [deployer, user1, user2, user3, user4, user5, user6, rewardPool, corporate, rewardManger] = await ethers.getSigners();

        const InvestmentToken = await ethers.getContractFactory("InvestmentToken") as InvestmentToken__factory;
        investmentToken = await InvestmentToken.deploy();

        const CreatorManager = await ethers.getContractFactory("CreatorManager") as CreatorManager__factory;
        creatorManager = await CreatorManager.deploy();

        const CampaignFeeManager = await ethers.getContractFactory("CampaignFeeManager") as CampaignFeeManager__factory;
        campaignFeeManager = await CampaignFeeManager.deploy(
            "100", "125", "400", // silver, gold, diamond
            "3", "2", "2", "0" // reward_0pc, reward_30pc, reward_50pc, reward_100pc   
        );

        const MembershipFeeManager = await ethers.getContractFactory("MembershipFeeManager") as MembershipFeeManager__factory;
        membershipFeeManager = await MembershipFeeManager.deploy("5", "8");

        const PMMembershipManager = await ethers.getContractFactory("PMMembershipManager") as PMMembershipManager__factory;
        pmMembershipManager = await PMMembershipManager.deploy(membershipFeeManager.address);

        const PMTeamManager = await ethers.getContractFactory("PMTeamManager") as PMTeamManager__factory;
        pmTeamManager = await PMTeamManager.deploy(membershipFeeManager.address);

        const RewardCampaignFactory = await ethers.getContractFactory("RewardCampaignFactory") as RewardCampaignFactory__factory;
        rewardCampaignFactory = await RewardCampaignFactory.deploy(campaignFeeManager.address, pmMembershipManager.address, pmTeamManager.address, creatorManager.address);

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
                expect(await pmMembershipManager.isMember(user1.address)).to.equal(true);
                expect(await pmMembershipManager.isMember(user2.address)).to.equal(true);

            })

            it("Giveaway memberships works for already members as well", async () => {

                await expect(pmMembershipManager.connect(user1).giveAwayMembership([user1.address, user2.address]))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await expect(() => pmMembershipManager.giveAwayMembership([user1.address]))
                    .to.changeEtherBalances([deployer, membershipFeeManager], [0, 0]);
                await pmMembershipManager.giveAwayMembership([user1.address, user2.address]);
                await pmMembershipManager.giveAwayMembership([user2.address, user3.address]);

                expect(await pmMembershipManager.totalSupply()).to.equal(3);
                expect(await pmMembershipManager.isMember(user1.address)).to.equal(true);
                expect(await pmMembershipManager.isMember(user2.address)).to.equal(true);
                expect(await pmMembershipManager.isMember(user3.address)).to.equal(true);

            })

            it("Token URIs works fine", async () => {

                await pmMembershipManager.changePauseStatus(false);

                const Fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);

                await pmMembershipManager.becomeMember(user1.address, { value: Fee });
                expect(await pmMembershipManager.tokenURI(1)).to.equal(MEMBERSHIP_URI);

                await expect(
                    pmMembershipManager.tokenURI(2)
                ).to.be.rejectedWith("PMMembershipManager__TOKEN_DONT_EXIST");

                await pmMembershipManager.becomeMember(user2.address, { value: Fee });
                expect(await pmMembershipManager.tokenURI(2)).to.equal(MEMBERSHIP_URI);

            })

            it("only owner can update MembershipFee Manager address", async () => {

                await expect(pmMembershipManager.connect(user1).updateMembershipFeeManager(DEAD_ADDRESS))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await pmMembershipManager.updateMembershipFeeManager(DEAD_ADDRESS);
                expect(await pmMembershipManager.getMemberShipFeeManager()).to.be.equal(DEAD_ADDRESS);

            })

            it("only owner can change the pause status of membershipManager of the contract", async () => {

                expect(await pmMembershipManager.isPaused()).to.be.equal(false);

                await expect(pmMembershipManager.connect(user1).changePauseStatus(true))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await pmMembershipManager.changePauseStatus(true);
                expect(await pmMembershipManager.isPaused()).to.be.equal(true);

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
                expect(await pmTeamManager.getMemberShipFeeManager()).to.be.equal(DEAD_ADDRESS);

            })

            it("Anyone can read Team Data by token id", async () => {

                await pmTeamManager.changePauseStatus(false);
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

                await pmTeamManager.changePauseStatus(false);

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

                await pmTeamManager.changePauseStatus(false);

                const teamFee = await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM);
                await expect(() => pmTeamManager.connect(user1).createATeam(user1.address, { value: teamFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [teamFee.mul(-1), teamFee]);

                const teamTokenURI = await pmTeamManager.tokenURI(1);
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
                expect(allFeesUSD.member).to.equal("5");
                expect(allFeesUSD.team).to.equal("8");

                const allFeesBNB = await membershipFeeManager.getAllFees(FeesType.BNB);
                const latestPriceOfOneUSD = await membershipFeeManager.getLatestPriceOfOneUSD();
                expect(allFeesBNB.member).to.equal(latestPriceOfOneUSD.mul(allFeesUSD.member));
                expect(allFeesBNB.team).to.equal(latestPriceOfOneUSD.mul(allFeesUSD.team));


                expect(await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.member));
                expect(await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.team));

            })

            it("Only Owner can update the fees", async () => {

                await expect(membershipFeeManager.connect(user1).setMembershipFee("0", "0"))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await membershipFeeManager.setMembershipFee("0", "0");
                const allFeesUSD = await membershipFeeManager.getAllFees(FeesType.USD);
                expect(allFeesUSD.member).to.equal("0");
                expect(allFeesUSD.team).to.equal("0");


                const allFeesBNB = await membershipFeeManager.getAllFees(FeesType.BNB);
                expect(allFeesBNB.member).to.equal("0");
                expect(allFeesBNB.team).to.equal("0");


                expect(await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER)).to.equal("0");
                expect(await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM)).to.equal("0");

            })

            it("Only Owner can update the distribution scheme and addresses", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await expect(membershipFeeManager.connect(user1).setFeeDistributionShares(20, 20, 60))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await expect(membershipFeeManager.connect(user1).setFeeDistributionWallets(
                    rewardPool.address,
                    corporate.address,
                    buyBackToken.address,
                    DEAD_ADDRESS
                )).to.be.rejectedWith("Ownable: caller is not the owner");

                await membershipFeeManager.setFeeDistributionShares(20, 20, 60);
                await membershipFeeManager.setFeeDistributionWallets(
                    rewardPool.address,
                    corporate.address,
                    buyBackToken.address,
                    DEAD_ADDRESS
                );

            })

            it("Anyone can read the distribution scheme and addresses", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await membershipFeeManager.setFeeDistributionShares(20, 20, 60);
                await membershipFeeManager.setFeeDistributionWallets(
                    rewardPool.address,
                    corporate.address,
                    buyBackToken.address,
                    DEAD_ADDRESS
                );

                const feeDistributionScheme = await membershipFeeManager.getDistributionShares();
                expect(feeDistributionScheme.buyBackAndburn).be.equal(20);
                expect(feeDistributionScheme.rewardPool).be.equal(20);
                expect(feeDistributionScheme.corporate).be.equal(60);

                const feeDistributionWallets = await membershipFeeManager.getDistributionWallets();
                expect(feeDistributionWallets.buyBackAndburnToken).be.equal(buyBackToken.address);
                expect(feeDistributionWallets.rewardPool).be.equal(rewardPool.address);
                expect(feeDistributionWallets.corporate).be.equal(corporate.address);
                expect(feeDistributionWallets.buyBackReceiver).be.equal(DEAD_ADDRESS);

            })

            it("Only Owner can update the router address for buyingback", async () => {

                await expect(membershipFeeManager.connect(user1).updateRouter(DEAD_ADDRESS))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await membershipFeeManager.updateRouter(DEAD_ADDRESS);
                expect(await membershipFeeManager.uniswapV2Router()).to.be.equal(DEAD_ADDRESS);

            })

            it("Only owner can distribute the funds", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await user1.sendTransaction({
                    to: membershipFeeManager.address,
                    value: ethers.utils.parseEther("5")
                });

                await membershipFeeManager.setFeeDistributionShares(20, 20, 60);
                await membershipFeeManager.setFeeDistributionWallets(
                    rewardPool.address,
                    corporate.address,
                    buyBackToken.address,
                    DEAD_ADDRESS
                );

                await expect(membershipFeeManager.connect(user1).splitFunds())
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await expect(() => membershipFeeManager.splitFunds())
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

                await membershipFeeManager.setFeeDistributionShares(20, 20, 60);
                await membershipFeeManager.setFeeDistributionWallets(
                    rewardPool.address,
                    corporate.address,
                    buyBackToken.address,
                    DEAD_ADDRESS
                );

                const rewardPoolShare = balanceOfMembershipFeeManager.mul(20).div(100);
                const corporateShare = balanceOfMembershipFeeManager.mul(60).div(100);
                // const burnShare = balanceOfCampaignFeeManager.mul(20).div(100);

                await expect(() => membershipFeeManager.splitFunds())
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
                await pmMembershipManager.changePauseStatus(false);
                const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                await expect(() => pmMembershipManager.connect(user1).becomeMember(user1.address, { value: fee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [fee.mul(-1), fee]);

            })

            it("Can't transfer membership token because they are soulbound", async () => {
                await pmMembershipManager.changePauseStatus(false);

                const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);

                await expect(() => pmMembershipManager.connect(user1).becomeMember(user1.address, { value: fee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [fee.mul(-1), fee]);

                await expect(() => pmMembershipManager.connect(user2).becomeMember(user2.address, { value: fee }))
                    .to.changeEtherBalances([user2, membershipFeeManager], [fee.mul(-1), fee]);

                await expect(pmMembershipManager.connect(user1).transferFrom(user1.address, user3.address, 1))
                    .to.be.rejectedWith("PMMembershipManager__TOKEN_TRANSFER_IS_BLOCKED");
                await expect(pmMembershipManager.connect(user2).transferFrom(user2.address, user3.address, 2))
                    .to.be.rejectedWith("PMMembershipManager__TOKEN_TRANSFER_IS_BLOCKED");

            })

            it("Can't become a member without paying fee", async () => {
                await pmMembershipManager.changePauseStatus(false);

                const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);

                await expect(pmMembershipManager.connect(user1).becomeMember(user1.address))
                    .to.be.rejectedWith("PMMembershipManager__INSUFFICIENT_FUNDS");

                await expect(
                    () => pmMembershipManager.connect(user1).becomeMember(user1.address, { value: fee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [fee.mul(-1), fee]);

                await expect(() => pmMembershipManager.connect(user2).becomeMember(user2.address, { value: fee }))
                    .to.changeEtherBalances([user2, membershipFeeManager], [fee.mul(-1), fee]);


                // // Check if these tokens are soulbound
                await expect(pmMembershipManager.connect(user1).transferFrom(user1.address, user2.address, 1))
                    .to.be.rejectedWith("PMMembershipManager__TOKEN_TRANSFER_IS_BLOCKED");


            })


            it("Can't create a team without paying fee", async () => {
                await pmTeamManager.changePauseStatus(false);

                const teamFee = await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM);

                await expect(pmTeamManager.connect(user1).createATeam(user1.address))
                    .to.be.rejectedWith("PMTeamManager__INSUFFICIENT_FUNDS");

                await expect(() => pmTeamManager.connect(user1).createATeam(user1.address, { value: teamFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [teamFee.mul(-1), teamFee]);

            })

            it("No one can create a team if teamManager contract is paused", async () => {

                const teamFee = await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM);

                await pmTeamManager.changePauseStatus(true);

                await expect(
                    pmTeamManager.connect(user1).createATeam(user1.address, { value: teamFee }))
                    .to.be.rejectedWith("PMTeamManager__CONTRACT_IS_PAUSED");

                await pmTeamManager.changePauseStatus(false);

                await expect(() => pmTeamManager.connect(user1).createATeam(user1.address, { value: teamFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [teamFee.mul(-1), teamFee]);


            })

            it("No one can become member if membershipManager contract is paused", async () => {

                const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);

                await pmMembershipManager.changePauseStatus(true);

                await expect(pmMembershipManager.connect(user1).becomeMember(user1.address, { value: fee }))
                    .to.be.rejectedWith("PMMembershipManager__CONTRACT_IS_PAUSED");

                await pmMembershipManager.changePauseStatus(false);

                await expect(() => pmMembershipManager.connect(user1).becomeMember(user1.address, { value: fee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [fee.mul(-1), fee]);


            })

        })

    })

    describe("Campaigns Management", () => {

        describe("Reward Campaign Factory", () => {

            it("deploying alright", () => {
                expect(rewardCampaignFactory.address).is.properAddress
            })

            it("only owner can change the pause status of pool factory contract", async () => {

                await expect(rewardCampaignFactory.connect(user1).changePauseStatus(true))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await rewardCampaignFactory.changePauseStatus(true);

            })

            it("No one can create the campaign if contract is paused", async () => {

                const membershipFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);

                await rewardCampaignFactory.changePauseStatus(false);
                await pmMembershipManager.changePauseStatus(false);

                await expect(startACampaign(CampaignCategories.SILVER, user2))
                    .to.be.rejectedWith("RewardCampaignFactory__NOT_MEMBER_OR_TEAM");

                await expect(() => pmMembershipManager.connect(user2).becomeMember(user2.address, { value: membershipFee }))
                    .to.changeEtherBalances([user2, membershipFeeManager], [membershipFee.mul(-1), membershipFee]);

                const { poolId } = await startACampaign(CampaignCategories.SILVER, user2);
                expect(poolId).not.be.equal(0);

                await rewardCampaignFactory.changePauseStatus(true);
                await expect(startACampaign(CampaignCategories.SILVER, user2))
                    .to.be.rejectedWith("RewardCampaignFactory__CONTRACT_IS_PAUSED");
                await rewardCampaignFactory.changePauseStatus(false);

                const { poolId: poolId2 } = await startACampaign(CampaignCategories.SILVER, user2);
                expect(poolId2).not.be.equal(0);


            })

            it("Non-members can't create campaigns", async () => {

                const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);

                // Create a campaign with a regular + upgraded member
                await expect(startACampaign(CampaignCategories.SILVER, user2))
                    .to.be.rejectedWith("RewardCampaignFactory__NOT_MEMBER_OR_TEAM");

                await expect(() => pmMembershipManager.connect(user2).becomeMember(user2.address, { value: memberFee }))
                    .to.changeEtherBalances([user2, membershipFeeManager], [memberFee.mul(-1), memberFee]);

                const { poolId } = await startACampaign(CampaignCategories.SILVER, user2);
                expect(poolId).not.be.equal(0);

            })

            it("Members can create campaigns", async () => {

                const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);

                // Create a campaign with a premium member
                await expect(startACampaign(CampaignCategories.SILVER, user3))
                    .to.be.rejectedWith("RewardCampaignFactory__NOT_MEMBER_OR_TEAM");

                await expect(() => pmMembershipManager.connect(user3).becomeMember(user3.address, { value: memberFee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [memberFee.mul(-1), memberFee]);

                const { poolId } = await startACampaign(CampaignCategories.SILVER, user3);
                expect(poolId).not.be.equal(0);

            })

            it("Teams can create campaigns", async () => {

                const teamFee = await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM);

                // Create a campaign with a team
                await expect(startACampaign(CampaignCategories.SILVER))
                    .to.be.rejectedWith("RewardCampaignFactory__NOT_MEMBER_OR_TEAM");

                await expect(() => pmTeamManager.connect(user1).createATeam(user1.address, { value: teamFee }))
                    .to.changeEtherBalances([user1, membershipFeeManager], [teamFee.mul(-1), teamFee]);

                const { poolId } = await startACampaign(CampaignCategories.GOLD);
                expect(poolId).not.be.equal(0);

            })

            it("Can't create a campaign with a wrong team id", async () => {

                const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                const teamFee = await membershipFeeManager.getMembershipFee(MembershipCategory.TEAM);

                await expect(() => pmTeamManager.connect(user2).createATeam(user2.address, { value: teamFee }))
                    .to.changeEtherBalances([user2, membershipFeeManager], [teamFee.mul(-1), teamFee]);

                await expect(() => pmMembershipManager.connect(user3).becomeMember(user3.address, { value: memberFee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [memberFee.mul(-1), memberFee]);

                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategories.SILVER);

                const tokens = "1000";
                const decimals = investmentToken.decimals();
                const symbol = investmentToken.symbol();
                await investmentToken.connect(user3).mint(ethers.utils.parseEther(tokens));
                await investmentToken.connect(user3).approve(rewardCampaignFactory.address, ethers.utils.parseEther(tokens));

                let latestBlock = await ethers.provider.getBlock("latest");

                await expect(
                    rewardCampaignFactory.connect(user3).createARewardCampaign(
                        // projectInfo 
                        {
                            category: CampaignCategories.SILVER,
                            projectName: "Awesome Investment Pool",
                            projectSymbol: "ASP",
                            tokenAddress: investmentToken.address,
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
                ).to.rejectedWith("RewardCampaignFactory__NOT_OWNER_OF_TEAM");

            })

            it("Can't create a campaign without paying fee", async () => {

                const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);

                await expect(() => pmMembershipManager.connect(user3).becomeMember(user3.address, { value: memberFee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [memberFee.mul(-1), memberFee]);

                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategories.SILVER);

                const tokens = "1000";
                const decimals = investmentToken.decimals();
                const symbol = investmentToken.symbol();
                await investmentToken.connect(user3).mint(ethers.utils.parseEther(tokens));
                await investmentToken.connect(user3).approve(rewardCampaignFactory.address, ethers.utils.parseEther(tokens));

                let latestBlock = await ethers.provider.getBlock("latest");

                await expect(
                    rewardCampaignFactory.connect(user3).createARewardCampaign(
                        // projectInfo 
                        {
                            category: CampaignCategories.SILVER,
                            projectName: "Awesome Investment Pool",
                            projectSymbol: "ASP",
                            tokenAddress: investmentToken.address,
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
                ).to.rejectedWith("RewardCampaignFactory__INSUFFICIENT_FUNDS");

            })

            it("Can't create a campaign with past date", async () => {

                const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);

                await expect(() => pmMembershipManager.connect(user3).becomeMember(user3.address, { value: memberFee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [memberFee.mul(-1), memberFee]);

                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategories.SILVER);

                const tokens = "1000";
                const decimals = investmentToken.decimals();
                const symbol = investmentToken.symbol();
                await investmentToken.connect(user3).mint(ethers.utils.parseEther(tokens));
                await investmentToken.connect(user3).approve(rewardCampaignFactory.address, ethers.utils.parseEther(tokens));

                let latestBlock = await ethers.provider.getBlock("latest");

                await expect(
                    rewardCampaignFactory.connect(user3).createARewardCampaign(
                        // projectInfo 
                        {
                            category: CampaignCategories.SILVER,
                            projectName: "Awesome Investment Pool",
                            projectSymbol: "ASP",
                            tokenAddress: investmentToken.address,
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
                ).to.rejectedWith("RewardCampaignFactory__START_TIME_SHOULD_BE_FUTURE");

            })

            it("Can't create a campaign with past date", async () => {

                const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);

                await expect(() => pmMembershipManager.connect(user3).becomeMember(user3.address, { value: memberFee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [memberFee.mul(-1), memberFee]);

                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategories.SILVER);

                const tokens = "1000";
                const decimals = investmentToken.decimals();
                const symbol = investmentToken.symbol();

                let latestBlock = await ethers.provider.getBlock("latest");

                await expect(
                    rewardCampaignFactory.connect(user3).createARewardCampaign(
                        // projectInfo 
                        {
                            category: CampaignCategories.SILVER,
                            projectName: "Awesome Investment Pool",
                            projectSymbol: "ASP",
                            tokenAddress: investmentToken.address,
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

        describe("Investment pools", () => {

            describe("Token Investment", () => {

                it("No one can invest tokens if campaign is not started yet", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });

                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);


                    const tokens = ethers.utils.parseEther("1000");
                    await investmentToken.connect(user2).mint(tokens);
                    await investmentToken.connect(user2).approve(rewardCampaignFactory.address, tokens);

                    await expect(
                        poolContract.connect(user2).investTokens(user2.address, tokens, InvestmentType.THREE_MONTH)
                    ).to.rejectedWith("RewardCampaign__POOL_NOT_STARTED")

                    await expect(
                        poolContract.connect(user3).investTokens(user3.address, tokens, InvestmentType.THREE_MONTH)
                    ).to.rejectedWith("RewardCampaign__POOL_NOT_STARTED()")




                })

                it("Anyone with tokens can invest their tokens", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });

                    const { poolContract, poolId } = await startACampaign(CampaignCategories.DIAMOND, user1);

                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine");

                    const tokens = ethers.utils.parseEther("1000");
                    await investmentToken.connect(user2).mint(tokens);
                    await investmentToken.connect(user2).approve(poolContract.address, tokens);

                    await poolContract.connect(user2)
                        .investTokens(user2.address, tokens, InvestmentType.THREE_MONTH);

                    const tokenDataForUser2 = await poolContract.getTokenData("1");
                    expect(tokenDataForUser2.poolAddress).to.be.equal(poolContract.address);
                    expect(tokenDataForUser2.poolId).to.be.equal(poolId);
                    expect(tokenDataForUser2.tokenInvested).to.be.equal(tokens);
                    expect(tokenDataForUser2.tokenAddress).to.be.equal(investmentToken.address);
                    expect(tokenDataForUser2.owner).to.be.equal(user2.address);
                    expect(tokenDataForUser2.investmentType).to.be.equal(InvestmentType.THREE_MONTH);
                    expect(tokenDataForUser2.isUnskated).to.be.equal(false);

                    await investmentToken.connect(user3).mint(tokens);
                    await investmentToken.connect(user3).approve(poolContract.address, tokens);
                    await poolContract.connect(user3)
                        .investTokens(user3.address, tokens, InvestmentType.THREE_MONTH);

                    const tokenDataForUser3 = await poolContract.getTokenData("2");
                    expect(tokenDataForUser3.poolAddress).to.be.equal(poolContract.address);
                    expect(tokenDataForUser3.poolId).to.be.equal(poolId);
                    expect(tokenDataForUser3.tokenInvested).to.be.equal(tokens);
                    expect(tokenDataForUser3.tokenAddress).to.be.equal(investmentToken.address);
                    expect(tokenDataForUser3.owner).to.be.equal(user3.address);
                    expect(tokenDataForUser3.investmentType).to.be.equal(InvestmentType.THREE_MONTH);
                    expect(tokenDataForUser3.isUnskated).to.be.equal(false);

                })

                it("No one can invest tokens if pool is empty", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });

                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);
                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine");

                    const tokens = ethers.utils.parseEther("1250");
                    await investmentToken.connect(user2).mint(tokens);
                    await investmentToken.connect(user2).approve(poolContract.address, tokens);

                    await poolContract.connect(user2).investTokens(user2.address, tokens, InvestmentType.TWELVE_MONTH);

                    expect((await poolContract.getProjectInfo()).poolInfo.remainingPool).to.be.equal("0");

                    await investmentToken.connect(user2).mint(tokens);
                    await investmentToken.connect(user2).approve(poolContract.address, tokens);

                    await expect(
                        poolContract.connect(user2).investTokens(user2.address, tokens, InvestmentType.THREE_MONTH)
                    ).to.rejectedWith("RewardCampaign__NOT_ENOUGH_REWARD_IN_POOL");

                })

            })

            describe("Token Claiming", () => {

                it("Only owner of the token can claim his tokens + reward", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });

                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);
                    await network.provider.send("evm_increaseTime", [15 * ONE_MINUTE]);
                    await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp

                    await investmentToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));

                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther("1000"), InvestmentType.THREE_MONTH);

                    const { fee } = await poolContract.checkTokenReward(`1`);
                    await expect(poolContract.connect(user1).claimTokensAndReward(1, { value: fee }))
                        .to.be.rejectedWith("RewardCampaign__NOT_AUTHERIZED");

                });

                it("Owner of the token can claim his tokens only once", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });

                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);
                    await passTime(15 * ONE_MINUTE);

                    await investmentToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));

                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther("1000"), InvestmentType.THREE_MONTH);

                    await investmentToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));
                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther("1000"), InvestmentType.THREE_MONTH);

                    await passTime(90 * ONE_DAY);

                    await poolContract.connect(user2).claimTokensAndReward(1);
                    await poolContract.connect(user2).claimTokensAndReward(2);

                    await expect(poolContract.connect(user2).claimTokensAndReward(1))
                        .to.be.rejectedWith("RewardCampaign__ALREADY_CLAIMED");

                });

                it("No one can claim anything with wrong token id", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });

                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);
                    await passTime(15 * ONE_MINUTE);

                    await investmentToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));

                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther("1000"), InvestmentType.THREE_MONTH);

                    await expect(poolContract.connect(user2).claimTokensAndReward(2))
                        .to.be.rejectedWith("RewardCampaign__NOT_AUTHERIZED");

                });

                it("Reading partial rewards and claiming fees are changing with time as expected", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });

                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);
                    await passTime(15 * ONE_MINUTE);

                    const tokensToInvest = "1000";
                    await investmentToken.connect(user2).mint(ethers.utils.parseEther(tokensToInvest));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther(tokensToInvest));

                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther(tokensToInvest), InvestmentType.THREE_MONTH);

                    const useToBNB = await membershipFeeManager.getLatestPriceOfOneUSD();

                    let rewardData = await poolContract.checkTokenReward(1)
                    expect(rewardData.fee).to.be.equal(useToBNB.mul("3"));
                    expect(ethers.utils.formatEther(rewardData.expectedReward.mul(BigNumber.from("0")).div("100")))
                        .to.be.equal(ethers.utils.formatEther(rewardData.redeemableReward));

                    // After passing 50% time
                    await passTime(90 * 0.5 * ONE_DAY);

                    rewardData = await poolContract.checkTokenReward(1)
                    expect(rewardData.fee).to.be.equal(useToBNB.mul("2"));
                    expect(ethers.utils.formatEther(rewardData.expectedReward.mul(BigNumber.from("30")).div("100")))
                        .to.be.equal(ethers.utils.formatEther(rewardData.redeemableReward));


                    // After passing 80% time (30% more)
                    await passTime(90 * 0.3 * ONE_DAY);

                    rewardData = await poolContract.checkTokenReward(1)
                    expect(rewardData.fee).to.be.equal(useToBNB.mul("2"));
                    expect(ethers.utils.formatEther(rewardData.expectedReward.mul(BigNumber.from("50")).div("100")))
                        .to.be.equal(ethers.utils.formatEther(rewardData.redeemableReward));


                    // After passing 100% time (20% more)
                    await passTime(90 * 0.2 * ONE_DAY);

                    rewardData = await poolContract.checkTokenReward(1)
                    expect(rewardData.fee).to.be.equal(useToBNB.mul("0"));
                    expect(ethers.utils.formatEther(rewardData.expectedReward.mul(BigNumber.from("100")).div("100")))
                        .to.be.equal(ethers.utils.formatEther(rewardData.redeemableReward));

                });

                it("Early withdrawls with less than 50% time, No reward and $3 fee", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });

                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);
                    await passTime(15 * ONE_MINUTE);

                    const tokensToInvest = "1000";
                    await investmentToken.connect(user2).mint(ethers.utils.parseEther(tokensToInvest));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther(tokensToInvest));

                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther(tokensToInvest), InvestmentType.THREE_MONTH);

                    const useToBNB = await membershipFeeManager.getLatestPriceOfOneUSD();
                    const { fee, expectedReward } = await poolContract.checkTokenReward(1)

                    expect(fee).to.be.equal(useToBNB.mul("3"));

                    await expect(poolContract.connect(user2).claimTokensAndReward(1, { value: "0" }))
                        .to.be.rejectedWith("RewardCampaign__INSUFFICIENT_FUNDS");

                    await expect(() => poolContract.connect(user2).claimTokensAndReward(1, { value: fee }))
                        .to.changeEtherBalances(
                            [
                                user2,
                                campaignFeeManager
                            ],
                            [
                                fee.mul(-1),
                                fee,
                            ]);


                    const reward = ethers.utils.formatEther(
                        expectedReward.mul(BigNumber.from("0")).div("100"));

                    expect(Number(tokensToInvest) + Number(reward))
                        .to.be.equal(Number(ethers.utils.formatEther(
                            await investmentToken.balanceOf(user2.address))));

                });

                it("Early withdrawls with 50-80% time, 30% reward and $2 fee", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });

                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);

                    await passTime(15 * ONE_MINUTE);

                    const tokensToInvest = "1000";
                    await investmentToken.connect(user2).mint(ethers.utils.parseEther(tokensToInvest));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther(tokensToInvest));

                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther(tokensToInvest), InvestmentType.THREE_MONTH);

                    await passTime(90 * .5 * ONE_DAY);

                    const useToBNB = await membershipFeeManager.getLatestPriceOfOneUSD();
                    const { fee, expectedReward } = await poolContract.checkTokenReward(1)

                    expect(fee).to.be.equal(useToBNB.mul("2"));

                    await expect(poolContract.connect(user2).claimTokensAndReward(1, { value: "0" }))
                        .to.be.rejectedWith("RewardCampaign__INSUFFICIENT_FUNDS");

                    await expect(() => poolContract.connect(user2).claimTokensAndReward(1, { value: fee }))
                        .to.changeEtherBalances(
                            [
                                user2,
                                campaignFeeManager
                            ],
                            [
                                fee.mul(-1),
                                fee,
                            ]);


                    const reward = ethers.utils.formatEther(
                        expectedReward.mul(BigNumber.from("30")).div("100"));

                    expect(Number(tokensToInvest) + Number(reward))
                        .to.be.equal(Number(ethers.utils.formatEther(
                            await investmentToken.balanceOf(user2.address))));

                });

                it("Early withdrawls with 80-100% time, 50% reward and $2 fee", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });

                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);

                    await passTime(15 * ONE_MINUTE);

                    const tokensToInvest = "1000";
                    await investmentToken.connect(user2).mint(ethers.utils.parseEther(tokensToInvest));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther(tokensToInvest));

                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther(tokensToInvest), InvestmentType.THREE_MONTH);

                    await passTime(90 * .8 * ONE_DAY);

                    const useToBNB = await membershipFeeManager.getLatestPriceOfOneUSD();
                    const { fee, expectedReward } = await poolContract.checkTokenReward(1)

                    expect(fee).to.be.equal(useToBNB.mul("2"));

                    await expect(poolContract.connect(user2).claimTokensAndReward(1, { value: "0" }))
                        .to.be.rejectedWith("RewardCampaign__INSUFFICIENT_FUNDS");

                    await expect(() => poolContract.connect(user2).claimTokensAndReward(1, { value: fee }))
                        .to.changeEtherBalances(
                            [
                                user2,
                                campaignFeeManager
                            ],
                            [
                                fee.mul(-1),
                                fee,
                            ]);


                    const reward = ethers.utils.formatEther(
                        expectedReward.mul(BigNumber.from("50")).div("100"));

                    expect(Number(tokensToInvest) + Number(reward))
                        .to.be.equal(Number(ethers.utils.formatEther(
                            await investmentToken.balanceOf(user2.address))));

                });

                it("No fee for completed time", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });

                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);

                    await passTime(15 * ONE_MINUTE);

                    const tokensToInvest = "1000";
                    await investmentToken.connect(user2).mint(ethers.utils.parseEther(tokensToInvest));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther(tokensToInvest));

                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther(tokensToInvest), InvestmentType.THREE_MONTH);
                    await passTime(90 * ONE_DAY);

                    const useToBNB = await membershipFeeManager.getLatestPriceOfOneUSD();
                    const { fee, expectedReward } = await poolContract.checkTokenReward(1)

                    expect(fee).to.be.equal(useToBNB.mul("0"));


                    await expect(() => poolContract.connect(user2).claimTokensAndReward(1, { value: 0 }))
                        .to.changeEtherBalances(
                            [
                                user2,
                                campaignFeeManager
                            ],
                            [
                                fee.mul(-1),
                                fee,
                            ]);


                    const reward = ethers.utils.formatEther(
                        expectedReward.mul(BigNumber.from("100")).div("100"));

                    expect(Number(tokensToInvest) + Number(reward))
                        .to.be.equal(Number(ethers.utils.formatEther(
                            await investmentToken.balanceOf(user2.address))));

                });

            })

            describe("Tokens information", () => {

                it("Anyone can read all tokens information of any user", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });

                    const { poolContract, poolId } = await startACampaign(CampaignCategories.DIAMOND, user1);

                    await passTime(15 * ONE_MINUTE);

                    await investmentToken.connect(user2).mint(ethers.utils.parseEther("300"));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("300"));

                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther("100"), InvestmentType.THREE_MONTH);
                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther("100"), InvestmentType.SIX_MONTH);
                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther("100"), InvestmentType.TWELVE_MONTH);

                    const allTokens = await poolContract.getUserTokens(user2.address);
                    expect(allTokens.length).to.be.equal(3);

                    expect(allTokens[0].tokenId).to.be.equal(1);
                    expect(allTokens[0].tokenInvested).to.be.equal(ethers.utils.parseEther("100"));
                    expect(allTokens[0].investmentType).to.be.equal(InvestmentType.THREE_MONTH);
                    expect(allTokens[1].tokenId).to.be.equal(2);
                    expect(allTokens[1].tokenInvested).to.be.equal(ethers.utils.parseEther("100"));
                    expect(allTokens[1].investmentType).to.be.equal(InvestmentType.SIX_MONTH);
                    expect(allTokens[2].tokenId).to.be.equal(3);
                    expect(allTokens[2].tokenInvested).to.be.equal(ethers.utils.parseEther("100"));
                    expect(allTokens[2].investmentType).to.be.equal(InvestmentType.TWELVE_MONTH);

                    await investmentToken.connect(user3).mint(ethers.utils.parseEther("100"));
                    await investmentToken.connect(user3).approve(poolContract.address, ethers.utils.parseEther("100"));
                    await poolContract.connect(user3).investTokens(user3.address, ethers.utils.parseEther("100"), InvestmentType.THREE_MONTH);

                    const tokenDataForUser3 = await poolContract.getTokenData("4");
                    expect(tokenDataForUser3.poolAddress).to.be.equal(poolContract.address);
                    expect(tokenDataForUser3.poolId).to.be.equal(poolId);
                    expect(tokenDataForUser3.tokenAddress).to.be.equal(investmentToken.address);
                    expect(tokenDataForUser3.owner).to.be.equal(user3.address);
                    expect(tokenDataForUser3.investmentType).to.be.equal(InvestmentType.THREE_MONTH);
                    expect(tokenDataForUser3.isUnskated).to.be.equal(false);

                })

            })

        })

        describe("Campaign Fee Manager", () => {

            it("Campaign Fees fetching works fine in both USD and BNB formats", async () => {

                // "100", "125", "400", // silver, gold, diamond
                // "3", "2", "2", "0" // reward_0pc, reward_30pc, reward_50pc, reward_100pc   

                const allFeesUSD = await campaignFeeManager.getAllCampaignFees(FeesType.USD);
                expect(allFeesUSD.silver).to.equal("100");
                expect(allFeesUSD.gold).to.equal("125");
                expect(allFeesUSD.diamond).to.equal("400");

                const allFeesBNB = await campaignFeeManager.getAllCampaignFees(FeesType.BNB);
                const latestPriceOfOneUSD = await campaignFeeManager.getLatestPriceOfOneUSD();
                expect(allFeesBNB.silver).to.equal(latestPriceOfOneUSD.mul(allFeesUSD.silver));
                expect(allFeesBNB.gold).to.equal(latestPriceOfOneUSD.mul(allFeesUSD.gold));
                expect(allFeesBNB.diamond).to.equal(latestPriceOfOneUSD.mul(allFeesUSD.diamond));

                expect(await campaignFeeManager.getCampaignFee(CampaignCategories.SILVER))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.silver));
                expect(await campaignFeeManager.getCampaignFee(CampaignCategories.GOLD))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.gold));
                expect(await campaignFeeManager.getCampaignFee(CampaignCategories.DIAMOND))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.diamond));

            })

            it("Claiming Fees fetching works fine in both USD and BNB formats", async () => {

                const allFeesUSD = await campaignFeeManager.getAllClaimFees(FeesType.USD);
                expect(allFeesUSD.reward_0pc).to.equal("3");
                expect(allFeesUSD.reward_30pc).to.equal("2");
                expect(allFeesUSD.reward_50pc).to.equal("2");
                expect(allFeesUSD.reward_100pc).to.equal("0");

                const allFeesBNB = await campaignFeeManager.getAllClaimFees(FeesType.BNB);
                const latestPriceOfOneUSD = await campaignFeeManager.getLatestPriceOfOneUSD();
                expect(allFeesBNB.reward_0pc).to.equal(latestPriceOfOneUSD.mul("3"));
                expect(allFeesBNB.reward_30pc).to.equal(latestPriceOfOneUSD.mul("2"));
                expect(allFeesBNB.reward_50pc).to.equal(latestPriceOfOneUSD.mul("2"));
                expect(allFeesBNB.reward_100pc).to.equal(latestPriceOfOneUSD.mul("0"));

                expect(await campaignFeeManager.getClaimFee(ClaimCategory.REWARD_0PC))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.reward_0pc));
                expect(await campaignFeeManager.getClaimFee(ClaimCategory.REWARD_30PC))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.reward_30pc));
                expect(await campaignFeeManager.getClaimFee(ClaimCategory.REWARD_50PC))
                    .to.equal(latestPriceOfOneUSD.mul(allFeesUSD.reward_50pc));
                expect(await campaignFeeManager.getClaimFee(ClaimCategory.REWARD_100PC))
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


                expect(await campaignFeeManager.getCampaignFee(CampaignCategories.SILVER)).to.equal("0");
                expect(await campaignFeeManager.getCampaignFee(CampaignCategories.GOLD)).to.equal("0");
                expect(await campaignFeeManager.getCampaignFee(CampaignCategories.DIAMOND)).to.equal("0");

            })

            it("Only Owner can update claiming fees", async () => {

                await expect(campaignFeeManager.connect(user1).setClaimFees("0", "0", "0", "0"))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await campaignFeeManager.setClaimFees("0", "0", "0", "0");
                const allFeesUSD = await campaignFeeManager.getAllClaimFees(FeesType.USD);
                expect(allFeesUSD.reward_0pc).to.equal("0");
                expect(allFeesUSD.reward_30pc).to.equal("0");
                expect(allFeesUSD.reward_50pc).to.equal("0");
                expect(allFeesUSD.reward_100pc).to.equal("0");

                const allFeesBNB = await campaignFeeManager.getAllClaimFees(FeesType.BNB);
                expect(allFeesBNB.reward_0pc).to.equal("0");
                expect(allFeesBNB.reward_30pc).to.equal("0");
                expect(allFeesBNB.reward_50pc).to.equal("0");
                expect(allFeesBNB.reward_100pc).to.equal("0");

                expect(await campaignFeeManager.getClaimFee(ClaimCategory.REWARD_0PC)).to.equal("0");
                expect(await campaignFeeManager.getClaimFee(ClaimCategory.REWARD_30PC)).to.equal("0");
                expect(await campaignFeeManager.getClaimFee(ClaimCategory.REWARD_50PC)).to.equal("0");
                expect(await campaignFeeManager.getClaimFee(ClaimCategory.REWARD_100PC)).to.equal("0");

            })

            it("Only Owner can update the distribution scheme and addresses", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await expect(campaignFeeManager.connect(user1).setFeeDistributionShares(20, 20, 60))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await expect(campaignFeeManager.connect(user1).setFeeDistributionWallets(
                    rewardPool.address,
                    corporate.address,
                    buyBackToken.address,
                    DEAD_ADDRESS
                )).to.be.rejectedWith("Ownable: caller is not the owner");

                await campaignFeeManager.setFeeDistributionShares(20, 20, 60);
                await campaignFeeManager.setFeeDistributionWallets(
                    rewardPool.address,
                    corporate.address,
                    buyBackToken.address,
                    DEAD_ADDRESS
                );

            })

            it("Anyone can read the distribution scheme and addresses", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await campaignFeeManager.setFeeDistributionShares(20, 20, 60);
                await campaignFeeManager.setFeeDistributionWallets(
                    rewardPool.address,
                    corporate.address,
                    buyBackToken.address,
                    DEAD_ADDRESS
                );

                const feeDistributionScheme = await campaignFeeManager.getDistributionShares();
                expect(feeDistributionScheme.buyBackAndburn).be.equal(20);
                expect(feeDistributionScheme.rewardPool).be.equal(20);
                expect(feeDistributionScheme.corporate).be.equal(60);

                const feeDistributionWallets = await campaignFeeManager.getDistributionWallets();
                expect(feeDistributionWallets.rewardPool).be.equal(rewardPool.address);
                expect(feeDistributionWallets.corporate).be.equal(corporate.address);
                expect(feeDistributionWallets.buyBackAndburnToken).be.equal(buyBackToken.address);
                expect(feeDistributionWallets.buyBackReceiver).be.equal(DEAD_ADDRESS);

            })

            it("Only Owner can update the router address for buyingback", async () => {

                await expect(campaignFeeManager.connect(user1).updateRouter(DEAD_ADDRESS))
                    .to.be.rejectedWith("Ownable: caller is not the owner");

                await campaignFeeManager.updateRouter(DEAD_ADDRESS);
                expect(await campaignFeeManager.uniswapV2Router()).to.be.equal(DEAD_ADDRESS);

            })

            it("Only owner can distribute the funds", async () => {

                const { buyBackToken } = await launchOPAndProvideLiquidity();

                await user1.sendTransaction({
                    to: campaignFeeManager.address,
                    value: ethers.utils.parseEther("5")
                });

                await campaignFeeManager.setFeeDistributionShares(20, 20, 60);
                await campaignFeeManager.setFeeDistributionWallets(
                    rewardPool.address,
                    corporate.address,
                    buyBackToken.address,
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

                await campaignFeeManager.setFeeDistributionShares(20, 20, 60);
                await campaignFeeManager.setFeeDistributionWallets(
                    rewardPool.address,
                    corporate.address,
                    buyBackToken.address,
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
                    await expect(creatorManager.createACreator(user1.address)).to.rejectedWith("CreatorManager__ALREADY_EXIST")
                })

                it("If someone's creator contract exists, then it can be queried", async () => {
                    await creatorManager.createACreator(user1.address);
                    const creatorContract = await creatorManager.getCreatorAddressOfUser(user1.address);
                    expect(creatorContract).is.properAddress
                })

                it("If someone's creator contract doesn't exists, then it will return ZERO ADDRESS",
                    async () => {

                        expect(await creatorManager.getCreatorAddressOfUser(user1.address)).to.be.equal(NULL_ADDRESS)
                        expect(await creatorManager.getCreatorAddressOfUser(user2.address)).to.be.equal(NULL_ADDRESS)
                        expect(await creatorManager.getCreatorAddressOfUser(user3.address)).to.be.equal(NULL_ADDRESS)

                        await creatorManager.createACreator(user1.address);
                        await creatorManager.createACreator(user2.address);
                        await creatorManager.createACreator(user3.address);

                        expect(await creatorManager.getCreatorAddressOfUser(user1.address)).is.properAddress
                        expect(await creatorManager.getCreatorAddressOfUser(user2.address)).is.properAddress
                        expect(await creatorManager.getCreatorAddressOfUser(user3.address)).is.properAddress

                        expect(await creatorManager.getCreatorAddressOfUser(user4.address)).to.be.equal(NULL_ADDRESS)
                        expect(await creatorManager.getCreatorAddressOfUser(user5.address)).to.be.equal(NULL_ADDRESS)
                        expect(await creatorManager.getCreatorAddressOfUser(user6.address)).to.be.equal(NULL_ADDRESS)

                    })

            })

            describe('Investing tokens on Creator Contract', () => {

                it("Investing tokens will automatically deploy a creator contract on user's behalf", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });

                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);

                    await network.provider.send("evm_increaseTime", [15 * ONE_MINUTE]);
                    await network.provider.send("evm_mine");

                    const tokens = ethers.utils.parseEther("1000");
                    await investmentToken.connect(user2).mint(tokens);
                    await investmentToken.connect(user2).approve(poolContract.address, tokens);

                    await poolContract.connect(user2).investTokens(user2.address, tokens, InvestmentType.THREE_MONTH);

                    await expect(creatorManager.createACreator(user2.address))
                        .to.rejectedWith("CreatorManager__ALREADY_EXIST")

                    const tokenDataForUser = await poolContract.getTokenData("1");
                    expect(await creatorManager.getCreatorAddressOfUser(user2.address)).to.be.equal(tokenDataForUser.creator);

                })

                it("Investing tokens will automatically tranfer all tokens to creator contract", async () => {

                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });
                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);
                    await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                    await network.provider.send("evm_mine");
                    await passTime(15 * ONE_MINUTE);

                    await investmentToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));

                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther("1000"), InvestmentType.THREE_MONTH);

                    const creatorAddress = await creatorManager.getCreatorAddressOfUser(user2.address);
                    const tokenDataForUser = await poolContract.getTokenData("1");
                    expect(tokenDataForUser.tokenInvested).to.be.equal(ethers.utils.parseEther("1000"));
                    expect(await investmentToken.balanceOf(creatorAddress)).to.be.equal(ethers.utils.parseEther("1000"));

                })

                it("Investing tokens will automatically add the pool address in the creator contract", async () => {


                    const memberFee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: memberFee });
                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);

                    await passTime(15 * ONE_MINUTE);

                    await investmentToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));
                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther("1000"), InvestmentType.THREE_MONTH);

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(1);


                    await investmentToken.connect(user2).mint(ethers.utils.parseEther("1000"));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("1000"));
                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther("1000"), InvestmentType.THREE_MONTH);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(1);
                })

                it("Claiming tokens will automatically remove the pool address in the creator contract", async () => {

                    const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: fee });
                    const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);

                    await passTime(15 * ONE_MINUTE);

                    await investmentToken.connect(user2).mint(ethers.utils.parseEther("2000"));
                    await investmentToken.connect(user2).approve(poolContract.address, ethers.utils.parseEther("2000"));
                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther("1000"), InvestmentType.THREE_MONTH);
                    await poolContract.connect(user2).investTokens(user2.address, ethers.utils.parseEther("1000"), InvestmentType.THREE_MONTH);

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(1);

                    await passTime(90 * ONE_DAY);

                    const creator = await creatorManager.getCreatorAddressOfUser(user2.address);
                    const CreatorContract = await ethers.getContractFactory("CreatorContract")
                    const creatorContract = CreatorContract.attach(creator);

                    expect(await investmentToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("0"));
                    expect(await poolContract.balanceOf(creator)).to.equal(2);
                    expect(await investmentToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("2000"));
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.empty;

                    await expect(() => poolContract.connect(user2).claimTokensAndReward(1))
                        .changeTokenBalances(investmentToken,
                            [user2, poolContract, creatorContract],
                            [
                                ethers.utils.parseEther("1300"),
                                ethers.utils.parseEther("-300"),
                                ethers.utils.parseEther("-1000"),
                            ]
                        )

                    expect(await investmentToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("1300"));
                    expect(await poolContract.balanceOf(creator)).to.equal(1);
                    expect(await investmentToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("1000"));
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.empty;

                    await expect(() => poolContract.connect(user2).claimTokensAndReward(2))
                        .changeTokenBalances(investmentToken,
                            [user2, poolContract, creatorContract],
                            [
                                ethers.utils.parseEther("1300"),
                                ethers.utils.parseEther("-300"),
                                ethers.utils.parseEther("-1000"),
                            ]
                        )

                    expect(await investmentToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("2600"));
                    expect(await poolContract.balanceOf(creator)).to.equal(0);
                    expect(await investmentToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("0"));
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.empty;


                })

                it("Multiple token investment simulation", async () => {

                    const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                    await pmMembershipManager.becomeMember(user1.address, { value: fee });
                    const { poolContract: poolContract1 } = await startACampaign(CampaignCategories.DIAMOND, user1);
                    const { poolContract: poolContract2 } = await startACampaign(CampaignCategories.DIAMOND, user1);
                    const { poolContract: poolContract3 } = await startACampaign(CampaignCategories.DIAMOND, user1);

                    await passTime(15 * ONE_MINUTE);

                    await creatorManager.createACreator(user2.address);
                    const creator = await creatorManager.getCreatorAddressOfUser(user2.address);
                    const CreatorContract = await ethers.getContractFactory("CreatorContract")
                    const creatorContract = CreatorContract.attach(creator);

                    await investmentToken.connect(user2).mint(ethers.utils.parseEther("200"));
                    await investmentToken.connect(user2).approve(poolContract1.address, ethers.utils.parseEther("200"));
                    await poolContract1.connect(user2).investTokens(user2.address, ethers.utils.parseEther("100"), InvestmentType.THREE_MONTH);
                    await poolContract1.connect(user2).investTokens(user2.address, ethers.utils.parseEther("100"), InvestmentType.THREE_MONTH);

                    await investmentToken.connect(user2).mint(ethers.utils.parseEther("200"));
                    await investmentToken.connect(user2).approve(poolContract2.address, ethers.utils.parseEther("200"));
                    await poolContract2.connect(user2).investTokens(user2.address, ethers.utils.parseEther("100"), InvestmentType.THREE_MONTH);
                    await poolContract2.connect(user2).investTokens(user2.address, ethers.utils.parseEther("100"), InvestmentType.THREE_MONTH);

                    await investmentToken.connect(user2).mint(ethers.utils.parseEther("200"));
                    await investmentToken.connect(user2).approve(poolContract3.address, ethers.utils.parseEther("200"));
                    await poolContract3.connect(user2).investTokens(user2.address, ethers.utils.parseEther("100"), InvestmentType.THREE_MONTH);
                    await poolContract3.connect(user2).investTokens(user2.address, ethers.utils.parseEther("100"), InvestmentType.THREE_MONTH);


                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract1.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract2.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract3.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(3);


                    expect(await investmentToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("0"));
                    expect(await investmentToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("600"));

                    await passTime(90 * ONE_DAY);

                    await expect(() => poolContract1.connect(user2).claimTokensAndReward(1))
                        .changeTokenBalances(investmentToken,
                            [user2, poolContract1, creatorContract],
                            [
                                ethers.utils.parseEther("130"),
                                ethers.utils.parseEther("-30"),
                                ethers.utils.parseEther("-100"),
                            ]
                        )

                    expect(await investmentToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("130"));
                    expect(await investmentToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("500"));

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract1.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract2.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract3.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(3);


                    await expect(() => poolContract1.connect(user2).claimTokensAndReward(2))
                        .changeTokenBalances(investmentToken,
                            [user2, poolContract1, creatorContract],
                            [
                                ethers.utils.parseEther("130"),
                                ethers.utils.parseEther("-30"),
                                ethers.utils.parseEther("-100"),
                            ]
                        )

                    expect(await investmentToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("260"));
                    expect(await investmentToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("400"));

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract1.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract2.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract3.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(2);



                    await expect(poolContract1.connect(user2).claimTokensAndReward(1)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract1.connect(user2).claimTokensAndReward(2)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")

                    await expect(() => poolContract2.connect(user2).claimTokensAndReward(1))
                        .changeTokenBalances(investmentToken,
                            [user2, poolContract2, creatorContract],
                            [
                                ethers.utils.parseEther("130"),
                                ethers.utils.parseEther("-30"),
                                ethers.utils.parseEther("-100"),
                            ]
                        )

                    expect(await investmentToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("390"));
                    expect(await investmentToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("300"));

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract1.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract2.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract3.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(2);



                    await expect(poolContract1.connect(user2).claimTokensAndReward(1)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract1.connect(user2).claimTokensAndReward(2)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract2.connect(user2).claimTokensAndReward(1)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")

                    await expect(() => poolContract2.connect(user2).claimTokensAndReward(2))
                        .changeTokenBalances(investmentToken,
                            [user2, poolContract2, creatorContract],
                            [
                                ethers.utils.parseEther("130"),
                                ethers.utils.parseEther("-30"),
                                ethers.utils.parseEther("-100"),
                            ]
                        )

                    expect(await investmentToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("520"));
                    expect(await investmentToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("200"));

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract1.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract2.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract3.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(1);



                    await expect(poolContract1.connect(user2).claimTokensAndReward(1)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract1.connect(user2).claimTokensAndReward(2)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract2.connect(user2).claimTokensAndReward(1)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract2.connect(user2).claimTokensAndReward(2)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")

                    await expect(() => poolContract3.connect(user2).claimTokensAndReward(1))
                        .changeTokenBalances(investmentToken,
                            [user2, poolContract3, creatorContract],
                            [
                                ethers.utils.parseEther("130"),
                                ethers.utils.parseEther("-30"),
                                ethers.utils.parseEther("-100"),
                            ]
                        )

                    expect(await investmentToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("650"));
                    expect(await investmentToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("100"));

                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract1.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.not.include(poolContract2.address);
                    expect(await creatorManager.getPoolAddressesOfCreator(user2.address)).to.include(poolContract3.address);
                    expect((await creatorManager.getPoolAddressesOfCreator(user2.address)).length).to.equal(1);


                    await expect(poolContract1.connect(user2).claimTokensAndReward(1)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract1.connect(user2).claimTokensAndReward(2)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract2.connect(user2).claimTokensAndReward(1)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract2.connect(user2).claimTokensAndReward(2)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract3.connect(user2).claimTokensAndReward(1)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")


                    await expect(() => poolContract3.connect(user2).claimTokensAndReward(2))
                        .changeTokenBalances(investmentToken,
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

                    expect(await investmentToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("780"));
                    expect(await investmentToken.balanceOf(creatorContract.address)).to.equal(ethers.utils.parseEther("0"));

                    await expect(poolContract1.connect(user2).claimTokensAndReward(1)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract1.connect(user2).claimTokensAndReward(2)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract2.connect(user2).claimTokensAndReward(1)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract2.connect(user2).claimTokensAndReward(2)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract3.connect(user2).claimTokensAndReward(1)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")
                    await expect(poolContract3.connect(user2).claimTokensAndReward(2)).to.rejectedWith("RewardCampaign__ALREADY_CLAIMED")

                })

            })

        })

        describe("Adjustable APY ", () => {

            it("Can create a campaing with only single investment scheme", async () => {

                const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategories.SILVER);

                await expect(() => pmMembershipManager.connect(user3).becomeMember(user3.address, { value: fee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [fee.mul(-1), fee]);

                const tokens = ethers.utils.parseEther("1000");
                const decimals = investmentToken.decimals();
                const symbol = investmentToken.symbol();

                await investmentToken.connect(user3).mint(tokens);
                await investmentToken.connect(user3).approve(rewardCampaignFactory.address, tokens);

                let latestBlock = await ethers.provider.getBlock("latest");

                const tx = await rewardCampaignFactory.connect(user3).createARewardCampaign(
                    // projectInfo 
                    {
                        category: CampaignCategories.SILVER,
                        projectName: "Awesome Investment Pool",
                        projectSymbol: "ASP",
                        tokenAddress: investmentToken.address,
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
                let poolAddress = xxxx[0].args.poolAddress;
                let poolId = xxxx[0].args.poolId;
                const rewardPool = await ethers.getContractFactory("RewardCampaign") as RewardCampaign__factory;
                const poolContract = rewardPool.attach(poolAddress);

                await passTime(15 * ONE_MINUTE);

                const tokensToInvest = ethers.utils.parseEther("10000");
                await investmentToken.connect(user2).mint(tokensToInvest);
                await investmentToken.connect(user2).approve(poolContract.address, tokensToInvest);

                await poolContract.connect(user2).investTokens(user2.address, tokensToInvest, InvestmentType.ONE_MONTH);

                const tokenDataForUser2 = await poolContract.getTokenData("1");

                expect(tokenDataForUser2.investmentType).to.be.equal(InvestmentType.ONE_MONTH);
                expect(tokenDataForUser2.tokenInvested).to.be.equal(tokensToInvest);
                expect(tokenDataForUser2.owner).to.be.equal(user2.address);
                expect(tokenDataForUser2.isUnskated).to.be.equal(false);


                await expect(
                    poolContract.connect(user2).investTokens(user2.address, tokens, InvestmentType.THREE_MONTH)
                ).to.rejectedWith("RewardCampaign__NOT_A_VALID_CLAIM_TYPE")
                await expect(
                    poolContract.connect(user2).investTokens(user2.address, tokens, InvestmentType.SIX_MONTH)
                ).to.rejectedWith("RewardCampaign__NOT_A_VALID_CLAIM_TYPE")
                await expect(
                    poolContract.connect(user2).investTokens(user2.address, tokens, InvestmentType.NINE_MONTH)
                ).to.rejectedWith("RewardCampaign__NOT_A_VALID_CLAIM_TYPE")
                await expect(
                    poolContract.connect(user2).investTokens(user2.address, tokens, InvestmentType.TWELVE_MONTH)
                ).to.rejectedWith("RewardCampaign__NOT_A_VALID_CLAIM_TYPE")

                await network.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
                await network.provider.send("evm_mine");

                expect(await investmentToken.balanceOf(poolContract.address)).to.be.equal(ethers.utils.parseEther("1000"))
                expect(await investmentToken.balanceOf(user2.address)).to.be.equal(ethers.utils.parseEther("0"))

                await poolContract.connect(user2).claimTokensAndReward(tokenDataForUser2.tokenId, { value: "0" });

                expect(await investmentToken.balanceOf(poolContract.address)).to.be.equal(ethers.utils.parseEther("0"))
                expect(await investmentToken.balanceOf(user2.address)).to.be.equal(ethers.utils.parseEther("11000"))


                await investmentToken.connect(user2).mint(tokensToInvest);
                await investmentToken.connect(user2).approve(poolContract.address, tokensToInvest);

                await expect(
                    poolContract.connect(user2).investTokens(user2.address, tokensToInvest, InvestmentType.ONE_MONTH)
                ).to.rejectedWith("RewardCampaign__NOT_ENOUGH_REWARD_IN_POOL()");


            })

            it("Can create a campaing with selected investment scheme", async () => {

                const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategories.SILVER);

                await expect(() => pmMembershipManager.connect(user3).becomeMember(user3.address, { value: fee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [fee.mul(-1), fee]);

                const tokens = ethers.utils.parseEther("1000");
                const decimals = investmentToken.decimals();
                const symbol = investmentToken.symbol();

                await investmentToken.connect(user3).mint(tokens);
                await investmentToken.connect(user3).approve(rewardCampaignFactory.address, tokens);

                let latestBlock = await ethers.provider.getBlock("latest");

                const tx = await rewardCampaignFactory.connect(user3).createARewardCampaign(
                    // projectInfo 
                    {
                        category: CampaignCategories.SILVER,
                        projectName: "Awesome Investment Pool",
                        projectSymbol: "ASP",
                        tokenAddress: investmentToken.address,
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
                        APY_1_months: "10",
                        APY_3_months: "0",
                        APY_6_months: "60",
                        APY_9_months: "0",
                        APY_12_months: "100",
                    },
                    {
                        value: campaignFee
                    }
                );

                let receipt: ContractReceipt = await tx.wait();
                const xxxx: any = receipt.events?.filter((x) => { return x.event == "Poolcreated" })
                let poolAddress = xxxx[0].args.poolAddress;
                let poolId = xxxx[0].args.poolId;
                const rewardPool = await ethers.getContractFactory("RewardCampaign") as RewardCampaign__factory;
                const poolContract = rewardPool.attach(poolAddress);


                await network.provider.send("evm_increaseTime", [15 * 60 * 1000]);
                await network.provider.send("evm_mine");

                const tokensToInvest = ethers.utils.parseEther("100");
                await investmentToken.connect(user2).mint(tokensToInvest.mul("3"));
                await investmentToken.connect(user2).approve(poolContract.address, tokensToInvest.mul("3"));

                await poolContract.connect(user2).investTokens(user2.address, tokensToInvest, InvestmentType.ONE_MONTH);
                await poolContract.connect(user2).investTokens(user2.address, tokensToInvest, InvestmentType.SIX_MONTH);
                await poolContract.connect(user2).investTokens(user2.address, tokensToInvest, InvestmentType.TWELVE_MONTH);

                await expect(
                    poolContract.connect(user2).investTokens(user2.address, tokens, InvestmentType.THREE_MONTH)
                ).to.rejectedWith("RewardCampaign__NOT_A_VALID_CLAIM_TYPE");

                await expect(
                    poolContract.connect(user2).investTokens(user2.address, tokens, InvestmentType.NINE_MONTH)
                ).to.rejectedWith("RewardCampaign__NOT_A_VALID_CLAIM_TYPE");

            });

            it("Can create a campaing with all investment scheme", async () => {
                await pmMembershipManager.changePauseStatus(false);
                await rewardCampaignFactory.changePauseStatus(false);

                const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
                const campaignFee = await campaignFeeManager.getCampaignFee(CampaignCategories.SILVER);

                await expect(() => pmMembershipManager.connect(user3).becomeMember(user3.address, { value: fee }))
                    .to.changeEtherBalances([user3, membershipFeeManager], [fee.mul(-1), fee]);

                const tokens = ethers.utils.parseEther("1000");
                const decimals = investmentToken.decimals();
                const symbol = investmentToken.symbol();

                await investmentToken.connect(user3).mint(tokens);
                await investmentToken.connect(user3).approve(rewardCampaignFactory.address, tokens);

                let latestBlock = await ethers.provider.getBlock("latest");

                const tx = await rewardCampaignFactory.connect(user3).createARewardCampaign(
                    // projectInfo 
                    {
                        category: CampaignCategories.SILVER,
                        projectName: "Awesome Investment Pool",
                        projectSymbol: "ASP",
                        tokenAddress: investmentToken.address,
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
                let poolAddress = xxxx[0].args.poolAddress;
                let poolId = xxxx[0].args.poolId;
                const rewardPool = await ethers.getContractFactory("RewardCampaign") as RewardCampaign__factory;
                const poolContract = rewardPool.attach(poolAddress);

                await passTime(15 * ONE_MINUTE);

                const tokensToInvest = ethers.utils.parseEther("100");
                await investmentToken.connect(user2).mint(tokensToInvest.mul("5"));
                await investmentToken.connect(user2).approve(poolContract.address, tokensToInvest.mul("5"));

                await poolContract.connect(user2).investTokens(user2.address, tokensToInvest, InvestmentType.ONE_MONTH);
                await poolContract.connect(user2).investTokens(user2.address, tokensToInvest, InvestmentType.THREE_MONTH);
                await poolContract.connect(user2).investTokens(user2.address, tokensToInvest, InvestmentType.SIX_MONTH);
                await poolContract.connect(user2).investTokens(user2.address, tokensToInvest, InvestmentType.NINE_MONTH);
                await poolContract.connect(user2).investTokens(user2.address, tokensToInvest, InvestmentType.TWELVE_MONTH);

            })


        })

    })

    describe('Reward Distributor', () => {

        it("deploying alright", () => {
            expect(pmRewardDistributor.address).is.properAddress;
        })

        it("Only Owner can update giveAway Manager address", async () => {
            expect(await pmRewardDistributor.getGiveAwayManager()).is.equal(rewardManger.address);
            await pmRewardDistributor.updateGiveAwayManager(user1.address);
            expect(await pmRewardDistributor.getGiveAwayManager()).is.equal(user1.address);
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

            await pmRewardDistributor.changePauseStatus(false);

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });

            await expect(pmRewardDistributor.connect(user1).distributeReward(user1.address, 1))
                .to.be.rejectedWith("Not Authorized");
            await expect(pmRewardDistributor.connect(deployer).distributeReward(user1.address, 1))
                .to.be.rejectedWith("Not Authorized");

            await pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 1);


            await pmRewardDistributor.connect(deployer).changePauseStatus(true);

            await expect(pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 1))
                .to.be.rejectedWith("CONTRACT_IS_PAUSED");

            await pmRewardDistributor.connect(deployer).changePauseStatus(false);
            await pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 1);

        })

        it("Only giveaway manager can distributeReward to giveaway winners", async () => {

            await pmRewardDistributor.changePauseStatus(false);

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });

            await expect(pmRewardDistributor.connect(user1).distributeReward(user1.address, 1))
                .to.be.rejectedWith("Not Authorized");
            await expect(pmRewardDistributor.connect(deployer).distributeReward(user1.address, 1))
                .to.be.rejectedWith("Not Authorized");

            await pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 1);

            // await expect(() => pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 1))
            //     .to.changeEtherBalances(
            //         [pmRewardDistributor, user1],
            //         [PriceOfOneUSD.mul(-1), PriceOfOneUSD]
            //     );

        })

        it("if balance is not enought then should throw an error on distributeReward", async () => {
            await pmRewardDistributor.changePauseStatus(false);

            await expect(pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 1))
                .to.be.rejectedWith("PMRewardDistributor__NOT_ENOUGH_BALANCE");
        })

        it("Giveaway winner will receive his reward as expected", async () => {

            await pmRewardDistributor.changePauseStatus(false);

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

            await pmRewardDistributor.changePauseStatus(false);
            await rewardCampaignFactory.changePauseStatus(false);
            await pmMembershipManager.changePauseStatus(false);

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });


            const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
            await pmMembershipManager.becomeMember(user1.address, { value: fee });

            const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);

            await expect(pmRewardDistributor.connect(user1)
                .applyRewardToACampaing(poolContract.address, user1.address, 2, InvestmentType.THREE_MONTH))
                .to.be.rejectedWith("Not Authorized");

        })

        it("if balance is not enought then should throw an error on applyRewardToACampaing", async () => {

            await pmRewardDistributor.changePauseStatus(false);
            await rewardCampaignFactory.changePauseStatus(false);
            await pmMembershipManager.changePauseStatus(false);

            const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
            await pmMembershipManager.becomeMember(user1.address, { value: fee });

            const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);

            await expect(pmRewardDistributor.connect(rewardManger)
                .applyRewardToACampaing(poolContract.address, user1.address, 2, InvestmentType.THREE_MONTH))
                .to.be.rejectedWith("PMRewardDistributor__NOT_ENOUGH_BALANCE");
        })

        it("if contract is paused then should throw an error on applyRewardToACampaing", async () => {

            await pmRewardDistributor.changePauseStatus(false);
            await rewardCampaignFactory.changePauseStatus(false);
            await pmMembershipManager.changePauseStatus(false);

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });
            await provideLiquidity();

            const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
            await pmMembershipManager.becomeMember(user1.address, { value: fee });

            const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);

            await passTime(15 * ONE_MINUTE);

            const PriceOfOneUSD = await pmRewardDistributor.getLatestPriceOfOneUSD();

            await pmRewardDistributor.connect(deployer).changePauseStatus(true);

            await expect(pmRewardDistributor.connect(rewardManger)
                .applyRewardToACampaing(poolContract.address, user1.address, 2, InvestmentType.THREE_MONTH))
                .to.be.rejectedWith("PMRewardDistributor__CONTRACT_IS_PAUSED");

            await pmRewardDistributor.connect(deployer).changePauseStatus(false);

            await expect(() => pmRewardDistributor.connect(rewardManger).
                applyRewardToACampaing(poolContract.address, user1.address, 2, InvestmentType.THREE_MONTH))
                .to.changeEtherBalances(
                    [pmRewardDistributor],
                    [PriceOfOneUSD.mul(-2)]
                );

        })

        it("Users can apply Reward To A Campaing", async () => {

            await pmRewardDistributor.changePauseStatus(false);
            await rewardCampaignFactory.changePauseStatus(false);
            await pmMembershipManager.changePauseStatus(false);

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });
            await provideLiquidity();

            const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
            await pmMembershipManager.becomeMember(user1.address, { value: fee });
            const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);

            await passTime(15 * ONE_MINUTE);

            const PriceOfOneUSD = await pmRewardDistributor.getLatestPriceOfOneUSD();

            await expect(() => pmRewardDistributor.connect(rewardManger).
                applyRewardToACampaing(poolContract.address, user1.address, 2, InvestmentType.THREE_MONTH))
                .to.changeEtherBalances(
                    [pmRewardDistributor],
                    [PriceOfOneUSD.mul(-2)]
                );

        })

        it("total Reward Distributed is working fine", async () => {

            await pmRewardDistributor.changePauseStatus(false);
            await rewardCampaignFactory.changePauseStatus(false);
            await pmMembershipManager.changePauseStatus(false);

            await user1.sendTransaction({
                to: pmRewardDistributor.address,
                value: ethers.utils.parseEther("5")
            });
            await provideLiquidity();

            const fee = await membershipFeeManager.getMembershipFee(MembershipCategory.MEMBER);
            await pmMembershipManager.becomeMember(user1.address, { value: fee });
            const { poolContract } = await startACampaign(CampaignCategories.DIAMOND, user1);

            await passTime(15 * ONE_MINUTE);

            const PriceOfOneUSD = await pmRewardDistributor.getLatestPriceOfOneUSD();

            await expect(() => pmRewardDistributor.connect(rewardManger).
                applyRewardToACampaing(poolContract.address, user1.address, 5, InvestmentType.THREE_MONTH))
                .to.changeEtherBalances(
                    [pmRewardDistributor],
                    [PriceOfOneUSD.mul(-5)]
                );

            await expect(() => pmRewardDistributor.connect(rewardManger).distributeReward(user1.address, 5))
                .to.changeEtherBalances(
                    [pmRewardDistributor, user1],
                    [PriceOfOneUSD.mul(-5), PriceOfOneUSD.mul(5)]
                );

            expect(await pmRewardDistributor.getTotalRewardDistributed()).to.be.equal(PriceOfOneUSD.mul(BigNumber.from("10")));

        })
    })

})

