import React from 'react'

interface FinancePriceDisplayProps {
  price: number // This will be the outstanding balance
  financeType?: string
  financeProvider?: string
  originalAmount?: number
  outstandingBalance?: number
  askingPrice?: number
  monthlyPayment?: number
  remainingTerm?: string
  earlySettlement?: string
  variant?: 'detail' | 'card'
}

export default function FinancePriceDisplay({
  price,
  financeType,
  financeProvider,
  originalAmount,
  outstandingBalance,
  askingPrice,
  monthlyPayment,
  remainingTerm,
  earlySettlement,
  variant = 'detail'
}: FinancePriceDisplayProps) {
  const displayBalance = outstandingBalance || price
  const displayAskingPrice = askingPrice || displayBalance

  if (variant === 'card') {
    return (
      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-1">Asking Price</p>
        <p className="text-2xl font-bold text-blue-600">
          Rs. {displayAskingPrice.toLocaleString()}
        </p>
        {monthlyPayment && (
          <p className="text-sm text-gray-600 mt-1">
            Rs. {monthlyPayment.toLocaleString()}/month
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
        <p className="text-sm font-semibold text-amber-800 mb-1">
          <i className="fas fa-handshake mr-1"></i> Finance/Lease Takeover
        </p>
        {financeType && financeProvider && (
          <p className="text-xs text-amber-700">
            {financeType} - {financeProvider}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Asking Price:</span>
          <span className="text-3xl font-bold text-blue-600">
            Rs. {displayAskingPrice.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Outstanding Balance:</span>
          <span className="text-lg font-semibold text-gray-900">
            Rs. {displayBalance.toLocaleString()}
          </span>
        </div>
        {monthlyPayment && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Monthly Payment:</span>
            <span className="text-lg font-semibold text-gray-900">
              Rs. {monthlyPayment.toLocaleString()}
            </span>
          </div>
        )}
        {remainingTerm && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Remaining Term:</span>
            <span className="text-sm font-medium text-gray-700">{remainingTerm}</span>
          </div>
        )}
        {originalAmount && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Original Loan Amount:</span>
            <span className="text-sm text-gray-700">
              Rs. {originalAmount.toLocaleString()}
            </span>
          </div>
        )}
        {earlySettlement && (
          <div className="mt-3 p-2 bg-blue-50 rounded">
            <p className="text-xs text-blue-700">
              <i className="fas fa-info-circle mr-1"></i>
              Early Settlement: {earlySettlement}
            </p>
          </div>
        )}
      </div>
    </>
  )
}