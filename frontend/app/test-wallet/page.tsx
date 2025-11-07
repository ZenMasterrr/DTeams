'use client';

import { WalletButton } from '@/components/WalletButton';
import { useAccount } from 'wagmi';

export default function TestWalletPage() {
  const { isConnected, chain } = useAccount();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Wallet Connection Test</h1>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Connection Status:</h2>
            <div className="p-3 bg-muted rounded-md">
              <p>Connected: {isConnected ? '✅ Yes' : '❌ No'}</p>
              {isConnected && (
                <div className="mt-2 text-sm space-y-1">
                  <p>Chain ID: {chain?.id}</p>
                  <p>Chain Name: {chain?.name}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Connect Wallet:</h2>
            <WalletButton />
          </div>
        </div>
      </div>
    </div>
  );
}
