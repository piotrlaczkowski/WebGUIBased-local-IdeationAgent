// Custom LLM interface to work with our Hugging Face Transformers.js setup
interface CustomLLM {
  generateResponse: (
    messages: Array<{ role: string; content: string }>,
    tools: Array<any>,
    onToken?: (token: string) => void
  ) => Promise<string>;
}

// Define the state interface for our graph
export interface AgentState {
  user_input: string;
  conversation_history: string[];
  idea_summary: string;
  orchestrator_output: string;
  questioner_output: string;
  memory_output: string;
  summarizer_output: string;
  current_agent: string;
  agent_status: Record<string, { isActive: boolean; currentTask: string }>;
  final_summary: string;
  // New fields for DAG routing
  needs_clarification: boolean;
  needs_research: boolean;
  needs_technical_analysis: boolean;
  complexity_level: 'simple' | 'moderate' | 'complex';
  execution_path: string[];
  parallel_tasks: string[];
  completed_tasks: string[];
  research_output: string;
  technical_output: string;
  feedback_output: string;
  // Iteration and feedback fields
  iteration_count: number;
  user_feedback: string[];
  iteration_history: Array<{
    iteration: number;
    feedback: string;
    improvements: string;
    timestamp: Date;
  }>;
  readiness_score: number; // 0-100
  is_ready_for_development: boolean;
}

// Agent-specific prompts
const ORCHESTRATOR_PROMPT = `
You are coordinating a simple interview session. Decide if we need just basic questions or more detailed investigation.

USER SAID: {user_input}
CONTEXT: {conversation_history}

DECISION RULES:
- If it's a simple idea (like "build a house"), just use: questioner, summarizer
- If it's more complex or technical, add: memory, questioner, summarizer
- Only use research/technical for very complex business or tech ideas

Respond ONLY with JSON:
{
  "complexity": "simple|moderate|complex",
  "needs_clarification": true,
  "needs_research": false,
  "needs_technical_analysis": false,
  "execution_path": ["questioner", "summarizer"],
  "reasoning": "Brief reason for approach"
}

Keep it simple. Most ideas just need good questions.
`;

const QUESTIONER_PROMPT = `
You are an experienced journalist conducting a focused interview. Your job is to ask 2-3 sharp, direct questions that get to the core of what's missing about this idea.

CURRENT STORY:
User said: {user_input}
Previous context: {idea_summary}

JOURNALIST APPROACH:
- Ask direct, specific questions like a real journalist would
- Don't give advice or explanations - just ask questions
- Focus on the biggest gaps in the story
- Be conversational but professional

Examples of good journalist questions:
- "What specific problem are you trying to solve?"
- "Who exactly would use this?"
- "How would this actually work?"
- "What's your timeline for this?"
- "What's the biggest challenge you see?"

Keep it short and focused. Ask only the most important questions needed to understand this idea better.
`;

const MEMORY_PROMPT = `
You are the Ideation Memory agent, responsible for connecting current ideas with past insights and knowledge. Your role is to:
1. Retrieve relevant information from past ideation sessions
2. Identify patterns and connections between ideas
3. Suggest related approaches or solutions
4. Provide context and learning from previous idea development

Conversation history: {conversation_history}
Current idea summary: {idea_summary}
Orchestrator analysis: {orchestrator_output}
User input: {user_input}

Based on the current ideation session, provide:

**Relevant Patterns & Connections:**
- Similar ideas or approaches from past conversations
- Common themes or patterns in idea development
- Lessons learned from previous ideation sessions

**Related Insights:**
- Complementary ideas that could enhance this concept
- Alternative approaches or perspectives to consider
- Successful strategies from similar ideas

**Development Recommendations:**
- Key insights that should inform this idea's development
- Potential pitfalls or challenges to avoid
- Opportunities for innovation or differentiation

**Knowledge Integration:**
- How this idea builds upon or differs from previous concepts
- Unique aspects that make this idea worth pursuing
- Strategic considerations for development

Focus on actionable insights that will help develop this specific idea further.
`;

