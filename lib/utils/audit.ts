import { logger } from '@/lib/utils/logger'

type AuditPayload = Record<string, unknown>

function logAudit(event: string, payload: AuditPayload = {}): void {
  logger.info(`Audit event: ${event}`, {
    timestamp: new Date().toISOString(),
    ...payload,
  })
}

export const AuditEvents = {
  listingApproved(listingId: string, adminUserId: string, matchCount: number) {
    logAudit('admin.listing.approved', {
      listingId,
      adminUserId,
      matchCount,
    })
  },

  accountDeleted(userId: string, email: string) {
    logAudit('user.account.deleted', {
      userId,
      email,
    })
  },
}

