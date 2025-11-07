import { metaMask } from 'wagmi/connectors';

// Export the standard MetaMask connector with our dapp metadata
export { metaMask } from 'wagmi/connectors';

// Clean up Reown-related data when the app loads
if (typeof window !== 'undefined') {
  // Run cleanup on initial load
  Object.keys(window.localStorage).forEach(key => {
    if (key.includes('reown') || key.includes('appkit')) {
      window.localStorage.removeItem(key);
    }
  });

  // Also clean up when the page is about to unload
  window.addEventListener('beforeunload', () => {
    Object.keys(window.localStorage).forEach(key => {
      if (key.includes('reown') || key.includes('appkit')) {
        window.localStorage.removeItem(key);
      }
    });
  });
}
