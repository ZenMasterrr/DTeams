"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Zap, BookOpen, HelpCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { ZapList } from "@/components/ZapList";
import { toast } from "sonner";

export default function Dashboard() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleZapCreated = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    toast.success("Zap created successfully!");
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    toast.success("Zap list refreshed");
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
      // Clean up URL
      window.history.replaceState({}, document.title, '/dashboard');
    } else if (params.get('google_auth') === 'error') {
      toast.error('Failed to connect Google account');
      window.history.replaceState({}, document.title, '/dashboard');
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

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle>Create a Zap</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Automate tasks by connecting your favorite apps and services.</p>
              <Button className="mt-4 w-full" asChild>
                <Link href="/create-zap">Create Zap</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle>Learn</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Discover what you can automate with our guides and templates.</p>
              <Button variant="outline" className="mt-4 w-full">
                View Templates
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mb-4">
                <HelpCircle className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Get help from our documentation or contact support.</p>
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" className="flex-1">
                  Docs
                </Button>
                <Button variant="outline" className="flex-1">
                  Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}