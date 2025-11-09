import ListingsPageClient from './_components/ListingsPageClient'
import { getListingsFeed, getPromotedSlots } from '@/lib/server/listings-feed'
import type { ListingsFeedFilters } from '@/lib/types/listings-feed'
import type {
  ListingsPageFilterState,
  ListingsPagePaginationState,
  SortOption
} from '@/app/listings/types'

export const revalidate = 120

type RawParam = string | string[] | undefined

function getParam(params: Record<string, RawParam>, key: string): string {
  const value = params[key]
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return value ?? ''
}

function parseNumber(value: string): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function fromSortParam(value: string): SortOption {
  switch (value) {
    case 'price-low':
      return 'price_low'
    case 'price-high':
      return 'price_high'
    case 'year-new':
      return 'year_new'
    case 'year-old':
      return 'year_old'
    case 'mileage-low':
      return 'mileage_low'
    default:
      return 'recent'
  }
}

function parseFilters(searchParams: Record<string, RawParam>) {
  const search = getParam(searchParams, 'q').trim()
  const vehicleType = getParam(searchParams, 'category')
  const location = getParam(searchParams, 'location')
  const make = getParam(searchParams, 'make')
  const model = getParam(searchParams, 'model')
  const minYear = getParam(searchParams, 'minYear')
  const maxYear = getParam(searchParams, 'maxYear')
  const minPrice = getParam(searchParams, 'minPrice')
  const maxPrice = getParam(searchParams, 'maxPrice')
  const fuel = getParam(searchParams, 'fuel')
  const transmission = getParam(searchParams, 'transmission')
  const urgentOnly = getParam(searchParams, 'urgent') === 'true'
  const sort = fromSortParam(getParam(searchParams, 'sort'))
  const pageParam = getParam(searchParams, 'page')
  const page = Math.max(parseInt(pageParam, 10) || 1, 1)

  const fuelTypes = fuel ? fuel.split(',').filter(Boolean) : []
  const transmissionTypes = transmission ? transmission.split(',').filter(Boolean) : []

  const dbFilters: ListingsFeedFilters = {
    vehicleType: vehicleType || null,
    make: make || null,
    model: model || null,
    minYear: parseNumber(minYear),
    maxYear: parseNumber(maxYear),
    minPrice: parseNumber(minPrice),
    maxPrice: parseNumber(maxPrice),
    fuelTypes: fuelTypes.length > 0 ? fuelTypes : null,
    transmissionTypes: transmissionTypes.length > 0 ? transmissionTypes : null,
    urgentOnly: urgentOnly || null,
    search: search || null,
    sort,
    page,
    pageSize: null
  }

  const clientFilters: ListingsPageFilterState = {
    search,
    vehicleType,
    location,
    make,
    model,
    minYear,
    maxYear,
    minPrice,
    maxPrice,
    fuelTypes,
    transmissionTypes,
    urgentOnly,
    sort
  }

  return { dbFilters, clientFilters }
}

interface ListingsPageProps {
  searchParams: Record<string, RawParam>
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const { dbFilters, clientFilters } = parseFilters(searchParams)

  const [initialFeed, promoted] = await Promise.all([
    getListingsFeed(dbFilters),
    getPromotedSlots(dbFilters.vehicleType ?? null)
  ])

  const shouldRefetchLastPage =
    (dbFilters.page ?? 1) > 1 &&
    initialFeed.totalPages > 0 &&
    initialFeed.page > initialFeed.totalPages

  const feed = shouldRefetchLastPage
    ? await getListingsFeed({ ...dbFilters, page: initialFeed.totalPages })
    : initialFeed

  const pagination: ListingsPagePaginationState = {
    page: feed.page,
    total: feed.total,
    pageSize: feed.pageSize,
    totalPages: feed.totalPages
  }

  return (
    <ListingsPageClient
      listings={feed.items}
      promoted={promoted}
      pagination={pagination}
      filters={clientFilters}
    />
  )
}