const RESEARCH_AGENT_PROMPT = `
You are the Ideation Research Agent, specialized in validating and enhancing ideas through market and competitive analysis. Your role is to:
1. Analyze market opportunities and trends relevant to the idea
2. Research competitive landscape and positioning opportunities
3. Identify market gaps and unmet needs
4. Provide strategic insights for idea development and positioning

Current idea: {user_input}
Orchestrator analysis: {orchestrator_output}
Idea summary: {idea_summary}

Please provide comprehensive research insights on:

**Market Analysis:**
- Target market size and growth potential
- Key market trends and opportunities
- Customer needs and pain points
- Market timing and readiness

**Competitive Landscape:**
- Direct and indirect competitors
- Competitive advantages and differentiators
- Market positioning opportunities
- Potential partnerships or collaborations

**Validation Opportunities:**
- Ways to test and validate the idea
- Key assumptions that need verification
- Customer feedback and research methods
- MVP or prototype testing approaches

**Strategic Recommendations:**
- Market entry strategies
- Positioning and messaging recommendations
- Risk factors and mitigation strategies
- Success metrics and KPIs

Format as a structured analysis with actionable insights for idea development.
`;

const TECHNICAL_AGENT_PROMPT = `
You are the Ideation Technical Agent, specialized in evaluating technical feasibility and implementation strategies for ideas. Your role is to:
1. Analyze technical requirements and implementation approaches
2. Evaluate feasibility and identify technical challenges
3. Provide technology recommendations and architecture guidance
4. Assess development complexity and resource requirements

Current idea: {user_input}
Orchestrator analysis: {orchestrator_output}
Idea summary: {idea_summary}

Please provide comprehensive technical analysis on:

**Technical Feasibility:**
- Core technical requirements and complexity
- Technology stack options and recommendations
- Implementation approaches and methodologies
- Scalability and performance considerations

**Development Strategy:**
- Recommended development phases and milestones
- Resource requirements (team, tools, infrastructure)
- Timeline estimates and critical path analysis
- Risk assessment and mitigation strategies

**Technology Recommendations:**
- Optimal technology stack for the idea
- Third-party services and integrations needed
- Development tools and platforms
- Security and compliance considerations

**Implementation Roadmap:**
- MVP development approach
- Iterative development strategy
- Testing and quality assurance approach
- Deployment and launch considerations

Format as a structured technical analysis with actionable recommendations for idea implementation.
`;

const SUMMARIZER_PROMPT = `
You are a journalist writing a concise story summary. Create a brief, clear summary of what we learned about this idea.

SOURCES:
User input: {user_input}
Questions asked: {questioner_output}
Background: {memory_output}

Write a brief, focused summary in this format:

# 💡 Idea Summary: [Brief title based on the idea]

## What We Know
[2-3 sentences about the core idea]

## Key Details
- **Problem**: [What problem this solves, if known]
- **Target**: [Who would use this, if known] 
- **Approach**: [How it would work, if known]

## Next Steps
[2-3 specific questions that still need answers]

Keep it short and actionable. Focus on facts, not speculation.`;

const FEEDBACK_AGENT_PROMPT = `
You are the Feedback Integration Agent, specialized in processing user feedback and improving ideas iteratively. Your role is to:
1. Analyze user feedback and identify key improvement areas
2. Suggest specific enhancements to the idea
3. Prioritize feedback-based improvements
4. Track iteration progress and readiness

Current idea summary: {idea_summary}
User feedback: {user_feedback}
Previous iteration: {iteration_count}
Agent outputs: {agent_outputs}

Please provide:

**Feedback Analysis:**
- Key themes and patterns in user feedback
- Most important improvement areas
- Priority ranking of feedback points

**Suggested Improvements:**
- Specific enhancements to address feedback
- New features or modifications to consider
- Refinements to existing concepts

**Iteration Plan:**
- What should be the focus of the next iteration
- Which agents should be involved
- Expected outcomes and success criteria

**Readiness Assessment:**
- Current readiness score (0-100)
- What would make the idea ready for development
- Remaining gaps to address

Format as a structured analysis with clear action items.
`;

// Helper function to format prompts with variables
const formatPrompt = (template: string, variables: Record<string, string>): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
};

// Helper function to parse JSON responses
const parseJSONResponse = (response: string): any => {
  try {
    // Extract JSON from response if it's wrapped in markdown
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                     response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    console.log('Raw response:', response);
    return null;
  }
};

