import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface MatchingCriteria {
  make: string;
  model: string;
  minYear: number;
  maxYear: number;
  minPrice: number;
  maxPrice: number;
}

export interface ListingMatchData {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
}

export interface WantedRequest {
  id: string;
  user_id: string;
  make?: string;
  model?: string;
  min_year?: number;
  max_year?: number;
  min_budget?: number;
  max_budget?: number;
  status: string;
}

export interface MatchNotification {
  id: string;
  listing_id: string;
  wanted_request_ids: string[];
  match_count: number;
  listing_make: string;
  listing_model: string;
  listing_year: number;
  listing_price: number;
  created_at: string;
  dismissed_at?: string;
}

/**
 * Calculate matching criteria for a listing with tolerance ranges
 */
function calculateMatchCriteria(listing: ListingMatchData): MatchingCriteria {
  return {
    make: listing.make,
    model: listing.model,
    minYear: listing.year - 3,
    maxYear: listing.year + 3,
    minPrice: listing.price * 0.85,  // 15% below
    maxPrice: listing.price * 1.25,  // 25% above
  };
}

/**
 * Perform fuzzy matching for make and model strings
 */
function fuzzyMatch(str1: string, str2: string): boolean {
  if (!str1 || !str2) return false;

  const normalize = (str: string) => str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const normalized1 = normalize(str1);
  const normalized2 = normalize(str2);

  // Exact match
  if (normalized1 === normalized2) return true;

  // Check if one contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;

  // Simple similarity check (at least 80% similar for longer strings)
  if (normalized1.length > 3 && normalized2.length > 3) {
    const similarity = calculateSimilarity(normalized1, normalized2);
    return similarity >= 0.8;
  }

  return false;
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // insertion
        matrix[j - 1][i] + 1, // deletion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
}

/**
 * Find wanted requests that match the given listing
 */
async function findMatchingWantedRequests(listing: ListingMatchData): Promise<WantedRequest[]> {
  const criteria = calculateMatchCriteria(listing);

  try {
    const { data: wantedRequests, error } = await supabase
      .from('wanted_requests')
      .select('*')
      .eq('status', 'active');

    if (error) {
      logger.error('Error fetching wanted requests', error as Error);
      return [];
    }

    if (!wantedRequests) return [];

    // Filter requests based on matching criteria
    const matchingRequests = wantedRequests.filter((request: WantedRequest) => {
      // Make matching (exact or fuzzy)
      if (request.make && !fuzzyMatch(request.make, criteria.make)) {
        return false;
      }

      // Model matching (exact or fuzzy)
      if (request.model && !fuzzyMatch(request.model, criteria.model)) {
        return false;
      }

      // Year range matching with tolerance
      if (request.min_year && listing.year < request.min_year - 3) {
        return false;
      }
      if (request.max_year && listing.year > request.max_year + 3) {
        return false;
      }

      // Budget range matching with asymmetric tolerance
      // 15% below minimum (buyers might accept slightly cheaper options)
      // 25% above maximum (buyers often stretch for the right vehicle)
      if (request.min_budget && listing.price < request.min_budget * 0.85) {
        return false;
      }
      if (request.max_budget && listing.price > request.max_budget * 1.25) {
        return false;
      }

      return true;
    });

    return matchingRequests;
  } catch (error) {
    logger.error('Error in findMatchingWantedRequests', error as Error);
    return [];
  }
}

/**
 * Process wanted request matching for a newly approved listing
 */
export async function processWantedRequestMatching(listingId: string): Promise<{
  success: boolean;
  matchCount: number;
  wantedRequestIds: string[];
  error?: string;
}> {
  try {
    // 1. Get listing data
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, make, model, year, price')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return {
        success: false,
        matchCount: 0,
        wantedRequestIds: [],
        error: 'Listing not found'
      };
    }

    // 2. Find matching wanted requests
    const matchingRequests = await findMatchingWantedRequests(listing);

    if (matchingRequests.length === 0) {
      return {
        success: true,
        matchCount: 0,
        wantedRequestIds: []
      };
    }

    // 3. Create notification record
    const wantedRequestIds = matchingRequests.map(req => req.id);

    const { error: insertError } = await supabase
      .from('listing_wanted_notifications')
      .insert({
        listing_id: listingId,
        wanted_request_ids: wantedRequestIds,
        match_count: matchingRequests.length,
        listing_make: listing.make,
        listing_model: listing.model,
        listing_year: listing.year,
        listing_price: listing.price
      });

    if (insertError) {
      logger.error('Error inserting notification', insertError as Error);
      return {
        success: false,
        matchCount: 0,
        wantedRequestIds: [],
        error: 'Failed to create notification'
      };
    }

    // 4. Update wanted requests with new match count
    const updatePromises = matchingRequests.map(request =>
      supabase
        .from('wanted_requests')
        .update({
          new_matches_count: (request.new_matches_count || 0) + 1,
          last_match_notification: new Date().toISOString()
        })
        .eq('id', request.id)
    );

    await Promise.all(updatePromises);

    return {
      success: true,
      matchCount: matchingRequests.length,
      wantedRequestIds
    };

  } catch (error) {
    logger.error('Error in processWantedRequestMatching', error as Error);
    return {
      success: false,
      matchCount: 0,
      wantedRequestIds: [],
      error: 'Internal server error'
    };
  }
}

/**
 * Get active match notifications for display
 */
export async function getActiveMatchNotifications(): Promise<MatchNotification[]> {
  try {
    const { data: notifications, error } = await supabase
      .from('listing_wanted_notifications')
      .select('*')
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(10); // Limit to most recent 10 notifications

    if (error) {
      logger.error('Error fetching notifications', error as Error);
      return [];
    }

    return notifications || [];
  } catch (error) {
    logger.error('Error in getActiveMatchNotifications', error as Error);
    return [];
  }
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(notificationId: string, userId?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const updateData: any = {
      dismissed_at: new Date().toISOString()
    };

    if (userId) {
      updateData.dismissed_by = userId;
    }

    const { error } = await supabase
      .from('listing_wanted_notifications')
      .update(updateData)
      .eq('id', notificationId);

    if (error) {
      logger.error('Error dismissing notification', error as Error);
      return {
        success: false,
        error: 'Failed to dismiss notification'
      };
    }

    return { success: true };
  } catch (error) {
    logger.error('Error in dismissNotification', error as Error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}

/**
 * Get active notification count for header badge
 */
export async function getActiveNotificationCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('listing_wanted_notifications')
      .select('*', { count: 'exact', head: true })
      .is('dismissed_at', null);

    if (error) {
      logger.error('Error getting notification count', error as Error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error('Error in getActiveNotificationCount', error as Error);
    return 0;
  }
}

/**
 * Clean up old dismissed notifications (called periodically)
 */
export async function cleanupOldNotifications(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from('listing_wanted_notifications')
      .delete()
      .not('dismissed_at', 'is', null)
      .lt('dismissed_at', thirtyDaysAgo.toISOString());

    if (error) {
      logger.error('Error cleaning up old notifications', error as Error);
    }
  } catch (error) {
    logger.error('Error in cleanupOldNotifications', error as Error);
  }
}