/**
 * Apply a SQL file to the Supabase Postgres database using psql.
 * Usage: node scripts/migrations/apply-sql-file.js <relative-path-to-sql>
 */
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

require('dotenv').config({ path: '.env.local' })

async function main() {
  const fileArg = process.argv[2]
  if (!fileArg) {
    console.error('Usage: node scripts/migrations/apply-sql-file.js <relative-sql-path>')
    process.exit(1)
  }

  const sqlPath = path.resolve(process.cwd(), fileArg)
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found:', sqlPath)
    process.exit(1)
  }

  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
  if (!dbUrl) {
    console.error('ERROR: Missing DATABASE_URL or SUPABASE_DB_URL in .env.local')
    process.exit(1)
  }

  console.log('Applying SQL file:', sqlPath)
  try {
    const { stdout, stderr } = await execAsync(`psql "${dbUrl}" -f "${sqlPath}"`, {
      maxBuffer: 10 * 1024 * 1024,
    })
    if (stderr && !/NOTICE|WARNING/i.test(stderr)) {
      console.error('psql stderr:', stderr)
    }
    console.log(stdout || 'Done.')
  } catch (err) {
    if (String(err.message || '').includes('psql')) {
      console.error('psql not available. Run manually in Supabase SQL editor.')
    }
    throw err
  }
}

main().catch((e) => {
  console.error('Failed applying SQL:', e.message || e)
  process.exit(1)
})

