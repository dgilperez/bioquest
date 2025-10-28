import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || 'dev';

// Only initialize Sentry in production, not in dev
if (SENTRY_DSN && SENTRY_ENVIRONMENT === 'production') {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: SENTRY_ENVIRONMENT !== 'production',

    beforeSend(event, hint) {
      // Filter out certain errors if needed
      const error = hint.originalException;

      // Don't send errors for expected/handled cases
      if (error instanceof Error) {
        if (
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ETIMEDOUT')
        ) {
          // These are expected in some cases (network issues)
          return null;
        }
      }

      return event;
    },
  });
}
