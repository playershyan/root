import { NextResponse } from 'next/server'
import { SandboxPaymentService } from '@/lib/payments/sandboxPaymentService'

export async function GET() {
  const isEnabled = SandboxPaymentService.isSandboxMode()
  
  return NextResponse.json({ 
    enabled: isEnabled 
  })
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

