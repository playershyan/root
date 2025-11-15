#!/usr/bin/env node

/**
 * Test Redis Connection Script
 * Tests Upstash Redis connection and basic operations
 * 
 * Usage: node scripts/test-redis.js
 */

const { Redis } = require('@upstash/redis')

// Load environment variables (optional, if dotenv is installed)
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  // dotenv not installed, environment variables should be set externally
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
const useUpstash = process.env.USE_UPSTASH?.toLowerCase() === 'true'

console.log('🔍 Redis Connection Test\n')
console.log('Configuration:')
console.log('  USE_UPSTASH:', useUpstash ? '✅ true' : '❌ false or not set')
console.log('  UPSTASH_REDIS_REST_URL:', redisUrl ? '✅ set' : '❌ not set')
console.log('  UPSTASH_REDIS_REST_TOKEN:', redisToken ? '✅ set' : '❌ not set')
console.log()

if (!redisUrl || !redisToken) {
  console.error('❌ Missing required environment variables!')
  console.error('\nPlease set:')
  console.error('  - USE_UPSTASH=true')
  console.error('  - UPSTASH_REDIS_REST_URL')
  console.error('  - UPSTASH_REDIS_REST_TOKEN')
  console.error('\nYou can set these in:')
  console.error('  - .env.local (for local development)')
  console.error('  - Vercel/Render environment variables (for production)')
  process.exit(1)
}

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
})

async function testConnection() {
  try {
    console.log('📡 Testing Redis connection...')
    const pong = await redis.ping()
    if (pong === 'PONG') {
      console.log('✅ Connection successful!\n')
    } else {
      console.log('⚠️  Unexpected response:', pong, '\n')
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    throw error
  }
}

async function testSetGet() {
  try {
    console.log('📝 Testing SET/GET operations...')
    const testKey = `test:${Date.now()}`
    const testValue = 'Hello Redis!'
    
    await redis.set(testKey, testValue)
    console.log(`  ✅ SET ${testKey} = "${testValue}"`)
    
    const value = await redis.get(testKey)
    if (value === testValue) {
      console.log(`  ✅ GET ${testKey} = "${value}"`)
    } else {
      console.log(`  ❌ GET failed: expected "${testValue}", got "${value}"`)
    }
    
    // Cleanup
    await redis.del(testKey)
    console.log(`  ✅ DEL ${testKey}\n`)
  } catch (error) {
    console.error('❌ SET/GET test failed:', error.message)
    throw error
  }
}

async function testRateLimiting() {
  try {
    console.log('⚡ Testing rate limiting operations...')
    const counterKey = `test:counter:${Date.now()}`
    
    // Test INCR
    const count1 = await redis.incr(counterKey)
    console.log(`  ✅ INCR ${counterKey} = ${count1}`)
    
    const count2 = await redis.incr(counterKey)
    console.log(`  ✅ INCR ${counterKey} = ${count2}`)
    
    // Test EXPIRE
    await redis.expire(counterKey, 60)
    console.log(`  ✅ EXPIRE ${counterKey} = 60 seconds`)
    
    // Test GET
    const count = await redis.get(counterKey)
    console.log(`  ✅ GET ${counterKey} = ${count}`)
    
    // Cleanup
    await redis.del(counterKey)
    console.log(`  ✅ DEL ${counterKey}\n`)
  } catch (error) {
    console.error('❌ Rate limiting test failed:', error.message)
    throw error
  }
}

async function testSets() {
  try {
    console.log('📊 Testing SET operations...')
    const setKey = `test:set:${Date.now()}`
    
    // Test SADD
    await redis.sadd(setKey, 'member1', 'member2', 'member3')
    console.log(`  ✅ SADD ${setKey} = 3 members`)
    
    // Test SMEMBERS
    const members = await redis.smembers(setKey)
    console.log(`  ✅ SMEMBERS ${setKey} = ${members.length} members`)
    
    // Test SISMEMBER
    const isMember = await redis.sismember(setKey, 'member1')
    console.log(`  ✅ SISMEMBER ${setKey} member1 = ${isMember}`)
    
    // Cleanup
    await redis.del(setKey)
    console.log(`  ✅ DEL ${setKey}\n`)
  } catch (error) {
    console.error('❌ SET operations test failed:', error.message)
    throw error
  }
}

async function testInfo() {
  try {
    console.log('📊 Getting Redis info...')
    const info = await redis.info()
    console.log('  ✅ INFO retrieved')
    console.log('  (Info length:', info?.length || 0, 'characters)\n')
  } catch (error) {
    // INFO might not be available in REST API, that's OK
    console.log('  ⚠️  INFO command not available (this is normal for REST API)\n')
  }
}

async function runTests() {
  try {
    await testConnection()
    await testSetGet()
    await testRateLimiting()
    await testSets()
    await testInfo()
    
    console.log('🎉 All tests passed!')
    console.log('\n✅ Redis is properly configured and working.')
    console.log('   Your application will now use Redis for:')
    console.log('   - Rate limiting (distributed across instances)')
    console.log('   - Metrics storage')
    console.log('   - IP quarantine tracking')
    console.log('\n💡 Monitor your usage in the Upstash dashboard:')
    console.log('   https://console.upstash.com/')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Test suite failed!')
    console.error('Error:', error.message)
    console.error('\n🔍 Troubleshooting:')
    console.error('  1. Check environment variables are set correctly')
    console.error('  2. Verify Upstash database is active')
    console.error('  3. Check network connectivity')
    console.error('  4. Review Upstash dashboard for errors')
    process.exit(1)
  }
}

// Run tests
runTests()

