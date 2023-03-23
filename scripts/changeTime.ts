import { ethers } from "hardhat";
import { network } from "hardhat";
import {moveBlocks} from "../utils/move-blocks";

import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ContractFunctionVisibility } from "hardhat/internal/hardhat-network/stack-traces/model";
const ONE_DAY = time.duration.days(1);

async function main() {
    // console.log("Progressing time");
    // await network.provider.send("evm_increaseTime", [180 * ONE_DAY]);
    // await network.provider.send("evm_mine");
    // console.log("Time updated");

    // await network.provider.send("evm_setIntervalMining", [180 * ONE_DAY]);


    const sevenDays = 180 * 24 * 60 * 60;

    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = blockBefore.timestamp;
    console.log("timestampBefore:", timestampBefore);

    await network.provider.send('evm_increaseTime', [sevenDays]);
    await network.provider.send('evm_mine');
    await moveBlocks(180);

    const blockNumAfter = await ethers.provider.getBlockNumber();
    const blockAfter = await ethers.provider.getBlock(blockNumAfter);
    const timestampAfter = blockAfter.timestamp;
    console.log("timestampAfter:", timestampAfter);



}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
