import { createSentryMCPTool } from './sentryIntegration'

// Example usage of MCP with Sentry integration
export async function exampleMCPUsage() {
  // Create an MCP tool instance with Sentry monitoring
  const mcpTool = createSentryMCPTool('example_session_123')

  try {
    // Example 1: Database operation with monitoring
    console.log('Executing database query...')
    const dbResult = await mcpTool.executeDatabaseQuery(
      'SELECT * FROM listings WHERE status = ?',
      ['active']
    )
    console.log('Database result:', dbResult)

    // Example 2: File upload with monitoring
    console.log('Processing file upload...')
    const mockFile = {
      name: 'example.jpg',
      size: 1024000,
      type: 'image/jpeg'
    }
    const uploadResult = await mcpTool.processFileUpload(mockFile, {
      quality: 0.8,
      resize: { width: 800, height: 600 }
    })
    console.log('Upload result:', uploadResult)

    // Example 3: External API call with monitoring
    console.log('Making external API call...')
    const apiResult = await mcpTool.makeExternalAPICall(
      'https://jsonplaceholder.typicode.com/posts/1',
      { method: 'GET' }
    )
    console.log('API result:', apiResult)

  } catch (error) {
    console.error('MCP operation failed:', error)
    // Error is automatically reported to Sentry via the MCP tool
  }
}

// Usage in API routes or server components
export async function handleListingOperation(listingId: string) {
  const mcpTool = createSentryMCPTool(`listing_${listingId}`)

  try {
    // This will be automatically tracked in Sentry with MCP context
    return await mcpTool.executeDatabaseQuery(
      'UPDATE listings SET view_count = view_count + 1 WHERE id = ?',
      [listingId]
    )
  } catch (error) {
    // Error automatically reported with listing context
    throw error
  }
}