'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DashboardV2() {
  const [selectedMode, setSelectedMode] = useState<'centralized' | 'decentralized' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Choose Your Automation Mode
          </h1>
          <p className="text-gray-600 text-lg">
            DTeams supports both centralized (free) and decentralized (Web3) automation
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* Centralized Mode Card */}
          <div 
            className={`bg-white rounded-2xl shadow-xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl ${
              selectedMode === 'centralized' ? 'ring-4 ring-blue-500 scale-105' : ''
            }`}
            onClick={() => setSelectedMode('centralized')}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">🏢 Centralized</h2>
              <span className="bg-green-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-full">
                FREE
              </span>
            </div>

            <p className="text-gray-600 mb-6">
              Traditional cloud-based automation. Fast, easy, and free to use.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✅</span>
                <div>
                  <p className="font-semibold">Completely Free</p>
                  <p className="text-sm text-gray-500">No charges, no fees</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✅</span>
                <div>
                  <p className="font-semibold">Fast Setup</p>
                  <p className="text-sm text-gray-500">Create zaps in seconds</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✅</span>
                <div>
                  <p className="font-semibold">No Wallet Needed</p>
                  <p className="text-sm text-gray-500">Just email and password</p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-yellow-500 text-xl mr-3">⚠️</span>
                <div>
                  <p className="font-semibold">Platform Controlled</p>
                  <p className="text-sm text-gray-500">Zaps stored on our servers</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-yellow-500 text-xl mr-3">⚠️</span>
                <div>
                  <p className="font-semibold">Trust Required</p>
                  <p className="text-sm text-gray-500">You trust us to execute</p>
                </div>
              </div>
            </div>

            <Link href="/create-zap">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 shadow-lg">
                Create Centralized Zap →
              </button>
            </Link>
          </div>

          {/* Decentralized Mode Card */}
          <div 
            className={`bg-white rounded-2xl shadow-xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl ${
              selectedMode === 'decentralized' ? 'ring-4 ring-purple-500 scale-105' : ''
            }`}
            onClick={() => setSelectedMode('decentralized')}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">🔗 Decentralized</h2>
              <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-4 py-2 rounded-full">
                WEB3
              </span>
            </div>

            <p className="text-gray-600 mb-6">
              Blockchain-powered automation. You own your zaps as NFTs.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✅</span>
                <div>
                  <p className="font-semibold">You Own Zaps (NFTs)</p>
                  <p className="text-sm text-gray-500">Transferable, tradeable</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✅</span>
                <div>
                  <p className="font-semibold">Trustless</p>
                  <p className="text-sm text-gray-500">Smart contracts guarantee execution</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✅</span>
                <div>
                  <p className="font-semibold">Censorship Resistant</p>
                  <p className="text-sm text-gray-500">No one can block your zaps</p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-blue-500 text-xl mr-3">💰</span>
                <div>
                  <p className="font-semibold">Gas Fees Apply</p>
                  <p className="text-sm text-gray-500">~$2-5 per execution</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-blue-500 text-xl mr-3">🔐</span>
                <div>
                  <p className="font-semibold">Web3 Wallet Required</p>
                  <p className="text-sm text-gray-500">MetaMask or similar</p>
                </div>
              </div>
            </div>

            <Link href="/create-zap-web3">
              <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg">
                Create Decentralized Zap →
              </button>
            </Link>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">Feature Comparison</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-4 px-4">Feature</th>
                  <th className="text-center py-4 px-4">🏢 Centralized</th>
                  <th className="text-center py-4 px-4">🔗 Decentralized</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Cost</td>
                  <td className="text-center py-4 px-4">
                    <span className="text-green-600 font-semibold">FREE</span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="text-blue-600 font-semibold">~$2-5/execution</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Setup Time</td>
                  <td className="text-center py-4 px-4">⚡ Instant</td>
                  <td className="text-center py-4 px-4">🔧 5 minutes</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Ownership</td>
                  <td className="text-center py-4 px-4">❌ Platform</td>
                  <td className="text-center py-4 px-4">✅ You (NFT)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Trust Model</td>
                  <td className="text-center py-4 px-4">⚠️ Trust us</td>
                  <td className="text-center py-4 px-4">✅ Trustless</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Transparency</td>
                  <td className="text-center py-4 px-4">❌ Private</td>
                  <td className="text-center py-4 px-4">✅ Public (on-chain)</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Censorship</td>
                  <td className="text-center py-4 px-4">❌ Can be blocked</td>
                  <td className="text-center py-4 px-4">✅ Resistant</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <h4 className="font-bold text-blue-900 mb-2">💡 Recommendation</h4>
          <p className="text-blue-800">
            <strong>New users:</strong> Start with <strong>Centralized</strong> mode to learn the platform for free.
            <br />
            <strong>Advanced users:</strong> Use <strong>Decentralized</strong> mode for true ownership and censorship resistance.
            <br />
            <strong>Best of both:</strong> You can use both! Create some zaps centrally and others on blockchain.
          </p>
        </div>
      </div>
    </div>
  );
}
