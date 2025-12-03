'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { Sparkles, FileText, ChevronDown, Edit, X, Check, Wand2, Sparkles as SparklesIcon } from 'lucide-react'

interface DescriptionGeneratorProps {
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  onGenerate: () => Promise<boolean>
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
  const [isEditMode, setIsEditMode] = useState(false)
  const [editValue, setEditValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      // Set height based on scrollHeight, with min and max constraints
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 120), 600)
      textarea.style.height = `${newHeight}px`
    }
  }, [])

  useEffect(() => {
    if (isEditMode) {
      adjustTextareaHeight()
    }
  }, [editValue, isEditMode, adjustTextareaHeight])

  // Also resize when expanded or entering edit mode
  useEffect(() => {
    if (isExpanded && isEditMode) {
      // Small delay to ensure DOM is updated
      setTimeout(adjustTextareaHeight, 100)
    }
  }, [isExpanded, isEditMode, adjustTextareaHeight])

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

  // Auto-expand when description is present (show preview)
  useEffect(() => {
    if (formData.description && !isExpanded) {
      setIsExpanded(true)
      setIsEditMode(false) // Show preview, not edit mode
    }
  }, [formData.description])

  // Sync editValue with formData.description when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      setEditValue(formData.description || '')
    }
  }, [isEditMode, formData.description])

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditMode && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [isEditMode])

  const handleGenerate = async () => {
    setIsGenerating(true)
    const success = await onGenerate()
    setIsGenerating(false)
    // Only expand if description was successfully generated
    if (success) {
      setIsExpanded(true)
      setIsEditMode(false)
    }
  }

  const handleEdit = () => {
    setIsEditMode(true)
    setEditValue(formData.description || '')
  }

  const handleCancel = () => {
    setIsEditMode(false)
    setEditValue('')
  }

  const handleSave = () => {
    setFormData((prev: any) => ({ ...prev, description: editValue }))
    setIsEditMode(false)
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
                onClick={handleGenerate}
                disabled={aiLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {aiLoading ? 'Generating...' : 'Write/Generate'}
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
            {/* Loading state when generating */}
            {isGenerating && !formData.description && (
              <div className="flex items-center gap-2 text-blue-600">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-sm">Generating description...</span>
              </div>
            )}

            {/* Preview Mode */}
            {formData.description && !isEditMode && (
              <div className="relative opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                {/* Premium Card with Gradient Border */}
                <div className="relative p-6 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-xl border-2 border-blue-200/50 shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300">
                  {/* Gradient Border Effect on Hover */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl"></div>
                  
                  {/* Header with AI Badge and Edit Button */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full shadow-md">
                        <SparklesIcon className="w-3 h-3" />
                        <span>AI Generated</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </div>

                  {/* Preview Content with Enhanced Typography */}
                  <div className="relative">
                    <div className="text-base text-gray-800 leading-relaxed space-y-2.5">
                      {formData.description.split('\n').map((line, index, lines) => {
                        const trimmedLine = line.trim()
                        const prevLine = index > 0 ? lines[index - 1].trim() : ''
                        
                        // Find the next non-empty line
                        let nextNonEmptyLine = ''
                        for (let i = index + 1; i < lines.length; i++) {
                          if (lines[i].trim() !== '') {
                            nextNonEmptyLine = lines[i].trim()
                            break
                          }
                        }
                        
                        // Detect section separator: empty line that comes after a non-empty line
                        // and before another non-empty line (handles consecutive empty lines)
                        const isSectionSeparator = trimmedLine === '' && prevLine !== '' && nextNonEmptyLine !== ''
                        const isAfterSeparator = index > 0 && prevLine === '' && lines[index - 1].trim() === ''

                        // Render section separator as a visual divider (only once per separator group)
                        if (isSectionSeparator && prevLine !== '') {
                          return (
                            <div key={index} className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-3"></div>
                          )
                        }

                        // Skip rendering empty lines
                        if (trimmedLine === '') {
                          return null
                        }

                        // First line (title) - make it bold if it doesn't contain a colon
                        if (index === 0 && !trimmedLine.includes(':')) {
                          return (
                            <div key={index} className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-3">
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
                            <div key={index} className={`flex items-start gap-2 ${isAfterSeparator ? 'mt-0' : 'mt-1'}`}>
                              <span className="font-semibold text-gray-900 min-w-fit">{fieldName}:</span>
                              {fieldValue && <span className="text-gray-700 flex-1">{fieldValue}</span>}
                            </div>
                          )
                        }

                        // Regular lines
                        return (
                          <div key={index} className={isAfterSeparator ? 'mt-0' : 'mt-1'}>
                            {trimmedLine}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Enhanced Footer with Status */}
                <div className="flex items-center justify-between mt-4 px-1">
                  <span className="text-xs text-gray-500 font-medium">
                    {formData.description.length} characters
                  </span>
                  {!isGenerating && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-semibold">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Ready to publish</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Edit Mode */}
            {isEditMode && (
              <div className="relative">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    name="description"
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value)
                      // Resize immediately on input
                      setTimeout(adjustTextareaHeight, 0)
                    }}
                    placeholder="Describe your vehicle in detail... Include key features, condition, maintenance history, and why it's a great purchase."
                    className={`w-full px-4 py-3 pr-20 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all resize-none overflow-hidden ${
                      errors?.description ? 'border-red-300' : 'border-gray-300'
                    } bg-white`}
                    style={{ whiteSpace: 'pre-wrap', minHeight: '120px', maxHeight: '600px' }}
                  />
                  
                  {/* Action buttons (X and Check) in top right of textarea */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="text-green-600 hover:text-green-700 transition-colors"
                      title="Save"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Character count */}
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-500">
                    {editValue.length} characters
                  </span>
                </div>
              </div>
            )}

            {/* Generate Button (when in edit mode) */}
            {isEditMode && (
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
            )}

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