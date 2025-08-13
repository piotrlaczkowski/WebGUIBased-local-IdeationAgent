import React, { useState, useEffect } from "react";
import { Edit3, Save, X, Square, FileText, Download, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

interface IdeaSummaryProps {
  summary: string;
  onSummaryChange: (newSummary: string) => void;
  onStopIdeation: () => void;
  onGenerateReport: () => void;
  isGenerating: boolean;
  isUpdatingSummary?: boolean;
}

const IdeaSummary: React.FC<IdeaSummaryProps> = ({
  summary,
  onSummaryChange,
  onStopIdeation,
  onGenerateReport,
  isGenerating,
  isUpdatingSummary = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingSummary, setEditingSummary] = useState(summary);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Update editing summary when summary prop changes
  useEffect(() => {
    setEditingSummary(summary);
    if (summary && !isUpdatingSummary) {
      setLastUpdateTime(new Date());
      // Extract progress percentage from summary
      const progressMatch = summary.match(/(\d+)%\s*structured/);
      if (progressMatch) {
        setProgressPercentage(parseInt(progressMatch[1]));
      }
    }
  }, [summary, isUpdatingSummary]);

  const handleStartEdit = () => {
    setEditingSummary(summary);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onSummaryChange(editingSummary);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditingSummary(summary);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-2xl font-bold text-teal-400">Idea Summary</h2>
            {isUpdatingSummary && (
              <div className="flex items-center space-x-2 text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                <span className="text-sm font-medium">Updating...</span>
              </div>
            )}
          </div>
          
          {/* Progress Bar and Status */}
          <div className="flex items-center space-x-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Development Progress</span>
                <span className="text-xs text-gray-300 font-medium">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    progressPercentage < 30 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                    progressPercentage < 60 ? 'bg-gradient-to-r from-yellow-500 to-green-500' :
                    progressPercentage < 80 ? 'bg-gradient-to-r from-green-500 to-blue-500' :
                    'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            
            {/* Status Icon */}
            <div className="flex items-center space-x-1">
              {progressPercentage < 30 ? (
                <AlertCircle className="h-4 w-4 text-orange-400" />
              ) : progressPercentage < 80 ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <CheckCircle className="h-4 w-4 text-purple-400" />
              )}
            </div>
          </div>

          {/* Last Update Time */}
          {lastUpdateTime && !isUpdatingSummary && (
            <div className="text-xs text-gray-500 mb-2">
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </div>
          )}
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col gap-2 ml-4">
          <div className="flex gap-2">
            {isGenerating && (
              <button
                onClick={onStopIdeation}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg transition-all transform hover:scale-105 text-sm shadow-lg"
              >
                <Square size={14} className="mr-1" />
                Stop
              </button>
            )}
            
            {!isEditing ? (
              <>
                <button
                  onClick={handleStartEdit}
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition-all transform hover:scale-105 text-sm shadow-lg"
                >
                  <Edit3 size={14} className="mr-1" />
                  Edit
                </button>
                <button
                  onClick={onGenerateReport}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg transition-all transform hover:scale-105 text-sm shadow-lg"
                >
                  <FileText size={14} className="mr-1" />
                  Report
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg transition-all transform hover:scale-105 text-sm shadow-lg"
                >
                  <Save size={14} className="mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-lg transition-all transform hover:scale-105 text-sm shadow-lg"
                >
                  <X size={14} className="mr-1" />
                  Cancel
                </button>
              </>
            )}
          </div>
          
          {/* Quick Actions */}
          {!isEditing && summary && (
            <div className="flex gap-1">
              <button
                onClick={() => navigator.clipboard.writeText(summary)}
                className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                title="Copy to clipboard"
              >
                Copy
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([summary], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'idea-summary.md';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                title="Download as markdown"
              >
                <Download size={10} className="inline" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Summary Content */}
      <div className="flex-grow bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-xl p-4 overflow-y-auto custom-scrollbar border border-gray-700 shadow-lg">
        {isEditing ? (
          <div className="h-full">
            <textarea
              value={editingSummary}
              onChange={(e) => setEditingSummary(e.target.value)}
              className="w-full h-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Edit your idea summary..."
            />
          </div>
        ) : (
          <div className="text-gray-300">
            {summary ? (
              <div className="relative">
                {/* Summary Update Overlay */}
                {isUpdatingSummary && (
                  <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent mx-auto mb-3"></div>
                      <p className="text-blue-400 font-medium">AI is updating your summary...</p>
                      <p className="text-gray-400 text-sm mt-1">Analyzing conversation for new insights</p>
                    </div>
                  </div>
                )}
                <MarkdownRenderer content={summary} />
              </div>
            ) : (
              <div className="text-gray-500 italic text-center py-12">
                <div className="relative">
                  <div className="text-6xl mb-6 animate-pulse">💡</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 border-4 border-blue-500/20 rounded-full animate-ping"></div>
                  </div>
                </div>
                <h3 className="text-xl mb-3 text-gray-400 font-semibold">Ready to Structure Your Idea</h3>
                <p className="text-base mb-4 text-gray-500">Your AI-powered idea summary will appear here as you chat</p>
                <div className="bg-gray-700/50 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">What the AI will track:</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>🎯 Core concept and objectives</li>
                    <li>👥 Target users and market</li>
                    <li>⚡ Key features and functionality</li>
                    <li>🔧 Technical requirements</li>
                    <li>📊 Progress and next steps</li>
                  </ul>
                </div>
                <p className="text-sm mt-4 text-blue-400">Start by sharing your idea below! ↓</p>
              </div>
            )}
          </div>
        )}
      </div>

      {summary && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Words: {summary.split(/\s+/).filter(word => word.length > 0).length}</span>
            <span>Characters: {summary.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaSummary;
