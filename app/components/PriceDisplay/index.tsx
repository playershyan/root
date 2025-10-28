import React from 'react'
import CashPriceDisplay from './CashPriceDisplay'
import FinancePriceDisplay from './FinancePriceDisplay'

export interface PriceDisplayProps {
  pricingType?: 'cash' | 'finance'
  price: number
  negotiable?: boolean
  financeType?: string
  outstandingBalance?: number
  askingPrice?: number
  monthlyPayment?: number
  remainingTerm?: string
  showFinanceCalculator?: boolean
  calculatedMonthlyPayment?: number | null
  variant?: 'detail' | 'card'
}

export default function PriceDisplay(props: PriceDisplayProps) {
  const {
    pricingType = 'cash',
    price,
    negotiable,
    financeType,
    outstandingBalance,
    askingPrice,
    monthlyPayment,
    remainingTerm,
    showFinanceCalculator = true,
    calculatedMonthlyPayment,
    variant = 'detail'
  } = props

  if (pricingType === 'finance') {
    return (
      <FinancePriceDisplay
        price={price}
        financeType={financeType}
        outstandingBalance={outstandingBalance}
        askingPrice={askingPrice}
        monthlyPayment={monthlyPayment}
        remainingTerm={remainingTerm}
        variant={variant}
      />
    )
  }

  return (
    <CashPriceDisplay
      price={price}
      negotiable={negotiable}
      showFinanceCalculator={showFinanceCalculator}
      monthlyPayment={calculatedMonthlyPayment}
      variant={variant}
    />
  )
}

// Export the sub-components for direct use if needed
export { CashPriceDisplay, FinancePriceDisplay }