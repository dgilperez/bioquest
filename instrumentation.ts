/**
 * Next.js Instrumentation
 *
 * This file is loaded once when the server starts (both dev and production).
 * Use it for initialization tasks like cleanup, telemetry setup, etc.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on server, not edge runtime
    console.log('🚀 Server starting - running initialization tasks...');

    try {
      // Import here to avoid loading DB code in edge runtime
      const { resetStaleProcessingItems } = await import(
        '@/lib/rarity-queue/manager'
      );

      // Reset any stale processing items from previous server crashes
      const resetCount = await resetStaleProcessingItems();

      if (resetCount > 0) {
        console.log(`✅ Initialization complete: ${resetCount} stale items reset`);
      } else {
        console.log('✅ Initialization complete: No stale items found');
      }
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      // Don't throw - allow server to start even if cleanup fails
    }
  }
}
