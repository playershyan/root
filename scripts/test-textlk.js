#!/usr/bin/env node

/**
 * Text.lk SMS/OTP Test Script for Sri Lankan SMS Gateway
 *
 * Usage:
 *   node scripts/test-textlk.js [phone_number]
 *
 * Example:
 *   node scripts/test-textlk.js 0771234567
 *   node scripts/test-textlk.js 94771234567
 *   node scripts/test-textlk.js +94771234567
 */

require('dotenv').config({ path: '.env.local' })

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function formatPhoneNumber(phoneNumber) {
  // Remove any spaces, dashes, or parentheses
  let formatted = phoneNumber.replace(/[\s\-\(\)]/g, '')

  // Remove leading + if exists
  if (formatted.startsWith('+')) {
    formatted = formatted.substring(1)
  }

  // Handle Sri Lankan numbers
  if (formatted.startsWith('0')) {
    // Local Sri Lankan number (e.g., 0771234567 -> 94771234567)
    formatted = '94' + formatted.substring(1)
  } else if (!formatted.startsWith('94')) {
    // Assume Sri Lankan number without country code
    formatted = '94' + formatted
  }

  return formatted
}

function validateSriLankanNumber(phoneNumber) {
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '')
  const patterns = [
    /^0[0-9]{9}$/,           // Local format: 0771234567
    /^94[0-9]{9}$/,          // Without +: 94771234567
    /^\+94[0-9]{9}$/,        // With +: +94771234567
  ]
  return patterns.some(pattern => pattern.test(cleaned))
}

