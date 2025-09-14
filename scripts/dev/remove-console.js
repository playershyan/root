const fs = require('fs');
const path = require('path');

const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);
const roots = ['app', 'lib', 'supabase/functions'];
const excludeDirs = new Set(['node_modules', '.next', 'tests', '__tests__']);

function shouldExclude(p) {
  return [...excludeDirs].some(seg => p.split(path.sep).includes(seg));
}

function stripConsole(source) {
  // Remove whole statements like: console.log(...);
  // Handles multiline until the closing );
  const regex = /\bconsole\.(log|warn|error|info|debug)\s*\(([^)]|\)(?!;))*\);?/gms;
  return source.replace(regex, '');
}

function processFile(file) {
  const ext = path.extname(file);
  if (!exts.has(ext)) return;
  const rel = file;
  if (shouldExclude(rel)) return;
  if (rel.startsWith('tests' + path.sep)) return;
  try {
    const src = fs.readFileSync(file, 'utf8');
    if (!/\bconsole\.(log|warn|error|info|debug)\s*\(/.test(src)) return;
    const out = stripConsole(src);
    if (out !== src) {
      fs.writeFileSync(file, out, 'utf8');
      process.stdout.write(file + '\n');
    }
  } catch (e) {}
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (excludeDirs.has(entry)) continue;
      walk(full);
    } else {
      processFile(full);
    }
  }
}

for (const root of roots) walk(root);

