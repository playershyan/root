import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'docs', 'api', 'openapi.json')
    const openApiSpec = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    return NextResponse.json(openApiSpec, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    logger.error('Error loading OpenAPI spec', error as Error)
    return NextResponse.json(
      { error: 'Failed to load OpenAPI specification' },
      { status: 500 }
    )
  }
}