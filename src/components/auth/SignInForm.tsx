'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('naturalist');
  const [isMockMode, setIsMockMode] = useState(false);

  // Check mock mode on client side only to avoid hydration mismatch
  useEffect(() => {
    const checkMockMode = async () => {
      try {
        const response = await fetch('/api/auth/providers');
        const providers = await response.json();
        // If we see 'mock' provider instead of 'inaturalist', we're in mock mode
        setIsMockMode('mock' in providers);
      } catch {
        setIsMockMode(false);
      }
    };
    checkMockMode();
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      if (isMockMode) {
        // Use mock provider with credentials
        const result = await signIn('mock', {
          username,
          redirect: true,
          callbackUrl: 'http://localhost:3001/dashboard',
        });

        if (result?.error) {
          console.error('Sign in error:', result.error);
          setIsLoading(false);
        }
      } else {
        // Use real iNaturalist OAuth
        await signIn('inaturalist', {
          callbackUrl: '/dashboard',
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold">Sign in to continue</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {isMockMode
              ? '🎭 Demo Mode - Mock data for development'
              : 'Use your iNaturalist account to get started'
            }
          </p>
        </div>

        {isMockMode && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mock Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-nature-500 focus:outline-none focus:ring-2 focus:ring-nature-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Enter any username"
            />
            <p className="text-xs text-gray-500">
              Enter any username to try the app with mock data
            </p>
          </div>
        )}

        <Button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full bg-nature-600 hover:bg-nature-700"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              {isMockMode ? (
                <>🎭 Sign in with Mock Data</>
              ) : (
                <>
                  <svg
                    className="mr-2 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                  </svg>
                  Sign in with iNaturalist
                </>
              )}
            </>
          )}
        </Button>

        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
          <p className="flex items-start gap-2">
            <span className="text-nature-600">✓</span>
            <span>Sync your observations automatically</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-nature-600">✓</span>
            <span>Earn points and unlock badges</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-nature-600">✓</span>
            <span>Track your progress and stats</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-nature-600">✓</span>
            <span>Discover rare and legendary species</span>
          </p>
        </div>
      </div>
    </div>
  );
}
