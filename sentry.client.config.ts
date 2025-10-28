import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development';

// Only initialize Sentry in production, not in development
if (SENTRY_DSN && SENTRY_ENVIRONMENT === 'production') {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: SENTRY_ENVIRONMENT === 'development',

    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // You can also set custom tags or context here
    beforeSend(event, hint) {
      // Filter out certain errors if needed
      const error = hint.originalException;

      // Don't send errors for expected/handled cases
      if (error instanceof Error) {
        if (
          error.message.includes('Network request failed') ||
          error.message.includes('Failed to fetch')
        ) {
          // These are expected in some cases (offline, etc.)
          return null;
        }
      }

      return event;
    },
  });
}
