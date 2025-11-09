import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    // Read the OpenAPI JSON file
    const filePath = path.join(process.cwd(), 'docs', 'api', 'openapi.json')
    const openApiSpec = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    // Generate Swagger UI HTML
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vera.lk API Documentation</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
      <link rel="icon" type="image/png" href="/favicon.png">
      <style>
        html {
          box-sizing: border-box;
          overflow: -moz-scrollbars-vertical;
          overflow-y: scroll;
        }
        *, *:before, *:after {
          box-sizing: inherit;
        }
        body {
          margin:0;
          background: #fafafa;
        }
        .swagger-ui .topbar {
          background-color: #1f2937;
        }
        .swagger-ui .topbar .download-url-wrapper .select-label {
          color: #f3f4f6;
        }
        .swagger-ui .info .title {
          color: #1f2937;
        }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            spec: ${JSON.stringify(openApiSpec)},
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            tryItOutEnabled: true,
            requestInterceptor: (request) => {
              // Add any request interceptors here
              return request;
            },
            responseInterceptor: (response) => {
              // Add any response interceptors here
              return response;
            }
          });
        };
      </script>
    </body>
    </html>
    `
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    logger.error('Error serving API docs', error as Error)
    return NextResponse.json(
      { error: 'Failed to load API documentation' },
      { status: 500 }
    )
  }
}