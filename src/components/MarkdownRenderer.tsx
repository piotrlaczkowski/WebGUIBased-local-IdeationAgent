import React from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Handle empty or null content
  if (!content || content.trim() === '') {
    return (
      <div className="text-gray-500 italic text-center py-8">
        <div className="text-4xl mb-4">🤔</div>
        <p>Thinking...</p>
      </div>
    );
  }

  // Custom components for enhanced styling
  const components = {
    h1: ({ children, ...props }: any) => (
      <div className="mb-8 text-center">
        <div className="inline-flex items-center bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-2xl px-8 py-4 shadow-2xl interactive-element">
          <span className="text-3xl mr-4 animate-pulse">📝</span>
          <h1 className="text-2xl font-bold text-white tracking-wide" {...props}>
            {children}
          </h1>
        </div>
        <div className="mt-4 w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
      </div>
    ),
    h2: ({ children, ...props }: any) => (
      <div className="mb-4 text-xl font-bold text-blue-300" {...props}>
        <span className="mr-2">🎯</span>
        {children}
      </div>
    ),
    h3: ({ children, ...props }: any) => (
      <div className="mb-4 text-lg font-semibold text-green-300" {...props}>
        <span className="mr-2">⚙️</span>
        {children}
      </div>
    ),
    p: ({ children, ...props }: any) => (
      <p className="text-gray-300 mb-3 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="gradient-text font-bold" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="text-blue-300 italic" {...props}>
        {children}
      </em>
    ),
    code: ({ children, ...props }: any) => (
      <code className="bg-gray-700 text-green-300 px-2 py-1 rounded text-sm font-mono border border-green-500/30" {...props}>
        {children}
      </code>
    ),
    li: ({ children, ...props }: any) => (
      <div className="list-item-hover p-3 group interactive-element summary-card">
        <div className="flex items-start">
          <span className="text-lg mr-3 mt-0.5 emoji-bounce group-hover:scale-110 transition-transform">
            ✨
          </span>
          <div className="text-gray-300 flex-1 leading-relaxed" {...props}>
            {children}
          </div>
        </div>
      </div>
    ),
    ul: ({ children, ...props }: any) => (
      <div className="space-y-2" {...props}>
        {children}
      </div>
    ),
    ol: ({ children, ...props }: any) => (
      <div className="space-y-2" {...props}>
        {children}
      </div>
    ),
  };

  return (
    <div className="space-y-4">
      <div className="markdown">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
      
      {/* Only show progress indicator for summary content, not chat messages */}
      {content.length > 200 && (
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-cyan-900/40 rounded-2xl border border-blue-500/30 summary-card">
          <div className="flex items-center justify-between text-sm text-blue-200 mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3 animate-bounce">🚀</span>
              <span className="font-bold text-lg gradient-text">Development Status</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center progress-badge">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs font-semibold">ACTIVE</span>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full progress-bar"
              style={{ '--progress-width': '75%' } as React.CSSProperties}
            ></div>
          </div>
          
          <div className="mt-3 text-xs text-gray-400 text-center">
            Idea structure automatically updated after each conversation
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownRenderer;
