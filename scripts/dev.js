#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Starting VERA LK Development Server with Sentry MCP')
console.log('───────────────────────────────────────────────────────────')

// Set environment
process.env.NODE_ENV = 'development'

// Start the integrated server
const serverProcess = spawn('node', ['server.js'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: {
    ...process.env,
    FORCE_COLOR: '1' // Enable colors in output
  }
})

serverProcess.on('error', (err) => {
  console.error('❌ Failed to start development server:', err)
  process.exit(1)
})

serverProcess.on('exit', (code, signal) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Development server exited with code ${code}`)
  }
  if (signal) {
    console.log(`🛑 Development server killed with signal ${signal}`)
  }
  process.exit(code || 0)
})

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...')
  serverProcess.kill('SIGINT')
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminating development server...')
  serverProcess.kill('SIGTERM')
})