const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { spawn } = require('child_process')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3001

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

let mcpProcess = null

// Start MCP Server
function startMCPServer() {
  console.log('🚀 Starting Sentry MCP Server...')
  
  mcpProcess = spawn('node', ['mcp-sentry.config.js'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: process.cwd()
  })

  mcpProcess.on('error', (err) => {
    console.error('❌ MCP Server failed to start:', err)
  })

  mcpProcess.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ MCP Server exited with code ${code}`)
    }
    if (signal) {
      console.log(`🛑 MCP Server killed with signal ${signal}`)
    }
  })

  console.log('✅ Sentry MCP Server started')
}

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)
  
  if (mcpProcess) {
    console.log('🔄 Stopping MCP Server...')
    mcpProcess.kill('SIGTERM')
    
    setTimeout(() => {
      if (mcpProcess && !mcpProcess.killed) {
        console.log('⚠️  Force killing MCP Server...')
        mcpProcess.kill('SIGKILL')
      }
    }, 5000)
  }
  
  process.exit(0)
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start the servers
app.prepare().then(() => {
  // Start MCP Server first
  startMCPServer()
  
  // Then start Next.js server
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err
    console.log(`✅ Next.js server ready on http://${hostname}:${port}`)
    console.log(`🔗 Both Next.js and Sentry MCP Server are running`)
  })
})

module.exports = { startMCPServer, gracefulShutdown }