import React, { useState, useEffect, useMemo } from "react";
import { 
  Edit3, 
  Save, 
  X, 
  Square, 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Target,
  Users,
  Zap,
  Settings,
  Calendar,
  BarChart3,
  Lightbulb,
  Copy
} from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

interface IdeaSummaryProps {
  summary: string;
  onSummaryChange: (newSummary: string) => void;
  onStopIdeation: () => void;
  onGenerateReport: () => void;
  isGenerating: boolean;
  isUpdatingSummary?: boolean;
}

interface SummarySection {
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
  priority: number;
}

interface Metrics {
  progress?: number;
  wordCount: number;
  charCount: number;
  sectionsCount: number;
  estimatedTime?: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'metrics'>('overview');

  // Parse summary into structured sections
  const summarySections = useMemo(() => {
    if (!summary) return [];
    
    const sections: SummarySection[] = [];
    const lines = summary.split('\n');
    let currentSection: Partial<SummarySection> | null = null;
    
    lines.forEach((line) => {
      // Detect headers
      const headerMatch = line.match(/^#{1,3}\s*(.+)$/);
      if (headerMatch) {
        if (currentSection) {
          sections.push(currentSection as SummarySection);
        }
        
        const title = headerMatch[1].trim();
        
        // Determine section type and styling
        let icon, color, priority;
        if (title.toLowerCase().includes('core') || title.toLowerCase().includes('idea')) {
          icon = <Lightbulb className="w-5 h-5" />;
          color = 'from-blue-500 to-cyan-500';
          priority = 1;
        } else if (title.toLowerCase().includes('goal') || title.toLowerCase().includes('objective')) {
          icon = <Target className="w-5 h-5" />;
          color = 'from-green-500 to-emerald-500';
          priority = 2;
        } else if (title.toLowerCase().includes('user') || title.toLowerCase().includes('audience')) {
          icon = <Users className="w-5 h-5" />;
          color = 'from-purple-500 to-pink-500';
          priority = 3;
        } else if (title.toLowerCase().includes('feature') || title.toLowerCase().includes('functionality')) {
          icon = <Zap className="w-5 h-5" />;
          color = 'from-yellow-500 to-orange-500';
          priority = 4;
        } else if (title.toLowerCase().includes('technical') || title.toLowerCase().includes('requirement')) {
          icon = <Settings className="w-5 h-5" />;
          color = 'from-indigo-500 to-blue-500';
          priority = 5;
        } else {
          icon = <BarChart3 className="w-5 h-5" />;
          color = 'from-gray-500 to-gray-600';
          priority = 6;
        }
        
        currentSection = { title, content: '', icon, color, priority };
      } else if (currentSection && line.trim()) {
        currentSection.content += line + '\n';
      }
    });
    
    if (currentSection) {
      sections.push(currentSection as SummarySection);
    }
    
    return sections.sort((a, b) => a.priority - b.priority);
  }, [summary]);

  // Extract KPIs and metrics
  const metrics = useMemo((): Metrics => {
    if (!summary) {
      return {
        wordCount: 0,
        charCount: 0,
        sectionsCount: 0
      };
    }
    
    const kpis: Metrics = {
      wordCount: summary.split(/\s+/).filter(word => word.length > 0).length,
      charCount: summary.length,
      sectionsCount: summarySections.length
    };
    
    // Extract progress percentage
    const progressMatch = summary.match(/(\d+)%\s*(structured|complete|done)/i);
    if (progressMatch) {
      kpis.progress = parseInt(progressMatch[1]);
    }
    
    // Extract estimated development time
    const timeMatch = summary.match(/(\d+)\s*(weeks?|months?|days?)/i);
    if (timeMatch) {
      kpis.estimatedTime = `${timeMatch[1]} ${timeMatch[2]}`;
    }
    
    return kpis;
  }, [summary, summarySections]);

  // Update editing summary when summary prop changes
  useEffect(() => {
    setEditingSummary(summary);
    if (summary && !isUpdatingSummary) {
      setLastUpdateTime(new Date());
      if (metrics.progress) {
        setProgressPercentage(metrics.progress);
      }
    }
  }, [summary, isUpdatingSummary, metrics.progress]);

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadSummary = () => {
    const blob = new Blob([summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idea-summary-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Modern Header with Tabs */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              {isUpdatingSummary && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Idea Summary</h2>
              <p className="text-sm text-gray-400">AI-powered insights & metrics</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {isGenerating && (
              <button
                onClick={onStopIdeation}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-all transform hover:scale-105 text-sm font-medium shadow-lg"
              >
                <Square size={16} className="mr-1" />
                Stop
              </button>
            )}
            
            {!isEditing ? (
              <>
                <button
                  onClick={handleStartEdit}
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all transform hover:scale-105 text-sm font-medium shadow-lg"
                >
                  <Edit3 size={16} className="mr-1" />
                  Edit
                </button>
                <button
                  onClick={onGenerateReport}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-all transform hover:scale-105 text-sm font-medium shadow-lg"
                >
                  <FileText size={16} className="mr-1" />
                  Report
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-all transform hover:scale-105 text-sm font-medium shadow-lg"
                >
                  <Save size={16} className="mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-all transform hover:scale-105 text-sm font-medium shadow-lg"
                >
                  <X size={16} className="mr-1" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/10'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <BarChart3 size={16} />
              <span>Overview</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
              activeTab === 'details'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/10'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <FileText size={16} />
              <span>Details</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
              activeTab === 'metrics'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/10'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp size={16} />
              <span>Metrics</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <div className="h-full p-4">
            <textarea
              value={editingSummary}
              onChange={(e) => setEditingSummary(e.target.value)}
              className="w-full h-full bg-gray-800 text-white p-4 rounded-xl border border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Edit your idea summary..."
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar">
            {summary ? (
              <div className="relative">
                {/* Summary Update Overlay */}
                {isUpdatingSummary && (
                  <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
                      <p className="text-blue-400 font-medium text-lg">AI is updating your summary...</p>
                      <p className="text-gray-400 text-sm mt-2">Analyzing conversation for new insights</p>
                    </div>
                  </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="p-6 space-y-6">
                    {/* Progress Section */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Development Progress</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-blue-400">{progressPercentage}%</span>
                          {progressPercentage < 30 ? (
                            <AlertCircle className="h-5 w-5 text-orange-400" />
                          ) : progressPercentage < 80 ? (
                            <TrendingUp className="h-5 w-5 text-green-400" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-purple-400" />
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-3 rounded-full transition-all duration-1000 ${
                            progressPercentage < 30 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                            progressPercentage < 60 ? 'bg-gradient-to-r from-yellow-500 to-green-500' :
                            progressPercentage < 80 ? 'bg-gradient-to-r from-green-500 to-blue-500' :
                            'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-3 text-sm text-gray-400">
                        <span>Last updated: {lastUpdateTime?.toLocaleTimeString()}</span>
                        <span>{metrics.sectionsCount} sections analyzed</span>
                      </div>
                    </div>

                    {/* Quick Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Words</p>
                            <p className="text-xl font-bold text-white">{metrics.wordCount}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Sections</p>
                            <p className="text-xl font-bold text-white">{metrics.sectionsCount}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Est. Time</p>
                            <p className="text-xl font-bold text-white">{metrics.estimatedTime || 'TBD'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Status</p>
                            <p className="text-xl font-bold text-white">
                              {progressPercentage < 30 ? 'Planning' : 
                               progressPercentage < 60 ? 'Development' : 
                               progressPercentage < 80 ? 'Testing' : 'Complete'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 text-sm font-medium"
                      >
                        <Copy size={16} className="mr-2" />
                        Copy Summary
                      </button>
                      <button
                        onClick={downloadSummary}
                        className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 text-sm font-medium"
                      >
                        <Download size={16} className="mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="p-6 space-y-6">
                    {summarySections.length > 0 ? (
                      summarySections.map((section, index) => (
                        <div key={index} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-600/30 hover:border-gray-500/50 transition-all">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`w-12 h-12 bg-gradient-to-r ${section.color} rounded-xl flex items-center justify-center`}>
                              {section.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                          </div>
                          <div className="prose prose-invert max-w-none">
                            <MarkdownRenderer content={section.content} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl text-gray-400 mb-2">No structured sections found</h3>
                        <p className="text-gray-500">The AI will organize your idea into sections as you continue the conversation.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Metrics Tab */}
                {activeTab === 'metrics' && (
                  <div className="p-6 space-y-6">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600/50">
                      <h3 className="text-lg font-semibold text-white mb-4">Detailed Analytics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Content Length</span>
                            <span className="text-white font-medium">{metrics.charCount} characters</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Word Count</span>
                            <span className="text-white font-medium">{metrics.wordCount} words</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Sections</span>
                            <span className="text-white font-medium">{metrics.sectionsCount} organized</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-white font-medium">{progressPercentage}% complete</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Estimated Time</span>
                            <span className="text-white font-medium">{metrics.estimatedTime || 'To be determined'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Last Update</span>
                            <span className="text-white font-medium">{lastUpdateTime?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 px-6">
                <div className="relative mb-8">
                  <div className="text-8xl mb-6 animate-pulse">💡</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 border-4 border-blue-500/20 rounded-full animate-ping"></div>
                  </div>
                </div>
                <h3 className="text-2xl mb-4 text-gray-300 font-semibold">Ready to Structure Your Idea</h3>
                <p className="text-lg mb-8 text-gray-400 max-w-md mx-auto">
                  Your AI-powered idea summary will appear here as you chat. The system will automatically organize and track your progress.
                </p>
                <div className="bg-gray-800/50 rounded-2xl p-6 max-w-lg mx-auto border border-gray-600/30">
                  <h4 className="text-lg font-semibold text-gray-200 mb-4">What the AI will track:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span>Core concept & objectives</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>Target users & market</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span>Key features & functionality</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4 text-indigo-400" />
                      <span>Technical requirements</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-green-400" />
                      <span>Progress & next steps</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <span>Timeline & milestones</span>
                    </div>
                  </div>
                </div>
                <p className="text-blue-400 mt-6 font-medium">Start by sharing your idea below! ↓</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeaSummary;
