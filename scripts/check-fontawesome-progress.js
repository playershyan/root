#!/usr/bin/env node

/**
 * FontAwesome Migration Progress Tracker
 * 
 * Usage: node scripts/check-fontawesome-progress.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RESET = '\x1b[0m';
const BRIGHT = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

const INITIAL_COUNT = 119; // Starting count in app directory

function countFontAwesomeUsage() {
  try {
    const output = execSync(
      'grep -r "className=.*fa[sr]\\? fa-" app --include="*.tsx" --include="*.jsx" 2>/dev/null || true',
      { encoding: 'utf-8', shell: '/bin/bash' }
    );
    
    const lines = output.trim().split('\n').filter(line => line.length > 0);
    return lines.length;
  } catch (error) {
    // If grep finds nothing, it returns non-zero exit code
    return 0;
  }
}

function getFileBreakdown() {
  try {
    const output = execSync(
      'grep -r "className=.*fa[sr]\\? fa-" app --include="*.tsx" 2>/dev/null | cut -d: -f1 | sort | uniq -c | sort -rn || true',
      { encoding: 'utf-8', shell: '/bin/bash' }
    );
    
    return output.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    return [];
  }
}

function calculateProgress(current, initial) {
  const completed = initial - current;
  const percentage = ((completed / initial) * 100).toFixed(1);
  return { completed, percentage };
}

function getProgressBar(percentage, width = 40) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return GREEN + '█'.repeat(filled) + RESET + '░'.repeat(empty);
}

function main() {
  console.log(`\n${BRIGHT}${CYAN}╔═══════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BRIGHT}${CYAN}║  FontAwesome → Lucide Migration Progress Tracker          ║${RESET}`);
  console.log(`${BRIGHT}${CYAN}╚═══════════════════════════════════════════════════════════╝${RESET}\n`);

  const currentCount = countFontAwesomeUsage();
  const { completed, percentage } = calculateProgress(currentCount, INITIAL_COUNT);

  // Overall Progress
  console.log(`${BRIGHT}Overall Progress:${RESET}`);
  console.log(`${getProgressBar(percentage)} ${GREEN}${percentage}%${RESET}\n`);

  console.log(`${BRIGHT}Statistics:${RESET}`);
  console.log(`  Initial count:    ${YELLOW}${INITIAL_COUNT}${RESET} icons`);
  console.log(`  Remaining:        ${currentCount > 0 ? RED : GREEN}${currentCount}${RESET} icons`);
  console.log(`  Completed:        ${GREEN}${completed}${RESET} icons\n`);

  // Phase breakdown
  console.log(`${BRIGHT}Phase Targets:${RESET}`);
  
  const phases = [
    { name: 'Phase 1: Listing Components', target: 70 },
    { name: 'Phase 2: Wanted Requests', target: 11 },
    { name: 'Phase 3: Forms & Post Pages', target: 13 },
    { name: 'Phase 4: UI Components', target: 7 },
    { name: 'Phase 5: Legacy Files', target: 18 },
  ];

  phases.forEach(phase => {
    const icon = completed >= phase.target ? GREEN + '✓' : YELLOW + '○';
    console.log(`  ${icon} ${phase.name.padEnd(35)} ${phase.target} icons${RESET}`);
  });

  // File breakdown
  if (currentCount > 0) {
    console.log(`\n${BRIGHT}Top Files Remaining:${RESET}`);
    const breakdown = getFileBreakdown();
    breakdown.slice(0, 10).forEach(line => {
      const match = line.trim().match(/(\d+)\s+(.+)/);
      if (match) {
        const count = match[1];
        const file = match[2].replace(/^app\//, '');
        console.log(`  ${RED}${count.padStart(3)}${RESET} icons - ${file}`);
      }
    });
    
    if (breakdown.length > 10) {
      console.log(`  ${YELLOW}... and ${breakdown.length - 10} more files${RESET}`);
    }
  } else {
    console.log(`\n${GREEN}${BRIGHT}🎉 All FontAwesome icons have been migrated! 🎉${RESET}`);
  }

  // Next steps
  if (currentCount > 0) {
    console.log(`\n${BRIGHT}Next Steps:${RESET}`);
    console.log(`  1. Choose a file from the list above`);
    console.log(`  2. Open ${CYAN}docs/migration/FONTAWESOME_MIGRATION_PLAN.md${RESET} for detailed instructions`);
    console.log(`  3. Use ${CYAN}docs/migration/fontawesome-to-lucide.md${RESET} for icon mappings`);
    console.log(`  4. Run this script again to track progress\n`);
  } else {
    console.log(`\n${BRIGHT}Final Checklist:${RESET}`);
    console.log(`  ${YELLOW}○${RESET} Run ${CYAN}npm run build${RESET} to verify no errors`);
    console.log(`  ${YELLOW}○${RESET} Check bundle size reduction`);
    console.log(`  ${YELLOW}○${RESET} Run Lighthouse performance test`);
    console.log(`  ${YELLOW}○${RESET} Visual regression testing`);
    console.log(`  ${YELLOW}○${RESET} Deploy to production\n`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { countFontAwesomeUsage, calculateProgress };

