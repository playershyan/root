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
      {/* Header with breathing effect */}
      <div
        className={`relative overflow-hidden rounded-lg border transition-all duration-500 ${
          isExpanded
            ? 'bg-white border-gray-200'
            : 'bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 border-purple-200 cursor-pointer hover:border-purple-300'
        }`}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        {/* Animated background for breathing effect when collapsed */}
        {!isExpanded && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-blue-400/10 to-purple-400/10 animate-pulse"></div>
        )}

        {/* Header Section */}
        <div className="relative p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                {!isExpanded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                )}
                <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  isExpanded ? 'bg-blue-50 border border-blue-200' : 'bg-white/80'
                }`}>
                  <FileText className={`w-5 h-5 ${isExpanded ? 'text-blue-600' : 'text-purple-600'}`} />
                </div>
              </div>
              <div>
                <h2 className={`text-xl font-semibold transition-colors ${
                  isExpanded ? 'text-gray-900' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
                }`}>
                  Description
                </h2>
                {!isExpanded && (
                  <p className="text-sm text-gray-600 mt-0.5">Click to write or generate description</p>
                )}
              </div>
            </div>

            {/* Generate Button */}
            {!isExpanded ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleGenerate()
                }}
                disabled={aiLoading}
                className="relative px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                {aiLoading ? 'Generating...' : 'Generate'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                {aiLoading ? 'Generating...' : 'Generate Description'}
              </button>
            </div>

            {/* Description Textarea with animation */}
            <div className="relative">
              {isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 rounded-lg animate-pulse pointer-events-none z-10 opacity-50"></div>
              )}
              <textarea
                ref={textareaRef}
                rows={6}
                name="description"
                value={formData.description}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your vehicle in detail... Include key features, condition, maintenance history, and why it's a great purchase."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                  errors?.description ? 'border-red-300' : 'border-gray-300'
                } ${isGenerating ? 'bg-gray-50' : 'bg-white'}`}
                disabled={isGenerating}
              />

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
                  <span className="text-sm text-purple-600 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 animate-spin" />
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

      {/* Helper text below the container */}
      {!isExpanded && (
        <p className="text-gray-500 text-sm mt-3">
          Create an attractive description for your listing using AI or write your own
        </p>
      )}
    </div>
  )
})

DescriptionGenerator.displayName = 'DescriptionGenerator'

export default DescriptionGenerator