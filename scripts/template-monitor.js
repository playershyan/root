#!/usr/bin/env node

/**
 * Template Generation Monitoring Script
 *
 * Usage:
 *   node scripts/template-monitor.js [command]
 *
 * Commands:
 *   status    - Check current template status
 *   history   - Show generation history
 *   next      - Show next scheduled generation date
 *   simulate  - Simulate cron job execution (dry run)
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTemplateStatus() {
  console.log('📊 Template Status Check')
  console.log('========================')

  try {
    // Check active templates
    const { data: activeTemplates, error } = await supabase
      .from('description_templates')
      .select('id, version, usage_count, created_at')
      .eq('is_active', true)

    if (error) throw error

    console.log(`✅ Active Templates: ${activeTemplates?.length || 0}`)

    if (activeTemplates && activeTemplates.length > 0) {
      const currentVersion = activeTemplates[0].version
      const totalUsage = activeTemplates.reduce((sum, t) => sum + (t.usage_count || 0), 0)
      const avgUsage = (totalUsage / activeTemplates.length).toFixed(2)

      console.log(`📅 Current Version: ${currentVersion}`)
      console.log(`📈 Total Usage: ${totalUsage}`)
      console.log(`📊 Average Usage: ${avgUsage} per template`)
      console.log(`🕒 Last Created: ${new Date(activeTemplates[0].created_at).toLocaleString()}`)
    }

    // Check if regeneration is needed
    const currentDate = new Date()
    const currentVersion = parseInt(`${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`)
    const latestVersion = activeTemplates && activeTemplates.length > 0 ? activeTemplates[0].version : 0

    const needsRegeneration = latestVersion < currentVersion
    console.log(`🔄 Needs Regeneration: ${needsRegeneration ? 'YES' : 'NO'}`)

  } catch (error) {
    console.error('❌ Error checking template status:', error.message)
  }
}

async function showGenerationHistory() {
  console.log('📋 Generation History')
  console.log('====================')

  try {
    const { data: logs, error } = await supabase
      .from('template_generation_logs')
      .select('*')
      .order('generation_date', { ascending: false })
      .limit(10)

    if (error) throw error

    if (!logs || logs.length === 0) {
      console.log('No generation history found.')
      return
    }

    logs.forEach((log, index) => {
      const date = new Date(log.generation_date).toLocaleString()
      const status = getStatusEmoji(log.generation_status)
      console.log(`${index + 1}. ${status} ${date}`)
      console.log(`   Status: ${log.generation_status}`)
      console.log(`   Templates: ${log.total_templates_generated}`)
      console.log(`   Cost: $${log.openai_cost_estimate || 0}`)
      if (log.error_message) {
        console.log(`   Error: ${log.error_message}`)
      }
      console.log()
    })

  } catch (error) {
    console.error('❌ Error fetching generation history:', error.message)
  }
}

function getStatusEmoji(status) {
  switch (status) {
    case 'completed': return '✅'
    case 'failed': return '❌'
    case 'in_progress': return '⏳'
    case 'pending': return '⏸️'
    default: return '❓'
  }
}

function showNextScheduledRun() {
  console.log('⏰ Next Scheduled Generation')
  console.log('============================')

  const now = new Date()
  const startDate = new Date('2025-10-30T02:00:00.000Z')

  if (now < startDate) {
    console.log(`🚀 First generation scheduled for: ${startDate.toLocaleString()}`)
    const daysUntil = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24))
    console.log(`⏳ Days until activation: ${daysUntil}`)
    return
  }

  // Calculate next 30th of month at 2 AM
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  let nextRun = new Date(currentYear, currentMonth, 30, 2, 0, 0)

  // If we've passed this month's 30th, move to next month
  if (now > nextRun) {
    nextRun = new Date(currentYear, currentMonth + 1, 30, 2, 0, 0)
  }

  // Handle months with fewer than 30 days
  if (nextRun.getDate() !== 30) {
    nextRun = new Date(currentYear, currentMonth + 2, 30, 2, 0, 0)
  }

  console.log(`📅 Next run: ${nextRun.toLocaleString()}`)

  const daysUntil = Math.ceil((nextRun - now) / (1000 * 60 * 60 * 24))
  console.log(`⏳ Days until next run: ${daysUntil}`)
}

async function simulateCronExecution() {
  console.log('🧪 Simulating Cron Job Execution')
  console.log('=================================')

  const startDate = new Date('2025-10-30')
  const currentDate = new Date()

  if (currentDate < startDate) {
    console.log(`⏸️  Generation not yet active. Start date: ${startDate.toISOString()}`)
    return
  }

  // Simulate the cron logic without actually generating templates
  try {
    const { data: latestTemplates } = await supabase
      .from('description_templates')
      .select('version')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)

    const currentVersion = parseInt(`${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`)
    const latestVersion = latestTemplates && latestTemplates.length > 0 ? latestTemplates[0].version : 0

    const needsRegeneration = latestVersion < currentVersion

    console.log(`📊 Current version: ${currentVersion}`)
    console.log(`📊 Latest version: ${latestVersion}`)
    console.log(`🔄 Would regenerate: ${needsRegeneration ? 'YES' : 'NO'}`)

    if (needsRegeneration) {
      console.log(`✨ Cron job would generate 100 new templates`)
      console.log(`💰 Estimated cost: ~$0.002`)
    } else {
      console.log(`✅ Templates are up to date, would skip generation`)
    }

  } catch (error) {
    console.error('❌ Simulation error:', error.message)
  }
}

async function main() {
  const command = process.argv[2] || 'status'

  console.log(`🤖 Template Monitor - vera.lk`)
  console.log(`Command: ${command}`)
  console.log(`Time: ${new Date().toLocaleString()}`)
  console.log()

  switch (command) {
    case 'status':
      await checkTemplateStatus()
      break
    case 'history':
      await showGenerationHistory()
      break
    case 'next':
      showNextScheduledRun()
      break
    case 'simulate':
      await simulateCronExecution()
      break
    default:
      console.log('Available commands: status, history, next, simulate')
  }
}

main().catch(console.error)