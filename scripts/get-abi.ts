const hre = require("hardhat");

async function main() {
  // Access ethers from the hre object
  const zapArtifact = await hre.ethers.getContractFactory("Zap");
  const abi = JSON.stringify(zapArtifact.interface.fragments, null, 2);
  console.log(abi);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});