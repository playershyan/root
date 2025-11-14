# AGENTS 3-6: Quick Migration Tasks

## 🎯 AGENT 3: Promoted Listings Section (5 icons, 1 file)

### File: `app/components/listings/PromotedListingsSection.tsx`

**Step 1: Add Import**
```typescript
import { Crown, Zap, AlertTriangle, Star, TrendingUp } from 'lucide-react'
```

**Step 2: Replace (search for these patterns)**
```typescript
<i className="fas fa-crown"></i> → <Crown size={16} />
<i className="fas fa-bolt"></i> → <Zap size={16} />
<i className="fas fa-star"></i> → <Star size={16} />
<i className="fas fa-arrow-up"></i> → <TrendingUp size={16} />
<i className="fas fa-exclamation-triangle"></i> → <AlertTriangle size={16} />
```

**Verify:**
```bash
grep "fa-" app/components/listings/PromotedListingsSection.tsx
```

---

## 🎯 AGENT 4: Wanted Request Cards (4 icons, 2 files)

### File 1: `app/components/wantedRequests/UrgentWantedCard.tsx`

**Step 1: Add Import**
```typescript
import { Fuel, Settings } from 'lucide-react'
```

**Step 2: Replace**
```typescript
// FIND:
<i className="fas fa-gas-pump text-orange-500 text-sm w-4 text-center flex-shrink-0"></i>

// REPLACE WITH:
<Fuel className="text-orange-500 text-sm w-4 h-4 text-center flex-shrink-0" />

// FIND:
<i className="fas fa-cogs text-orange-500 text-sm w-4 text-center flex-shrink-0"></i>

// REPLACE WITH:
<Settings className="text-orange-500 text-sm w-4 h-4 text-center flex-shrink-0" />
```

### File 2: `app/components/wantedRequests/RegularWantedCard.tsx`

**Step 1: Add Import**
```typescript
import { Fuel, Settings } from 'lucide-react'
```

**Step 2: Replace (SAME as above but gray color)**
```typescript
<i className="fas fa-gas-pump text-gray-500 text-sm w-4 text-center flex-shrink-0"></i>
→ <Fuel className="text-gray-500 text-sm w-4 h-4 text-center flex-shrink-0" />

<i className="fas fa-cogs text-gray-500 text-sm w-4 text-center flex-shrink-0"></i>
→ <Settings className="text-gray-500 text-sm w-4 h-4 text-center flex-shrink-0" />
```

**Verify:**
```bash
grep "fa-" app/components/wantedRequests/*.tsx
```

---

## 🎯 AGENT 5: Wanted Pages (7 icons, 4 files)

### File 1: `app/wanted/page.tsx` (2 icons)

**Import:** `import { Plus } from 'lucide-react'`

**Replace:**
```typescript
<i className="fas fa-plus"></i> → <Plus size={16} />
```
(2 instances)

---

### File 2: `app/wanted/[id]/page.tsx` (1 icon)

**Import:** `import { Star } from 'lucide-react'`

**Replace:**
```typescript
<i className="fas fa-star"></i> → <Star size={16} />
```

---

### File 3: `app/wanted/post/page.tsx` (1 icon)

**Import:** `import { Lightbulb } from 'lucide-react'`

**Replace:**
```typescript
<i className="fas fa-lightbulb text-blue-600 text-xl"></i>
→ <Lightbulb className="text-blue-600" size={20} />
```

---

### File 4: `app/wanted/search/page.tsx` (2 icons)

**Import:** `import { Search } from 'lucide-react'`

**Replace:**
```typescript
// Small:
<i className="fas fa-search text-sm"></i>
→ <Search size={14} />

// Large (no results):
<i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
→ <Search size={64} className="text-gray-300 mb-4" />
```

**Verify All:**
```bash
grep "fa-" app/wanted/*.tsx
```

---

## 🎯 AGENT 6: SearchBar Component (1 icon, 1 file)

### File: `app/wanted/components/SearchBar.tsx`

**Step 1: Add Import**
```typescript
import { Search } from 'lucide-react'
```

**Step 2: Replace**
```typescript
// FIND:
<i className="fas fa-search text-base"></i>

// REPLACE WITH:
<Search size={16} />
```

**Verify:**
```bash
grep "fa-" app/wanted/components/SearchBar.tsx
```

---

## 📊 Progress Reports

**AGENT 3:**
```
✅ AGENT 3 COMPLETE
- PromotedListingsSection.tsx: 5/5 icons migrated
```

**AGENT 4:**
```
✅ AGENT 4 COMPLETE
- UrgentWantedCard.tsx: 2/2 icons migrated
- RegularWantedCard.tsx: 2/2 icons migrated
Total: 4/4 icons ✅
```

**AGENT 5:**
```
✅ AGENT 5 COMPLETE
- wanted/page.tsx: 2/2 icons migrated
- wanted/[id]/page.tsx: 1/1 icons migrated
- wanted/post/page.tsx: 1/1 icons migrated
- wanted/search/page.tsx: 2/2 icons migrated
Total: 6/6 icons ✅
```

**AGENT 6:**
```
✅ AGENT 6 COMPLETE
- wanted/components/SearchBar.tsx: 1/1 icons migrated
```

---

## 🎉 Final Verification (All Agents)

After ALL agents complete, run:
```bash
# Count remaining
grep -r "className=.*fa[sr]? fa-" app --include="*.tsx" | wc -l

# Should be 0!

# List any remaining
grep -r "className=.*fa[sr]? fa-" app --include="*.tsx"
```

**Success = No output! 🎊**

