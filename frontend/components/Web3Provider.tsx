'use client';

// Simple wrapper component for Web3 functionality
// Actual wallet connection is handled in individual pages using ethers.js

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
