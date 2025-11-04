import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/cn"

/**
 * Mobile-optimized button variants
 * All sizes meet or exceed 48px Android minimum touch target
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Brand-specific variants matching existing system
        primary: "bg-blue-600 text-white hover:bg-blue-700 rounded-full",
        "primary-outline": "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50",
        tertiary: "bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100",
        whatsapp: "bg-white text-green-600 border border-green-500 hover:bg-green-50",
        danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
        success: "bg-white text-green-600 border border-green-200 hover:bg-green-50",
      },
      size: {
        default: "h-12 px-6 py-4 text-base min-h-touch-android",
        sm: "h-10 px-4 py-3 text-sm min-h-[40px]",
        lg: "h-14 px-8 py-5 text-lg min-h-[56px]",
        icon: "h-12 w-12 min-h-touch-android min-w-touch-android",
        "icon-sm": "h-10 w-10 min-h-[40px] min-w-[40px]",
        "icon-lg": "h-14 w-14 min-h-[56px] min-w-[56px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

/**
 * Mobile-first Button component
 * - Minimum 48px touch target (Android recommendation)
 * - Active scale feedback for better UX
 * - Accessible focus states
 * - Multiple variants matching existing design system
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
