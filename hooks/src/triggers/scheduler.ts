import { monitorAllGmailZaps } from './gmail-monitor';
import { monitorPriceAlerts } from './price-monitor';

/**
 * Start all trigger monitoring services
 */
export function startTriggerMonitoring() {
  console.log('\n🔄 Starting automatic trigger monitoring...\n');
  
  // Monitor Gmail triggers every 1 minute
  setInterval(async () => {
    try {
      await monitorAllGmailZaps();
    } catch (error) {
      console.error('Error in Gmail monitoring cycle:', error);
    }
  }, 60000); // 1 minute
  
  // Monitor price alerts every 1 minute
  setInterval(async () => {
    try {
      await monitorPriceAlerts();
    } catch (error) {
      console.error('Error in price monitoring cycle:', error);
    }
  }, 60000); // 1 minute
  
  // Run immediately on startup
  setTimeout(() => {
    monitorAllGmailZaps().catch(console.error);
    monitorPriceAlerts().catch(console.error);
  }, 5000); // Wait 5 seconds for server to fully start
  
  console.log('✅ Trigger monitoring started');
  console.log('   - Gmail: Checking every 60 seconds');
  console.log('   - Price Alerts: Checking every 60 seconds\n');
}
