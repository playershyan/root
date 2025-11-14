# FontAwesome to Lucide Migration Checklist

**Total Instances:** 119 in app code  
**Start Date:** _________  
**Target Completion:** _________

## Phase 1: Listing Components (Priority: HIGH) ⭐⭐⭐

### Listing Cards
- [ ] `app/components/listings/RegularAdCard.tsx` (12 icons)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate RegularAdCard to Lucide icons`
  
- [ ] `app/components/listings/FeaturedAdCard.tsx` (9 icons)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate FeaturedAdCard to Lucide icons`

- [ ] `app/components/listings/GoldFeaturedCard.tsx` (7 icons)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate GoldFeaturedCard to Lucide icons`

- [ ] `app/components/listings/TopSpotCard.tsx` (6 icons)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate TopSpotCard to Lucide icons`

- [ ] `app/components/listings/BoostedCard.tsx` (6 icons)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate BoostedCard to Lucide icons`

- [ ] `app/components/listings/UrgentListingCard.tsx` (4 icons)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate UrgentListingCard to Lucide icons`

- [ ] `app/components/listings/ListingCard.tsx` (3 icons)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate ListingCard to Lucide icons`

- [ ] `app/components/listings/PromotedListingsSection.tsx` (5 icons)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate PromotedListingsSection to Lucide icons`

### Listing Pages
- [ ] `app/listings/[id]/ListingDetailClient.tsx` (11 icons)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate listing detail page to Lucide icons`

- [ ] `app/listings/_components/ListingsPageClient.tsx` (7 icons)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate listings page to Lucide icons`

**Phase 1 Subtotal:** 70 icons

---

## Phase 2: Wanted Requests (Priority: HIGH) ⭐⭐⭐

### Wanted Cards
- [ ] `app/components/wantedRequests/UrgentWantedCard.tsx` (2 icons)
  - [ ] Test visually
  
- [ ] `app/components/wantedRequests/RegularWantedCard.tsx` (2 icons)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate wanted card components to Lucide icons`

### Wanted Pages
- [ ] `app/wanted/page.tsx` (2 icons)
  - [ ] Test visually

- [ ] `app/wanted/[id]/page.tsx` (1 icon)
  - [ ] Test visually

- [ ] `app/wanted/post/page.tsx` (1 icon)
  - [ ] Test visually

- [ ] `app/wanted/search/page.tsx` (2 icons)
  - [ ] Test visually

- [ ] `app/wanted/components/SearchBar.tsx` (1 icon)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate wanted pages to Lucide icons`

**Phase 2 Subtotal:** 11 icons

---

## Phase 3: Forms & Post Pages (Priority: MEDIUM) ⭐⭐

- [ ] `app/post/page.tsx` (2 icons)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate post page to Lucide icons`

- [ ] `app/post/paid-features/page.tsx` (11 icons)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate paid features page to Lucide icons`

**Phase 3 Subtotal:** 13 icons

---

## Phase 4: UI Components (Priority: MEDIUM) ⭐⭐

### Modals & Notifications
- [ ] `app/components/modals/ContactModal.tsx` (1 icon + WhatsApp SVG)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate ContactModal to Lucide icons`

- [ ] `app/components/NotificationSystem.tsx` (1 icon)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate NotificationSystem to Lucide icons`

- [ ] `app/components/ErrorBoundary.tsx` (1 icon)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate ErrorBoundary to Lucide icons`

### Filters
- [ ] `app/components/filters/MobileFilterSheet.tsx` (1 icon)
  - [ ] Test visually

- [ ] `app/components/filters/MobileWantedFilterSheet.tsx` (1 icon)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate filter components to Lucide icons`

### Price Display
- [ ] `app/components/PriceDisplay/FinancePriceDisplay.tsx` (1 icon)
  - [ ] Test visually

- [ ] `app/components/PriceDisplay/CashPriceDisplay.tsx` (1 icon)
  - [ ] Test visually
  - [ ] Commit: `feat: migrate price display components to Lucide icons`

**Phase 4 Subtotal:** 7 icons

---

## Phase 5: Legacy Files (Priority: LOW) ⭐

- [ ] `app/wanted/page.client-backup.tsx` (18 icons)
  - [ ] Consider deleting instead of migrating
  - [ ] Or migrate last
  - [ ] Commit: `chore: migrate or remove legacy backup file`

**Phase 5 Subtotal:** 18 icons

---

## Final Testing & Validation

### Build & Bundle
- [ ] Run `npm run build` - No errors
- [ ] Check bundle size - Reduced by 2-3KB+
- [ ] Check `.next/static` folder size

### Performance Testing
- [ ] Run Lighthouse on homepage
- [ ] Verify 0 FontAwesome CDN requests
- [ ] Check First Contentful Paint (FCP)
- [ ] Check Largest Contentful Paint (LCP)
- [ ] Check Total Blocking Time (TBT)

### Visual Regression
- [ ] Homepage - Compare before/after screenshots
- [ ] Listings page - Compare before/after screenshots
- [ ] Listing detail - Compare before/after screenshots
- [ ] Wanted requests - Compare before/after screenshots
- [ ] Post pages - Compare before/after screenshots

### Cross-Browser Testing
- [ ] Chrome - Desktop
- [ ] Firefox - Desktop
- [ ] Safari - Desktop
- [ ] Chrome - Mobile
- [ ] Safari - iOS

### Accessibility
- [ ] Screen reader test
- [ ] Keyboard navigation
- [ ] Color contrast (should be same)

---

## Documentation Updates

- [x] Created FONTAWESOME_MIGRATION_PLAN.md
- [x] Created MIGRATION_CHECKLIST.md
- [x] Created fontawesome-to-lucide.md guide
- [x] Created iconMapping.ts utility
- [ ] Update main README with migration notes
- [ ] Add entry to CHANGELOG

---

## Cleanup

- [ ] Search for any remaining FontAwesome references:
  ```bash
  grep -r "fas fa-\|far fa-\|fab fa-" app --include="*.tsx"
  ```
- [ ] Remove unused FontAwesome types/imports
- [ ] Update component documentation
- [ ] Remove any FontAwesome-related comments

---

## Deployment

- [ ] Create PR with all changes
- [ ] Request code review
- [ ] Merge to main
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Deploy to production
- [ ] Monitor for issues

---

## Progress Tracking

**Completed:** ___ / 119 icons (___%)

**Phase 1:** ___ / 70 (___%)  
**Phase 2:** ___ / 11 (___%)  
**Phase 3:** ___ / 13 (___%)  
**Phase 4:** ___ / 7 (___%)  
**Phase 5:** ___ / 18 (___%)

---

## Notes & Issues

_Use this space to track any issues, questions, or notes during migration_

---

## Quick Commands

```bash
# Count remaining FontAwesome icons
grep -r "className=.*fa[sr]? fa-" app --include="*.tsx" | wc -l

# Find specific icon type
grep -r "fas fa-search" app --include="*.tsx"

# Build and check for errors
npm run build

# Run dev server
npm run dev

# Check bundle size
npm run build && du -sh .next/static/chunks
```

