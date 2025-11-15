export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side initialization (Node.js runtime)
    const Sentry = await import('@sentry/nextjs');

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://e84ef31faaf542b8de73f959d2db5b17@o4509934043725824.ingest.us.sentry.io/4509934048837632",
      
      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1.0,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,

      // Enable logs to be sent to Sentry
      enableLogs: true,

      // Set environment
      environment: process.env.NODE_ENV,

      integrations: [
        // Send console.log, console.warn, and console.error calls as logs to Sentry
        Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
      ],

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
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime initialization
    const Sentry = await import('@sentry/nextjs');

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://e84ef31faaf542b8de73f959d2db5b17@o4509934043725824.ingest.us.sentry.io/4509934048837632",
      
      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1.0,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,

      // Enable logs to be sent to Sentry
      enableLogs: true,

      // Set environment
      environment: process.env.NODE_ENV,

      integrations: [
        // Send console.log, console.warn, and console.error calls as logs to Sentry
        Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
      ],
    });
  }
}

