import { ethers, network, run } from "hardhat";


 const varify = async ( address: string, args: any[]) => {

  console.log(`Verifying contract on Etherscan...`);

  try{
      await run(`verify:verify`, {
        address: address,
        constructorArguments: args,
      });
  }
  catch(e){
    console.error(e);
  }
}

export default varify;
