const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const METADATA_PATH = path.join(ROOT, 'client-server-metadata.json');

if (!fs.existsSync(METADATA_PATH)) {
  throw new Error('client-server-metadata.json not found. Run client_component_scan.cjs first.');
}

const entries = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));

const summary = {
  totals: {
    components: entries.length,
    pages: 0,
    layouts: 0,
    sharedComponents: 0,
    lib: 0,
    contexts: 0,
  },
  hooks: {},
  events: {},
  usage: {
    supabase: 0,
    fetch: 0,
    router: 0,
    authContext: 0,
    browserAPIs: 0,
  },
  patterns: {
    dataFetchOnly: [],
    authGuardOnly: [],
    layoutWrappers: [],
    staticButClient: [],
    heavyClient: [],
  },
};

function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

for (const entry of entries) {
  const { path: filePath, hooks, events, hasFetch, hasSupabase, hasRouter, hasAuthContext, hasBrowserAPIs } = entry;
  const lower = filePath.toLowerCase();
  if (lower.endsWith('/page.tsx')) summary.totals.pages += 1;
  else if (lower.endsWith('/layout.tsx')) summary.totals.layouts += 1;
  else if (lower.startsWith('app/components')) summary.totals.sharedComponents += 1;
  else if (lower.startsWith('components/')) summary.totals.sharedComponents += 1;
  else if (lower.startsWith('lib/contexts')) summary.totals.contexts += 1;
  else if (lower.startsWith('lib/')) summary.totals.lib += 1;

  if (hasSupabase) summary.usage.supabase += 1;
  if (hasFetch) summary.usage.fetch += 1;
  if (hasRouter) summary.usage.router += 1;
  if (hasAuthContext) summary.usage.authContext += 1;
  if (hasBrowserAPIs) summary.usage.browserAPIs += 1;

  // Hook counts
  for (const [hook, used] of Object.entries(hooks)) {
    if (used) increment(summary.hooks, hook);
  }

  for (const [event, used] of Object.entries(events)) {
    if (used) increment(summary.events, event);
  }

  const hookCount = Object.values(hooks).filter(Boolean).length;
  const eventCount = Object.values(events).filter(Boolean).length;

  const isStatic = hookCount === 0 && eventCount === 0 && !hasBrowserAPIs && !hasRouter;
  const hasDataFetch = hasFetch || hasSupabase;
  const interactiveHookNames = Object.entries(hooks)
    .filter(([, used]) => used)
    .map(([name]) => name);

  if (
    hasDataFetch &&
    interactiveHookNames.every((name) => name === 'useEffect' || name === 'useState') &&
    eventCount === 0 &&
    !hasBrowserAPIs &&
    !hasRouter
  ) {
    summary.patterns.dataFetchOnly.push(filePath);
  }

  if (
    hasAuthContext &&
    hasRouter &&
    interactiveHookNames.every((name) => ['useEffect', 'useState', 'useMemo'].includes(name)) &&
    eventCount === 0 &&
    !hasBrowserAPIs
  ) {
    summary.patterns.authGuardOnly.push(filePath);
  }

  if (filePath.endsWith('/layout.tsx') && hookCount === 0 && eventCount === 0) {
    summary.patterns.layoutWrappers.push(filePath);
  }

  if (isStatic) {
    summary.patterns.staticButClient.push(filePath);
  }

  if (hookCount >= 5 || eventCount >= 5 || entry.lines >= 600) {
    summary.patterns.heavyClient.push(filePath);
  }
}

fs.writeFileSync(
  path.join(ROOT, 'client-pattern-summary.json'),
  JSON.stringify(summary, null, 2),
  'utf8'
);

console.log('Client component pattern summary generated.');
