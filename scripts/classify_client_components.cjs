const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const METADATA_PATH = path.join(ROOT, 'client-server-metadata.json');
const SUMMARY_PATH = path.join(ROOT, 'client-pattern-summary.json');

if (!fs.existsSync(METADATA_PATH)) {
  throw new Error('client-server-metadata.json not found. Run client_component_scan.cjs first.');
}

if (!fs.existsSync(SUMMARY_PATH)) {
  throw new Error('client-pattern-summary.json not found. Run analyze_client_components.cjs first.');
}

const entries = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));

const heavySet = new Set(summary.patterns.heavyClient || []);
const dataFetchSet = new Set(summary.patterns.dataFetchOnly || []);
const staticSet = new Set(summary.patterns.staticButClient || []);
const authGuardSet = new Set(summary.patterns.authGuardOnly || []);

function countTruthy(obj) {
  return Object.values(obj).filter(Boolean).length;
}

function classify(entry) {
  const hookCount = countTruthy(entry.hooks);
  const eventCount = countTruthy(entry.events);
  const { path: filePath } = entry;

  const metrics = {
    hookCount,
    eventCount,
    lines: entry.lines,
    sizeKB: Number((entry.sizeBytes / 1024).toFixed(1)),
    hasBrowserAPIs: entry.hasBrowserAPIs,
    hasSupabase: entry.hasSupabase,
    hasFetch: entry.hasFetch,
    hasRouter: entry.hasRouter,
    hasAuthContext: entry.hasAuthContext,
  };

  const notes = [];
  let category = 'C';
  let reason = 'Interactive component with client state or event handlers';

  const normalizedPath = filePath.replace(/\\/g, '/');
  const isPage = /\/(page|layout)\.tsx$/i.test(normalizedPath);
  const isVehicleForm = normalizedPath.includes('vehicle-forms/');
  const isNotifications = normalizedPath.includes('notifications/');

  if (heavySet.has(filePath) || entry.lines >= 600) {
    category = 'B';
    reason = 'Large client module mixing concerns; split server data + client UI';
    notes.push('Heavy client usage or large file');
  } else if (authGuardSet.has(filePath)) {
    category = 'B';
    reason = 'Auth gating on client; move auth check to server and keep minimal client shell if needed';
    notes.push('Auth guard pattern');
  } else if (dataFetchSet.has(filePath) && !isNotifications) {
    category = 'A';
    reason = 'Data fetching via useEffect without user interaction';
    notes.push('Switch to server data loading');
  } else if (
    staticSet.has(filePath) &&
    !isVehicleForm &&
    !isNotifications &&
    !normalizedPath.includes('Toast') &&
    hookCount === 0 &&
    eventCount === 0
  ) {
    category = 'A';
    reason = 'Pure presentational markup; remove client directive';
    notes.push('Static UI component');
  } else if (
    hookCount === 0 &&
    eventCount === 0 &&
    !entry.hasBrowserAPIs &&
    !entry.hasRouter &&
    !entry.hasAuthContext &&
    !isVehicleForm &&
    !isNotifications
  ) {
    category = 'A';
    reason = 'No hooks, events, or browser APIs detected';
  } else if (
    isPage &&
    (entry.hasSupabase || entry.hasFetch) &&
    hookCount <= 3 &&
    eventCount <= 1
  ) {
    category = 'B';
    reason = 'Page performs data fetching plus limited UI; pull data server-side and keep small client widgets';
  } else if (hookCount === 0 && eventCount === 0 && !entry.hasBrowserAPIs && !entry.hasRouter) {
    category = 'A';
    reason = 'Minimal client usage; safe to convert to server component';
  }

  if (isVehicleForm) {
    category = 'C';
    reason = 'Form components rely on client state via parent callbacks';
    notes.push('Receives setFormData or event handlers');
  }

  if (isNotifications) {
    category = 'C';
    reason = 'Notification system relies on runtime event handlers or callbacks';
    notes.push('Notification system requires client interactivity');
  }

  return {
    path: filePath,
    category,
    reason,
    notes,
    metrics,
  };
}

const classification = entries.map(classify);

fs.writeFileSync(
  path.join(ROOT, 'client-component-classification.json'),
  JSON.stringify(classification, null, 2),
  'utf8'
);

const grouped = classification.reduce((acc, item) => {
  if (!acc[item.category]) acc[item.category] = [];
  acc[item.category].push(item);
  return acc;
}, {});

for (const list of Object.values(grouped)) {
  list.sort((a, b) => b.metrics.lines - a.metrics.lines);
}

fs.writeFileSync(
  path.join(ROOT, 'client-component-groups.json'),
  JSON.stringify(grouped, null, 2),
  'utf8'
);

const impact = Object.fromEntries(
  Object.entries(grouped).map(([category, list]) => {
    const totalLines = list.reduce((sum, item) => sum + item.metrics.lines, 0);
    const totalKB = list.reduce((sum, item) => sum + item.metrics.sizeKB, 0);
    const avgKB = list.length ? totalKB / list.length : 0;
    return [category, {
      count: list.length,
      totalLines,
      totalKB: Number(totalKB.toFixed(1)),
      avgKB: Number(avgKB.toFixed(1)),
    }];
  })
);

fs.writeFileSync(
  path.join(ROOT, 'client-component-impact.json'),
  JSON.stringify(impact, null, 2),
  'utf8'
);

if (grouped.B) {
  fs.writeFileSync(
    path.join(ROOT, 'client-top-b-components.json'),
    JSON.stringify(grouped.B.slice(0, 10), null, 2),
    'utf8'
  );
}

if (grouped.A) {
  fs.writeFileSync(
    path.join(ROOT, 'client-category-a-components.json'),
    JSON.stringify(grouped.A, null, 2),
    'utf8'
  );
}

const counts = Object.fromEntries(
  Object.entries(grouped).map(([key, value]) => [key, value.length])
);

console.log('Classification counts:', counts);