// Agent functions
const orchestratorAgent = async (state: AgentState, llm: CustomLLM): Promise<AgentState> => {
  const prompt = formatPrompt(ORCHESTRATOR_PROMPT, {
    conversation_history: state.conversation_history.join("\n"),
    idea_summary: state.idea_summary,
    user_input: state.user_input,
    iteration_count: state.iteration_count.toString(),
  });

  const messages = [
    { role: "system", content: prompt }
  ];

  const output = await llm.generateResponse(messages, []);
  console.log('🤖 Orchestrator response length:', output.length, 'chars');
  
  if (!output || output.trim() === '') {
    console.warn('Empty response from LLM, using fallback');
    return {
      ...state,
      orchestrator_output: "Analysis completed with fallback logic",
      current_agent: "orchestrator",
      complexity_level: 'moderate',
      needs_clarification: true,
      needs_research: false,
      needs_technical_analysis: false,
      execution_path: ['memory', 'questioner', 'summarizer'],
      agent_status: {
        ...state.agent_status,
        orchestrator: { isActive: false, currentTask: "Completed analysis (fallback)" },
      },
    };
  }
  
  const analysis = parseJSONResponse(output);

  // Fallback logic if JSON parsing fails
  let complexity_level: 'simple' | 'moderate' | 'complex' = 'moderate';
  let needs_clarification = false;
  let needs_research = false;
  let needs_technical_analysis = false;
  let execution_path = ['questioner', 'summarizer'];

  if (analysis) {
    complexity_level = analysis.complexity || 'moderate';
    needs_clarification = analysis.needs_clarification || false;
    needs_research = analysis.needs_research || false;
    needs_technical_analysis = analysis.needs_technical_analysis || false;
    execution_path = analysis.execution_path || ['questioner', 'summarizer'];
  } else {
    // Fallback: analyze the text response to determine complexity
    const outputLower = output.toLowerCase();
    if (outputLower.includes('simple') || outputLower.includes('basic')) {
      complexity_level = 'simple';
    } else if (outputLower.includes('complex') || outputLower.includes('advanced')) {
      complexity_level = 'complex';
      needs_clarification = true;
      needs_research = true;
      needs_technical_analysis = true;
      execution_path = ['memory', 'research', 'technical', 'questioner', 'summarizer'];
    } else {
      complexity_level = 'moderate';
      needs_clarification = true;
      execution_path = ['memory', 'questioner', 'summarizer'];
    }
  }

  return {
    ...state,
    orchestrator_output: output,
    current_agent: "orchestrator",
    complexity_level,
    needs_clarification,
    needs_research,
    needs_technical_analysis,
    execution_path,
    agent_status: {
      ...state.agent_status,
      orchestrator: { isActive: false, currentTask: "Completed analysis" },
    },
  };
};

const questionerAgent = async (state: AgentState, llm: CustomLLM): Promise<AgentState> => {
  const prompt = formatPrompt(QUESTIONER_PROMPT, {
    idea_summary: state.idea_summary,
    orchestrator_output: state.orchestrator_output,
    user_input: state.user_input,
    complexity_level: state.complexity_level,
  });

  const messages = [
    { role: "system", content: prompt }
  ];

  const output = await llm.generateResponse(messages, []);

  return {
    ...state,
    questioner_output: output,
    current_agent: "questioner",
    completed_tasks: [...state.completed_tasks, 'questioner'],
    agent_status: {
      ...state.agent_status,
      questioner: { isActive: false, currentTask: "Completed questioning" },
    },
  };
};

const memoryAgent = async (state: AgentState, llm: CustomLLM): Promise<AgentState> => {
  const prompt = formatPrompt(MEMORY_PROMPT, {
    conversation_history: state.conversation_history.join("\n"),
    idea_summary: state.idea_summary,
    orchestrator_output: state.orchestrator_output,
    questioner_output: state.questioner_output,
    user_input: state.user_input,
  });

  const messages = [
    { role: "system", content: prompt }
  ];

  const output = await llm.generateResponse(messages, []);

  return {
    ...state,
    memory_output: output,
    current_agent: "memory",
    completed_tasks: [...state.completed_tasks, 'memory'],
    agent_status: {
      ...state.agent_status,
      memory: { isActive: false, currentTask: "Completed memory retrieval" },
    },
  };
};

