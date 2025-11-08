<!-- Audit notes generated on 2025-11-08 -->
# Mobile Notifications & Security Audit (Mobile View ≤414px)

## Notifications (`app/profile/notifications/page.tsx` + `NotificationsTab`)
- **Page scaffold**: `max-w-4xl` container forces 16px side padding but still centres content; on ≤375px the inner cards inherit desktop padding (`p-6`) creating cramped scroll length.
- **Header hierarchy**: `text-2xl` title paired with `gap-4` flex utility yields oversized typography vs. viewport; summary info occupies two rows before actionable content.
- **Summary stats grid**: `grid-cols-1 md:grid-cols-3` keeps full-width cards on mobile with 32px bottom padding; numeric emphasis uses `text-2xl` causing overflow in languages with longer labels.
- **Change alert & save CTA**: Stacked banners (`bg-blue-50`, etc.) plus repeated save controls (mid-body and footer) produce excessive vertical spacing; primary buttons sized `h-12` span edge-to-edge without sticky positioning, so users scroll to reach CTAs.
- **Notification cards**: Each `NotificationCard` uses `p-6` and horizontal flex layout; toggle sits left, label right, leading to awkward reading order on small screens. Status chips and warnings expand vertical height with no collapsing; duplicate alerts overshadow toggles.
- **Information section**: Blue info panel at end is full-width with long bullet list; no collapse/accordion results in heavy scroll tail.

## Security (`app/profile/security/page.tsx` + `SecurityTab` and child cards)
- **Page scaffold**: Same `max-w-4xl` desktop width; `py-8` spacing and `Button` back CTA mimic desktop semantics.
- **Header block**: `SecurityTab` renders `text-2xl` heading plus logout button inline; on mobile the logout CTA overlaps or wraps awkwardly. Security score meter uses flex row with progress bar; 120% width progress indicator + 50px padding wastes vertical space.
- **Feedback banners**: Success/error blocks replicate desktop spacing with `p-4` moving content far below the fold.
- **Component stack**:
  - `EmailSecurityCard`: 2-column affordances (icons + text) remain horizontal; `max-w-md` restricts width even on mobile. Action button uses `w-full sm:w-auto` but form fields keep large margin/padding.
  - `PasswordSecurityCard`/`TwoFactorCard` share similar desktop paddings; toggles, instructions, and forms appear simultaneously leading to dense sections.
  - `SessionsCard`: Table-like layout with action buttons inline; requires horizontal space.
  - `DeleteAccountCard`: Danger zone header and card separated by `mt-8`; card uses wide layout with side-by-side warnings/actions.
- **Tips section**: Blue informational panel repeats bullet list similar to notifications; lacks collapsing.

## Cross-cutting Issues
- **Typography scale**: Titles `text-2xl`, stats `text-2xl`, and button labels default to desktop sizes; headings dominate viewport.
- **Spacing**: Consistent use of `p-6`, `px-6`, `py-4` results in heavy padding that compresses content vertically.
- **Interaction patterns**: Buttons rely on `h-12` and are not sticky; multiple redundant CTAs increase cognitive load.
- **Scroll experience**: Stacked banners and info sections extend page length; no progressive disclosure (accordions/tabs) to manage density.
- **Icon sizing**: `w-6 h-6` icons next to large text create alignment issues; can downscale to `w-4 h-4` for mobile.

These findings inform the upcoming mobile-first refactor.

