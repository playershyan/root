# 'use client' Directive Audit - Instructions for AI Agent

## Objective

Audit all React components in the Next.js 14 App Router codebase to identify unnecessary 'use client' directives that force client-side rendering when Server Components would be more efficient.

## Context

- **Framework**: Next.js 14 with App Router
- **Default**: All components are Server Components unless marked with 'use client'
- **Problem**: Overuse of 'use client' increases bundle size and reduces performance
- **Goal**: Convert pure display components to Server Components, extract interactive logic into minimal Client Components

## Task Breakdown

### Step 1: Inventory All 'use client' Components

Search for all files containing the 'use client' directive:

```bash
grep -r "^'use client'" app/ --include="*.tsx" --include="*.ts"
```

Create a list of all files with their paths.

### Step 2: Classification Criteria

For each component, determine if it REQUIRES 'use client' by checking for:

**Client-Only Features (must stay 'use client'):**
1. React hooks: `useState`, `useEffect`, `useReducer`, `useContext` (client contexts only)
2. Event handlers: `onClick`, `onChange`, `onSubmit`, `onKeyDown`, etc.
3. Browser APIs: `window`, `document`, `navigator`, `localStorage`, `sessionStorage`
4. React lifecycle methods for client interactions
5. Third-party libraries that require browser environment
6. Refs that manipulate DOM: `useRef` with DOM manipulation

**Server Component Safe (can remove 'use client'):**
1. Pure display/rendering logic with no interactivity
2. Components that only receive and display props
3. Static layouts and wrappers
4. Components using only server-safe utilities
5. Typography, badges, labels, status indicators
6. Read-only data displays

### Step 3: Analysis Template

For each component, provide this analysis:

```markdown
### Component: `<file_path>`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: [KEEP CLIENT | CONVERT TO SERVER | SPLIT COMPONENT]

**Reasoning**: <explain why based on detected features>

**Recommendation**:
- If KEEP CLIENT: No change needed
- If CONVERT TO SERVER: Remove 'use client', ensure no client features used
- If SPLIT COMPONENT: Extract interactive parts into separate Client Component

**Split Strategy** (if applicable):
```tsx
// BEFORE (all client)
'use client'
export function Card({ data }) {
  const [liked, setLiked] = useState(false)
  return (
    <div>
      <h2>{data.title}</h2>
      <p>{data.description}</p>
      <button onClick={() => setLiked(!liked)}>Like</button>
    </div>
  )
}

// AFTER (split server + client)
// Card.tsx (Server Component - no directive)
import { LikeButton } from './LikeButton'

export function Card({ data }) {
  return (
    <div>
      <h2>{data.title}</h2>
      <p>{data.description}</p>
      <LikeButton itemId={data.id} />
    </div>
  )
}

// LikeButton.tsx (Client Component)
'use client'
export function LikeButton({ itemId }) {
  const [liked, setLiked] = useState(false)
  return <button onClick={() => setLiked(!liked)}>Like</button>
}
```
```

### Step 4: Priority Categories

**High Priority** (likely can be converted):
- Badge/Label components
- Status indicators
- Typography components
- Layout wrappers without interactivity
- Pure display cards/tiles
- Static headers/footers

**Medium Priority** (may need splitting):
- Complex cards with buttons
- Form field wrappers
- Navigation components with active states
- Modals/dialogs (split trigger from content)

**Low Priority** (likely need to stay client):
- Form inputs
- Interactive widgets (sliders, toggles, etc.)
- Components with heavy useState usage
- Real-time updating components
- Animation-heavy components

### Step 5: Automated Detection Patterns

Use these regex patterns to detect client-only features:

```typescript
// Hook usage
/use(State|Effect|Reducer|Ref|Context|Callback|Memo|LayoutEffect|ImperativeHandle|DebugValue|Id|DeferredValue|Transition|SyncExternalStore|InsertionEffect)\(/

// Event handlers
/on(Click|Change|Submit|KeyDown|KeyUp|KeyPress|MouseEnter|MouseLeave|MouseMove|Focus|Blur|Load|Error|Scroll|Resize|Touch|Drag|Drop)=/

// Browser APIs
/\b(window|document|navigator|localStorage|sessionStorage|fetch|XMLHttpRequest|WebSocket|location|history|crypto)\b/

// DOM manipulation
/\.querySelector|\.getElementById|\.getElementsBy|\.createElement|\.appendChild/
```

### Step 6: Output Format

Provide results in this structure:

