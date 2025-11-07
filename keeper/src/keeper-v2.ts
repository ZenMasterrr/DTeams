import { ethers } from "ethers";
import * as dotenv from "dotenv";
import axios from "axios";

// Load environment variables
dotenv.config();

// Configuration
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL!;
const KEEPER_PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY!;
const ZAP_CONTRACT_ADDRESS = process.env.ZAP_CONTRACT_ADDRESS!;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3002";

// Validate configuration
if (!SEPOLIA_RPC_URL || !KEEPER_PRIVATE_KEY || !ZAP_CONTRACT_ADDRESS) {
  console.error("❌ Missing required environment variables!");
  console.error("Required: SEPOLIA_RPC_URL, KEEPER_PRIVATE_KEY, ZAP_CONTRACT_ADDRESS");
  process.exit(1);
}

// Contract ABI (only functions we need)
const ZAP_ABI = [
  "function getTotalZaps() view returns (uint256)",
  "function getZap(uint256) view returns (address owner, uint256 triggerType, bool active, uint256 executionCount, uint256 actionCount)",
  "function zaps(uint256) view returns (address owner, uint256 triggerType, bytes data, bool active, uint256 executionCount, uint256 lastExecuted)",
  "function execute(uint256 zapId) payable",
  "function isKeeper(address) view returns (bool)",
  "function executionReward() view returns (uint256)",
  "event ZapMinted(uint256 indexed zapId, address indexed owner, uint256 triggerType)",
  "event ZapExecuted(uint256 indexed zapId, address indexed executor, bool isKeeper, uint256 reward)"
];

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(KEEPER_PRIVATE_KEY, provider);

// Initialize contract
const zapContract = new ethers.Contract(ZAP_CONTRACT_ADDRESS, ZAP_ABI, wallet);

/**
 * Keeper Service Class
 */
class KeeperService {
  private processedEmails = new Set<string>();
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Start the keeper service
   */
  async start() {
    console.log("\n🚀 Keeper Service Starting...\n");
    console.log("=" .repeat(50));
    console.log("📍 Keeper Address:", wallet.address);
    console.log("📍 Contract Address:", ZAP_CONTRACT_ADDRESS);
    console.log("🌐 Network: Sepolia Testnet");
    console.log("=" .repeat(50));

    try {
      // Check keeper registration
      const isRegistered = await zapContract.isKeeper(wallet.address);
      
      if (!isRegistered) {
        console.error("\n❌ NOT REGISTERED AS KEEPER!");
        console.error("Please register first using:");
        console.error("npx hardhat run scripts/register-keeper.js --network sepolia\n");
        process.exit(1);
      }

      console.log("✅ Keeper registered\n");

      // Check balance
      const balance = await provider.getBalance(wallet.address);
      console.log("💰 Balance:", ethers.formatEther(balance), "ETH");

      if (balance < ethers.parseEther("0.01")) {
        console.warn("\n⚠️  Low balance! Consider adding more ETH.\n");
      }

      // Get execution reward
      const reward = await zapContract.executionReward();
      console.log("🎁 Execution Reward:", ethers.formatEther(reward), "ETH\n");

      // Initial monitoring
      await this.monitorZaps();

      // Start monitoring loop (every 60 seconds)
      this.monitoringInterval = setInterval(() => {
        this.monitorZaps();
      }, 60000);

      // Listen for new zaps
      zapContract.on("ZapMinted", (zapId, owner, triggerType) => {
        console.log(`\n📝 New Zap Minted!`);
        console.log(`   Zap ID: #${zapId}`);
        console.log(`   Owner: ${owner}`);
        console.log(`   Trigger Type: ${triggerType === 0n ? "On-chain" : "Off-chain"}\n`);
      });

      // Listen for zap executions
      zapContract.on("ZapExecuted", (zapId, executor, isKeeper, reward) => {
        if (executor.toLowerCase() === wallet.address.toLowerCase()) {
          console.log(`\n🎉 Successfully executed Zap #${zapId}!`);
          console.log(`   Reward: ${ethers.formatEther(reward)} ETH\n`);
        }
      });

      console.log("✅ Keeper service is running...");
      console.log("⏰ Monitoring every 60 seconds\n");
      console.log("Press Ctrl+C to stop\n");

    } catch (error: any) {
      console.error("\n❌ Failed to start keeper service:");
      console.error(error.message);
      process.exit(1);
    }
  }

