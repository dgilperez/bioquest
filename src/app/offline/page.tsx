'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-nature-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🌐</div>
        <h1 className="text-4xl font-display font-bold mb-4 bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
          You're Offline
        </h1>
        <p className="text-lg text-muted-foreground mb-6 font-body">
          No internet connection detected. Don't worry - you can still view your cached observations and stats!
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 mb-6">
          <h2 className="font-display font-semibold text-xl mb-4">What you can do offline:</h2>
          <ul className="space-y-2 text-left text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-nature-600">✓</span>
              <span>View your cached observations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-nature-600">✓</span>
              <span>Check your stats and badges</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-nature-600">✓</span>
              <span>Review completed quests</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-nature-600">✓</span>
              <span>Browse your profile</span>
            </li>
          </ul>
        </div>

        <div className="bg-nature-100 dark:bg-nature-900/20 rounded-lg border border-nature-300 dark:border-nature-700 p-4">
          <p className="text-sm text-nature-800 dark:text-nature-200">
            <strong>Tip:</strong> New observations and progress will sync automatically when you're back online.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 bg-nature-600 hover:bg-nature-700 text-white rounded-lg font-display font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