```markdown
# 'use client' Audit Results

## Summary Statistics
- Total components with 'use client': <count>
- Can be converted to Server: <count> (<percentage>%)
- Need to be split: <count> (<percentage>%)
- Must remain Client: <count> (<percentage>%)

## Estimated Bundle Savings
- Components to convert: <count> × avg 5KB = <total>KB
- Components to split: <count> × avg 3KB = <total>KB
- **Total Estimated Savings**: <total>KB

## High Priority Conversions (Quick Wins)

### 1. <component_path>
- **Reason**: Pure display, no interactivity
- **Action**: Remove 'use client' directive
- **Estimated Savings**: ~5KB

### 2. <component_path>
...

## Components Requiring Split

### 1. <component_path>
- **Current**: All client-side
- **Strategy**: Extract <interactive_part> into separate Client Component
- **Estimated Savings**: ~3KB

### 2. <component_path>
...

## Components That Must Remain Client

### 1. <component_path>
- **Reason**: Heavy use of useState, event handlers, and browser APIs
- **Action**: No change

## Implementation Priority Order

1. Pure display components (no dependencies)
2. Simple splits (single button extraction)
3. Complex splits (multiple interactive elements)
4. Components with external dependencies

## Detailed Analysis

<for each component, provide the full analysis template from Step 3>
```

## Special Considerations

### 1. Context Providers
- Client contexts force all consumers to be Client Components
- Check if context can be server-side (e.g., static config)
- Consider splitting client context to minimal scope

### 2. Third-Party Libraries
- Check if library has RSC-compatible version
- Some libraries work in both environments
- May need dynamic imports with `ssr: false`

### 3. Shared State
- Components sharing useState must both be Client
- Consider lifting state to parent or using URL params
- Server state via props eliminates need for client state

### 4. Styling Libraries
- CSS-in-JS libraries often require client
- Tailwind CSS works in both
- CSS Modules work in both

### 5. Data Fetching
- Server Components can fetch directly
- Client Components need useEffect + fetch or SWR/React Query
- Converting to Server saves data fetching code

## Testing Checklist

After making changes, verify:

- [ ] Build completes without errors: `npm run build`
- [ ] No client-only APIs used in Server Components
- [ ] Event handlers only in Client Components
- [ ] Props are serializable (no functions passed to Server Components)
- [ ] TypeScript types pass
- [ ] Visual regression testing
- [ ] Interactive features still work

## Common Pitfalls to Avoid

1. **Don't pass functions as props to Server Components** - Causes serialization errors
2. **Don't use hooks in Server Components** - Will cause runtime errors
3. **Don't forget to update imports** - Client Components should be in separate files
4. **Don't break existing functionality** - Test thoroughly after splits
5. **Don't optimize prematurely** - Focus on high-value conversions first

## Success Metrics

Track these metrics before/after:

- Bundle size (JavaScript delivered to client)
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Total Blocking Time (TBT)
- Lighthouse Performance Score

Expected improvements:
- 50-100KB bundle reduction from conversions
- 10-15 point Lighthouse score increase
- Faster initial page loads
- Reduced JavaScript execution time

## Execution Strategy

### Phase 1: Quick Wins (1-2 hours)
Convert pure display components with no dependencies

### Phase 2: Simple Splits (2-4 hours)
Extract single interactive elements (buttons, toggles)

### Phase 3: Complex Splits (4-6 hours)
Handle components with multiple interactive parts

### Phase 4: Verification (1-2 hours)
Build, test, measure performance improvements

**Total Estimated Time**: 8-14 hours

## Files to Prioritize

Based on codebase analysis, focus on these directories:

1. `app/components/` - Reusable UI components
2. `app/components/listings/` - Listing display components
3. `app/components/hero/` - Homepage components
4. `app/components/filters/` - Filter UI components
5. `app/components/modals/` - Modal components (often splittable)

## Delivery Format

Provide output as:
1. Markdown report (detailed analysis)
2. JSON file (machine-readable results)
3. Migration checklist (ordered by priority)

```json
{
  "summary": {
    "total_components": 0,
    "can_convert": 0,
    "need_split": 0,
    "must_remain_client": 0,
    "estimated_savings_kb": 0
  },
  "conversions": [
    {
      "path": "app/components/...",
      "action": "convert_to_server",
      "reason": "...",
      "estimated_savings_kb": 5
    }
  ],
  "splits": [
    {
      "path": "app/components/...",
      "action": "split_component",
      "extract": "ButtonComponent",
      "estimated_savings_kb": 3
    }
  ]
}
```

---

## Begin Audit

Start by running the grep command to list all 'use client' components, then systematically analyze each one using the criteria above. Focus on identifying quick wins that deliver maximum bundle size reduction with minimal code changes.