  /**
   * Monitor all zaps and check for triggers
   */
  async monitorZaps() {
    try {
      const now = new Date().toISOString();
      console.log(`[${now}] 🔍 Monitoring zaps...`);

      // Get total zaps from contract
      const totalZaps = await zapContract.getTotalZaps();
      console.log(`📊 Total zaps on contract: ${totalZaps}`);

      if (totalZaps === 0n) {
        console.log("⏰ No zaps to monitor. Waiting for zaps to be created...\n");
        return;
      }

      // Check each zap
      let activeZaps = 0;
      for (let i = 0; i < Number(totalZaps); i++) {
        const zapActive = await this.checkZap(i);
        if (zapActive) activeZaps++;
      }

      console.log(`✅ Monitored ${activeZaps} active zaps\n`);

    } catch (error: any) {
      console.error("❌ Error monitoring zaps:", error.message);
    }
  }

  /**
   * Check individual zap for triggers
   */
  async checkZap(zapId: number): Promise<boolean> {
    try {
      // Get zap details
      const [owner, triggerType, active, executionCount, actionCount] = 
        await zapContract.getZap(zapId);

      if (!active) {
        return false;
      }

      // Only monitor off-chain triggers (type 1)
      if (triggerType === 1n) {
        console.log(`  Zap #${zapId}: Off-chain trigger (${executionCount} executions)`);
        
        // Try to get trigger config from backend
        const hasNewTrigger = await this.checkOffChainTrigger(zapId);
        
        if (hasNewTrigger) {
          await this.executeZap(zapId);
        }
      } else {
        // On-chain triggers would be checked here
        console.log(`  Zap #${zapId}: On-chain trigger (skipping for now)`);
      }

      return true;

    } catch (error: any) {
      // Skip individual zap errors
      return false;
    }
  }

  /**
   * Check off-chain trigger (Gmail, Price, Webhook)
   */
  async checkOffChainTrigger(zapId: number): Promise<boolean> {
    try {
      // For now, we'll integrate with your existing backend
      // The backend will tell us if a trigger has fired
      
      // In Phase 3, we'll implement:
      // 1. Fetch trigger config from backend or IPFS
      // 2. Check Gmail API for new emails
      // 3. Check CoinGecko for price alerts
      // 4. Check webhook registry
      
      // For now, just check with backend
      const response = await axios.get(
        `${BACKEND_URL}/api/v1/keeper/check-trigger/${zapId}`,
        { timeout: 5000 }
      );

      return response.data.shouldExecute || false;

    } catch (error: any) {
      // Backend might not have this endpoint yet, that's okay
      if (error.code !== "ECONNREFUSED") {
        console.log(`  ⚠️  Could not check trigger for Zap #${zapId}`);
      }
      return false;
    }
  }

  /**
   * Execute zap on blockchain
   */
  async executeZap(zapId: number) {
    try {
      console.log(`\n🚀 Executing Zap #${zapId} on blockchain...`);

      // Estimate gas
      const gasEstimate = await zapContract.execute.estimateGas(zapId);
      console.log(`   Estimated gas: ${gasEstimate.toString()}`);

      // Execute
      const tx = await zapContract.execute(zapId, {
        gasLimit: gasEstimate * 120n / 100n // 20% buffer
      });

      console.log(`   Transaction sent: ${tx.hash}`);
      console.log(`   Waiting for confirmation...`);

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log(`✅ Zap #${zapId} executed successfully!`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`   Block: ${receipt.blockNumber}`);
      } else {
        console.log(`❌ Zap #${zapId} execution failed`);
      }

    } catch (error: any) {
      console.error(`\n❌ Failed to execute Zap #${zapId}:`);
      
      if (error.code === "INSUFFICIENT_FUNDS") {
        console.error("   Insufficient ETH balance");
      } else if (error.message.includes("revert")) {
        console.error("   Transaction reverted:", error.message);
      } else {
        console.error("   Error:", error.message);
      }
    }
  }

  /**
   * Stop the keeper service
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log("\n🛑 Keeper service stopped\n");
  }
}

// Main execution
async function main() {
  const keeper = new KeeperService();

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\n🛑 Shutting down keeper service...");
    keeper.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n\n🛑 Shutting down keeper service...");
    keeper.stop();
    process.exit(0);
  });

  // Start keeper
  await keeper.start();
}

// Run
main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