const researchAgent = async (state: AgentState, llm: CustomLLM): Promise<AgentState> => {
  const prompt = formatPrompt(RESEARCH_AGENT_PROMPT, {
    user_input: state.user_input,
    orchestrator_output: state.orchestrator_output,
    idea_summary: state.idea_summary,
  });

  const messages = [
    { role: "system", content: prompt }
  ];

  const output = await llm.generateResponse(messages, []);

  return {
    ...state,
    research_output: output,
    current_agent: "research",
    completed_tasks: [...state.completed_tasks, 'research'],
    agent_status: {
      ...state.agent_status,
      research: { isActive: false, currentTask: "Completed research" },
    },
  };
};

const technicalAgent = async (state: AgentState, llm: CustomLLM): Promise<AgentState> => {
  const prompt = formatPrompt(TECHNICAL_AGENT_PROMPT, {
    user_input: state.user_input,
    orchestrator_output: state.orchestrator_output,
    idea_summary: state.idea_summary,
  });

  const messages = [
    { role: "system", content: prompt }
  ];

  const output = await llm.generateResponse(messages, []);

  return {
    ...state,
    technical_output: output,
    current_agent: "technical",
    completed_tasks: [...state.completed_tasks, 'technical'],
    agent_status: {
      ...state.agent_status,
      technical: { isActive: false, currentTask: "Completed technical analysis" },
    },
  };
};

const summarizerAgent = async (state: AgentState, llm: CustomLLM): Promise<AgentState> => {
  const prompt = formatPrompt(SUMMARIZER_PROMPT, {
    user_input: state.user_input,
    orchestrator_output: state.orchestrator_output,
    questioner_output: state.questioner_output,
    memory_output: state.memory_output,
    research_output: state.research_output || '',
    technical_output: state.technical_output || '',
    idea_summary: state.idea_summary,
    execution_path: state.execution_path.join(' → '),
    iteration_count: state.iteration_count.toString(),
    user_feedback: state.user_feedback.join("; "),
  });

  const messages = [
    { role: "system", content: prompt }
  ];

  const output = await llm.generateResponse(messages, []);

  // Extract readiness score from output
  const readinessMatch = output.match(/readiness.*?(\d+)/i);
  const readinessScore = readinessMatch ? parseInt(readinessMatch[1]) : Math.min(50 + state.iteration_count * 10, 100);
  const isReadyForDevelopment = readinessScore >= 80;

  return {
    ...state,
    summarizer_output: output,
    final_summary: output,
    current_agent: "summarizer",
    completed_tasks: [...state.completed_tasks, 'summarizer'],
    readiness_score: readinessScore,
    is_ready_for_development: isReadyForDevelopment,
    agent_status: {
      ...state.agent_status,
      summarizer: { isActive: false, currentTask: "Completed summarization" },
    },
  };
};

// DAG-based workflow execution
export const runAgentWorkflow = async (
  userInput: string,
  llm: CustomLLM,
  conversationHistory: string[] = [],
  ideaSummary: string = ""
): Promise<AgentState> => {
  console.log('🚀 Starting DAG workflow for:', userInput.substring(0, 50) + '...');
  // Initialize state
  let state: AgentState = createInitialState(userInput, conversationHistory, ideaSummary);

  try {
    // Step 1: Always start with Orchestrator for routing decisions
    console.log('🎯 Starting orchestrator agent...');
    state.agent_status.orchestrator.isActive = true;
    state.agent_status.orchestrator.currentTask = "Analyzing input and planning workflow";
    state = await orchestratorAgent(state, llm);
    state.completed_tasks.push('orchestrator');
    console.log('✅ Orchestrator completed. Complexity:', state.complexity_level, 'Path:', state.execution_path.join(' → '));

    // Step 2: Execute parallel tasks based on orchestrator decisions
    const parallelTasks: Promise<AgentState>[] = [];

    // Memory agent runs in parallel if we have conversation history
    if (conversationHistory.length > 0) {
      state.agent_status.memory.isActive = true;
      state.agent_status.memory.currentTask = "Retrieving relevant knowledge";
      parallelTasks.push(memoryAgent(state, llm));
    }

    // Research agent runs in parallel if needed
    if (state.needs_research) {
      state.agent_status.research.isActive = true;
      state.agent_status.research.currentTask = "Conducting market research";
      parallelTasks.push(researchAgent(state, llm));
    }

    // Technical agent runs in parallel if needed
    if (state.needs_technical_analysis) {
      state.agent_status.technical.isActive = true;
      state.agent_status.technical.currentTask = "Analyzing technical requirements";
      parallelTasks.push(technicalAgent(state, llm));
    }

    // Wait for parallel tasks to complete
    if (parallelTasks.length > 0) {
      const parallelResults = await Promise.all(parallelTasks);
      
      // Merge results from parallel tasks
      parallelResults.forEach(result => {
        if (result.memory_output) state.memory_output = result.memory_output;
        if (result.research_output) state.research_output = result.research_output;
        if (result.technical_output) state.technical_output = result.technical_output;
        state.completed_tasks.push(...result.completed_tasks.filter(task => 
          !state.completed_tasks.includes(task)
        ));
      });
    }

    // Step 3: Questioner agent (conditional based on complexity and needs)
    if (state.needs_clarification || state.complexity_level === 'complex') {
      state.agent_status.questioner.isActive = true;
      state.agent_status.questioner.currentTask = "Generating probing questions";
      state = await questionerAgent(state, llm);
    }

    // Step 4: Always end with Summarizer
    console.log('📝 Starting summarizer agent...');
    state.agent_status.summarizer.isActive = true;
    state.agent_status.summarizer.currentTask = "Creating conversation summary";
    state = await summarizerAgent(state, llm);
    console.log('✅ Summarizer completed. Summary length:', state.final_summary.length, 'chars');

  } catch (error) {
    console.error('Error in agent workflow:', error);
    throw error;
  }

  return state;
};

