import React from 'react'
import CashPriceDisplay from './CashPriceDisplay'
import FinancePriceDisplay from './FinancePriceDisplay'

export interface PriceDisplayProps {
  pricingType?: 'cash' | 'finance'
  price: number | null
  negotiable?: boolean
  financeType?: string
  outstandingBalance?: number
  askingPrice?: number
  monthlyPayment?: number
  remainingTerm?: string
  showFinanceCalculator?: boolean
  calculatedMonthlyPayment?: number | null
  variant?: 'detail' | 'card'
  colorScheme?: 'blue' | 'gold'
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
    variant = 'detail',
    colorScheme = 'blue'
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
        colorScheme={colorScheme}
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
      colorScheme={colorScheme}
    />
  )
}

// Export the sub-components for direct use if needed
export { CashPriceDisplay, FinancePriceDisplay }