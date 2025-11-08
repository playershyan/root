const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES_PATH = path.join(ROOT, 'client-pages-metadata.json');

if (!fs.existsSync(PAGES_PATH)) {
  throw new Error('client-pages-metadata.json not found. Run client_component_scan.cjs first.');
}

const pages = JSON.parse(fs.readFileSync(PAGES_PATH, 'utf8'));

function countTruthy(obj) {
  if (!obj) return 0;
  return Object.values(obj).filter(Boolean).length;
}

const analysis = pages.map((page) => {
  const hookCount = countTruthy(page.hooks);
  const eventCount = countTruthy(page.events);
  const interactivityScore = hookCount * 2 + eventCount * 3 + (page.hasBrowserAPIs ? 4 : 0) + (page.hasRouter ? 2 : 0);
  let recommendation;
  if (eventCount === 0 && hookCount === 0 && !page.hasBrowserAPIs && !page.hasRouter && !page.hasAuthContext) {
    recommendation = 'server';
  } else if (page.lines > 600 || eventCount > 5 || hookCount > 4) {
    recommendation = 'split';
  } else {
    recommendation = 'review';
  }

  return {
    path: page.path,
    lines: page.lines,
    sizeKB: Number((page.sizeBytes / 1024).toFixed(1)),
    hookCount,
    eventCount,
    hasBrowserAPIs: page.hasBrowserAPIs,
    hasSupabase: page.hasSupabase,
    hasFetch: page.hasFetch,
    hasRouter: page.hasRouter,
    hasAuthContext: page.hasAuthContext,
    recommendation,
    interactivityScore,
  };
});

analysis.sort((a, b) => b.lines - a.lines);

fs.writeFileSync(
  path.join(ROOT, 'client-pages-analysis.json'),
  JSON.stringify(analysis, null, 2),
  'utf8'
);

const summary = analysis.reduce((acc, item) => {
  acc[item.recommendation] = (acc[item.recommendation] || 0) + 1;
  return acc;
}, {});

console.log(`Analyzed ${analysis.length} client page/layout components.`);
console.log('Recommendation summary:', summary);
