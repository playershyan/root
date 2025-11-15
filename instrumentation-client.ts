import * as Sentry from "@sentry/nextjs";

// Client-side Sentry configuration
// This file replaces sentry.client.config.ts for better Turbopack compatibility
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://e84ef31faaf542b8de73f959d2db5b17@o4509934043725824.ingest.us.sentry.io/4509934048837632",
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration options
      maskAllText: true,
      blockAllMedia: true,
    }),
    // Send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],

  // Filter out non-critical errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Filter out network errors that are not actionable
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('Load failed')) {
      return null;
    }

    // Filter out some browser extension errors
    if (error && typeof error === 'object' && 'stack' in error && typeof error.stack === 'string' && error.stack.includes('extension://')) {
      return null;
    }

    return event;
  },

  // Set environment
  environment: process.env.NODE_ENV,
});

// Export hook for router transition instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

