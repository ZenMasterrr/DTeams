import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface PriceData {
  symbol: string;
  price: number;
  timestamp: Date;
}

// Cache for last known prices
const priceCache: Record<string, number> = {};

/**
 * Fetch current crypto price from CoinGecko
 */
async function fetchCryptoPrice(symbol: string): Promise<number | null> {
  try {
    // Convert symbol to CoinGecko ID (e.g., BTC -> bitcoin, ETH -> ethereum)
    const coinMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'DOT': 'polkadot',
      'LINK': 'chainlink'
    };
    
    const coinId = coinMap[symbol.toUpperCase()] || symbol.toLowerCase();
    
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { timeout: 5000 }
    );
    
    const price = response.data[coinId]?.usd;
    
    if (price) {
      console.log(`💰 ${symbol}: $${price}`);
      return price;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Check if price condition is met
 */
function checkPriceCondition(
  currentPrice: number,
  targetPrice: number,
  condition: 'above' | 'below'
): boolean {
  if (condition === 'above') {
    return currentPrice > targetPrice;
  } else {
    return currentPrice < targetPrice;
  }
}

/**
 * Monitor price alerts for all active zaps
 */
export async function monitorPriceAlerts() {
  try {
    // Get all zaps with price triggers
    const priceZaps = await prisma.zap.findMany({
      where: {
        status: 'active',
        trigger: {
          type: 'price'
        }
      },
      include: {
        trigger: true,
        actions: true,
        user: true
      }
    });
    
    console.log(`📊 Monitoring ${priceZaps.length} price alert zaps...`);
    
    for (const zap of priceZaps) {
      if (!zap.trigger) continue;
      
      const metadata = typeof zap.trigger.metadata === 'string'
        ? JSON.parse(zap.trigger.metadata)
        : zap.trigger.metadata;
      
      const { symbol, targetPrice, condition } = metadata;
      
      if (!symbol || !targetPrice) {
        console.warn(`⚠️  Skipping zap ${zap.id}: missing symbol or targetPrice`);
        continue;
      }
      
      // Fetch current price
      const currentPrice = await fetchCryptoPrice(symbol);
      
      if (currentPrice === null) {
        console.warn(`⚠️  Could not fetch price for ${symbol}`);
        continue;
      }
      
      // Check if condition is met
      const conditionMet = checkPriceCondition(
        currentPrice,
        parseFloat(targetPrice),
        condition || 'above'
      );
      
      // Check if this is a new trigger (price crossed threshold)
      const lastPrice = priceCache[`${zap.id}-${symbol}`];
      const isNewTrigger = lastPrice && (
        (condition === 'above' && lastPrice <= targetPrice && currentPrice > targetPrice) ||
        (condition === 'below' && lastPrice >= targetPrice && currentPrice < targetPrice)
      );
      
      // Update cache
      priceCache[`${zap.id}-${symbol}`] = currentPrice;
      
      if (conditionMet && (!lastPrice || isNewTrigger)) {
        console.log(`🚨 Price alert triggered! ${symbol} is ${condition} $${targetPrice} (current: $${currentPrice})`);
        
        // Trigger the zap
        await executeZap(zap.id, {
          price: currentPrice,
          symbol,
          targetPrice,
          condition,
          timestamp: new Date()
        });
      }
    }
    
  } catch (error) {
    console.error('Error monitoring price alerts:', error);
  }
}

/**
 * Execute a zap (call the test-zap endpoint)
 */
async function executeZap(zapId: string, triggerData: any) {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    console.log(`🚀 Executing zap ${zapId}...`);
    
    const response = await axios.post(
      `${frontendUrl}/api/test-zap/${zapId}`,
      { triggerData },
      { timeout: 30000 }
    );
    
    console.log(`✅ Zap ${zapId} executed successfully:`, response.data);
    
  } catch (error) {
    console.error(`❌ Error executing zap ${zapId}:`, error instanceof Error ? error.message : error);
  }
}
