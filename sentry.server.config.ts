import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Set environment
  environment: process.env.NODE_ENV,

  // Enhanced error context for server-side errors
  beforeSend(event, hint) {
    // Add server context
    if (event.request) {
      event.tags = {
        ...event.tags,
        server: true,
      };
    }

    return event;
  },
});