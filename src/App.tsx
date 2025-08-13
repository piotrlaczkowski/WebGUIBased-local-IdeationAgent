import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { openDB, type IDBPDatabase } from "idb";
import { Play, Zap, RotateCcw, Settings, X, Users } from "lucide-react";
import { useLLM } from "./hooks/useLLM";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";

import {
  getErrorMessage,
  isMobileOrTablet,
} from "./utils";

import { DEFAULT_SYSTEM_PROMPT } from "./constants/systemPrompt";
import { DB_NAME, SETTINGS_STORE_NAME } from "./constants/db";


import ExamplePrompts from "./components/ExamplePrompts";
import IdeaSummary from "./components/IdeaSummary";
import SummaryUpdateNotification from "./components/SummaryUpdateNotification";
import ContextModeIndicator from "./components/ContextModeIndicator";
import MarkdownRenderer from "./components/MarkdownRenderer";
import AgentsPage from "./components/AgentsPage";

import { LoadingScreen } from "./components/LoadingScreen";

interface BaseMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
type Message = BaseMessage;

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: "key" });
      }
    },
  });
}

const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-gray-200">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Idea Structuring Agent
            </span>
          </h1>
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              💬 Single Agent
            </Link>
            <Link
              to="/agents"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                location.pathname === "/agents"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              <Users size={16} />
              Multi-Agent
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

interface MainAppProps {
  selectedModelId: string;
  setSelectedModelId: (modelId: string) => void;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  progress: number;
  loadModel: () => Promise<any>;
  generateResponse: (
    messages: Array<{ role: string; content: string }>,
    tools: Array<any>,
    onToken?: (token: string) => void
  ) => Promise<string>;
  clearPastKeyValues: () => void;
}

