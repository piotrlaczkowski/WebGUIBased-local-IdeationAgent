import React from "react";

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

  // Enhanced markdown parsing with better emoji and formatting support
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    const processLine = (line: string, index: number): React.ReactNode | null => {
      // Skip empty lines
      if (!line.trim()) return null;

      // Headers with emojis
      if (line.match(/^#+ /)) {
        const level = (line.match(/^#+/) || [''])[0].length;
        const headerText = line.replace(/^#+\s*/, '');
        
        // Extract emoji if present
        const emojiMatch = headerText.match(/^([^\w\s]+)\s*(.*)/);
        const emoji = emojiMatch ? emojiMatch[1] : '📝';
        const title = emojiMatch ? emojiMatch[2] : headerText;

        if (level === 1) {
          return (
            <div key={index} className="mb-8 text-center">
              <div className="inline-flex items-center bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-2xl px-8 py-4 shadow-2xl interactive-element">
                <span className="text-3xl mr-4 animate-pulse">{emoji}</span>
                <h1 className="text-2xl font-bold text-white tracking-wide">{title}</h1>
              </div>
              <div className="mt-4 w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
            </div>
          );
        }

        // For other headers, just return a simple header element
        return (
          <div key={index} className={`mb-4 ${level === 2 ? 'text-xl font-bold text-blue-300' : 'text-lg font-semibold text-green-300'}`}>
            <span className="mr-2">{emoji}</span>
            {title}
          </div>
        );
      }

      // List items with enhanced styling
      if (line.match(/^[•\-*]\s+/)) {
        const itemText = line.replace(/^[•\-*]\s+/, '');
        
        // Extract emoji from the item text if present
        const emojiMatch = itemText.match(/^([^\w\s]+)\s*(.*)/);
        const emoji = emojiMatch ? emojiMatch[1] : '✨';
        const content = emojiMatch ? emojiMatch[2] : itemText;
        
        return (
          <div key={index} className="list-item-hover p-3 group interactive-element summary-card">
            <div className="flex items-start">
              <span className="text-lg mr-3 mt-0.5 emoji-bounce group-hover:scale-110 transition-transform">
                {emoji}
              </span>
              <div className="text-gray-300 flex-1 leading-relaxed">
                {processInlineFormatting(content)}
              </div>
            </div>
          </div>
        );
      }

      // Regular paragraphs
      if (line.trim()) {
        const processedText = processInlineFormatting(line);
        return (
          <p key={index} className="text-gray-300 mb-3 leading-relaxed">
            {processedText}
          </p>
        );
      }

      return null;
    };

    const processInlineFormatting = (text: string): React.ReactNode => {
      try {
        // Process bold text with gradient effect
        let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong class="gradient-text font-bold">$1</strong>');
        
        // Process italic text
        processed = processed.replace(/\*(.*?)\*/g, '<em class="text-blue-300 italic">$1</em>');
        
        // Process inline code with better styling
        processed = processed.replace(/`(.*?)`/g, '<code class="bg-gray-700 text-green-300 px-2 py-1 rounded text-sm font-mono border border-green-500/30">$1</code>');
        
        // Enhance numbers and metrics with badges
        processed = processed.replace(/(\d+)%/g, '<span class="progress-badge tooltip" data-tooltip="Progress percentage">$1%</span>');
        processed = processed.replace(/(\d+)(?!%)/g, '<span class="text-yellow-300 font-semibold bg-yellow-500/10 px-1 rounded">$1</span>');
        
        // Highlight key terms
        processed = processed.replace(/(goal|objective|target|user|customer|feature|solution|challenge|requirement)/gi, '<span class="text-cyan-300 font-medium">$1</span>');
        
        return <span dangerouslySetInnerHTML={{ __html: processed }} />;
      } catch (error) {
        // Fallback for any formatting errors
        console.warn('Error processing inline formatting:', text, error);
        return <span>{text}</span>;
      }
    };

    // Simple line-by-line processing
    lines.forEach((line, index) => {
      try {
        const processed = processLine(line, index);
        if (processed) {
          elements.push(processed);
        }
      } catch (error) {
        // Fallback for any parsing errors
        console.warn('Error processing markdown line:', line, error);
        elements.push(
          <p key={index} className="text-gray-300 mb-3 leading-relaxed">
            {line}
          </p>
        );
      }
    });

    return elements;
  };



  const elements = parseMarkdown(content);

  return (
    <div className="space-y-4">
      {elements.length > 0 ? (
        <>
          {elements.map((element, index) => (
            <div key={index}>{element}</div>
          ))}
          
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
        </>
      ) : (
        <div className="text-gray-500 italic text-center py-8">
          <div className="text-4xl mb-4">💭</div>
          <p>Processing your message...</p>
        </div>
      )}
    </div>
  );
};

export default MarkdownRenderer;
