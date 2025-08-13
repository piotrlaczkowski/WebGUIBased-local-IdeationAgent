import React from "react";
import { Brain, RefreshCw } from "lucide-react";

interface SummaryUpdateNotificationProps {
  isUpdating: boolean;
}

const SummaryUpdateNotification: React.FC<SummaryUpdateNotificationProps> = ({ isUpdating }) => {
  if (!isUpdating) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg shadow-2xl border border-blue-400/30 max-w-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Brain className="h-5 w-5 text-blue-200" />
            <RefreshCw className="h-3 w-3 text-white absolute -top-1 -right-1 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">Updating Idea Summary</span>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
            <p className="text-xs text-blue-100 mt-1">AI is creating a structured summary...</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 w-full bg-blue-800/50 rounded-full h-1">
          <div className="bg-gradient-to-r from-yellow-400 to-green-400 h-1 rounded-full animate-pulse" 
               style={{ 
                 width: '70%',
                 animation: 'progress-pulse 1.5s ease-in-out infinite'
               }}>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryUpdateNotification;
