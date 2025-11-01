'use client';

import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

interface GoogleConnectButtonProps {
  onConnectionChange?: (isConnected: boolean, email?: string) => void;
}

export function GoogleConnectButton({ onConnectionChange }: GoogleConnectButtonProps) {
  const { address } = useAccount();
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for OAuth callback in the URL
  useEffect(() => {
    const checkForCallback = () => {
      const params = new URLSearchParams(window.location.search);
      const googleAuth = params.get('google_auth');
      
      if (googleAuth === 'success') {
        toast.success('Successfully connected Google account');
        // Remove the query params from the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        // Refresh the connection status
        checkConnection();
      } else if (googleAuth === 'error') {
        const error = params.get('error');
        toast.error(`Google connection failed: ${error || 'Unknown error'}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    checkForCallback();
  }, []);

  const checkConnection = async () => {
    if (!address) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'}/api/v1/auth/google/status?wallet=${encodeURIComponent(address)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const connected = data.connected === true;
        setIsConnected(connected);
        onConnectionChange?.(connected, data.email);
      }
    } catch (error) {
      console.error('Error checking Google connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial connection check
  useEffect(() => {
    checkConnection();
    
    // Also set up a listener for storage events to handle cross-tab updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'google_oauth_state') {
        checkConnection();
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [address]);

  const handleConnect = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      // Generate a random state parameter
      const state = Math.random().toString(36).substring(2, 15);
      
      // Store the state in localStorage to verify later
      localStorage.setItem('google_oauth_state', state);
      
      // Build the OAuth URL
      const params = new URLSearchParams({
        wallet: address,
        state: state
      });
      
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'}/api/v1/auth/google?${params.toString()}`;
      
      // Open the OAuth flow in a popup or redirect
      window.location.href = url;
    } catch (error) {
      console.error('Google OAuth error:', error);
      toast.error('Failed to connect Google account');
    }
  };

  if (isLoading) {
    return (
      <Button disabled className="bg-gray-100 text-gray-600">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Checking connection...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <Button disabled className="bg-green-100 text-green-700 hover:bg-green-100">
        <Check className="w-4 h-4 mr-2" />
        Google Connected
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      className="bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
    >
      <svg
        className="w-4 h-4 mr-2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
          <path
            fill="#4285F4"
            d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.28426 53.749 C -8.52426 55.229 -9.24454 56.479 -10.4145 57.329 L -10.4395 57.556 L -5.4442 61.348 L -5.1942 61.373 C -3.12437 59.37 -2 56.568 -2 53.539 C -2 52.819 -2.073 52.149 -2.181 51.489 L -3.264 51.509 Z"
          />
          <path
            fill="#34A853"
            d="M -14.754 63.239 C -11.514 63.239 -8.8045 62.159 -6.7145 60.378 L -10.8145 56.828 C -11.8945 57.618 -13.364 58.109 -14.754 58.109 C -17.484 58.109 -19.8345 56.599 -20.8145 54.277 L -25.8945 54.277 L -26.0745 54.477 C -23.9845 58.439 -20.024 63.239 -14.754 63.239 Z"
          />
          <path
            fill="#FBBC05"
            d="M -20.8145 54.277 C -21.1945 53.097 -21.4145 51.839 -21.4145 50.539 C -21.4145 49.239 -21.1945 47.981 -20.8045 46.801 L -20.8045 46.461 L -25.8845 42.267 L -25.8945 42.277 C -27.2145 44.967 -27.8945 47.989 -27.8945 50.999 C -27.8945 54.009 -27.2145 57.031 -25.8945 59.721 L -20.8145 54.277 Z"
          />
          <path
            fill="#EA4335"
            d="M -14.754 42.969 C -12.984 42.969 -11.4045 43.549 -10.0545 44.649 L -6.6345 41.119 C -8.8045 39.109 -11.514 37.839 -14.754 37.839 C -20.024 37.839 -23.9845 42.639 -25.8945 46.601 L -20.8045 51.175 C -19.8245 48.853 -17.474 47.339 -14.754 47.339 C -13.354 47.339 -12.0545 47.809 -11.0045 48.609 C -9.9545 49.399 -9.2245 50.489 -8.9045 51.739 L -3.8845 47.939 C -5.1445 44.609 -7.6945 41.969 -10.8145 40.569 C -9.2645 39.489 -7.3145 38.839 -5.1942 38.839 L -14.754 42.969 Z"
          />
        </g>
      </svg>
      Connect Google Account
    </Button>
  );
}