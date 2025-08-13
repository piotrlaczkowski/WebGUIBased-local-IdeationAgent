import React, { useState, useEffect, useCallback } from "react";
import { Play, Zap, Users, Brain, MessageSquare, FileText, Database, History, Search, Code, RefreshCw, Lightbulb } from "lucide-react";
import { getErrorMessage } from "../utils";
import MarkdownRenderer from "./MarkdownRenderer";
import { runStreamingAgentWorkflow, feedbackAgent } from "../tools/agentGraph";
import type { AgentState } from "../tools/agentGraph";
import { agentStorage } from "../tools/agentStorage";
import type { AgentMemory, ConversationSession } from "../tools/agentStorage";

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  currentTask: string;
  output: string;
}

interface AgentMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  type: 'user_input' | 'agent_output' | 'system_update' | 'idea_summary' | 'iteration_feedback';
  metadata?: {
    agentName?: string;
    agentRole?: string;
    readinessScore?: number;
    iterationNumber?: number;
    isFinal?: boolean;
  };
}

interface AgentsPageProps {
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

const AgentsPage: React.FC<AgentsPageProps> = ({
  isReady,
  error,
  progress,
  loadModel,
  generateResponse,
  clearPastKeyValues,
}) => {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'orchestrator',
      name: 'Ideation Coordinator',
      role: 'Workflow Manager',
      description: 'Analyzes ideas and orchestrates the optimal development workflow',
      icon: <Brain className="w-5 h-5" />,
      isActive: false,
      currentTask: '',
      output: ''
    },
    {
      id: 'questioner',
      name: 'Idea Developer',
      role: 'Strategic Questioner',
      description: 'Asks probing questions to clarify and structure your ideas',
      icon: <MessageSquare className="w-5 h-5" />,
      isActive: false,
      currentTask: '',
      output: ''
    },
    {
      id: 'research',
      name: 'Market Validator',
      role: 'Market Analyst',
      description: 'Analyzes market opportunities and competitive landscape',
      icon: <Search className="w-5 h-5" />,
      isActive: false,
      currentTask: '',
      output: ''
    },
    {
      id: 'technical',
      name: 'Technical Architect',
      role: 'Feasibility Expert',
      description: 'Evaluates technical feasibility and implementation strategies',
      icon: <Code className="w-5 h-5" />,
      isActive: false,
      currentTask: '',
      output: ''
    },
    {
      id: 'memory',
      name: 'Knowledge Connector',
      role: 'Insight Manager',
      description: 'Connects current ideas with past insights and learnings',
      icon: <History className="w-5 h-5" />,
      isActive: false,
      currentTask: '',
      output: ''
    },
    {
      id: 'summarizer',
      name: 'Idea Synthesizer',
      role: 'Summary Creator',
      description: 'Creates comprehensive idea development summaries and action plans',
      icon: <FileText className="w-5 h-5" />,
      isActive: false,
      currentTask: '',
      output: ''
    },
    {
      id: 'feedback',
      name: 'Feedback Integrator',
      role: 'Iteration Manager',
      description: 'Processes user feedback and improves ideas iteratively',
      icon: <RefreshCw className="w-5 h-5" />,
      isActive: false,
      currentTask: '',
      output: ''
    }
  ]);

  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [relatedMemories, setRelatedMemories] = useState<AgentMemory[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [currentStreamingAgent, setCurrentStreamingAgent] = useState<string>("");
  const [workflowProgress, setWorkflowProgress] = useState<number>(0);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [iterationCount, setIterationCount] = useState<number>(0);

  const [ideaSummary, setIdeaSummary] = useState<string>("");

  const activateAgent = useCallback((agentId: string, task: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, isActive: true, currentTask: task }
        : { ...agent, isActive: false }
    ));
  }, []);



  const addAgentMessage = useCallback((
    agentId: string, 
    content: string, 
    type: AgentMessage['type'] = 'agent_output',
    metadata?: AgentMessage['metadata']
  ) => {
    const newMessage: AgentMessage = {
      id: `${agentId}-${Date.now()}`,
      agentId,
      content,
      timestamp: new Date(),
      type,
      metadata
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Clean and format agent output for display
  const formatAgentOutput = useCallback((output: string): string => {
    try {
      // Try to parse as JSON and extract meaningful content
      const parsed = JSON.parse(output);
      if (typeof parsed === 'object') {
        // Extract the most relevant field for display
        if (parsed.reasoning) return parsed.reasoning;
        if (parsed.analysis) return parsed.analysis;
        if (parsed.insights) return parsed.insights;
        if (parsed.recommendations) return parsed.recommendations;
        if (parsed.summary) return parsed.summary;
        if (parsed.questions) return parsed.questions;
        // If it's an array, join the first few items
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 3).join('\n\n');
        }
        // Otherwise, return a stringified version of the first few keys
        const keys = Object.keys(parsed);
        return keys.slice(0, 3).map(key => `${key}: ${parsed[key]}`).join('\n\n');
      }
    } catch {
      // If not JSON, return as is
    }
    return output;
  }, []);

  const runAgentWorkflowWithStorage = useCallback(async (userInput: string) => {
    setIsGenerating(true);
    setWorkflowProgress(0);
    setStreamingMessage("");
    setCurrentStreamingAgent("");
    
    // Clear any previous past key values to prevent stale data issues
    // This is especially important when starting new conversations or workflows
    clearPastKeyValues();
    
    try {
      // Create or get current session
      let session = currentSession;
      if (!session) {
        session = await agentStorage.createSession();
        setCurrentSession(session);
      }

      // Add user input to chat
      addAgentMessage('user', userInput, 'user_input');

      console.log('Starting agent workflow with:', { userInput, conversationHistory: messages.map(m => m.content), session: session.ideaSummary });
      
      const state = await runStreamingAgentWorkflow(
        userInput,
        { generateResponse },
        messages.map(m => m.content),
        session.ideaSummary,
        (progress, agent, message) => {
          setWorkflowProgress(progress);
          setCurrentStreamingAgent(agent);
          setStreamingMessage(message);
          
          // Update agent status
          activateAgent(agent, message);
          
          // Add system update message for significant progress
          if (progress % 25 === 0) {
            addAgentMessage('system', `${agent} is analyzing your idea...`, 'system_update', {
              agentName: agent
            });
          }
        }
      );

      setAgentState(state);
      
      // Create final summary message
      const finalSummary = state.final_summary || "Idea analysis complete. Review the results and provide feedback for iteration.";
      addAgentMessage('summarizer', finalSummary, 'idea_summary', {
        agentName: 'Idea Synthesizer',
        agentRole: 'Summary Creator',
        readinessScore: state.readiness_score,
        iterationNumber: state.iteration_count,
        isFinal: true
      });

      // Update idea summary for the main app
      setIdeaSummary(finalSummary);
      
      // Store in session
      await agentStorage.updateSessionSummary(session.id, finalSummary);

      // Get related memories
      const memories = await agentStorage.searchMemories(userInput);
      setRelatedMemories(memories);

      // Results are displayed via individual agent messages

    } catch (error) {
      console.error('Error in agent workflow:', error);
      addAgentMessage('system', `Error: ${getErrorMessage(error)}`, 'system_update');
    } finally {
      setIsGenerating(false);
      setWorkflowProgress(100);
      setCurrentStreamingAgent("");
      setStreamingMessage("");
    }
  }, [currentSession, messages, generateResponse, addAgentMessage, activateAgent]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !isReady || isGenerating) return;
    
    const userInput = input.trim();
    setInput("");
    
    await runAgentWorkflowWithStorage(userInput);
  }, [input, isReady, isGenerating, runAgentWorkflowWithStorage]);

  const handleIteration = async () => {
    if (!input.trim() || !isReady || !agentState) return;
    const feedback = input;
    setInput("");
    // Feedback tracked via messages
    setIterationCount(prev => prev + 1);
    
    addAgentMessage('user', `Feedback for iteration ${iterationCount + 1}: ${feedback}`, 'iteration_feedback', {
      iterationNumber: iterationCount + 1
    });
    
    await runIterationWithFeedback(feedback);
  };

  const runIterationWithFeedback = useCallback(async (feedback: string) => {
    if (!agentState) return;
    setIsGenerating(true);
    setWorkflowProgress(0);
    setCurrentStreamingAgent("");
    setStreamingMessage("");
    // Results handled by message display
    
    try {
      const iterationState = {
        ...agentState,
        user_input: `Iteration ${iterationCount + 1} feedback: ${feedback}`,
        user_feedback: [...agentState.user_feedback, feedback],
        iteration_count: iterationCount + 1,
      };
      
      setCurrentStreamingAgent("feedback");
      setStreamingMessage("Processing feedback and planning improvements...");
      
      const feedbackState = await feedbackAgent(iterationState, { generateResponse });
      
      const state = await runStreamingAgentWorkflow(
        `Iteration ${iterationCount + 1}: ${feedback}`,
        { generateResponse },
        messages.map(m => m.content),
        feedbackState.final_summary,
        (progress, agent, message) => {
          setWorkflowProgress(progress);
          setCurrentStreamingAgent(agent);
          setStreamingMessage(message);
          activateAgent(agent, message);
        }
      );

      setAgentState(state);
      
      // Create final summary message for iteration
      const finalSummary = state.final_summary || "Iteration complete. Review the updated analysis.";
      addAgentMessage('summarizer', finalSummary, 'idea_summary', {
        agentName: 'Idea Synthesizer',
        agentRole: 'Summary Creator',
        readinessScore: state.readiness_score,
        iterationNumber: state.iteration_count,
        isFinal: true
      });

      setIdeaSummary(finalSummary);
      // Results are displayed via individual agent messages

    } catch (error) {
      console.error('Error in iteration:', error);
      addAgentMessage('system', `Error during iteration: ${getErrorMessage(error)}`, 'system_update');
    } finally {
      setIsGenerating(false);
      setWorkflowProgress(100);
      setCurrentStreamingAgent("");
      setStreamingMessage("");
    }
  }, [agentState, iterationCount, messages, generateResponse, addAgentMessage, activateAgent]);

  // Get agent by ID
  const getAgentById = useCallback((agentId: string) => {
    return agents.find(agent => agent.id === agentId);
  }, [agents]);

  // Get message icon based on type
  const getMessageIcon = useCallback((message: AgentMessage) => {
    switch (message.type) {
      case 'user_input':
        return <Users className="w-5 h-5" />;
      case 'agent_output':
        return getAgentById(message.agentId)?.icon || <Brain className="w-5 h-5" />;
      case 'system_update':
        return <Zap className="w-5 h-5" />;
      case 'idea_summary':
        return <Lightbulb className="w-5 h-5" />;
      case 'iteration_feedback':
        return <RefreshCw className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  }, [getAgentById]);

  // Get message styling based on type with better contrast
  const getMessageStyling = useCallback((message: AgentMessage) => {
    switch (message.type) {
      case 'user_input':
        return {
          container: "flex justify-end",
          bubble: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg",
          icon: "bg-blue-500"
        };
      case 'agent_output':
        return {
          container: "flex justify-start",
          bubble: "bg-gradient-to-r from-slate-100 to-gray-100 text-gray-800 border border-gray-200 shadow-md",
          icon: "bg-slate-600"
        };
      case 'system_update':
        return {
          container: "flex justify-center",
          bubble: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg",
          icon: "bg-purple-500"
        };
      case 'idea_summary':
        return {
          container: "flex justify-start",
          bubble: "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-2 border-emerald-400 shadow-xl",
          icon: "bg-emerald-500"
        };
      case 'iteration_feedback':
        return {
          container: "flex justify-end",
          bubble: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg",
          icon: "bg-amber-500"
        };
      default:
        return {
          container: "flex justify-start",
          bubble: "bg-gradient-to-r from-slate-100 to-gray-100 text-gray-800 border border-gray-200",
          icon: "bg-slate-600"
        };
    }
  }, []);



  useEffect(() => {
    if (!isReady) {
      loadModel();
    }
  }, [isReady, loadModel]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading AI model for multi-agent system...</p>
          {progress > 0 && (
            <div className="mt-4">
              <div className="w-64 bg-gray-700 rounded-full h-2 mx-auto">
                <div 
                  className="bg-indigo-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}% loaded</p>
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-600 rounded-lg">
              <p className="text-sm">Error: {error}</p>
              <button 
                onClick={loadModel}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm"
              >
                Retry Loading
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
                Multi-Agent Ideation System
              </h1>
              <p className="text-gray-400">Collaborative AI agents working together to develop your ideas</p>
            </div>
            
            {isGenerating && (
              <div className="flex items-center gap-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl px-4 py-3">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <div className="text-sm font-medium text-indigo-300">
                    {currentStreamingAgent ? `${currentStreamingAgent} is working...` : 'Processing...'}
                  </div>
                  <div className="text-xs text-indigo-400">{streamingMessage}</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          {isGenerating && (
            <div className="mt-4 bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 transition-all duration-500 ease-out"
                style={{ width: `${workflowProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Agent Status Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 text-indigo-400 flex items-center gap-2">
                <Brain size={16} />
                Agent Status
              </h2>
              
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div key={agent.id} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          agent.isActive ? 'bg-indigo-500' : 'bg-gray-600'
                        }`}>
                          {agent.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{agent.name}</div>
                          <div className="text-xs text-gray-400">{agent.role}</div>
                        </div>
                      </div>
                      {agent.isActive && (
                        <div className="flex items-center text-xs text-green-200">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                          Active
                        </div>
                      )}
                    </div>
                    
                    {agent.currentTask && (
                      <div className="text-xs text-gray-300 bg-gray-600 rounded p-2">
                        {agent.currentTask}
                      </div>
                    )}
                    
                    {agent.output && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedAgents(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(agent.id)) {
                              newSet.delete(agent.id);
                            } else {
                              newSet.add(agent.id);
                            }
                            return newSet;
                          })}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                          {expandedAgents.has(agent.id) ? 'Hide' : 'Show'} output
                        </button>
                        
                        {expandedAgents.has(agent.id) && (
                          <div className="mt-2 p-3 bg-gray-600 rounded-lg text-xs text-gray-200 border border-gray-500">
                            <MarkdownRenderer content={formatAgentOutput(agent.output)} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Memory Panel */}
            <div className="bg-gray-800 rounded-lg p-4 mt-6">
              <h2 className="text-lg font-semibold mb-4 text-indigo-400 flex items-center gap-2">
                <Database size={16} />
                Related Memories
              </h2>
              <div className="space-y-3">
                {relatedMemories.length > 0 ? (
                  relatedMemories.map((memory) => (
                    <div key={memory.id} className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">
                          {memory.timestamp.toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          {memory.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-indigo-600 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        {memory.userInput.substring(0, 80)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        {memory.finalSummary.substring(0, 60)}...
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No related memories found</p>
                )}
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg p-4 h-[600px] flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-indigo-400">Agent Collaboration</h2>
              
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-300 mb-2">Ready to Collaborate</h3>
                    <p className="text-gray-500">Describe your idea to see the multi-agent system in action!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const styling = getMessageStyling(message);
                    
                    return (
                      <div key={message.id} className={`${styling.container} animate-fade-in`}>
                        <div className="max-w-lg">
                          <div className="flex items-start gap-3">
                            {message.type !== 'user_input' && message.type !== 'iteration_feedback' && (
                              <div className={`w-8 h-8 ${styling.icon} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                {getMessageIcon(message)}
                              </div>
                            )}
                            
                                                         <div className={`p-4 rounded-2xl shadow-lg ${styling.bubble}`}>
                               {/* Message Header */}
                               {message.metadata?.agentName && (
                                 <div className="flex items-center gap-2 mb-3">
                                   <span className="text-sm font-semibold opacity-90">
                                     {message.metadata.agentName}
                                   </span>
                                   {message.metadata.iterationNumber && (
                                     <span className="text-xs bg-black/10 px-2 py-1 rounded-full font-medium">
                                       Iteration {message.metadata.iterationNumber}
                                     </span>
                                   )}
                                 </div>
                               )}
                               
                               {/* Message Content */}
                               <div className={`prose max-w-none ${
                                 message.type === 'agent_output'
                                   ? 'prose-gray' 
                                   : 'prose-invert'
                               }`}>
                                 <MarkdownRenderer content={message.content} />
                               </div>
                              
                                                             {/* Readiness Score for idea summaries */}
                               {message.type === 'idea_summary' && message.metadata?.readinessScore !== undefined && (
                                 <div className="mt-4 p-4 bg-black/10 rounded-xl border border-white/20">
                                   <div className="flex items-center justify-between mb-3">
                                     <span className="text-sm font-semibold text-white">Development Readiness</span>
                                     <span className="text-lg font-bold text-emerald-400">{message.metadata.readinessScore}%</span>
                                   </div>
                                   <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                                     <div 
                                       className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-700 ease-out"
                                       style={{ width: `${message.metadata.readinessScore}%` }}
                                     ></div>
                                   </div>
                                   <div className="mt-2 text-xs text-white/70">
                                     {message.metadata.readinessScore < 30 ? 'Early Stage' : 
                                      message.metadata.readinessScore < 70 ? 'Development Phase' : 'Ready for Launch'}
                                   </div>
                                 </div>
                               )}
                              
                                                             {/* Feedback Input for iterations */}
                               {message.type === 'idea_summary' && 
                                message.metadata?.isFinal && 
                                !agentState?.is_ready_for_development && (
                                 <div className="mt-4 p-4 bg-black/10 rounded-xl border border-white/20">
                                   <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                     <span className="text-lg">💬</span>
                                     Provide Feedback for Next Iteration
                                   </h4>
                                   <textarea
                                     placeholder="What would you like to improve or clarify about this idea?"
                                     className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                                     rows={3}
                                     value={input}
                                     onChange={(e) => setInput(e.target.value)}
                                   />
                                   <div className="flex gap-3 mt-3">
                                     <button
                                       onClick={() => handleIteration()}
                                       disabled={!input.trim() || isGenerating}
                                       className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                                     >
                                       🔄 Start Next Iteration
                                     </button>
                                     <button
                                       onClick={() => setInput("")}
                                       className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                                     >
                                       Clear
                                     </button>
                                   </div>
                                 </div>
                               )}
                            </div>
                            
                            {message.type === 'user_input' && (
                              <div className={`w-8 h-8 ${styling.icon} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                {getMessageIcon(message)}
                              </div>
                            )}
                          </div>
                          
                                                     {/* Timestamp */}
                           <div className="text-xs text-gray-400 mt-2 text-center font-medium">
                             {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isGenerating && handleSendMessage()}
                    disabled={isGenerating}
                    className="w-full bg-gray-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 transition-all duration-200 placeholder-gray-400"
                    placeholder={
                      isGenerating 
                        ? "🤖 Agents are analyzing your idea..." 
                        : "💡 Describe your idea to start multi-agent collaboration..."
                    }
                  />
                  {isGenerating && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={isGenerating || !isReady}
                  className={`px-6 py-4 rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg ${
                    isGenerating || !isReady
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Working...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Idea Summary Integration */}
        {ideaSummary && (
          <div className="mt-6 bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 text-indigo-400 flex items-center gap-2">
              <Lightbulb size={16} />
              Generated Idea Summary
            </h2>
            <div className="bg-gray-700 rounded-lg p-4">
              <MarkdownRenderer content={ideaSummary} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentsPage;
