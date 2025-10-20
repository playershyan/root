import { ReactNode } from "react"

interface CardProps {
  children: ReactNode
  className?: string
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={`rounded-lg border bg-white shadow-sm ${className || ""}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className || ""}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={`p-6 pt-0 ${className || ""}`}>
      {children}
    </div>
  )
}