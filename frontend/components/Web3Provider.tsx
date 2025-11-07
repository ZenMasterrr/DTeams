'use client';

import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, Connector } from 'wagmi';

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { connect, connectors, error, status } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingConnector, setPendingConnector] = useState<Connector | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsConnecting(status === 'pending');
  }, [status]);

  if (!mounted) {
    return <div>Loading Web3...</div>;
  }

  const handleConnect = async (connector: Connector) => {
    try {
      setIsConnecting(true);
      setPendingConnector(connector);
      await connect({ connector });
    } catch (err) {
      console.error('Failed to connect:', err);
    } finally {
      setIsConnecting(false);
      setPendingConnector(null);
    }
  };

  return (
    <div>
      {children}
      
      {/* Connection Status */}
      <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg text-sm">
        {isConnected ? (
          <div>
            <p>Connected to Chain ID: {chainId}</p>
            <p>Address: {address ? `${address.substring(0, 6)}...${address.substring(38)}` : 'Unknown'}</p>
            <button 
              onClick={() => disconnect()}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={isConnecting}
            >
              {isConnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <div>
            <h3 className="font-bold mb-2">Connect Wallet</h3>
            {connectors.map((connector) => {
              const connectorId = connector.id || connector.name;
              return (
                <button
                  disabled={!connector.ready || isConnecting}
                  key={connectorId}
                  onClick={() => handleConnect(connector)}
                  className="block w-full px-4 py-2 mb-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {connector.name}
                  {!connector.ready && ' (unsupported)'}
                  {isConnecting && pendingConnector?.id === connectorId && ' (connecting)'}
                </button>
              );
            })}
            {error && <div className="text-red-500 mt-2">{error.message}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
