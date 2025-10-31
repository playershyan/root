#!/usr/bin/env node

/**
 * Lighthouse Performance Testing Script
 * Runs Lighthouse tests on all main application pages
 *
 * Usage:
 *   npm install -g lighthouse
 *   npm run dev (in separate terminal)
 *   node scripts/lighthouse-test.js
 *
 * Output: lighthouse-reports/ directory with HTML and JSON reports
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.LIGHTHOUSE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'lighthouse-reports');
const TIMESTAMP = new Date().toISOString().split('T')[0];

// Pages to test (excluding static/legal pages as requested)
const PAGES_TO_TEST = [
  {
    name: 'Home',
    url: '/',
    description: 'Main landing page with vehicle listings'
  },
  {
    name: 'Browse Listings',
    url: '/listings',
    description: 'Vehicle listings browse page'
  },
  {
    name: 'Listing Detail',
    url: '/listings/sample-id', // Replace with actual ID during testing
    description: 'Individual vehicle listing detail page',
    skip: true, // Requires dynamic ID
    note: 'Update with actual listing ID before running'
  },
  {
    name: 'Post Listing',
    url: '/post',
    description: 'Create new vehicle listing form'
  },
  {
    name: 'User Profile',
    url: '/profile',
    description: 'User profile and dashboard',
    requiresAuth: true
  },
  {
    name: 'Browse Wanted Requests',
    url: '/wanted',
    description: 'Wanted requests browse page'
  },
  {
    name: 'Wanted Detail',
    url: '/wanted/sample-id', // Replace with actual ID
    description: 'Individual wanted request detail',
    skip: true,
    note: 'Update with actual wanted request ID'
  },
  {
    name: 'Post Wanted Request',
    url: '/wanted/post',
    description: 'Create wanted request form'
  },
  {
    name: 'Wanted Search',
    url: '/wanted/search',
    description: 'Search wanted requests'
  },
  {
    name: 'Cars by Make',
    url: '/lk/cars/toyota', // Example make
    description: 'Listings filtered by make'
  },
  {
    name: 'Cars by Model',
    url: '/lk/cars/toyota/prius', // Example model
    description: 'Listings filtered by make and model'
  },
  {
    name: 'Business Profile',
    url: '/business/sample-id', // Replace with actual ID
    description: 'Business dealer profile page',
    skip: true,
    note: 'Update with actual business profile ID'
  },
  {
    name: 'Forgot Password',
    url: '/forgot-password',
    description: 'Password recovery page'
  },
  {
    name: 'Reset Password',
    url: '/reset-password',
    description: 'Password reset page'
  }
];

// Lighthouse configuration
const LIGHTHOUSE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'mobile',
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4
    },
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      disabled: false
    }
  }
};

// Desktop configuration
const DESKTOP_CONFIG = {
  ...LIGHTHOUSE_CONFIG,
  settings: {
    ...LIGHTHOUSE_CONFIG.settings,
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1
    }
  }
};

/**
 * Run Lighthouse test for a single page
 */