const MainApp: React.FC<MainAppProps> = ({
  selectedModelId,
  setSelectedModelId,
  isLoading,
  isReady,
  error,
  progress,
  loadModel,
  generateResponse,
  clearPastKeyValues,
}) => {
  const [systemPrompt, setSystemPrompt] = useState<string>(
    DEFAULT_SYSTEM_PROMPT,
  );
  const [isSystemPromptModalOpen, setIsSystemPromptModalOpen] =
    useState<boolean>(false);
  const [tempSystemPrompt, setTempSystemPrompt] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [ideaSummary, setIdeaSummary] = useState<string>("");
  const [conversationSummary, setConversationSummary] = useState<string>("");
  const [isUpdatingSummary, setIsUpdatingSummary] = useState<boolean>(false);
  const isMobile = useMemo(isMobileOrTablet, []);
  
  // Context window management constants
  const MAX_CONTEXT_MESSAGES = 12; // Maximum messages before switching to summary mode
  const RECENT_MESSAGES_COUNT = 4; // Keep last N messages for immediate context
  const [isModelDropdownOpen, setIsModelDropdownOpen] =
    useState<boolean>(false);
  
  // Mobile navigation state
  const [mobileActiveTab, setMobileActiveTab] = useState<'chat' | 'summary'>('summary');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setIdeaSummary("");
    setConversationSummary("");
    setIsUpdatingSummary(false);
    clearPastKeyValues();
  }, [clearPastKeyValues]);



  const extractIdeaSummary = useCallback(async (conversationHistory: Message[]): Promise<string> => {
    const userMessages = conversationHistory.filter(msg => msg.role === "user");
    
    if (conversationHistory.length === 0) {
      return "";
    }

    // Comprehensive journalist-style interview summary prompt
    const summaryPrompt = `You are a lead journalist creating a comprehensive interview summary. Your mission is to document EVERYTHING learned during this interview and identify what still needs investigation.

COMPLETE INTERVIEW TRANSCRIPT:
${conversationHistory.map(msg => `${msg.role === 'user' ? '👤 Interviewee' : '🎙️ Journalist'}: ${msg.content}`).join('\n\n')}

📰 COMPREHENSIVE DOCUMENTATION INSTRUCTIONS:
- Document ALL information the interviewee has provided (no matter how small)
- Extract EVERY detail, fact, preference, constraint, or goal mentioned
- Include specific quotes, numbers, timelines, or requirements stated
- Identify ALL information gaps that need investigation
- Create comprehensive follow-up questions for complete story

📋 COMPLETE INTERVIEW SUMMARY STRUCTURE:

# 💡 Complete Idea Development Interview Summary

## 🎯 What We Know: Core Concept & Vision
[Document EVERYTHING the user said about their main idea - be comprehensive]

## 🎯 Problem & Solution Analysis
[Include ALL details about problems mentioned and proposed solutions]

## 👥 Target Audience & Market Information
[Document ALL details about users, market, audience mentioned]

## ⚡ Features, Functionality & Implementation
[Include ALL features, technical details, functionality described]

## 🔧 Resources, Requirements & Constraints
[Document ALL resources, budget, timeline, constraints mentioned]

## 💬 Additional Details & Context
[Include ANY other information provided - preferences, experiences, concerns, etc.]

## 📊 Current Status & Progress Report
[Always include - comprehensive view of development stage]

## 🎙️ Critical Follow-Up Investigation Areas
[Always include - comprehensive list of 6-10 investigative questions covering ALL missing information needed for complete story]

🎯 COMPREHENSIVE DOCUMENTATION RULES:
- Include EVERY piece of information provided, no matter how small
- Use direct quotes extensively to preserve the interviewee's exact words
- Organize information comprehensively - don't leave anything out
- Identify ALL areas needing further investigation
- Create investigative questions that cover every missing piece of the puzzle
- Make this a complete record of everything learned so far`;

    try {
      const summary = await generateResponse([
        { role: "system", content: summaryPrompt }
      ], []);
      
      // Basic validation for summary
      if (!summary || summary.length < 50) {
        throw new Error('Summary too short or empty');
      }
      
      // Check for obvious placeholder content
      if (summary.includes('🤔 Thinking...') || summary.trim() === '...' || summary.trim() === '') {
        throw new Error('Summary contains placeholder content');
      }
      
      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      
            // Comprehensive journalist-style interview fallback summary
      let fallbackSummary = "# 💡 Complete Idea Development Interview Summary\n\n";
      
      if (userMessages.length > 0) {
        const allUserInputs = userMessages.map(msg => 
          msg.content.replace(/🤔|Thinking\.\.\./g, '').trim()
        ).filter(content => content.length > 0);
        
        // Document everything we learned
        fallbackSummary += `## 🎯 What We Know: Core Concept & Vision\n`;
        fallbackSummary += `**Complete interview record:**\n\n`;
        allUserInputs.forEach((input, index) => {
          fallbackSummary += `**Interview Exchange ${index + 1}:** "${input}"\n\n`;
        });
        
        // Extract any additional context from assistant responses
        const assistantMessages = conversationHistory.filter(msg => msg.role === "assistant");
        if (assistantMessages.length > 0) {
          fallbackSummary += `## 💬 Additional Details & Context\n`;
          fallbackSummary += `**Topics explored during interview:**\n`;
          assistantMessages.forEach((msg) => {
            // Extract key topics from assistant questions
            const content = msg.content.toLowerCase();
            if (content.includes('who') || content.includes('target')) {
              fallbackSummary += `- Target audience discussion initiated\n`;
            }
            if (content.includes('problem') || content.includes('solve')) {
              fallbackSummary += `- Problem definition exploration started\n`;
            }
            if (content.includes('how') || content.includes('work')) {
              fallbackSummary += `- Implementation approach investigated\n`;
            }
            if (content.includes('budget') || content.includes('resource')) {
              fallbackSummary += `- Resource requirements discussed\n`;
            }
          });
          fallbackSummary += '\n';
        }
        
        // Comprehensive status report
        fallbackSummary += `## 📊 Current Status & Progress Report\n`;
        fallbackSummary += `- **Interview Stage:** Active idea development investigation\n`;
        fallbackSummary += `- **Total Exchanges:** ${conversationHistory.length} conversation exchanges\n`;
        fallbackSummary += `- **User Responses:** ${userMessages.length} detailed input${userMessages.length > 1 ? 's' : ''} from interviewee\n`;
        fallbackSummary += `- **Information Density:** ${Math.min(userMessages.length * 15, 40)}% of complete idea profile documented\n`;
        fallbackSummary += `- **Investigation Depth:** ${assistantMessages.length} follow-up question${assistantMessages.length > 1 ? 's' : ''} asked\n\n`;
        
        // Comprehensive follow-up investigation
        fallbackSummary += `## 🎙️ Critical Follow-Up Investigation Areas\n`;
        fallbackSummary += `**Complete investigative plan for next interview sessions:**\n\n`;
        fallbackSummary += `1. **Problem Deep-Dive:** What specific problem does this solve? Who experiences this problem? How severe is it?\n`;
        fallbackSummary += `2. **Target Audience Analysis:** Who exactly are your users? What are their demographics, behaviors, pain points?\n`;
        fallbackSummary += `3. **Solution Mechanics:** How exactly does your solution work? What's the step-by-step process?\n`;
        fallbackSummary += `4. **Value Proposition:** What makes this unique? Why is this better than existing solutions?\n`;
        fallbackSummary += `5. **Implementation Strategy:** How will you build this? What resources do you need?\n`;
        fallbackSummary += `6. **Market Context:** Who else is solving this? What's your competitive advantage?\n`;
        fallbackSummary += `7. **Success Metrics:** How will you measure success? What are your specific goals?\n`;
        fallbackSummary += `8. **Timeline & Resources:** When do you want this completed? What's your budget/timeline?\n\n`;
        
        fallbackSummary += `*🎙️ **Interview Status:** Comprehensive investigation in progress. Continue with detailed questioning to document complete idea profile.*\n\n`;
      } else {
        fallbackSummary += `## 🎙️ Ready to Begin Comprehensive Interview\n`;
        fallbackSummary += `Share your idea to start the complete investigative interview process that will help you fully structure and define every aspect of your concept.\n\n`;
      }
      
      return fallbackSummary;
    }
  }, [generateResponse]);





  // Create conversation summary for context management
  const createConversationSummary = useCallback((messages: Message[]): string => {
    const userMessages = messages.filter(msg => msg.role === "user");
    
    if (messages.length === 0) return "";
    
    let summary = "Previous conversation covered:\n";
    
    // Extract key information from user messages
    const userIdeas: string[] = [];
    const keyPoints: string[] = [];
    
    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      // Extract main ideas (sentences with key indicators)
      if (content.includes("want to") || content.includes("idea") || content.includes("build") || content.includes("create")) {
        userIdeas.push(msg.content.length > 80 ? msg.content.substring(0, 80) + "..." : msg.content);
      }
      
      // Extract specific details (budget, timeline, features)
      if (content.includes("$") || content.includes("eur") || content.includes("budget") || content.includes("cost")) {
        keyPoints.push(`Budget/Cost: ${msg.content}`);
      }
      if (content.includes("plastic") || content.includes("material") || content.includes("technology")) {
        keyPoints.push(`Technical: ${msg.content}`);
      }
    });
    
    if (userIdeas.length > 0) {
      summary += `\nMain ideas discussed: ${userIdeas.join("; ")}\n`;
    }
    
    if (keyPoints.length > 0) {
      summary += `\nKey details mentioned: ${keyPoints.slice(0, 3).join("; ")}\n`;
    }
    
    // Add context about conversation length
    summary += `\nConversation length: ${messages.length} exchanges with ${userMessages.length} user inputs.`;
    
    return summary;
  }, []);

  const updateIdeaSummary = useCallback(async (messages: Message[]) => {
    // Only update if we have meaningful content
    const userMessages = messages.filter(msg => msg.role === "user");
    if (userMessages.length === 0) return;
    
    // Debounce summary updates to avoid tensor disposal issues
    const timeoutId = setTimeout(async () => {
    setIsUpdatingSummary(true);
    
    try {
        // Update idea summary using LLM with error handling
        const newIdeaSummary = await extractIdeaSummary(messages);
      setIdeaSummary(newIdeaSummary);
      
      // Update conversation summary if needed
      if (messages.length > MAX_CONTEXT_MESSAGES) {
        const newConversationSummary = createConversationSummary(messages);
        setConversationSummary(newConversationSummary);
      }
      
        // Allow model to settle between calls
        await new Promise(resolve => setTimeout(resolve, 500));
      
      } catch (error) {
      console.error("Error updating summaries:", error);
        // Use fallback summary that doesn't require LLM
        const fallbackSummary = `# 💡 Idea Development Interview Summary

## 🎯 What We Know: Core Concept
**Latest user input:** "${userMessages[userMessages.length - 1]?.content || 'No input yet'}"

## 📊 Current Status Report
- **Interview Stage:** Active idea development
- **Total Information:** ${userMessages.length} response${userMessages.length !== 1 ? 's' : ''} from interviewee
- **Conversation Length:** ${messages.length} total exchanges

## 🎙️ Critical Follow-Up Questions
**To continue developing this idea, we need to investigate:**

1. **Problem Definition:** What specific problem does this solve?
2. **Target Users:** Who exactly needs this solution?
3. **Implementation:** How would this actually work?
4. **Value Proposition:** What makes this unique or valuable?
5. **Resources:** What do you need to make this happen?

*🎙️ Continue the interview to build a comprehensive idea profile.*`;
        setIdeaSummary(fallbackSummary);
    } finally {
      setIsUpdatingSummary(false);
      }
    }, 2000); // Increased debounce to 2 seconds to prevent tensor issues
    
    // Cleanup timeout on component unmount or new update
    return () => clearTimeout(timeoutId);
  }, [extractIdeaSummary, createConversationSummary, MAX_CONTEXT_MESSAGES]);

  const handleSendMessage = async (): Promise<void> => {
    if (!input.trim() || !isReady) return;

    const userMessage: Message = { role: "user", content: input };
    const currentMessages: Message[] = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    setIsGenerating(true);
    
    // Trigger summary update strategically to avoid tensor disposal issues
    // Only update on first message or after significant conversation
    if (messages.length === 0 || messages.length % 2 === 0) {
      updateIdeaSummary(currentMessages);
    }

    try {
      // Smart context management: Use summary for long conversations
      let messagesForGeneration: Array<{ role: string; content: string }>;
      
      if (currentMessages.length > MAX_CONTEXT_MESSAGES) {
        // Use conversation summary + idea summary + recent messages
        const recentMessages = currentMessages.slice(-RECENT_MESSAGES_COUNT);
        const contextSummary = conversationSummary || createConversationSummary(currentMessages.slice(0, -RECENT_MESSAGES_COUNT));
        
        // Create a single context message to avoid confusion
        const contextMessage = `CONTEXT: ${contextSummary}\n\nCURRENT IDEA STATUS: ${ideaSummary || "Just starting to develop the idea."}`;
        
        messagesForGeneration = [
          { role: "system" as const, content: systemPrompt },
          { role: "system" as const, content: contextMessage },
          ...recentMessages,
        ];
        
        console.log("Using summary mode - Long conversation detected:", {
          totalOriginalMessages: currentMessages.length,
          recentMessagesIncluded: recentMessages.length,
          usingSummary: true,
          summaryLength: contextSummary.length
        });
      } else {
        // Use full conversation history for shorter conversations
        messagesForGeneration = [
          { role: "system" as const, content: systemPrompt },
          ...(ideaSummary ? [{ role: "system" as const, content: `CURRENT IDEA STATUS: ${ideaSummary}` }] : []),
          ...currentMessages,
        ];
        
        console.log("Using full history mode:", {
          totalMessages: messagesForGeneration.length,
          userMessages: messagesForGeneration.filter(m => m.role === "user").length,
          assistantMessages: messagesForGeneration.filter(m => m.role === "assistant").length,
          ideaSummaryIncluded: !!ideaSummary
        });
      }

        // Add empty assistant message for streaming
        const updatedMessages: Message[] = [...currentMessages, { role: "assistant" as const, content: "" }];
        setMessages(updatedMessages);

        let accumulatedContent = "";
        const response = await generateResponse(
          messagesForGeneration,
          [], // No tools
          (token: string) => {
            accumulatedContent += token;
            setMessages((current) => {
              const updated = [...current];
              updated[updated.length - 1] = {
                role: "assistant" as const,
                content: accumulatedContent,
              };
              return updated;
            });
          },
        );

        // Update the final message with the complete response
        const finalMessages: Message[] = [...currentMessages, { role: "assistant" as const, content: response }];
        setMessages(finalMessages);
      
      // Update idea summary strategically with complete conversation history
      // Only update after full conversation exchanges to prevent tensor disposal
      const finalMessagesForSummary = [...currentMessages, { role: "assistant" as const, content: response }];
      updateIdeaSummary(finalMessagesForSummary);
      
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const errorMessages: Message[] = [
        ...currentMessages,
        {
          role: "assistant" as const,
          content: `Error generating response: ${errorMessage}`,
        },
      ];
      setMessages(errorMessages);
      // Update summary on errors only if significant conversation exists
      if (currentMessages.length > 2) {
      updateIdeaSummary(currentMessages);
      }
    } finally {
      setIsGenerating(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const loadSystemPrompt = useCallback(async (): Promise<void> => {
    try {
      const db = await getDB();
      const stored = await db.get(SETTINGS_STORE_NAME, "systemPrompt");
      if (stored && stored.value) setSystemPrompt(stored.value);
    } catch (error) {
      console.error("Failed to load system prompt:", error);
    }
  }, []);

  const saveSystemPrompt = useCallback(
    async (prompt: string): Promise<void> => {
      try {
        const db = await getDB();
        await db.put(SETTINGS_STORE_NAME, {
          key: "systemPrompt",
          value: prompt,
        });
      } catch (error) {
        console.error("Failed to save system prompt:", error);
      }
    },
    [],
  );

  const loadSelectedModel = useCallback(async (): Promise<void> => {
    try {
      await loadModel();
    } catch (error) {
      console.error("Failed to load model:", error);
    }
  }, [loadModel]);

  const loadSelectedModelId = useCallback(async (): Promise<void> => {
    try {
      const db = await getDB();
      const stored = await db.get(SETTINGS_STORE_NAME, "selectedModelId");
      if (stored && stored.value) {
        setSelectedModelId(stored.value);
      }
    } catch (error) {
      console.error("Failed to load selected model ID:", error);
    }
  }, []);

  useEffect(() => {
    loadSystemPrompt();
  }, [loadSystemPrompt]);

  const handleOpenSystemPromptModal = (): void => {
    setTempSystemPrompt(systemPrompt);
    setIsSystemPromptModalOpen(true);
  };

  const handleSaveSystemPrompt = (): void => {
    setSystemPrompt(tempSystemPrompt);
    saveSystemPrompt(tempSystemPrompt);
    setIsSystemPromptModalOpen(false);
  };

  const handleCancelSystemPrompt = (): void => {
    setTempSystemPrompt("");
    setIsSystemPromptModalOpen(false);
  };

  const handleResetSystemPrompt = (): void => {
    setTempSystemPrompt(DEFAULT_SYSTEM_PROMPT);
  };

  const saveSelectedModel = useCallback(
    async (modelId: string): Promise<void> => {
      try {
        const db = await getDB();
        await db.put(SETTINGS_STORE_NAME, {
          key: "selectedModelId",
          value: modelId,
        });
      } catch (error) {
        console.error("Failed to save selected model ID:", error);
      }
    },
    [],
  );

  useEffect(() => {
    loadSystemPrompt();
    loadSelectedModelId();
  }, [loadSystemPrompt, loadSelectedModelId]);

  const handleModelSelect = async (modelId: string) => {
    setSelectedModelId(modelId);
    setIsModelDropdownOpen(false);
    await saveSelectedModel(modelId);
  };

  const handleExampleClick = async (messageText: string): Promise<void> => {
    if (!isReady || isGenerating) return;
    setInput(messageText);

    const userMessage: Message = { role: "user", content: messageText };
    const currentMessages: Message[] = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    setIsGenerating(true);

    try {
      // Smart context management for example clicks
      let messagesForGeneration: Array<{ role: string; content: string }>;
      
      if (currentMessages.length > MAX_CONTEXT_MESSAGES) {
        // Use conversation summary + idea summary + recent messages
        const recentMessages = currentMessages.slice(-RECENT_MESSAGES_COUNT);
        const contextSummary = conversationSummary || createConversationSummary(currentMessages.slice(0, -RECENT_MESSAGES_COUNT));
        
        // Create a single context message to avoid confusion
        const contextMessage = `CONTEXT: ${contextSummary}\n\nCURRENT IDEA STATUS: ${ideaSummary || "Just starting to develop the idea."}`;
        
        messagesForGeneration = [
          { role: "system" as const, content: systemPrompt },
          { role: "system" as const, content: contextMessage },
          ...recentMessages,
        ];
      } else {
        messagesForGeneration = [
          { role: "system" as const, content: systemPrompt },
          ...(ideaSummary ? [{ role: "system" as const, content: `CURRENT IDEA STATUS: ${ideaSummary}` }] : []),
          ...currentMessages,
        ];
      }
      
      console.log("Example click context:", {
        totalOriginalMessages: currentMessages.length,
        usingSmartContext: currentMessages.length > MAX_CONTEXT_MESSAGES,
        exampleMessage: messageText.substring(0, 50) + "..."
      });

        setMessages([...currentMessages, { role: "assistant", content: "" }]);

        let accumulatedContent = "";
        const response = await generateResponse(
          messagesForGeneration,
        [], // No tools
          (token: string) => {
            accumulatedContent += token;
            setMessages((current) => {
              const updated = [...current];
              updated[updated.length - 1] = {
                role: "assistant",
                content: accumulatedContent,
              };
              return updated;
            });
          },
        );

        currentMessages.push({ role: "assistant", content: response });
      setMessages(currentMessages);
      
      // Update idea summary strategically for example clicks
      updateIdeaSummary(currentMessages);
      
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const errorMessages: Message[] = [
        ...currentMessages,
        {
          role: "assistant" as const,
          content: `Error generating response: ${errorMessage}`,
        },
      ];
      setMessages(errorMessages);
      // Update summary on errors only if substantial conversation exists
      if (currentMessages.length > 1) {
        updateIdeaSummary(currentMessages);
      }
    } finally {
      setIsGenerating(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleStopIdeation = (): void => {
    setIsGenerating(false);
    // In a real implementation, you might want to cancel ongoing generation
  };

  const handleGenerateReport = (): void => {
    if (!ideaSummary) return;
    
    // Create a comprehensive report
    const report = `# Idea Development Report
    
Generated on: ${new Date().toLocaleDateString()}

## Summary
${ideaSummary}

## Conversation History
${messages.map((msg) => {
  if (msg.role === "user") {
    return `**User:** ${msg.content}`;
  } else if (msg.role === "assistant") {
    return `**Assistant:** ${msg.content}`;
  }
  return "";
}).filter(Boolean).join('\n\n')}

---
*Generated by Idea Structuring Agent*`;

    // Download as a text file
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idea-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`font-sans bg-gray-900 ${isMobile ? 'main-container safe-area-full' : ''} h-screen overflow-hidden`}>
      {!isReady ? (
        <LoadingScreen
          isLoading={isLoading}
          progress={progress}
          error={error}
          loadSelectedModel={loadSelectedModel}
          selectedModelId={selectedModelId}
          isModelDropdownOpen={isModelDropdownOpen}
          setIsModelDropdownOpen={setIsModelDropdownOpen}
          handleModelSelect={handleModelSelect}
        />
      ) : (
        <div className={`flex flex-col lg:flex-row ${isMobile ? 'h-full' : 'h-screen'} text-white content-container`}>
          {/* Mobile Tab Navigation */}
          {isMobile && (
            <div className="lg:hidden bg-gray-800 border-b border-gray-700 mobile-tab-container safe-area-top">
              <div className="flex w-full">
                <button
                  onClick={() => setMobileActiveTab('chat')}
                  className={`flex-1 mobile-tab no-select touch-feedback ${
                    mobileActiveTab === 'chat'
                      ? 'bg-indigo-600 text-white border-b-2 border-indigo-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  💬 Chat
                </button>
                <button
                  onClick={() => setMobileActiveTab('summary')}
                  className={`flex-1 mobile-tab no-select touch-feedback relative ${
                    mobileActiveTab === 'summary'
                      ? 'bg-indigo-600 text-white border-b-2 border-indigo-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  📋 Summary
                  {ideaSummary && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Chat Panel */}
          <div className={`${isMobile ? (mobileActiveTab === 'chat' ? 'flex' : 'hidden') : 'lg:flex'} flex-col ${isMobile ? 'flex-1 content-container' : 'lg:w-1/2'} ${isMobile ? 'p-0' : 'p-4'}`}>
                        <div className={`flex items-center justify-between ${isMobile ? 'p-4 pb-2' : 'mb-4'}`}>
              <div className="flex items-center gap-3">
                <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-gray-200 flex items-center no-select`}>
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {isMobile ? 'Idea Agent' : 'Idea Structuring Agent'}
                  </span>
                  {isGenerating && (
                    <div className="ml-3 flex items-center text-blue-400">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                      <div className={`ml-2 ${isMobile ? 'text-xs' : 'text-sm'} font-normal`}>Thinking...</div>
                    </div>
                  )}
                  {isUpdatingSummary && (
                    <div className="ml-3 flex items-center text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                      <div className={`ml-2 ${isMobile ? 'text-xs' : 'text-sm'} font-normal`}>Updating Summary...</div>
                    </div>
                  )}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {!isMobile && (
                  <div className="flex items-center text-green-400">
                    <Zap size={16} className="mr-2" />
                    Ready
                  </div>
                )}
                
                {/* Context Mode Indicator - Hidden on mobile */}
                {!isMobile && (
                  <ContextModeIndicator
                    messageCount={messages.length}
                    maxMessages={MAX_CONTEXT_MESSAGES}
                    usingSmartContext={messages.length > MAX_CONTEXT_MESSAGES}
                  />
                )}
                <button
                  disabled={isGenerating}
                  onClick={clearChat}
                  className={`${isMobile ? 'h-9 px-2' : 'h-10 px-3'} flex items-center py-2 rounded-lg font-bold transition-colors text-sm touch-feedback ${
                    isGenerating
                      ? "bg-gray-600 cursor-not-allowed opacity-50"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                  title="Clear chat and start over"
                >
                  <RotateCcw size={isMobile ? 12 : 14} className={isMobile ? '' : 'mr-2'} />
                  {!isMobile && ' Clear'}
                </button>
                <button
                  onClick={handleOpenSystemPromptModal}
                  className={`${isMobile ? 'h-9 px-2' : 'h-10 px-3'} flex items-center py-2 rounded-lg font-bold transition-colors bg-gray-600 hover:bg-gray-700 text-sm touch-feedback`}
                  title="Edit system prompt"
                >
                  <Settings size={isMobile ? 12 : 16} />
                </button>
              </div>
            </div>

            <div
              ref={chatContainerRef}
              className={`${isMobile ? 'chat-container-mobile' : 'flex-grow'} bg-gray-800 ${isMobile ? 'mx-3 rounded-lg' : 'rounded-lg'} ${isMobile ? 'p-3' : 'p-4'} overflow-y-auto ${isMobile ? '' : 'mb-4'} space-y-4 custom-scrollbar`}
            >
              {messages.length === 0 && isReady ? (
                <ExamplePrompts onExampleClick={handleExampleClick} />
              ) : (
                messages.map((msg, index) => {
                  const key = `${msg.role}-${index}`;

                  if (msg.role === "user") {
                    return (
                      <div key={key} className="flex justify-end animate-fade-in">
                        <div className={`${isMobile ? 'p-3 max-w-[85%]' : 'p-4 max-w-md'} rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg transform hover:scale-105 transition-transform`}>
                          <p className={`${isMobile ? 'text-sm' : 'text-sm'} whitespace-pre-wrap font-medium`}>
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    );
                  } else if (msg.role === "assistant") {
                      return (
                      <div key={key} className="flex justify-start animate-fade-in">
                        <div className={`flex items-start ${isMobile ? 'gap-2 max-w-[95%]' : 'gap-3 max-w-2xl'}`}>
                          <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg`}>
                            <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-bold text-white`}>AI</span>
                          </div>
                          <div className={`relative ${isMobile ? 'p-3' : 'p-4'} rounded-2xl bg-gradient-to-br from-gray-700 via-gray-800 to-gray-700 shadow-lg flex-1 border border-gray-600`}>
                            <div className="absolute -left-2 top-4 w-0 h-0 border-t-4 border-b-4 border-r-8 border-transparent border-r-gray-700"></div>
                            <div className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-100 leading-relaxed`}>
                              <MarkdownRenderer content={msg.content} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })
              )}
              
              {/* Summary Update Notification */}
              {isUpdatingSummary && (
                <div className="flex justify-start animate-fade-in mb-4">
                  <div className={`${isMobile ? 'mx-3' : ''} max-w-lg`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-blue-500">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-200">Updating Summary</span>
                        <div className="text-xs text-gray-500">
                          AI is analyzing your conversation...
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`${isMobile ? 'input-container-mobile safe-area-bottom' : 'w-full px-4'}`}>
              <div className={`flex ${isMobile ? 'gap-2' : 'w-full max-w-4xl mx-auto'}`}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    !isGenerating &&
                    isReady &&
                    handleSendMessage()
                  }
                  disabled={isGenerating || !isReady}
                  className={`flex-grow bg-gray-700 ${isMobile ? 'rounded-lg p-3 text-base text-mobile' : 'rounded-l-lg p-4 text-base min-w-0'} focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all`}
                  placeholder={
                    isReady
                      ? ideaSummary 
                        ? isMobile ? "Continue idea..." : "Continue developing your idea..."
                        : isMobile ? "Describe idea..." : "Describe your idea here..."
                      : isMobile ? "Load model first" : "Load model first to enable chat"
                  }
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isGenerating || !isReady}
                  className={`bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold ${isMobile ? 'p-3 rounded-lg min-w-[48px]' : 'p-4 rounded-r-lg min-w-[60px]'} transition-colors touch-feedback flex items-center justify-center`}
                >
                  <Play size={isMobile ? 18 : 20} />
                </button>
              </div>
            </div>
          </div>

          {/* Idea Summary Panel */}
          <div className={`${isMobile ? (mobileActiveTab === 'summary' ? 'flex' : 'hidden') : 'lg:flex'} flex-col ${isMobile ? 'flex-1' : 'lg:w-1/2'} p-4 ${!isMobile && 'border-l border-gray-700'}`}>
            <IdeaSummary
              summary={ideaSummary}
              onSummaryChange={setIdeaSummary}
              onStopIdeation={handleStopIdeation}
              onGenerateReport={handleGenerateReport}
              isGenerating={isGenerating}
              isUpdatingSummary={isUpdatingSummary}
            />
          </div>
        </div>
      )}

      {isSystemPromptModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-gray-800 rounded-lg ${isMobile ? 'p-4 w-full max-w-sm h-[90vh]' : 'p-6 w-3/4 max-w-4xl max-h-3/4'} flex flex-col text-gray-100`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-indigo-400`}>
                {isMobile ? 'System Prompt' : 'Edit System Prompt'}
              </h2>
              <button
                onClick={handleCancelSystemPrompt}
                className="text-gray-400 hover:text-white"
              >
                <X size={isMobile ? 18 : 20} />
              </button>
            </div>
            <div className="flex-grow mb-4">
              <textarea
                value={tempSystemPrompt}
                onChange={(e) => setTempSystemPrompt(e.target.value)}
                className={`w-full h-full bg-gray-700 text-white ${isMobile ? 'p-3 text-sm' : 'p-4'} rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                placeholder="Enter your system prompt here..."
                style={{ minHeight: isMobile ? "200px" : "300px" }}
              />
            </div>
            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
              <button
                onClick={handleResetSystemPrompt}
                className={`${isMobile ? 'w-full py-3' : 'px-4 py-2'} bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-sm font-medium`}
              >
                Reset to Default
              </button>
              <div className={`flex gap-3 ${isMobile ? 'w-full' : ''}`}>
                {isMobile && (
                  <button
                    onClick={handleCancelSystemPrompt}
                    className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSaveSystemPrompt}
                  className={`${isMobile ? 'flex-1 py-3' : 'px-4 py-2'} bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm font-medium`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Update Notification */}
      <SummaryUpdateNotification isUpdating={isUpdatingSummary} />
    </div>
  );
};

const App: React.FC = () => {
  // Shared LLM instance for both pages
  const [selectedModelId, setSelectedModelId] = useState<string>("350M");
  const {
    isLoading,
    isReady,
    error,
    progress,
    loadModel,
    generateResponse,
    clearPastKeyValues,
  } = useLLM(selectedModelId);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <Routes>
          <Route path="/" element={
            <MainApp 
              selectedModelId={selectedModelId}
              setSelectedModelId={setSelectedModelId}
              isLoading={isLoading}
              isReady={isReady}
              error={error}
              progress={progress}
              loadModel={loadModel}
              generateResponse={generateResponse}
              clearPastKeyValues={clearPastKeyValues}
            />
          } />
          <Route path="/agents" element={
            <AgentsPage 
              selectedModelId={selectedModelId}
              setSelectedModelId={setSelectedModelId}
              isLoading={isLoading}
              isReady={isReady}
              error={error}
              progress={progress}
              loadModel={loadModel}
              generateResponse={generateResponse}
              clearPastKeyValues={clearPastKeyValues}
            />
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;