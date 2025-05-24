"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, X, Edit3, Lightbulb, ArrowRight, Sparkles } from "lucide-react"
import { AIAnalysis } from "@/types/workflow"
import { cn } from "@/lib/utils"

interface AIAnalysisProps {
  analysis: AIAnalysis
  onApprove: () => void
  onReject: () => void
  onEdit: (editedPrompt: string) => void
  className?: string
}

export function AIAnalysisComponent({ 
  analysis, 
  onApprove, 
  onReject, 
  onEdit, 
  className 
}: AIAnalysisProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedBlueprint, setEditedBlueprint] = useState(analysis.blueprint)

  const handleEdit = () => {
    if (isEditing) {
      onEdit(editedBlueprint)
      setIsEditing(false)
    } else {
      setIsEditing(true)
    }
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-8", className)}>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          AI Analysis & Blueprint
        </h2>
        <p className="text-lg text-gray-600">
          Review the proposed workflow structure before generation
        </p>
      </div>

      {/* Blueprint */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Workflow Blueprint</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEdit}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditing ? 'Save' : 'Edit'}
          </Button>
        </div>
        
        {isEditing ? (
          <textarea
            value={editedBlueprint}
            onChange={(e) => setEditedBlueprint(e.target.value)}
            className="w-full min-h-[120px] p-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <p className="text-gray-700 leading-relaxed text-lg">{analysis.blueprint}</p>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Assumptions */}
        {analysis.assumptions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Assumptions Made</h3>
            </div>
            <ul className="space-y-3">
              {analysis.assumptions.map((assumption, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600 leading-relaxed">{assumption}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Recommendations</h3>
            </div>
            <ul className="space-y-3">
              {analysis.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600 leading-relaxed">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Workflow Preview */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Workflow Structure Preview</h3>
        <div className="mb-4">
          <span className="text-lg font-medium text-gray-900">{analysis.suggestedNodes.length}</span>
          <span className="text-gray-600 ml-2">workflow steps planned</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {analysis.suggestedNodes.map((node) => (
            <div 
              key={node.id} 
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium border",
                node.type === 'trigger' && "bg-green-50 text-green-700 border-green-200",
                node.type === 'action' && "bg-blue-50 text-blue-700 border-blue-200",
                node.type === 'condition' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                node.type === 'transform' && "bg-purple-50 text-purple-700 border-purple-200"
              )}
            >
              {node.data.label}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pt-4">
        <Button 
          variant="outline" 
          onClick={onReject}
          className="px-8 py-3"
        >
          <X className="w-4 h-4 mr-2" />
          Start Over
        </Button>
        <Button 
          onClick={onApprove}
          className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white"
        >
          Generate Workflow
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
} 