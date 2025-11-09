'use client'

import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw, Eye, BarChart3, AlertCircle, CheckCircle } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface Template {
  id: number
  template_content: string
  vehicle_type?: string
  usage_count: number
  created_at: string
  is_active: boolean
}

interface GenerationStats {
  generation: {
    recentGenerations: any[]
    totalActiveTemplates: number
  }
  usage: {
    totalTemplates: number
    totalUsage: number
  } | null
}

export default function TemplateManagementPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [stats, setStats] = useState<GenerationStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [templatesRes, statsRes] = await Promise.all([
        fetch('/api/admin/templates?action=templates'),
        fetch('/api/admin/templates?action=stats')
      ])

      const templatesData = await templatesRes.json()
      const statsData = await statsRes.json()

      setTemplates(templatesData.templates || [])
      setStats(statsData)
    } catch (error) {
      logger.error('Failed to load data', error as Error)
      setMessage({ type: 'error', text: 'Failed to load template data' })
    } finally {
      setLoading(false)
    }
  }

  const generateTemplates = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        await loadData() // Reload data
      } else {
        setMessage({ type: 'error', text: result.message || 'Generation failed' })
      }
    } catch (error) {
      logger.error('Template generation failed', error as Error)
      setMessage({ type: 'error', text: 'Template generation failed' })
    } finally {
      setGenerating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateTemplate = (content: string, maxLength: number = 150) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  }


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Management</h1>
          <p className="text-gray-600">Manage AI-generated vehicle description templates</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.generation.totalActiveTemplates}
                  </p>
                  <p className="text-sm text-gray-600">Active Templates</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <Eye className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.usage?.totalUsage || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Usage</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.generation.recentGenerations.length}
                  </p>
                  <p className="text-sm text-gray-600">Recent Generations</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">Monthly</p>
                  <p className="text-sm text-gray-600">Auto Refresh</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Template Generation</h2>
              <p className="text-gray-600">Generate new templates using OpenAI ChatGPT</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={generateTemplates}
                disabled={generating || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Generating...' : 'Generate New Templates'}
              </button>
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Templates</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No templates found. Generate some templates to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {templates.map((template) => (
                <div key={template.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Template
                        </span>
                        <span className="text-sm text-gray-500">
                          ID: {template.id}
                        </span>
                        <span className="text-sm text-gray-500">
                          Used: {template.usage_count} times
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">
                        {truncateTemplate(template.template_content)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {formatDate(template.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="ml-4 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Template Preview
                  </h3>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Template
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                  {selectedTemplate.template_content}
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Template ID: {selectedTemplate.id}</p>
                  <p>Usage Count: {selectedTemplate.usage_count}</p>
                  <p>Created: {formatDate(selectedTemplate.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}