async function runLighthouseTest(chrome, page, config, deviceType) {
  const url = `${BASE_URL}${page.url}`;

  console.log(`\n🔍 Testing ${page.name} (${deviceType})...`);
  console.log(`   URL: ${url}`);

  try {
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      output: 'html',
      logLevel: 'info'
    }, config);

    // Extract scores
    const { lhr } = runnerResult;
    const scores = {
      performance: lhr.categories.performance.score * 100,
      accessibility: lhr.categories.accessibility.score * 100,
      bestPractices: lhr.categories['best-practices'].score * 100,
      seo: lhr.categories.seo.score * 100
    };

    // Save HTML report
    const reportHtml = runnerResult.report;
    const fileName = `${page.name.toLowerCase().replace(/\s+/g, '-')}-${deviceType}`;
    const reportPath = path.join(OUTPUT_DIR, TIMESTAMP, `${fileName}.html`);

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, reportHtml);

    // Save JSON for programmatic access
    const jsonPath = path.join(OUTPUT_DIR, TIMESTAMP, `${fileName}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(lhr, null, 2));

    console.log(`   ✓ Performance: ${scores.performance.toFixed(0)}`);
    console.log(`   ✓ Accessibility: ${scores.accessibility.toFixed(0)}`);
    console.log(`   ✓ Best Practices: ${scores.bestPractices.toFixed(0)}`);
    console.log(`   ✓ SEO: ${scores.seo.toFixed(0)}`);
    console.log(`   📄 Report saved: ${reportPath}`);

    return { page: page.name, deviceType, scores, reportPath, metrics: lhr.audits };
  } catch (error) {
    console.error(`   ✗ Error testing ${page.name}:`, error.message);
    return { page: page.name, deviceType, error: error.message };
  }
}

/**
 * Generate summary report
 */
function generateSummaryReport(results) {
  const summaryPath = path.join(OUTPUT_DIR, TIMESTAMP, 'summary.html');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lighthouse Test Summary - ${TIMESTAMP}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1a73e8;
      margin-top: 0;
    }
    h2 {
      color: #333;
      border-bottom: 2px solid #1a73e8;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
    }
    .score {
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
      min-width: 40px;
      text-align: center;
    }
    .score-good { background: #0cce6b; color: white; }
    .score-average { background: #ffa400; color: white; }
    .score-poor { background: #ff4e42; color: white; }
    .device-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .device-mobile { background: #e8f0fe; color: #1967d2; }
    .device-desktop { background: #fce8e6; color: #c5221f; }
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: #1a73e8;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
    .timestamp {
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Lighthouse Performance Report</h1>
    <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>

    ${generateSummaryStats(results)}

    <h2>Detailed Results</h2>
    <table>
      <thead>
        <tr>
          <th>Page</th>
          <th>Device</th>
          <th>Performance</th>
          <th>Accessibility</th>
          <th>Best Practices</th>
          <th>SEO</th>
          <th>Report</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(result => {
          if (result.error) {
            return `
              <tr>
                <td>${result.page}</td>
                <td><span class="device-badge device-${result.deviceType}">${result.deviceType}</span></td>
                <td colspan="4" style="color: #d93025;">Error: ${result.error}</td>
                <td>-</td>
              </tr>
            `;
          }

          return `
            <tr>
              <td>${result.page}</td>
              <td><span class="device-badge device-${result.deviceType}">${result.deviceType}</span></td>
              <td>${getScoreBadge(result.scores.performance)}</td>
              <td>${getScoreBadge(result.scores.accessibility)}</td>
              <td>${getScoreBadge(result.scores.bestPractices)}</td>
              <td>${getScoreBadge(result.scores.seo)}</td>
              <td><a href="${path.basename(result.reportPath)}" target="_blank">View Report</a></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <h2>Recommendations</h2>
    ${generateRecommendations(results)}
  </div>
</body>
</html>
  `;

  fs.writeFileSync(summaryPath, html);
  console.log(`\n📊 Summary report saved: ${summaryPath}`);
  return summaryPath;
}

function generateSummaryStats(results) {
  const validResults = results.filter(r => !r.error);
  if (validResults.length === 0) return '<p>No valid results to analyze.</p>';

  const avgScores = {
    performance: validResults.reduce((sum, r) => sum + r.scores.performance, 0) / validResults.length,
    accessibility: validResults.reduce((sum, r) => sum + r.scores.accessibility, 0) / validResults.length,
    bestPractices: validResults.reduce((sum, r) => sum + r.scores.bestPractices, 0) / validResults.length,
    seo: validResults.reduce((sum, r) => sum + r.scores.seo, 0) / validResults.length
  };

  return `
    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-value">${avgScores.performance.toFixed(0)}</div>
        <div class="stat-label">Avg Performance</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgScores.accessibility.toFixed(0)}</div>
        <div class="stat-label">Avg Accessibility</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgScores.bestPractices.toFixed(0)}</div>
        <div class="stat-label">Avg Best Practices</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgScores.seo.toFixed(0)}</div>
        <div class="stat-label">Avg SEO</div>
      </div>
    </div>
  `;
}

function getScoreBadge(score) {
  const roundedScore = Math.round(score);
  let className = 'score-poor';
  if (roundedScore >= 90) className = 'score-good';
  else if (roundedScore >= 50) className = 'score-average';

  return `<span class="score ${className}">${roundedScore}</span>`;
}

function generateRecommendations(results) {
  const issues = [];

  results.forEach(result => {
    if (result.error || !result.scores) return;

    if (result.scores.performance < 50) {
      issues.push(`<li><strong>${result.page}</strong>: Poor performance score. Review bundle size, images, and code splitting.</li>`);
    }
    if (result.scores.accessibility < 90) {
      issues.push(`<li><strong>${result.page}</strong>: Accessibility needs improvement. Check ARIA labels, contrast ratios, and keyboard navigation.</li>`);
    }
  });

  if (issues.length === 0) {
    return '<p>✅ All pages meet baseline performance standards!</p>';
  }

  return `<ul>${issues.join('')}</ul>`;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Lighthouse Performance Tests...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📁 Output Directory: ${OUTPUT_DIR}/${TIMESTAMP}`);

  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });

  const results = [];

  // Test each page (mobile + desktop)
  for (const page of PAGES_TO_TEST) {
    if (page.skip) {
      console.log(`\n⏭️  Skipping ${page.name}: ${page.note}`);
      continue;
    }

    // Mobile test
    const mobileResult = await runLighthouseTest(chrome, page, LIGHTHOUSE_CONFIG, 'mobile');
    results.push(mobileResult);

    // Desktop test
    const desktopResult = await runLighthouseTest(chrome, page, DESKTOP_CONFIG, 'desktop');
    results.push(desktopResult);
  }

  // Close Chrome
  await chrome.kill();

  // Generate summary
  const summaryPath = generateSummaryReport(results);

  console.log('\n✅ All tests complete!');
  console.log(`\n📊 Open summary report: ${summaryPath}`);
  console.log(`\n💡 Tip: Open reports in a web browser to view detailed metrics.\n`);
}

// Run tests
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runLighthouseTest, generateSummaryReport };
