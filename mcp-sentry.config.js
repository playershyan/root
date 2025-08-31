const { spawn } = require('child_process');
const path = require('path');

// Load environment variables from .env.local
try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
} catch (error) {
  // dotenv might not be installed, try loading without it
  console.warn('⚠️  dotenv not available, using system environment variables only');
}

// Check for required environment variables
const accessToken = process.env.SENTRY_ACCESS_TOKEN;
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (!accessToken) {
  console.error('❌ SENTRY_ACCESS_TOKEN is required but not set in environment variables');
  console.error('💡 Get your token from: https://sentry.io/settings/account/api/auth-tokens/');
  console.error('💡 Add it to your .env.local file: SENTRY_ACCESS_TOKEN=your_token_here');
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  MCP Server will not start until access token is configured');
    process.exit(0); // Exit gracefully in development
  } else {
    process.exit(1); // Exit with error in production
  }
}

// Enhanced startup with better error handling
if (require.main === module) {
  console.log('🔄 Initializing Sentry MCP Server...')
  
  // Build command arguments
  const args = [
    `--access-token=${accessToken}`
  ];
  
  if (dsn) {
    args.push(`--sentry-dsn=${dsn}`);
  }
  
  // Start the MCP server as a child process
  const isWindows = process.platform === 'win32';
  const mcpServer = spawn(isWindows ? 'npx.cmd' : 'npx', ['@sentry/mcp-server', ...args], {
    stdio: 'inherit',
    shell: isWindows,
    env: {
      ...process.env,
      SENTRY_ORG: process.env.SENTRY_ORG,
      SENTRY_PROJECT: process.env.SENTRY_PROJECT
    }
  });

  mcpServer.on('error', (err) => {
    console.error('❌ Failed to start Sentry MCP Server:', err);
    process.exit(1);
  });

  mcpServer.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Sentry MCP Server exited with code ${code}`);
      process.exit(code);
    }
    if (signal) {
      console.log(`🛑 Sentry MCP Server killed with signal ${signal}`);
      process.exit(0);
    }
  });

  console.log('✅ Sentry MCP Server started successfully');
  console.log('📡 Listening for MCP protocol requests...');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Shutting down Sentry MCP Server...');
    mcpServer.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('🛑 Shutting down Sentry MCP Server...');
    mcpServer.kill('SIGINT');
  });
}