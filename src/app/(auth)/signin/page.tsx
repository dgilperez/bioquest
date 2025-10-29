import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SignInForm } from '@/components/auth/SignInForm';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to BioQuest with your iNaturalist account',
};

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  // If already signed in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-nature-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Image
              src="/images/logo.png"
              alt="BioQuest Logo"
              width={120}
              height={120}
              priority
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome to <span className="text-nature-600">BioQuest</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Transform your nature observations into an epic adventure
          </p>
        </div>

        <SignInForm />

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            By signing in, you agree to sync your iNaturalist observations
            <br />
            with BioQuest for gamification features.
          </p>
          <p className="mt-2">
            BioQuest is an unofficial companion app.
            <br />
            Not affiliated with iNaturalist.
          </p>
        </div>
      </div>
    </div>
  );
}
