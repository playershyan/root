# Top 10 High-Impact Client Modules

## app/listings/page.tsx (1795 lines, 73.8 KB)
- Responsibilities: full listings catalogue with search params sync, supabase fetch, promotion rotation, dynamic filters, recaptcha gating, favorites context integration.
- Complexity: stacks of `useState`/`useEffect`, memoised filter pipelines, dynamic imports, derives query params, triggers router navigation.
- Migration idea: move initial listings + metadata fetch to server component, expose filter data via props, keep recaptcha + filter interactions in smaller client slices.

## app/post/page.tsx (1628 lines, 67.5 KB)
- Responsibilities: multi-step listing creation flow with dynamic vehicle forms, supabase mutations, cloudinary upload hooks, toast system, auth enforcement.
- Complexity: deep form state, watchers for validations, dynamic imports for AI helpers, recaptcha, url param parsing.
- Migration idea: create `post/page.tsx` server wrapper for auth + initial data (profile, presets), isolate stepper + form editors into dedicated client components, leverage server actions for persistence.

## app/wanted/page.tsx (1325 lines, 50.5 KB)
- Responsibilities: wanted marketplace with supabase queries, infinite scroll, filter state, match notifications, dynamic imports for contact modal.
- Complexity: mutation of query params, `useEffect` fetch chains, intersection observer, recaptcha.
- Migration idea: server render initial wanted list and filter metadata, convert feed to server-driven pagination, keep filter sheet + contact modal client-side.

## app/wanted/post/page.tsx (1179 lines, 47.6 KB)
- Responsibilities: wanted request authoring with multi-step form, supabase reads/writes, edit mode prefill, toast notifications.
- Complexity: heavy local state, `useEffect` for edit prefill, location helpers, recaptcha, high-priority upsell logic.
- Migration idea: server wrapper loads existing draft + lookup data; split form wizard into atomic client components; migrate mutations to server actions where possible.

## app/components/filters/MobileFilterSheet.tsx (1088 lines, 35.8 KB)
- Responsibilities: mobile filter navigator for listings with multi-screen UI, local temp state, category/make/model drill downs, price/year pickers.
- Complexity: large UI tree but minimal data fetching; relies on callback props for mutations.
- Migration idea: break into smaller lazy-loaded client pieces (per sub-page) and share pure data (categories, makes, models) from server to reduce bundle.

## app/listings/[id]/ListingDetailClient.tsx (933 lines, 39.3 KB)
- Responsibilities: listing detail experience with galleries, finance calculator, conversation + contact modals, toast system.
- Complexity: multiple modals, stateful lightbox, conversation triggers, favorites/auth gating.
- Migration idea: server-render main listing/spec data; offload finance calculator, modals, and messaging entrypoints to dedicated client components loaded on demand.

## app/components/filters/MobileWantedFilterSheet.tsx (890 lines, 28.3 KB)
- Responsibilities: equivalent mobile filter UI for wanted requests.
- Complexity: similar multi-step UI with callback props, minimal data fetching.
- Migration idea: same as listings filter—chunk into smaller client modules, precompute option data on server.

## app/admin-old/page.tsx (742 lines, 29.3 KB)
- Responsibilities: legacy admin dashboard; fetches stats/listings/reports via REST endpoints, performs client paging, auth guard.
- Complexity: multiple `useEffect` fetch flows, manual loading states, listens to auth context.
- Migration idea: build server wrapper that preloads stats and tables; preserve tab UI as client; move admin auth to middleware/server and convert fetchers to server actions.

## app/components/header.tsx (723 lines, 29.7 KB)
- Responsibilities: global header with auth-aware nav, mobile menu, notifications, unread counts, Google One Tap modal toggling.
- Complexity: local storage flag checks, toasts, router interactions, context usage, event listeners.
- Migration idea: split deterministic markup (logo, nav links) into server component; keep auth menu + notification widgets client with dynamic import.

## app/components/messaging/EnhancedConversationModal.tsx (665 lines, 23.6 KB)
- Responsibilities: rich real-time messaging modal with quick replies, typing state, websocket presence, auth prompts.
- Complexity: websockets, optimistic sends, scroll management, keyboard shortcuts.
- Migration idea: remain client but lazy-load via dynamic import, trim dependencies, move static listing header into server-provided props.
