import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  emoji: string;
  defaultOpen?: boolean;
  level?: number;
}

  const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  emoji,
  defaultOpen = true,
  level = 2
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const levelStyles = {
    1: "text-xl font-bold text-white mb-3",
    2: "text-lg font-semibold text-blue-300 mb-2",
    3: "text-md font-medium text-green-300 mb-2"
  };

  const bgColors = {
    1: "bg-gradient-to-r from-blue-600/20 to-purple-600/20",
    2: "bg-gradient-to-r from-gray-700/30 to-gray-600/30",
    3: "bg-gradient-to-r from-green-600/20 to-blue-600/20"
  };

  return (
    <div className="mb-6 summary-card rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center w-full text-left p-4 transition-all duration-300 group interactive-element ${bgColors[level as keyof typeof bgColors] || bgColors[2]} border border-gray-600/30 hover:border-blue-500/50`}
      >
        <span className="mr-3 text-2xl emoji-bounce group-hover:scale-110 transition-transform">
          {emoji}
        </span>
        <span className={`${levelStyles[level as keyof typeof levelStyles] || levelStyles[2]} flex-1`}>
          {title}
        </span>
        <div className="opacity-60 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
          {isOpen ? 
            <ChevronDown size={20} className="text-blue-400" /> : 
            <ChevronRight size={20} className="text-green-400" />
          }
        </div>
      </button>
      {isOpen && (
        <div className="section-content p-4 border-t border-gray-600/30">
          {children}
        </div>
      )}
    </div>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Enhanced markdown parsing with better emoji and formatting support
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentSection: { title: string; content: string[]; emoji: string; level: number } | null = null;
    let lineIndex = 0;

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

        return { type: 'header', level, emoji, title, index };
      }

      // List items with enhanced styling
      if (line.match(/^[•\-\*]\s+/)) {
        const itemText = line.replace(/^[•\-\*]\s+/, '');
        const processedText = processInlineFormatting(itemText);
        
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
    };

    // First pass: identify sections
    const sections: Array<{ title: string; content: string[]; emoji: string; level: number; startIndex: number }> = [];
    let currentSectionData: { title: string; content: string[]; emoji: string; level: number; startIndex: number } | null = null;

    lines.forEach((line, index) => {
      if (line.match(/^##+ /)) {
        // Save previous section
        if (currentSectionData) {
          sections.push(currentSectionData);
        }
        
        // Start new section
        const level = (line.match(/^#+/) || [''])[0].length;
        const headerText = line.replace(/^#+\s*/, '');
        const emojiMatch = headerText.match(/^([^\w\s]+)\s*(.*)/);
        const emoji = emojiMatch ? emojiMatch[1] : getDefaultEmoji(headerText);
        const title = emojiMatch ? emojiMatch[2] : headerText;
        
        currentSectionData = {
          title,
          emoji,
          level,
          content: [],
          startIndex: index
        };
      } else if (currentSectionData && line.trim()) {
        currentSectionData.content.push(line);
      }
    });

    // Don't forget the last section
    if (currentSectionData) {
      sections.push(currentSectionData);
    }

    // Render sections
    sections.forEach((section, sectionIndex) => {
      const sectionContent = section.content.map((line, lineIdx) => 
        processLine(line, section.startIndex + lineIdx + 1)
      ).filter(Boolean);

      elements.push(
        <CollapsibleSection
          key={sectionIndex}
          title={section.title}
          emoji={section.emoji}
          level={section.level}
          defaultOpen={sectionIndex < 3} // First 3 sections open by default
        >
          {sectionContent}
        </CollapsibleSection>
      );
    });

    // Handle lines that aren't part of sections (like main title)
    lines.forEach((line, index) => {
      if (line.match(/^# /)) {
        const processed = processLine(line, index);
        if (processed && typeof processed === 'object' && 'type' in processed) {
          // Skip, will be handled as section
        } else if (processed) {
          elements.unshift(processed);
        }
      }
    });

    return elements;
  };

  const getDefaultEmoji = (title: string): string => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('core') || titleLower.includes('idea')) return '💡';
    if (titleLower.includes('goal') || titleLower.includes('objective')) return '🎯';
    if (titleLower.includes('audience') || titleLower.includes('user')) return '👥';
    if (titleLower.includes('feature') || titleLower.includes('solution')) return '⚙️';
    if (titleLower.includes('requirement')) return '✅';
    if (titleLower.includes('challenge') || titleLower.includes('problem')) return '⚠️';
    if (titleLower.includes('step') || titleLower.includes('plan')) return '📋';
    if (titleLower.includes('progress') || titleLower.includes('metric')) return '📊';
    if (titleLower.includes('focus') || titleLower.includes('current')) return '🤔';
    
    return '📝';
  };

  const elements = parseMarkdown(content);

  return (
    <div className="space-y-4">
      {elements.map((element, index) => (
        <div key={index}>{element}</div>
      ))}
      
      {/* Enhanced progress indicator */}
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
    </div>
  );
};

export default MarkdownRenderer;
