<!-- QA notes generated on 2025-11-08 -->
# Mobile Notifications & Security QA Checklist

## Viewport Smoke Tests
- ✅ 360×640 (small) — headers scale to `text-xl`, sticky bars remain legible, sticky save bar does not overlap content (`NotificationsTab` and `SecurityTab`).
- ✅ 390×844 (medium) — summary pills wrap without truncation; collapsible sections default closed where appropriate and expand smoothly.
- ✅ 414×896 (large) — cards retain 16px gutters, grid layouts graduate to two-column variants without overflow.

## Interaction Checks
- Toggling notification preferences updates inline status pills; mobile details toggle defaults collapsed and preserves state per card.
- Sticky mobile action bar only renders when `hasChanges === true`; safe-area padding avoids iOS tab-bar collisions.
- Security tab logout CTA accessible via rounded outline button; `details` elements retain native keyboard support.

## Accessibility
- Icon sizes reduced to `w-4/h-4` or `w-5/h-5` inside 44px touch targets.
- All interactive controls expose `aria` affordances (e.g., `aria-expanded` on collapsible toggles).
- Color contrast maintained (> 4.5:1) for text on colored badges and banners.

## Regression Notes
- Desktop breakpoints (`sm` and above) preserve previous spacing hierarchy with new responsive padding.
- No shared button variants introduced; existing `Button` component reused for consistent states.

