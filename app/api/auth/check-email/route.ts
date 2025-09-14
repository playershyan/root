import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', exists: false },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key for auth admin operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookies().getAll().map(({ name, value }) => ({ name, value }))
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookies().set(name, value, options)
            })
          },
        },
      }
    )

    // Check if user exists with this email using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('Error checking auth users:', authError)
      return NextResponse.json(
        { error: 'Failed to check email existence', exists: false },
        { status: 500 }
      )
    }

    // Check if email exists in auth.users
    const emailExists = authData.users?.some(user =>
      user.email?.toLowerCase() === email.toLowerCase()
    )

    return NextResponse.json({
      exists: !!emailExists,
      message: emailExists ? 'Email already registered' : 'Email available'
    })

  } catch (error) {
    console.error('Email check error:', error)
    return NextResponse.json(
      { error: 'Internal server error', exists: false },
      { status: 500 }
    )
  }
}