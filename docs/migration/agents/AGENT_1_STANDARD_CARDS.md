# AGENT 1: Standard Listing Cards Migration

## 🎯 Your Mission
Migrate 19 FontAwesome icons across 4 listing card components.

## 📋 Files Assigned
1. `app/components/listings/TopSpotCard.tsx` (6 icons)
2. `app/components/listings/BoostedCard.tsx` (6 icons)
3. `app/components/listings/UrgentListingCard.tsx` (4 icons)
4. `app/components/listings/ListingCard.tsx` (3 icons)

---

## FILE 1: TopSpotCard.tsx

### Step 1: Add Import
Find the line with `import { ... } from 'lucide-react'` and add these icons:
```typescript
Car, Camera, Gauge, Fuel, Phone, Mail
```

### Step 2: Replace Icons (6 total)

**Replace 1 - Car Icon:**
```typescript
// FIND:
<i className="fas fa-car text-purple-400 text-4xl"></i>

// REPLACE WITH:
<Car className="text-purple-400" size={64} />
```

**Replace 2 - Camera Icon:**
```typescript
// FIND:
<i className="fas fa-camera"></i>

// REPLACE WITH:
<Camera size={12} />
```

**Replace 3 - Gauge (Tachometer):**
```typescript
// FIND:
<i className="fas fa-tachometer-alt text-purple-500 text-xs"></i>

// REPLACE WITH:
<Gauge className="text-purple-500" size={12} />
```

**Replace 4 - Fuel (Gas Pump):**
```typescript
// FIND:
<i className="fas fa-gas-pump text-purple-500 text-xs"></i>

// REPLACE WITH:
<Fuel className="text-purple-500" size={12} />
```

**Replace 5 - Phone:**
```typescript
// FIND:
<i className="fas fa-phone text-xs"></i>

// REPLACE WITH:
<Phone size={12} />
```

**Replace 6 - Mail (Envelope):**
```typescript
// FIND:
<i className="fas fa-envelope text-xs"></i>

// REPLACE WITH:
<Mail size={12} />
```

---

## FILE 2: BoostedCard.tsx

### Step 1: Add Import
```typescript
import { Car, Camera, Gauge, Fuel, Phone, Mail } from 'lucide-react'
```

### Step 2: Replace Icons (6 total)

**Replace 1 - Car Icon:**
```typescript
// FIND:
<i className="fas fa-car text-blue-400 text-3xl"></i>

// REPLACE WITH:
<Car className="text-blue-400" size={48} />
```

**Replace 2 - Camera Icon:**
```typescript
// FIND:
<i className="fas fa-camera"></i>

// REPLACE WITH:
<Camera size={12} />
```

**Replace 3 - Gauge:**
```typescript
// FIND:
<i className="fas fa-tachometer-alt text-blue-500 text-xs"></i>

// REPLACE WITH:
<Gauge className="text-blue-500" size={12} />
```

**Replace 4 - Fuel:**
```typescript
// FIND:
<i className="fas fa-gas-pump text-blue-500 text-xs"></i>

// REPLACE WITH:
<Fuel className="text-blue-500" size={12} />
```

**Replace 5 - Phone:**
```typescript
// FIND:
<i className="fas fa-phone text-xs"></i>

// REPLACE WITH:
<Phone size={12} />
```

**Replace 6 - Mail:**
```typescript
// FIND:
<i className="fas fa-envelope text-xs"></i>

// REPLACE WITH:
<Mail size={12} />
```

---

## FILE 3: UrgentListingCard.tsx

### Step 1: Add Import
```typescript
import { Car, Camera, Gauge, Fuel } from 'lucide-react'
```

### Step 2: Replace Icons (4 total)

**Replace 1 - Car Icon:**
```typescript
// FIND:
<i className="fas fa-car text-red-400 text-3xl"></i>

// REPLACE WITH:
<Car className="text-red-400" size={48} />
```

**Replace 2 - Camera Icon:**
```typescript
// FIND:
<i className="fas fa-camera"></i>

// REPLACE WITH:
<Camera size={12} />
```

**Replace 3 - Gauge:**
```typescript
// FIND:
<i className="fas fa-tachometer-alt text-red-500 text-xs"></i>

// REPLACE WITH:
<Gauge className="text-red-500" size={12} />
```

**Replace 4 - Fuel:**
```typescript
// FIND:
<i className="fas fa-gas-pump text-red-500 text-xs"></i>

// REPLACE WITH:
<Fuel className="text-red-500" size={12} />
```

---

## FILE 4: ListingCard.tsx

### Step 1: Update Import
Find existing lucide-react import and ADD these icons:
```typescript
Car, ImageIcon, Zap
```

So it looks like:
```typescript
import { MapPin, Calendar, Eye, Car, ImageIcon, Zap } from 'lucide-react'
```

### Step 2: Replace Icons (3 total)

**Replace 1 - Car Icon:**
```typescript
// FIND:
<i className="fas fa-car text-slate-300 text-3xl mb-2"></i>

// REPLACE WITH:
<Car className="text-slate-300 mb-2" size={48} />
```

**Replace 2 - Images Icon:**
```typescript
// FIND:
<i className="fas fa-images"></i>

// REPLACE WITH:
<ImageIcon size={16} />
```

**Replace 3 - Bolt/Zap:**
```typescript
// FIND:
<i className="fas fa-bolt text-xs"></i>

// REPLACE WITH:
<Zap size={12} />
```

---

## ✅ Verification

After completing all 4 files, run:

```bash
# Check TopSpotCard
grep "fa-" app/components/listings/TopSpotCard.tsx

# Check BoostedCard
grep "fa-" app/components/listings/BoostedCard.tsx

# Check UrgentListingCard
grep "fa-" app/components/listings/UrgentListingCard.tsx

# Check ListingCard
grep "fa-" app/components/listings/ListingCard.tsx
```

**Expected result:** No output (0 matches)

---

## 📊 Progress Report

When done, report:
```
✅ AGENT 1 COMPLETE
- TopSpotCard.tsx: 6/6 icons migrated
- BoostedCard.tsx: 6/6 icons migrated
- UrgentListingCard.tsx: 4/4 icons migrated
- ListingCard.tsx: 3/3 icons migrated
Total: 19/19 icons ✅
```

---

## 🆘 Common Issues

**Issue:** Can't find the import line
**Solution:** Look for `import {` near the top of the file (usually lines 1-10)

**Issue:** Multiple lucide-react imports
**Solution:** Merge them into one line

**Issue:** Icon looks different size
**Solution:** Double-check the `size={}` prop matches the original text size classes

**Good luck! 🚀**

