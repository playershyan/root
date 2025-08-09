import React from 'react'
import Link from 'next/link'

interface CashPriceDisplayProps {
  price: number
  negotiable?: boolean
  showFinanceCalculator?: boolean
  monthlyPayment?: number | null
  variant?: 'detail' | 'card'
}

export default function CashPriceDisplay({
  price,
  negotiable,
  showFinanceCalculator = true,
  monthlyPayment,
  variant = 'detail'
}: CashPriceDisplayProps) {
  if (variant === 'card') {
    return (
      <div className="mb-3">
        <p className="text-2xl font-bold text-blue-600">
          Rs. {price.toLocaleString()}
        </p>
        {negotiable && (
          <span className="inline-block mt-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
            Negotiable
          </span>
        )}
      </div>
    )
  }

  return (
    <>
      <p className="text-4xl font-bold text-blue-600">
        Rs. {price.toLocaleString()}
      </p>
      {negotiable && (
        <span className="inline-block mt-2 px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full">
          <i className="fas fa-tag mr-1"></i> Negotiable
        </span>
      )}
      {showFinanceCalculator && monthlyPayment && (
        <p className="text-sm text-gray-600 mt-2">
          From Rs. {monthlyPayment.toLocaleString()}/month
          <Link href="#finance-calculator" className="text-blue-600 hover:underline ml-1">
            Calculate financing →
          </Link>
        </p>
      )}
    </>
  )
}