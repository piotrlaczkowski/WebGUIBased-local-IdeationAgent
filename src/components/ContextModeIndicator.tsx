import React from "react";
import { MessageSquare, FileText, Zap } from "lucide-react";

interface ContextModeIndicatorProps {
  messageCount: number;
  maxMessages: number;
  usingSmartContext: boolean;
}

const ContextModeIndicator: React.FC<ContextModeIndicatorProps> = ({ 
  messageCount, 
  maxMessages, 
  usingSmartContext 
}) => {
  const progressPercentage = Math.min((messageCount / maxMessages) * 100, 100);
  
  return (
    <div className="flex items-center space-x-2 text-xs text-gray-400">
      <div className="flex items-center space-x-1">
        {usingSmartContext ? (
          <>
            <Zap className="h-3 w-3 text-yellow-400" />
            <span className="text-yellow-400 font-medium">Smart Context</span>
          </>
        ) : (
          <>
            <MessageSquare className="h-3 w-3 text-blue-400" />
            <span className="text-blue-400">Full History</span>
          </>
        )}
      </div>
      
      <div className="flex items-center space-x-1">
        <div className="w-16 bg-gray-700 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all duration-300 ${
              usingSmartContext 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                : 'bg-gradient-to-r from-blue-400 to-green-400'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="text-xs">
          {messageCount}/{maxMessages}
        </span>
      </div>
      
      {usingSmartContext && (
        <div className="flex items-center space-x-1 text-yellow-300">
          <FileText className="h-3 w-3" />
          <span className="text-xs">Using Summary</span>
        </div>
      )}
    </div>
  );
};

export default ContextModeIndicator;
