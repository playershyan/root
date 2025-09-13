'use client'

import { useEffect, useState } from 'react'
import { Shield, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

type SecurityMetrics = {
  config: {
    recaptchaEnabled: boolean
    recaptchaUploadRequired: boolean
    aiRatePerMinute: number
    aiDailyLimit: number
    useUpstash: boolean
    quarantineEnabled: boolean
    quarantineThreshold: number
    quarantineWindowSeconds: number
    quarantineBanSeconds: number
  }
  metrics: Record<string, number>
  clusterMetrics?: Record<string, number> | null
  quarantine: { strikesSize: number; blockedSize: number }
  offenders?: { ips: Array<{ id: string, count: number }>, paths: Array<{ id: string, count: number }> }
  audit?: Array<{ action: string; at: string; ip?: string; meta?: any }>
  trends?: { aiErrors: Array<{ t: string, v: number }>, recaptchaFailures: Array<{ t: string, v: number }> }
}

export default function SecurityStatusWidget() {
  const [data, setData] = useState<SecurityMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [ipToUnblock, setIpToUnblock] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/security-metrics')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Failed to load security metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetCounters = async () => {
    await fetch('/api/admin/security-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset-counters' })
    })
    load()
  }

  const resetQuarantine = async () => {
    await fetch('/api/admin/security-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset-quarantine' })
    })
    load()
  }

  const handleUnblockIp = async () => {
    if (!ipToUnblock.trim()) return
    await fetch('/api/admin/security-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unblock-ip', ip: ipToUnblock.trim() })
    })
    setIpToUnblock('')
    load()
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Security & Abuse Protection</h3>
        </div>
        <button onClick={load} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
      )}

      {loading || !data ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Inline Sparkline component */}
          {(() => {
            type SparkProps = { values: number[]; width?: number; height?: number; color?: string; strokeWidth?: number }
            const Sparkline = ({ values, width = 320, height = 70, color = '#2563eb', strokeWidth = 2 }: SparkProps) => {
              const w = Math.max(10, width)
              const h = Math.max(10, height)
              const n = values.length
              const max = Math.max(1, ...values)
              const min = 0
              const dx = n > 1 ? w / (n - 1) : w
              const scaleY = (v: number) => h - ((v - min) / (max - min || 1)) * h
              const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * dx},${scaleY(v)}`).join(' ')
              const zeroLine = `M 0,${scaleY(0)} L ${w},${scaleY(0)}`
              return (
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
                  <path d={zeroLine} stroke="#e5e7eb" strokeWidth={1} fill="none" />
                  <path d={d} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )
            }
            return null
          })()}
          {/* Config overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded border">
              <div className="font-medium mb-2">reCAPTCHA</div>
              <div className="text-sm flex items-center gap-2">
                {data.config.recaptchaEnabled ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
                <span>Enabled: {String(data.config.recaptchaEnabled)}</span>
              </div>
              <div className="text-sm">Uploads require token: {String(data.config.recaptchaUploadRequired)}</div>
            </div>
            <div className="p-4 rounded border">
              <div className="font-medium mb-2">AI Limits</div>
              <div className="text-sm">Per minute: {data.config.aiRatePerMinute}</div>
              <div className="text-sm">Daily cap: {data.config.aiDailyLimit}</div>
            </div>
            <div className="p-4 rounded border">
              <div className="font-medium mb-2">Rate Limiting Backend</div>
              <div className="text-sm">Upstash enabled: {String(data.config.useUpstash)}</div>
            </div>
            <div className="p-4 rounded border">
              <div className="font-medium mb-2">Quarantine</div>
              <div className="text-sm">Enabled: {String(data.config.quarantineEnabled)}</div>
              <div className="text-sm">Threshold: {data.config.quarantineThreshold} in {data.config.quarantineWindowSeconds}s</div>
              <div className="text-sm">Ban: {data.config.quarantineBanSeconds}s</div>
            </div>
          </div>

          {/* Metrics */}
          <div className="p-4 rounded border">
            <div className="font-medium mb-2">Today’s Metrics (instance-local unless Upstash dashboards are used)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {Object.entries(data.metrics).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-1">
                  <span className="text-gray-600">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
              {Object.keys(data.metrics).length === 0 && (
                <div className="text-gray-500">No metrics recorded yet.</div>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={resetCounters} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Reset Counters</button>
            </div>
          </div>

          {/* Cluster Metrics (Upstash) */}
          {data.clusterMetrics && (
            <div className="p-4 rounded border">
              <div className="font-medium mb-2">Cluster Metrics (Upstash)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {Object.entries(data.clusterMetrics).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b py-1">
                    <span className="text-gray-600">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
                {Object.keys(data.clusterMetrics).length === 0 && (
                  <div className="text-gray-500">No cluster metrics yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Quarantine */}
          <div className="p-4 rounded border">
            <div className="font-medium mb-2">Quarantine</div>
            <div className="text-sm">Recent strike buckets: {data.quarantine.strikesSize}</div>
            <div className="text-sm mb-2">Currently blocked IPs (cache size): {data.quarantine.blockedSize}</div>
            <div className="mt-2 flex gap-2 items-center">
              <input value={ipToUnblock} onChange={(e) => setIpToUnblock(e.target.value)} placeholder="IP to unblock" className="border rounded px-2 py-1 text-sm" />
              <button onClick={handleUnblockIp} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">Unblock IP</button>
              <button onClick={resetQuarantine} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Reset Quarantine Caches</button>
            </div>
          </div>

          {/* Top Offenders */}
          {data.offenders && (
            <div className="p-4 rounded border">
              <div className="font-medium mb-2">Top Offenders (429s)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="font-medium mb-1">IPs</div>
                  <ul className="space-y-1">
                    {data.offenders.ips.map((o) => (
                      <li key={o.id} className="flex justify-between items-center border-b py-1">
                        <span className="truncate mr-2">{o.id}</span>
                        <span className="font-medium">{o.count}</span>
                      </li>
                    ))}
                    {data.offenders.ips.length === 0 && <li className="text-gray-500">No data</li>}
                  </ul>
                </div>
                <div>
                  <div className="font-medium mb-1">Paths</div>
                  <ul className="space-y-1">
                    {data.offenders.paths.map((o) => (
                      <li key={o.id} className="flex justify-between items-center border-b py-1">
                        <span className="truncate mr-2">{o.id}</span>
                        <span className="font-medium">{o.count}</span>
                      </li>
                    ))}
                    {data.offenders.paths.length === 0 && <li className="text-gray-500">No data</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Admin Audit Log */}
          {data.audit && (
            <div className="p-4 rounded border">
              <div className="font-medium mb-2">Admin Audit (recent)</div>
              <ul className="text-sm divide-y">
                {data.audit.map((a, idx) => (
                  <li key={idx} className="py-1 flex justify-between">
                    <span className="text-gray-700">{a.action}</span>
                    <span className="text-gray-500">{new Date(a.at).toLocaleString()}</span>
                  </li>
                ))}
                {data.audit.length === 0 && <li className="text-gray-500">No recent actions</li>}
              </ul>
            </div>
          )}

          {/* Trends */}
          {data.trends && (
            <div className="p-4 rounded border">
              <div className="font-medium mb-2">Recent Trends (last 60 min)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">AI Errors</div>
                    <div className="text-xs text-gray-500">latest: {data.trends.aiErrors[data.trends.aiErrors.length - 1]?.v || 0}</div>
                  </div>
                  {/* @ts-ignore - Sparkline defined above */}
                  <Sparkline values={data.trends.aiErrors.map(p => p.v)} color="#ef4444" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">reCAPTCHA Failures</div>
                    <div className="text-xs text-gray-500">latest: {data.trends.recaptchaFailures[data.trends.recaptchaFailures.length - 1]?.v || 0}</div>
                  </div>
                  {/* @ts-ignore - Sparkline defined above */}
                  <Sparkline values={data.trends.recaptchaFailures.map(p => p.v)} color="#f59e0b" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
