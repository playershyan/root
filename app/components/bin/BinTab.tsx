'use client'

import { useState } from 'react'
import { Trash2, Car, MessageSquare, Search, AlertTriangle } from 'lucide-react'
import { BinItemData } from '@/lib/utils/binUtils'
import BinMessageCard from './BinMessageCard'
import BinListingCard from './BinListingCard'
import BinWantedCard from './BinWantedCard'

interface BinTabProps {
  binItems: BinItemData[]
  onRestoreItem?: (itemType: string, id: string) => void
  restoringItemId?: string | null
  loading?: boolean
}

type BinType = 'listings' | 'messages' | 'wanted'

export default function BinTab({
  binItems,
  onRestoreItem,
  restoringItemId,
  loading = false
}: BinTabProps) {
  const [activeType, setActiveType] = useState<BinType>('listings')

  // Filter items by type
  const getFilteredItems = (type: BinType) => {
    const filterType = type === 'listings' ? 'listing' 
      : type === 'messages' ? 'message' 
      : 'wanted_request'
    
    return binItems.filter(item => item.item_type === filterType)
  }

  const listingItems = getFilteredItems('listings')
  const messageItems = getFilteredItems('messages')
  const wantedItems = getFilteredItems('wanted')

  const handleRestore = (id: string, itemType: string) => {
    if (onRestoreItem) {
      onRestoreItem(itemType, id)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading bin items...</span>
      </div>
    )
  }

  const totalItems = binItems.length
  const hasNoItems = totalItems === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Trash2 className="w-7 h-7" />
            Bin
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              {totalItems} total item{totalItems !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Items in the bin are automatically deleted</p>
              <p className="text-sm text-amber-700 mt-1">
                Deleted items will be permanently removed from your account after 30 days in the bin.
              </p>
            </div>
          </div>
        </div>

        {/* Type Toggle */}
        {!hasNoItems && (
          <div className="flex bg-gray-100 rounded-lg p-1 max-w-fit">
            <button
              onClick={() => setActiveType('listings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeType === 'listings'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Car className="w-4 h-4" />
              Listings ({listingItems.length})
            </button>
            <button
              onClick={() => setActiveType('messages')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeType === 'messages'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Messages ({messageItems.length})
            </button>
            <button
              onClick={() => setActiveType('wanted')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeType === 'wanted'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search className="w-4 h-4" />
              Wanted ({wantedItems.length})
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {hasNoItems ? (
          <div className="text-center py-12">
            <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bin is Empty</h3>
            <p className="text-gray-600">
              Items you delete will appear here for 30 days before being permanently removed.
            </p>
          </div>
        ) : (
          <div className="p-6">
            {activeType === 'listings' && (
              <>
                {listingItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Car className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="font-medium">No deleted listings in the bin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listingItems.map(item => (
                      <BinListingCard
                        key={item.id}
                        listing={item}
                        onRestore={(id) => handleRestore(id, 'listing')}
                        restoring={restoringItemId === item.id}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeType === 'messages' && (
              <>
                {messageItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="font-medium">No deleted messages in the bin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messageItems.map(item => (
                      <BinMessageCard
                        key={item.id}
                        message={item}
                        onRestore={(id) => handleRestore(id, 'message')}
                        restoring={restoringItemId === item.id}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeType === 'wanted' && (
              <>
                {wantedItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="font-medium">No deleted wanted requests in the bin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wantedItems.map(item => (
                      <BinWantedCard
                        key={item.id}
                        wanted={item}
                        onRestore={(id) => handleRestore(id, 'wanted_request')}
                        restoring={restoringItemId === item.id}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}