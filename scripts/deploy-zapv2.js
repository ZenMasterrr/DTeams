const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting ZapV2 deployment...\n");

  // Get deployer info
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance < hre.ethers.parseEther("0.1")) {
    console.error("❌ Insufficient balance! Need at least 0.1 ETH for deployment + funding.");
    process.exit(1);
  }

  // Deploy ZapV2
  console.log("📦 Deploying ZapV2 contract...");
  const ZapV2 = await hre.ethers.getContractFactory("ZapV2");
  const zapV2 = await ZapV2.deploy();
  
  await zapV2.waitForDeployment();
  const contractAddress = await zapV2.getAddress();

  console.log("✅ ZapV2 deployed to:", contractAddress);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}\n`);

  // Fund reward pool
  console.log("💰 Funding reward pool with 0.05 ETH...");
  const fundTx = await zapV2.fundRewardPool({ value: hre.ethers.parseEther("0.05") });
  await fundTx.wait();
  console.log("✅ Reward pool funded\n");

  // Enable keeper network
  console.log("🔧 Enabling keeper network...");
  const enableTx = await zapV2.setKeeperNetworkEnabled(true);
  await enableTx.wait();
  console.log("✅ Keeper network enabled\n");

  // Print contract info
  const totalZaps = await zapV2.getTotalZaps();
  const executionReward = await zapV2.executionReward();
  const minStake = await zapV2.minKeeperStake();
  const rewardPool = await zapV2.rewardPool();

  console.log("📊 Contract Status:");
  console.log("   Total Zaps:", totalZaps.toString());
  console.log("   Execution Reward:", hre.ethers.formatEther(executionReward), "ETH");
  console.log("   Min Keeper Stake:", hre.ethers.formatEther(minStake), "ETH");
  console.log("   Reward Pool:", hre.ethers.formatEther(rewardPool), "ETH");

  console.log("\n📝 SAVE THESE TO YOUR .env FILES:\n");
  console.log(`# Frontend .env.local`);
  console.log(`NEXT_PUBLIC_ZAP_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`NEXT_PUBLIC_NETWORK=sepolia`);
  console.log(`\n# Keeper .env`);
  console.log(`ZAP_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`);
  console.log(`KEEPER_PRIVATE_KEY=your_keeper_private_key\n`);

  console.log("🎉 Deployment complete!\n");
  console.log("📋 Next steps:");
  console.log("1. Save contract address to .env files");
  console.log("2. Verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
  console.log("3. Register as keeper:");
  console.log(`   See scripts/register-keeper.js`);
  console.log("4. Start keeper service:");
  console.log(`   cd keeper && npx ts-node src/keeper-v2.ts\n`);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
