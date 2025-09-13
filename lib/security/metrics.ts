// Lightweight metrics aggregator (in-memory with optional Upstash write-through)

type CounterMap = Map<string, number>

const counters: CounterMap = new Map()

function todayKey(base: string) {
  const iso = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const d = iso.replace(/-/g, '')
  return `${base}:d:${d}`
}

export function incr(name: string, by = 1) {
  const key = todayKey(name)
  counters.set(key, (counters.get(key) || 0) + by)
  writeThrough(name, by).catch(() => {})
}

// Increment per-minute trend counter (cluster-capable when Upstash configured)
export async function incrTrend(name: string, by = 1) {
  const client = await getUpstash()
  if (!client) return
  try {
    const key = minuteKey(`metrics:${name}`)
    await client.incrby(key, by)
    await client.expire(key, 172800)
  } catch {}
}

export function getSnapshot() {
  const out: Record<string, number> = {}
  for (const [k, v] of counters.entries()) {
    out[k] = v
  }
  return out
}

export function reset() {
  counters.clear()
}

// Optional Upstash write-through (best-effort)
const useUpstash = (process.env.USE_UPSTASH || '').toLowerCase() === 'true'
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

let upstash: any = null
async function getUpstash() {
  if (!(useUpstash && upstashUrl && upstashToken)) return null
  if (!upstash) {
    try {
      const { Redis } = await import('@upstash/redis')
      upstash = new Redis({ url: upstashUrl!, token: upstashToken! })
    } catch {
      return null
    }
  }
  return upstash
}

async function writeThrough(name: string, by = 1) {
  const client = await getUpstash()
  if (!client) return
  const key = todayKey(`metrics:${name}`)
  const setKey = dailySetKey('metrics:keys')
  try {
    // INCRBY and set 2-day TTL to avoid key buildup
    await client.incrby(key, by)
    await client.expire(key, 172800)
    // Track key name for cluster reads
    await client.sadd(setKey, key)
    await client.expire(setKey, 172800)
  } catch {
    // ignore
  }
}

function dailySetKey(base: string) {
  const iso = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `${base}:d:${iso}`
}

export async function getClusterSnapshot(): Promise<Record<string, number> | null> {
  const client = await getUpstash()
  if (!client) return null
  try {
    const setKey = dailySetKey('metrics:keys')
    const keys: string[] = await client.smembers(setKey)
    if (!keys || keys.length === 0) return {}
    const values = await client.mget(...keys)
    const out: Record<string, number> = {}
    keys.forEach((k: string, i: number) => {
      const v = values[i]
      const num = typeof v === 'string' ? parseInt(v, 10) : (typeof v === 'number' ? v : 0)
      out[k] = Number.isFinite(num) ? num : 0
    })
    return out
  } catch {
    return null
  }
}

function minuteKey(base: string, d: Date = new Date()) {
  const iso = new Date(d).toISOString()
  // YYYYMMDDHHmm (UTC minute granularity)
  const y = iso.slice(0,4)
  const m = iso.slice(5,7)
  const day = iso.slice(8,10)
  const hh = iso.slice(11,13)
  const mm = iso.slice(14,16)
  return `${base}:m:${y}${m}${day}${hh}${mm}`
}

export async function getClusterTrend(name: string, minutes = 60): Promise<Array<{ t: string, v: number }>> {
  const client = await getUpstash()
  const points: Array<{ t: string, v: number }> = []
  const now = new Date()
  const keys: string[] = []
  const labels: string[] = []
  for (let i = minutes - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60000)
    const key = minuteKey(`metrics:${name}`, d)
    keys.push(key)
    labels.push(d.toISOString())
  }
  if (!client) {
    // No cluster store; return zeroed trend
    return labels.map((t) => ({ t, v: 0 }))
  }
  try {
    const vals = await client.mget(...keys)
    for (let i = 0; i < labels.length; i++) {
      const raw = vals[i]
      const num = typeof raw === 'string' ? parseInt(raw, 10) : (typeof raw === 'number' ? raw : 0)
      points.push({ t: labels[i], v: Number.isFinite(num) ? num : 0 })
    }
  } catch {
    return labels.map((t) => ({ t, v: 0 }))
  }
  return points
}

// Admin audit log (best-effort Upstash-backed)
type AuditEntry = { action: string; actor?: string; ip?: string; meta?: any; at: string }
const localAudit: AuditEntry[] = []

export async function logAdminAction(action: string, meta?: Record<string, any>) {
  const entry: AuditEntry = {
    action,
    meta,
    at: new Date().toISOString(),
  }
  localAudit.unshift(entry)
  if (localAudit.length > 200) localAudit.pop()

  const client = await getUpstash()
  if (!client) return
  const listKey = dailySetKey('admin:audit')
  try {
    await client.lpush(listKey, JSON.stringify(entry))
    await client.expire(listKey, 259200) // 3 days
  } catch {}
}

export async function getAdminAuditLog(limit = 50): Promise<AuditEntry[]> {
  const client = await getUpstash()
  if (!client) return localAudit.slice(0, limit)
  try {
    const listKey = dailySetKey('admin:audit')
    const items: string[] = await client.lrange(listKey, 0, limit - 1)
    const parsed = (items || []).map((s) => {
      try { return JSON.parse(s) } catch { return null }
    }).filter(Boolean)
    return parsed as AuditEntry[]
  } catch {
    return localAudit.slice(0, limit)
  }
}
