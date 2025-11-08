const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INCLUDE_DIRS = ['app', 'components', 'lib'];
const FILE_EXTENSIONS = new Set(['.tsx', '.ts']);
const CLIENT_DIRECTIVE_RE = /['"]use client['"]/;

const HOOK_PATTERNS = [
  'useState',
  'useEffect',
  'useContext',
  'useReducer',
  'useMemo',
  'useCallback',
  'useRef',
  'useTransition',
  'useLayoutEffect',
  'useImperativeHandle',
];

const EVENT_PATTERNS = [
  'onClick=',
  'onChange=',
  'onSubmit=',
  'onKeyDown=',
  'onKeyUp=',
  'onKeyPress=',
  'onFocus=',
  'onBlur=',
  'onInput=',
  'onMouse',
  'onTouch',
];

function walkDir(dir, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.name.endsWith('.backup')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, results);
    } else if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
      const contents = fs.readFileSync(fullPath, 'utf8');
      if (!CLIENT_DIRECTIVE_RE.test(contents)) continue;

      const relPath = path.relative(ROOT, fullPath).replace(/\\/g, '/');
      const lines = contents.split(/\r?\n/);
      const imports = lines.filter((line) => /^\s*import\s+/.test(line));
      const hooks = {};
      for (const hook of HOOK_PATTERNS) {
        hooks[hook] = contents.includes(hook);
      }
      const events = {};
      for (const event of EVENT_PATTERNS) {
        events[event.replace(/=$/, '')] = contents.includes(event);
      }

      results.push({
        path: relPath,
        lines: lines.length,
        sizeBytes: fs.statSync(fullPath).size,
        imports,
        hooks,
        events,
        hasBrowserAPIs: /(window|document|localStorage|sessionStorage|navigator)/.test(contents),
        hasSupabase: /supabase/.test(contents),
        hasFetch: /fetch\(/.test(contents),
        hasRouter: /(useRouter|usePathname|useSearchParams)/.test(contents),
        hasAuthContext: /useAuth/.test(contents),
      });
    }
  }
}

const results = [];
for (const dir of INCLUDE_DIRS) {
  const absDir = path.join(ROOT, dir);
  if (fs.existsSync(absDir)) {
    walkDir(absDir, results);
  }
}

results.sort((a, b) => b.lines - a.lines);

fs.writeFileSync(
  path.join(ROOT, 'client-server-metadata.json'),
  JSON.stringify(results, null, 2),
  'utf8'
);

const pageEntries = results.filter((item) => /\/(page|layout)\.tsx$/i.test(item.path));
fs.writeFileSync(
  path.join(ROOT, 'client-pages-metadata.json'),
  JSON.stringify(pageEntries, null, 2),
  'utf8'
);

console.log(`Scanned ${results.length} client components.`);
console.log(`Client page/layout components: ${pageEntries.length}.`);
