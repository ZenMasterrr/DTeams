"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { ZapList } from "@/components/ZapList";
import { toast } from "sonner";

export default function Dashboard() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);

  const handleZapCreated = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    toast.success("Zap created successfully!");
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    toast.success("Zap list refreshed");
  }, []);

  const handleConnectGoogle = useCallback(() => {
    // Get wallet address from localStorage or use a default
    const wallet = localStorage.getItem('wallet') || 
                   localStorage.getItem('address') || 
                   'user-' + Date.now();
    
    // Redirect to Google OAuth
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
    window.location.href = `${backendUrl}/api/v1/auth/google?wallet=${encodeURIComponent(wallet)}`;
  }, []);

  useEffect(() => {
    setIsClient(true);
    
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signup");
      return;
    }

    // Check for authentication success/error in URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_auth') === 'success') {
      toast.success('Successfully connected Google account');
      setGoogleConnected(true);
      // Store connection status
      localStorage.setItem('google_connected', 'true');
      // Clean up URL
      window.history.replaceState({}, document.title, '/dashboard');
    } else if (params.get('google_auth') === 'error') {
      toast.error('Failed to connect Google account');
      window.history.replaceState({}, document.title, '/dashboard');
    }

    // Check if Google is already connected
    const googleConnectedStatus = localStorage.getItem('google_connected');
    if (googleConnectedStatus === 'true') {
      setGoogleConnected(true);
    }
  }, [router]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Google Account Connection Banner */}
      {!googleConnected ? (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Connect Google Account</h3>
                  <p className="text-sm text-blue-700">
                    Connect your Google account to use Gmail, Sheets, and Calendar in your workflows
                  </p>
                </div>
              </div>
              <Button onClick={handleConnectGoogle} variant="default" className="bg-blue-600 hover:bg-blue-700">
                Connect Google
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Google Account Connected</h3>
                  <p className="text-sm text-green-700">
                    Your Google account is connected. You can now use Gmail, Sheets, and Calendar in your workflows.
                  </p>
                </div>
              </div>
              <Button onClick={handleConnectGoogle} variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                Reconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Zaps</h1>
          <p className="text-gray-600">Manage your automated workflows</p>
        </div>
        <Link href="/create-zap">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Zap
          </Button>
        </Link>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Active Zaps</CardTitle>
              <CardDescription>View and manage your active workflows</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Error loading zaps: {error}</p>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            <ZapList 
              key={refreshKey} 
              onLoadingChange={setIsLoading}
              onError={setError}
              onZapCreated={handleZapCreated}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}