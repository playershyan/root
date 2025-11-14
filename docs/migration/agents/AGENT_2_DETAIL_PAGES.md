# AGENT 2: Detail Pages Migration

## 🎯 Your Mission
Migrate 18 FontAwesome icons across 2 large page components.

## 📋 Files Assigned
1. `app/listings/[id]/ListingDetailClient.tsx` (11 icons)
2. `app/listings/_components/ListingsPageClient.tsx` (7 icons)

---

## FILE 1: ListingDetailClient.tsx (11 icons)

### Step 1: Add Import
Add these to lucide-react imports:
```typescript
import { Calendar, Activity, Fuel, Settings, MapPin, Handshake, Info } from 'lucide-react'
```

### Step 2: Replace Icons

**Replace 1-2 - Calendar Icons (multiple instances):**
```typescript
// FIND:
<i className="fas fa-calendar-alt mr-1"></i>

// REPLACE WITH:
<Calendar className="mr-1" size={16} />
```
**Note:** There may be 2-3 instances of calendar icons

**Replace 3 - Road/Mileage Icon:**
```typescript
// FIND:
<i className="fas fa-road mr-1"></i>

// REPLACE WITH:
<Activity className="mr-1" size={16} />
```

**Replace 4 - Gas Pump/Fuel:**
```typescript
// FIND:
<i className="fas fa-gas-pump mr-1"></i>

// REPLACE WITH:
<Fuel className="mr-1" size={16} />
```

**Replace 5-6 - Cog/Settings (multiple instances):**
```typescript
// FIND:
<i className="fas fa-cog mr-1"></i>
// OR
<i className="fas fa-cogs mr-1"></i>

// REPLACE WITH:
<Settings className="mr-1" size={16} />
```

**Replace 7-8 - Map Marker/Location (multiple instances):**
```typescript
// FIND:
<i className="fas fa-map-marker-alt mr-1"></i>

// REPLACE WITH:
<MapPin className="mr-1" size={16} />
```

**Replace 9-10 - Handshake (2 sizes):**
```typescript
// FIND:
<i className="fas fa-handshake mr-1"></i>

// REPLACE WITH:
<Handshake className="mr-1" size={16} />

// ALSO FIND:
<i className="fas fa-handshake mr-0.5 text-[10px]"></i>

// REPLACE WITH:
<Handshake className="mr-0.5" size={10} />
```

**Replace 11 - Info Circle:**
```typescript
// FIND:
<i className="fas fa-info-circle mr-1"></i>

// REPLACE WITH:
<Info className="mr-1" size={16} />
```

---

## FILE 2: ListingsPageClient.tsx (7 icons)

### Step 1: Add Import
```typescript
import { Filter, Search, Star, Crown, Zap, AlertCircle } from 'lucide-react'
```

### Step 2: Replace Icons

**Replace 1 - Filter Icon:**
```typescript
// FIND:
<i className="fas fa-filter"></i>

// REPLACE WITH:
<Filter size={16} />
```

**Replace 2-3 - Search Icons (2 sizes):**
```typescript
// FIND (small):
<i className="fas fa-search text-base"></i>

// REPLACE WITH:
<Search size={16} />

// FIND (large - no results):
<i className="fas fa-search text-4xl text-gray-300"></i>

// REPLACE WITH:
<Search size={64} className="text-gray-300" />
```

**Replace 4 - Star Icon:**
```typescript
// FIND:
<i className="fas fa-star text-yellow-500"></i>

// REPLACE WITH:
<Star className="text-yellow-500 fill-yellow-500" size={16} />
```
**Note:** Star needs both `className` with fill AND text color

**Replace 5 - Crown Icon:**
```typescript
// FIND:
<i className="fas fa-crown text-purple-500"></i>

// REPLACE WITH:
<Crown className="text-purple-500" size={16} />
```

**Replace 6 - Bolt/Zap:**
```typescript
// FIND:
<i className="fas fa-bolt text-blue-500"></i>

// REPLACE WITH:
<Zap className="text-blue-500" size={16} />
```

**Replace 7 - Exclamation Circle:**
```typescript
// FIND:
<i className="fas fa-exclamation-circle text-red-500"></i>

// REPLACE WITH:
<AlertCircle className="text-red-500" size={16} />
```

---

## ✅ Verification

```bash
# Check ListingDetailClient
grep "fa-" app/listings/[id]/ListingDetailClient.tsx

# Check ListingsPageClient
grep "fa-" app/listings/_components/ListingsPageClient.tsx
```

**Expected result:** No output (0 matches)

---

## 📊 Progress Report

When done, report:
```
✅ AGENT 2 COMPLETE
- ListingDetailClient.tsx: 11/11 icons migrated
- ListingsPageClient.tsx: 7/7 icons migrated
Total: 18/18 icons ✅
```

---

## 🆘 Tips

**ListingDetailClient is a LARGE file:**
- Use Ctrl+F (Cmd+F) to search for each icon
- Replace them one at a time
- Count as you go to track progress

**Multiple instances:**
- Some icons appear 2-3 times
- Replace ALL instances

**Star icon special case:**
- Needs `fill-yellow-500` to show filled star
- Format: `className="text-yellow-500 fill-yellow-500"`

**Good luck! 🚀**

