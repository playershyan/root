import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT_DIR = path.resolve('app');
const OUTPUT_DIR = path.resolve('reports');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'use-client-audit.json');
const OUTPUT_MARKDOWN = path.join(OUTPUT_DIR, 'use-client-audit.md');

const FILE_EXTENSIONS = new Set(['.ts', '.tsx']);

const hooksRegex = /use(State|Reducer|Effect|LayoutEffect|Context|Ref|Callback|Memo|ImperativeHandle|DebugValue|Id|DeferredValue|Transition|SyncExternalStore|InsertionEffect)\s*(?:<[^>]+>)?\s*\(/;
const stateRegex = /use(State|Reducer)\s*(?:<[^>]+>)?\s*\(/;
const effectRegex = /use(Effect|LayoutEffect|InsertionEffect)\s*(?:<[^>]+>)?\s*\(/;
const contextRegex = /useContext\s*(?:<[^>]+>)?\s*\(/;
const refRegex = /useRef\s*(?:<[^>]+>)?\s*\(/;
const eventHandlerRegex = /\son[A-Z][\w]*\s*=/;
const browserApiRegex = /\b(window|document|navigator|localStorage|sessionStorage|history|location|crypto|Notification|performance|matchMedia|ResizeObserver)\b/;
const domManipulationRegex = /\.(querySelector|getElementById|getElementsBy|createElement|appendChild|classList|focus|scrollIntoView|setAttribute|removeAttribute)\s*\(/;

const thirdPartyIndicators = [
  /react-hot-toast/,
  /framer-motion/,
  /react-hook-form/,
  /zustand/,
  /@capacitor\//,
  /@google-analytics/,
  /mixpanel/,
  /sentry/,
  /@stripe\//,
  /cloudinary/,
  /react-phone-number-input/,
  /react-select/,
  /react-use/,
  /firebase/,
  /supabase/,
  /socket\.io/,
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    const ext = path.extname(entry.name);
    if (!FILE_EXTENSIONS.has(ext)) continue;

    files.push(fullPath);
  }

  return files;
}

function detectFeatures(content) {
  const hasState = stateRegex.test(content);
  const hasEffect = effectRegex.test(content);
  const hasEventHandlers = eventHandlerRegex.test(content);
  const hasBrowserApis = browserApiRegex.test(content);
  const hasRef = refRegex.test(content);
  const hasDomManipulation = domManipulationRegex.test(content);
  const hasHooks = hooksRegex.test(content);
  const hasClientContext = contextRegex.test(content);
  const hasThirdPartyClient = thirdPartyIndicators.some((pattern) => pattern.test(content));

  return {
    hasUseStateOrReducer: hasState,
    hasUseEffectOrLayout: hasEffect,
    hasEventHandlers,
    hasBrowserApis,
    hasUseRef: hasRef,
    hasDomManipulation,
    hasThirdPartyClient,
    hasClientContext,
    hasAnyHook: hasHooks,
  };
}

const SAFE_CONVERT_PATTERNS = [
  /Badge/i,
  /Status/i,
  /Message/i,
  /Label/i,
  /Promotion/i,
  /Indicator/i,
  /Header\.tsx$/i,
  /Footer\.tsx$/i,
];

const RISKY_CONVERT_PATTERNS = [
  /Form/i,
  /Factory/i,
  /page\.tsx$/i,
  /use[A-Z]/,
  /Hook/i,
  /Modal/i,
  /Card/i,
  /Section/i,
  /Filter/i,
  /Search/i,
  /Toast/i,
  /Notification/i,
  /Provider/i,
  /Context/i,
  /Table/i,
  /Chart/i,
  /Wizard/i,
];

function decideVerdict(relativePath, features) {
  const fileName = path.basename(relativePath);
  const {
    hasUseStateOrReducer,
    hasUseEffectOrLayout,
    hasEventHandlers,
    hasBrowserApis,
    hasDomManipulation,
    hasThirdPartyClient,
    hasClientContext,
  } = features;

  const featureFlags = [
    hasUseStateOrReducer,
    hasUseEffectOrLayout,
    hasEventHandlers,
    hasBrowserApis,
    hasDomManipulation,
    hasThirdPartyClient,
    hasClientContext,
  ];

  const hasClientOnlyFeature = featureFlags.some(Boolean);

  if (!hasClientOnlyFeature) {
    const matchesSafePattern = SAFE_CONVERT_PATTERNS.some((regex) => regex.test(fileName));
    const matchesRiskyPattern = RISKY_CONVERT_PATTERNS.some((regex) => regex.test(fileName));

    if (matchesSafePattern && !matchesRiskyPattern) {
      return {
        verdict: 'convert_to_server',
        reasoning: 'No client-only hooks or browser APIs detected; component is a pure display element.',
      };
    }

    return {
      verdict: 'keep_client',
      reasoning: 'No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.',
    };
  }

  const splitCandidates = [
    'Badge',
    'Status',
    'Message',
    'Card',
    'Label',
    'Banner',
    'Indicator',
    'Tag',
  ];

  const isSplitCandidate = splitCandidates.some((keyword) => relativePath.includes(keyword));

  if (isSplitCandidate && !hasUseStateOrReducer && !hasUseEffectOrLayout && hasEventHandlers && !hasBrowserApis) {
    return {
      verdict: 'split_component',
      reasoning: 'Lightweight interactivity detected (event handlers without local state). Consider extracting handlers into a client sub-component.',
    };
  }

  return {
    verdict: 'keep_client',
    reasoning: 'Uses client-only features that require the component to remain a Client Component.',
  };
}

function formatCheckbox(value) {
  return value ? '[x]' : '[ ]';
}

function buildAnalysisMarkdown(analysis) {
  const lines = ['# \'use client\' Audit Results', ''];

  lines.push('## Summary Statistics');
  lines.push(`- Total components with 'use client': ${analysis.summary.total_components}`);
  lines.push(`- Can be converted to Server: ${analysis.summary.can_convert} (${analysis.summary.can_convert_percentage}%)`);
  lines.push(`- Need to be split: ${analysis.summary.need_split} (${analysis.summary.need_split_percentage}%)`);
  lines.push(`- Must remain Client: ${analysis.summary.must_remain_client} (${analysis.summary.must_remain_client_percentage}%)`);
  lines.push('');
  lines.push('## Estimated Bundle Savings');
  lines.push(`- Components to convert: ${analysis.summary.can_convert} × avg 5KB = ${analysis.summary.convert_savings_kb}KB`);
  lines.push(`- Components to split: ${analysis.summary.need_split} × avg 3KB = ${analysis.summary.split_savings_kb}KB`);
  lines.push(`- **Total Estimated Savings**: ${analysis.summary.total_savings_kb}KB`);
  lines.push('');

  const quickWins = analysis.components.filter((item) => item.verdict === 'convert_to_server' && item.priority === 'high').slice(0, 10);
  if (quickWins.length) {
    lines.push('## High Priority Conversions (Quick Wins)');
    for (const item of quickWins) {
      lines.push('');
      lines.push(`### ${item.path}`);
      lines.push('- **Reason**: Pure display, no interactivity detected');
      lines.push('- **Action**: Remove \'use client\' directive');
      lines.push('- **Estimated Savings**: ~5KB');
    }
    lines.push('');
  }

  const splits = analysis.components.filter((item) => item.verdict === 'split_component');
  if (splits.length) {
    lines.push('## Components Requiring Split');
    let index = 1;
    for (const item of splits) {
      lines.push('');
      lines.push(`### ${index}. ${item.path}`);
      lines.push(`- **Current**: ${item.reasoning}`);
      lines.push(`- **Strategy**: Extract interactive elements into dedicated Client Component`);
      lines.push('- **Estimated Savings**: ~3KB');
      index += 1;
    }
    lines.push('');
  }

  const keepers = analysis.components.filter((item) => item.verdict === 'keep_client');
  if (keepers.length) {
    lines.push('## Components That Must Remain Client');
    let index = 1;
    for (const item of keepers.slice(0, 20)) {
      lines.push('');
      lines.push(`### ${index}. ${item.path}`);
      lines.push(`- **Reason**: ${item.reasoning}`);
      lines.push('- **Action**: No change');
      index += 1;
    }
    lines.push('');
  }

  lines.push('## Implementation Priority Order');
  lines.push('1. Pure display components (no dependencies)');
  lines.push('2. Simple splits (single button extraction)');
  lines.push('3. Complex splits (multiple interactive elements)');
  lines.push('4. Components with external dependencies');
  lines.push('');

  lines.push('## Detailed Analysis');
  lines.push('');

  for (const component of analysis.components) {
    lines.push(`### Component: \`${component.path}\``);
    lines.push('');
    lines.push(`**Current Status**: 'use client' directive present`);
    lines.push('');
    lines.push('**Features Detected**:');
    lines.push(`- ${formatCheckbox(component.features.hasUseStateOrReducer)} useState/useReducer`);
    lines.push(`- ${formatCheckbox(component.features.hasUseEffectOrLayout)} useEffect/useLayoutEffect`);
    lines.push(`- ${formatCheckbox(component.features.hasEventHandlers)} Event handlers (onClick, onChange, etc.)`);
    lines.push(`- ${formatCheckbox(component.features.hasBrowserApis)} Browser APIs (window, localStorage, etc.)`);
    lines.push(`- ${formatCheckbox(component.features.hasUseRef || component.features.hasDomManipulation)} useRef with DOM manipulation`);
    lines.push(`- ${formatCheckbox(component.features.hasThirdPartyClient)} Third-party client libraries`);
    lines.push(`- ${formatCheckbox(component.features.hasClientContext)} Client-only context consumption`);
    lines.push('');
    const verdictLabel = component.verdict === 'convert_to_server'
      ? 'CONVERT TO SERVER'
      : component.verdict === 'split_component'
        ? 'SPLIT COMPONENT'
        : 'KEEP CLIENT';
    lines.push(`**Verdict**: ${verdictLabel}`);
    lines.push('');
    lines.push(`**Reasoning**: ${component.reasoning}`);
    lines.push('');
    lines.push('**Recommendation**:');
    if (component.verdict === 'convert_to_server') {
      lines.push('- Remove \'use client\', ensure no client features used');
    } else if (component.verdict === 'split_component') {
      lines.push('- Extract interactive parts into separate Client Component');
    } else {
      lines.push('- No change needed');
    }
    lines.push('');
    if (component.verdict === 'split_component') {
      lines.push('**Split Strategy** (if applicable):');
      lines.push('```tsx');
      lines.push('// BEFORE (all client)');
      lines.push("'use client'");
      lines.push('export function ExampleComponent(props) {');
      lines.push('  return <InteractiveSubcomponent {...props} />;');
      lines.push('}');
      lines.push('');
      lines.push('// AFTER (split server + client)');
      lines.push('// ExampleComponent.tsx (Server Component - no directive)');
      lines.push('import { InteractiveSubcomponent } from \'./InteractiveSubcomponent\';');
      lines.push('');
      lines.push('export function ExampleComponent(props) {');
      lines.push('  return <InteractiveSubcomponent {...props} />;');
      lines.push('}');
      lines.push('');
      lines.push("'use client'");
      lines.push('export function InteractiveSubcomponent(props) {');
      lines.push('  return <button onClick={props.onClick}>Action</button>;');
      lines.push('}');
      lines.push('```');
      lines.push('');
    }
  }

  return lines.join('\n');
}

function determinePriority(relativePath, verdict) {
  if (verdict !== 'convert_to_server') return 'normal';

  const highPriorityPatterns = [
    /Badge/i,
    /Status/i,
    /Message/i,
    /Label/i,
    /Indicator/i,
    /Header/i,
    /Footer/i,
  ];

  return highPriorityPatterns.some((regex) => regex.test(relativePath)) ? 'high' : 'normal';
}

async function main() {
  const files = await walk(ROOT_DIR);
  const components = [];

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf8');

    if (!/['"]use client['"]/.test(content)) continue;

    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    const directiveMatch = content.match(/['"]use client['"]/);
    const directiveIndex = directiveMatch ? directiveMatch.index ?? -1 : -1;
    if (directiveIndex > 200) {
      // Skip files where directive is not at the top; likely false positive inside a string.
      continue;
    }

    const features = detectFeatures(content);
    const { verdict, reasoning } = decideVerdict(relativePath, features);
    const priority = determinePriority(relativePath, verdict);

    components.push({
      path: relativePath,
      features,
      verdict,
      reasoning,
      priority,
    });
  }

  components.sort((a, b) => a.path.localeCompare(b.path));

  const total = components.length;
  const canConvert = components.filter((item) => item.verdict === 'convert_to_server').length;
  const needSplit = components.filter((item) => item.verdict === 'split_component').length;
  const mustRemainClient = total - canConvert - needSplit;

  const summary = {
    total_components: total,
    can_convert: canConvert,
    can_convert_percentage: total ? ((canConvert / total) * 100).toFixed(1) : '0.0',
    need_split: needSplit,
    need_split_percentage: total ? ((needSplit / total) * 100).toFixed(1) : '0.0',
    must_remain_client: mustRemainClient,
    must_remain_client_percentage: total ? ((mustRemainClient / total) * 100).toFixed(1) : '0.0',
    convert_savings_kb: canConvert * 5,
    split_savings_kb: needSplit * 3,
    total_savings_kb: canConvert * 5 + needSplit * 3,
  };

  const payload = {
    generated_at: new Date().toISOString(),
    summary,
    components,
    conversions: components.filter((item) => item.verdict === 'convert_to_server').map((item) => ({
      path: item.path,
      action: 'convert_to_server',
      reason: item.reasoning,
      estimated_savings_kb: 5,
    })),
    splits: components.filter((item) => item.verdict === 'split_component').map((item) => {
      const baseName = path.basename(item.path, path.extname(item.path));
      return {
        path: item.path,
        action: 'split_component',
        extract: `${baseName}Client`,
        estimated_savings_kb: 3,
      };
    }),
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_JSON, JSON.stringify(payload, null, 2));
  await writeFile(OUTPUT_MARKDOWN, buildAnalysisMarkdown({ summary, components }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

