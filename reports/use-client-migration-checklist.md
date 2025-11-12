# 'use client' Migration Checklist

## Phase 1 – Pure Display Conversions
1. Remove `'use client'` from `app/components/listings/ListingStatusBadge.tsx`.
   - Confirm `getStatusInfo()` remains server-safe.
   - Verify props contain only serializable data.
2. Remove `'use client'` from `app/components/listings/ListingStatusMessage.tsx`.
   - Confirm messaging helpers do not rely on client APIs.
3. Remove `'use client'` from `app/components/listings/PromotionBadges.tsx`.
   - Ensure icon imports remain compatible in Server Components.
4. Remove `'use client'` from `app/components/wantedRequests/WantedRequestStatusBadge.tsx`.
5. Remove `'use client'` from `app/components/wantedRequests/WantedRequestStatusMessage.tsx`.

## Phase 2 – Split Lightweight Interactivity
6. Refactor `app/components/messages/MessagesList.tsx`.
   - Extract item click/archive/bin handlers into a tiny Client Component wrapper.
   - Keep display list rendering in a Server Component for serialization safety.

## Phase 3 – Validation
7. Run `npm run lint` to confirm no lint violations.
8. Run `npm run build` to ensure Server Component conversions compile.
9. Smoke-test listings and wanted request detail views for badge/status display.
10. Verify messaging actions (open, archive, move to bin, mark as read) still work after split.