// Feedback integration agent for iterative improvements
export const feedbackAgent = async (state: AgentState, llm: CustomLLM): Promise<AgentState> => {
  const agentOutputs = {
    orchestrator: state.orchestrator_output,
    questioner: state.questioner_output,
    memory: state.memory_output,
    research: state.research_output,
    technical: state.technical_output,
    summarizer: state.summarizer_output,
  };

  const prompt = formatPrompt(FEEDBACK_AGENT_PROMPT, {
    idea_summary: state.idea_summary,
    user_feedback: state.user_feedback.join("; "),
    iteration_count: state.iteration_count.toString(),
    agent_outputs: JSON.stringify(agentOutputs),
  });

  const messages = [
    { role: "system", content: prompt }
  ];

  const output = await llm.generateResponse(messages, []);

  return {
    ...state,
    feedback_output: output,
    current_agent: "feedback",
    completed_tasks: [...state.completed_tasks, 'feedback'],
    agent_status: {
      ...state.agent_status,
      feedback: { isActive: false, currentTask: "Completed feedback integration" },
    },
  };
};

// Streaming version of the agent workflow with real-time updates
export const runStreamingAgentWorkflow = async (
  userInput: string,
  llm: CustomLLM,
  conversationHistory: string[] = [],
  ideaSummary: string = "",
  onProgress?: (progress: number, agent: string, message: string) => void
): Promise<AgentState> => {
  console.log('🚀 Starting streaming DAG workflow for:', userInput.substring(0, 50) + '...');
  
  // Initialize state
  let state: AgentState = createInitialState(userInput, conversationHistory, ideaSummary);

  try {
    // Step 1: Always start with Orchestrator for routing decisions
    onProgress?.(10, "orchestrator", "Analyzing input and planning workflow...");
    console.log('🎯 Starting orchestrator agent...');
    state.agent_status.orchestrator.isActive = true;
    state.agent_status.orchestrator.currentTask = "Analyzing input and planning workflow";
    state = await orchestratorAgent(state, llm);
    state.completed_tasks.push('orchestrator');
    onProgress?.(30, "orchestrator", "Analysis complete. Planning execution path...");
    console.log('✅ Orchestrator completed. Complexity:', state.complexity_level, 'Path:', state.execution_path.join(' → '));
    
    // Add orchestrator output to chat history
    if (state.orchestrator_output) {
      onProgress?.(25, "orchestrator", "Adding analysis to chat history...");
      // This will be handled by the callback in the main component
    }

    // Step 2: Execute parallel tasks based on orchestrator decisions
    const parallelTasks: Promise<AgentState>[] = [];


    // Memory agent runs in parallel if we have conversation history
    if (conversationHistory.length > 0) {
      onProgress?.(40, "memory", "Retrieving relevant knowledge from past conversations...");
      state.agent_status.memory.isActive = true;
      state.agent_status.memory.currentTask = "Retrieving relevant knowledge";
      parallelTasks.push(memoryAgent(state, llm));
    }

    // Research agent runs in parallel if needed
    if (state.needs_research) {
      onProgress?.(45, "research", "Conducting market research and competitive analysis...");
      state.agent_status.research.isActive = true;
      state.agent_status.research.currentTask = "Conducting market research";
      parallelTasks.push(researchAgent(state, llm));
    }

    // Technical agent runs in parallel if needed
    if (state.needs_technical_analysis) {
      onProgress?.(50, "technical", "Analyzing technical requirements and feasibility...");
      state.agent_status.technical.isActive = true;
      state.agent_status.technical.currentTask = "Analyzing technical requirements";
      parallelTasks.push(technicalAgent(state, llm));
    }

    // Wait for parallel tasks to complete
    if (parallelTasks.length > 0) {
      onProgress?.(60, "parallel", "Executing parallel analysis tasks...");
      const parallelResults = await Promise.all(parallelTasks);
      
      // Merge results from parallel tasks
      parallelResults.forEach(result => {
        if (result.memory_output) state.memory_output = result.memory_output;
        if (result.research_output) state.research_output = result.research_output;
        if (result.technical_output) state.technical_output = result.technical_output;
        state.completed_tasks.push(...result.completed_tasks.filter(task => 
          !state.completed_tasks.includes(task)
        ));
      });
      onProgress?.(70, "parallel", "Parallel analysis complete");
    }

    // Step 3: Questioner agent (conditional based on complexity and needs)
    if (state.needs_clarification || state.complexity_level === 'complex') {
      onProgress?.(75, "questioner", "Generating probing questions to clarify the idea...");
      state.agent_status.questioner.isActive = true;
      state.agent_status.questioner.currentTask = "Generating probing questions";
      state = await questionerAgent(state, llm);
      state.completed_tasks.push('questioner');
      onProgress?.(85, "questioner", "Questions generated successfully");
      
      // Add questioner output to chat history
      if (state.questioner_output) {
        onProgress?.(80, "questioner", "Adding questions to chat history...");
      }
    }

    // Step 4: Always end with Summarizer
    onProgress?.(90, "summarizer", "Creating comprehensive summary of all findings...");
    console.log('📝 Starting summarizer agent...');
    state.agent_status.summarizer.isActive = true;
    state.agent_status.summarizer.currentTask = "Creating conversation summary";
    state = await summarizerAgent(state, llm);
    onProgress?.(100, "summarizer", "Summary complete!");
    console.log('✅ Summarizer completed. Summary length:', state.final_summary.length, 'chars');
    
    // Add summarizer output to chat history
    if (state.summarizer_output) {
      onProgress?.(95, "summarizer", "Adding final summary to chat history...");
    }

  } catch (error) {
    console.error('Error in streaming agent workflow:', error);
    onProgress?.(100, "error", `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }

  return state;
};

// Helper function to initialize state
export const createInitialState = (
  userInput: string,
  conversationHistory: string[] = [],
  ideaSummary: string = ""
): AgentState => {
  return {
    user_input: userInput,
    conversation_history: conversationHistory,
    idea_summary: ideaSummary,
    orchestrator_output: "",
    questioner_output: "",
    memory_output: "",
    summarizer_output: "",
    research_output: "",
    technical_output: "",
    feedback_output: "",
    current_agent: "",
    agent_status: {
      orchestrator: { isActive: true, currentTask: "Starting analysis..." },
      questioner: { isActive: false, currentTask: "" },
      memory: { isActive: false, currentTask: "" },
      research: { isActive: false, currentTask: "" },
      technical: { isActive: false, currentTask: "" },
      summarizer: { isActive: false, currentTask: "" },
    },
    final_summary: "",
    needs_clarification: false,
    needs_research: false,
    needs_technical_analysis: false,
    complexity_level: 'moderate',
    execution_path: [],
    parallel_tasks: [],
    completed_tasks: [],
    // Initialize iteration fields
    iteration_count: 0,
    user_feedback: [],
    iteration_history: [],
    readiness_score: 0,
    is_ready_for_development: false,
  };
};