async function testTextLK(phoneNumber) {
  log('\n🚀 Text.lk SMS Gateway Test (Sri Lanka)', 'bright')
  log('=========================================\n', 'bright')

  // Check environment variables
  log('1️⃣  Checking Environment Variables...', 'cyan')
  const apiKey = process.env.TEXTLK_API_KEY
  const senderId = process.env.TEXTLK_SENDER_ID || 'TextLKDemo'

  if (!apiKey) {
    log('❌ Missing Text.lk API credentials in .env.local', 'red')
    log('\nPlease add the following to your .env.local file:', 'yellow')
    log('TEXTLK_API_KEY=your_api_bearer_token', 'yellow')
    log('TEXTLK_SENDER_ID=your_sender_id (optional, defaults to vera.lk)', 'yellow')
    log('\n📝 How to get Text.lk API credentials:', 'cyan')
    log('1. Sign up at https://www.text.lk/', 'blue')
    log('2. Go to Dashboard → API Settings', 'blue')
    log('3. Generate an API token', 'blue')
    log('4. Set up a Sender ID (alphanumeric, max 11 chars)', 'blue')
    return
  }

  log('✅ Credentials found', 'green')
  log(`   API Key: ${apiKey.substring(0, 20)}...`, 'green')
  log(`   Sender ID: ${senderId}\n`, 'green')

  // Validate phone number
  log('2️⃣  Validating Phone Number...', 'cyan')
  if (!validateSriLankanNumber(phoneNumber)) {
    log('❌ Invalid Sri Lankan phone number format', 'red')
    log('   Valid formats:', 'yellow')
    log('   • 0771234567 (local format)', 'yellow')
    log('   • 94771234567 (country code without +)', 'yellow')
    log('   • +94771234567 (international format)', 'yellow')
    return
  }

  // Format phone number
  const formattedPhone = formatPhoneNumber(phoneNumber)
  log('✅ Valid phone number', 'green')
  log(`   Original: ${phoneNumber}`, 'blue')
  log(`   Formatted for API: ${formattedPhone}\n`, 'blue')

  // Generate OTP
  const otp = generateOTP()
  log('3️⃣  Generating OTP...', 'cyan')
  log(`   OTP Code: ${otp}\n`, 'magenta')

  // Prepare SMS message
  const message = `Your vera.lk verification code is: ${otp}\n\nValid for 10 minutes.\n\nDo not share this code with anyone.`

  // Send SMS via Text.lk API
  log('4️⃣  Sending SMS via Text.lk API...', 'cyan')

  try {
    const requestBody = {
      recipient: formattedPhone,
      sender_id: senderId,
      type: 'plain',
      message: message
    }

    log('   Request Details:', 'blue')
    log(`   • Endpoint: https://app.text.lk/api/v3/sms/send`, 'blue')
    log(`   • Recipient: ${formattedPhone}`, 'blue')
    log(`   • Sender ID: ${senderId}`, 'blue')
    log(`   • Message Type: plain\n`, 'blue')

    const response = await fetch('https://app.text.lk/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()

    if (result.status === 'success') {
      log('✅ SMS Sent Successfully!', 'green')
      log('   Response Details:', 'green')

      if (result.data) {
        // Display available data fields
        if (result.data.uid) log(`   • Message ID: ${result.data.uid}`, 'green')
        if (result.data.to) log(`   • To: ${result.data.to}`, 'green')
        if (result.data.from) log(`   • From: ${result.data.from}`, 'green')
        if (result.data.status) log(`   • Status: ${result.data.status}`, 'green')
        if (result.data.cost) log(`   • Cost: LKR ${result.data.cost}`, 'green')
        if (result.data.sms_count) log(`   • SMS Parts: ${result.data.sms_count}`, 'green')
      }

      log('\n📱 SMS Content:', 'cyan')
      log(message, 'blue')

      // Check message status after a delay (if message ID available)
      if (result.data && result.data.uid) {
        log('\n5️⃣  Checking delivery status (waiting 3 seconds)...', 'cyan')
        await new Promise(resolve => setTimeout(resolve, 3000))

        try {
          const statusResponse = await fetch(`https://app.text.lk/api/v3/sms/${result.data.uid}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })

          const statusResult = await statusResponse.json()

          if (statusResult.status === 'success' && statusResult.data) {
            log(`   Delivery Status: ${statusResult.data.status || 'Pending'}`,
                statusResult.data.status === 'Delivered' ? 'green' : 'yellow')
          }
        } catch (error) {
          log('   Could not fetch delivery status', 'yellow')
        }
      }

    } else {
      log('❌ Failed to send SMS', 'red')
      log(`   Error: ${result.message || 'Unknown error'}\n`, 'red')

      // Common error explanations
      if (result.message) {
        if (result.message.includes('balance')) {
          log('ℹ️  Note: Your Text.lk account may have insufficient balance.', 'yellow')
          log('   Top up your account at https://app.text.lk/', 'yellow')
        } else if (result.message.includes('authentication')) {
          log('ℹ️  Note: Check your TEXTLK_API_KEY in .env.local', 'yellow')
          log('   Generate a new token at https://app.text.lk/api-tokens', 'yellow')
        } else if (result.message.includes('sender')) {
          log('ℹ️  Note: Your sender ID may not be registered.', 'yellow')
          log('   Register sender ID at Text.lk dashboard', 'yellow')
        }
      }
    }

  } catch (error) {
    log('❌ Failed to send SMS', 'red')
    log(`   Error: ${error.message}\n`, 'red')

    if (error.message.includes('fetch')) {
      log('ℹ️  Note: Network error. Check your internet connection.', 'yellow')
    }
  }
}

// Main execution
async function main() {
  const phoneNumber = process.argv[2]

  if (!phoneNumber) {
    log('📱 Text.lk SMS/OTP Test Script', 'bright')
    log('\nUsage:', 'yellow')
    log('  node scripts/test-textlk.js [phone_number]', 'cyan')
    log('\nExamples for Sri Lankan numbers:', 'yellow')
    log('  node scripts/test-textlk.js 0771234567', 'cyan')
    log('  node scripts/test-textlk.js 94771234567', 'cyan')
    log('  node scripts/test-textlk.js +94771234567', 'cyan')
    log('\n📝 Note: Text.lk is a Sri Lankan SMS gateway optimized for local delivery', 'blue')
    log('   Lower costs compared to international providers like Twilio', 'blue')
    return
  }

  await testTextLK(phoneNumber)
}

main().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red')
  process.exit(1)
})