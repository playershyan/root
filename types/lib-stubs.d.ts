declare module '@/lib/errorHandling' {
  export class APIError extends Error { status: number; original?: any; constructor(message: string, status?: number, original?: any) }
  export async function withErrorHandling<T>(op: () => Promise<T>, message?: string): Promise<T>
}

declare module '@/lib/utils/errorHandling' {
  export class APIError extends Error { status: number; original?: any; constructor(message: string, status?: number, original?: any) }
  export async function withErrorHandling<T>(op: () => Promise<T>, message?: string): Promise<T>
}

declare module '@/lib/middleware/adminAuth' {
  export async function verifyAdminAccess(req: any): Promise<any>
}

declare module '@/lib/security/recaptcha' {
  export async function verifyRecaptcha(token?: string, ip?: string): Promise<{ success: boolean; score?: number; action?: string; errorCodes?: string[] }>
  export function captchaGuardFailJson(minScore?: number): any
}

declare module '@/lib/security/metrics' {
  export function incr(metric: string, value?: number): void
  export function incrTrend(metric: string, value?: number): void
  export function getSnapshot(): any
  export function reset(): void
  export async function getClusterSnapshot(): Promise<any>
  export async function logAdminAction(action: string, payload?: any): Promise<void>
  export async function getAdminAuditLog(count?: number): Promise<any[]>
  export async function getClusterTrend(metric: string, minutes: number): Promise<Array<{ t: number; v: number }>>
  export const performanceMonitor: { trackApiResponseTime: (endpoint: string, ms: number) => void; trackBusinessMetric: (name: string, v: number) => void }
}

declare module '@/lib/monitoring/uptime' {
  export const uptimeMonitor: { getUptimeSeconds: () => number; getUptimeFormatted: () => string; runHealthChecks: () => Promise<any[]> }
}

declare module '@/lib/monitoring/security-monitoring' {
  export const securityMonitor: { getHealthStatus: () => any; getMetrics: (since?: Date) => any[]; getAlerts: () => any[] }
}

declare module '@/lib/middleware/rateLimiter' {
  export function getQuarantineSnapshot(): any
  export async function unblockIp(ip: string): Promise<void>
  export function resetQuarantineCaches(): void
  export async function getTopOffenders(n: number): Promise<any[]>
}

declare module '@/lib/payments/payhereService' {
  export const PayHereService: { handleNotification: (data: Record<string, string>) => Promise<{ success: boolean }> }
}

declare module '@/lib/cloudinary' {
  export const CloudinaryService: { upload: (input: any) => Promise<any> }
}

declare module '@/lib/services/promotionService' {
  export const PromotionService: { expirePromotions: () => Promise<void>; applyDailyBoost: () => Promise<void> }
}

declare module '@/lib/services/rotationService' {
  export const RotationService: { resetDailyRotationScores: () => Promise<void> }
}

declare module '@/lib/gemini' {
  export async function generateVehicleDescription(make: string, model: string, year: number, mileage?: number, fuel?: string, trans?: string, extra?: string): Promise<string>
}
