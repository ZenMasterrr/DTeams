// 1. Import the Hardhat Runtime Environment
const hre = require("hardhat");

async function main() {
  // 2. Change 'ethers' to 'hre.ethers'
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // 3. Change 'ethers' to 'hre.ethers' (in two places on this line)
  const zapOracleContract = await hre.ethers.deployContract("ZapOracle", [hre.ethers.ZeroAddress]);
  await zapOracleContract.waitForDeployment();
  console.log(`ZapOracle contract deployed to: ${zapOracleContract.target}`);

  // 4. Change 'ethers' to 'hre.ethers'
  const zapContract = await hre.ethers.deployContract("Zap", [zapOracleContract.target]);
  await zapContract.waitForDeployment();
  console.log(`Zap contract deployed to: ${zapContract.target}`);

  // 5. Change 'ethers' to 'hre.ethers'
  const listenerContract = await hre.ethers.deployContract("Listener", [zapContract.target]);
  await listenerContract.waitForDeployment();
  console.log(`Listener contract deployed to: ${listenerContract.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});