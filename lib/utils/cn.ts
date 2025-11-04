import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge to handle conflicts
 * @param inputs - Class names or conditional class objects
 * @returns Merged class string with Tailwind conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
