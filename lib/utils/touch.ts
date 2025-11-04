/**
 * Touch target utilities for mobile-first development
 * Enforces iOS (44px) and Android (48px) minimum touch target guidelines
 */

/**
 * iOS minimum touch target size (44x44pt)
 */
export const IOS_MIN_TOUCH_TARGET = 44;

/**
 * Android recommended touch target size (48x48dp)
 */
export const ANDROID_MIN_TOUCH_TARGET = 48;

/**
 * Minimum font size to prevent iOS auto-zoom on input focus
 */
export const MIN_FONT_SIZE_NO_ZOOM = 16;

/**
 * Validates if an element meets minimum touch target requirements
 * @param width - Element width in pixels
 * @param height - Element height in pixels
 * @param platform - Target platform ('ios' | 'android' | 'both')
 * @returns Boolean indicating if touch target is valid
 */
export function isValidTouchTarget(
  width: number,
  height: number,
  platform: 'ios' | 'android' | 'both' = 'both'
): boolean {
  const minSize = platform === 'ios' ? IOS_MIN_TOUCH_TARGET : ANDROID_MIN_TOUCH_TARGET;

  if (platform === 'both') {
    return width >= ANDROID_MIN_TOUCH_TARGET && height >= ANDROID_MIN_TOUCH_TARGET;
  }

  return width >= minSize && height >= minSize;
}

/**
 * Get CSS classes for touch target based on platform
 * @param platform - Target platform ('ios' | 'android' | 'both')
 * @returns Tailwind CSS classes for minimum touch target
 */
export function getTouchTargetClasses(platform: 'ios' | 'android' | 'both' = 'both'): string {
  if (platform === 'ios') {
    return 'min-h-touch min-w-touch';  // 44px
  }
  return 'min-h-touch-android min-w-touch-android';  // 48px (recommended)
}

/**
 * Get minimum height class for inputs
 * @returns Tailwind class for 48px height
 */
export function getInputHeightClass(): string {
  return 'h-12';  // 3rem = 48px
}

/**
 * Get button padding class for mobile
 * @param size - Button size variant
 * @returns Tailwind padding classes
 */
export function getButtonPaddingClass(size: 'sm' | 'md' | 'lg' = 'md'): string {
  switch (size) {
    case 'sm':
      return 'px-4 py-3';  // ~44px height
    case 'lg':
      return 'px-8 py-5';  // ~56px height
    default:
      return 'px-6 py-4';  // ~48px height
  }
}

/**
 * Check if font size prevents iOS auto-zoom
 * @param fontSize - Font size in pixels
 * @returns Boolean indicating if size prevents zoom
 */
export function preventsIOSZoom(fontSize: number): boolean {
  return fontSize >= MIN_FONT_SIZE_NO_ZOOM;
}
