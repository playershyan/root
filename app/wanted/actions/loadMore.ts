'use server'

import { getWantedRequestsDynamic } from '../utils/getWantedRequests'
import type { WantedFilters } from '../utils/getWantedRequests'

export async function loadMoreWantedRequests(
  filters: WantedFilters,
  page: number
) {
  try {
    const result = await getWantedRequestsDynamic(filters, page, 20)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Error loading more wanted requests:', error)
    return {
      success: false,
      error: 'Failed to load more requests'
    }
  }
}

