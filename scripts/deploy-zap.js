const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory
  const Zap = await ethers.getContractFactory("Zap");
  
  // Deploy the contract
  console.log("Deploying Zap contract...");
  const zap = await Zap.deploy();
  
  // Wait for deployment to complete
  await zap.deployed();
  
  console.log(`Zap contract deployed to: ${zap.address}`);
  
  // Verify the contract on Etherscan (if needed)
  // await hre.run("verify:verify", {
  //   address: zap.address,
  //   constructorArguments: [],
  // });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
