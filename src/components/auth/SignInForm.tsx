'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('inaturalist', {
        callbackUrl: '/dashboard',
      });
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
            Use your iNaturalist account to get started
          </p>
        </div>

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
