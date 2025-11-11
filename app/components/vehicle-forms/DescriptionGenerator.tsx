'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Sparkles, FileText, ChevronDown } from 'lucide-react'

interface DescriptionGeneratorProps {
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  onGenerate: () => Promise<void>
  aiLoading: boolean
  errors?: Record<string, string>
}

export interface DescriptionGeneratorRef {
  expandAndFocus: () => void
}

const DescriptionGenerator = forwardRef<DescriptionGeneratorRef, DescriptionGeneratorProps>(({
  formData,
  setFormData,
  onGenerate,
  aiLoading,
  errors
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    expandAndFocus: () => {
      setIsExpanded(true)
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
        setTimeout(() => {
          textareaRef.current?.focus()
        }, 300)
      }, 100)
    }
  }))

  // Auto-expand when description is present
  useEffect(() => {
    if (formData.description && !isExpanded) {
      setIsExpanded(true)
    }
  }, [formData.description])

  // Auto-focus textarea when expanded
  useEffect(() => {
    if (isExpanded && textareaRef.current && !formData.description) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 300)
    }
  }, [isExpanded])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setIsExpanded(true)
    await onGenerate()
    setIsGenerating(false)
  }

  return (
    <div className="border-t border-gray-200 pt-8">
      {/* Header */}
      <div className="bg-white border border-gray-300 rounded-lg">
        {/* Header Section */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            {!isExpanded && (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Write/Generate
              </button>
            )}
          </div>
        </div>

        {/* Expandable Content Section */}
        <div
          ref={containerRef}
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-4 space-y-4">

            {/* Generate Button (when expanded) */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={aiLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                {aiLoading ? 'Generating...' : 'Generate Description'}
              </button>
            </div>

            {/* Description Textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={6}
                name="description"
                value={formData.description}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your vehicle in detail... Include key features, condition, maintenance history, and why it's a great purchase."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all resize-y ${
                  errors?.description ? 'border-red-300' : 'border-gray-300'
                } ${isGenerating ? 'bg-gray-50' : 'bg-white'}`}
                disabled={isGenerating}
                style={{ whiteSpace: 'pre-wrap' }}
              />
              
              {/* Preview of formatted description */}
              {formData.description && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">
                    {formData.description.split('\n').map((line, index) => {
                      const trimmedLine = line.trim()

                      // First line (title) - make it bold if it doesn't contain a colon
                      if (index === 0 && !trimmedLine.includes(':')) {
                        return (
                          <div key={index} className="font-bold text-gray-900 text-base mb-1">
                            {trimmedLine}
                          </div>
                        )
                      }

                      // Lines with "Field: Value" format - make field name bold
                      if (trimmedLine.includes(':')) {
                        const colonIndex = trimmedLine.indexOf(':')
                        const fieldName = trimmedLine.substring(0, colonIndex)
                        const fieldValue = trimmedLine.substring(colonIndex + 1).trim()

                        return (
                          <div key={index}>
                            <strong className="font-semibold text-gray-900">{fieldName}:</strong>
                            {fieldValue && <span> {fieldValue}</span>}
                          </div>
                        )
                      }

                      // Regular lines
                      return (
                        <div key={index}>
                          {trimmedLine}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Character count and status */}
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500">
                  {formData.description.length} characters
                </span>
                {formData.description && !isGenerating && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Good description
                  </span>
                )}
                {isGenerating && (
                  <span className="text-sm text-blue-600 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Generating...
                  </span>
                )}
              </div>
            </div>

            {errors?.description && (
              <p className="text-red-600 text-sm">{errors.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

DescriptionGenerator.displayName = 'DescriptionGenerator'

export default DescriptionGenerator