// In-browser storage system for agent memory and conversation history
export interface AgentMemory {
  id: string;
  timestamp: Date;
  userInput: string;
  agentOutputs: {
    orchestrator: string;
    questioner: string;
    memory: string;
    summarizer: string;
  };
  finalSummary: string;
  tags: string[];
}

export interface ConversationSession {
  id: string;
  startTime: Date;
  lastActivity: Date;
  messages: Array<{
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    agentType?: string;
  }>;
  ideaSummary: string;
  agentMemories: AgentMemory[];
}

class AgentStorage {
  private readonly MEMORY_KEY = 'agent_memories';
  private readonly SESSIONS_KEY = 'conversation_sessions';
  private readonly MAX_MEMORIES = 100;
  private readonly MAX_SESSIONS = 20;

  // Memory management
  async saveMemory(memory: AgentMemory): Promise<void> {
    try {
      const memories = await this.getMemories();
      memories.unshift(memory);
      
      // Keep only the most recent memories
      if (memories.length > this.MAX_MEMORIES) {
        memories.splice(this.MAX_MEMORIES);
      }
      
      localStorage.setItem(this.MEMORY_KEY, JSON.stringify(memories));
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  }

  async getMemories(): Promise<AgentMemory[]> {
    try {
      const stored = localStorage.getItem(this.MEMORY_KEY);
      if (!stored) return [];
      
      const memories = JSON.parse(stored);
      return memories.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
    } catch (error) {
      console.error('Error loading memories:', error);
      return [];
    }
  }

  async searchMemories(query: string): Promise<AgentMemory[]> {
    const memories = await this.getMemories();
    const queryLower = query.toLowerCase();
    
    return memories.filter(memory => 
      memory.userInput.toLowerCase().includes(queryLower) ||
      memory.finalSummary.toLowerCase().includes(queryLower) ||
      memory.tags.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }

  async getRelatedMemories(currentInput: string, limit: number = 5): Promise<AgentMemory[]> {
    const memories = await this.getMemories();
    const currentLower = currentInput.toLowerCase();
    
    // Simple relevance scoring based on keyword overlap
    const scoredMemories = memories.map(memory => {
      const inputWords = currentLower.split(/\s+/);
      const memoryWords = (memory.userInput + ' ' + memory.finalSummary).toLowerCase().split(/\s+/);
      
      const overlap = inputWords.filter(word => 
        word.length > 3 && memoryWords.includes(word)
      ).length;
      
      return { memory, score: overlap };
    });
    
    return scoredMemories
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory);
  }

  // Session management
  async saveSession(session: ConversationSession): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.unshift(session);
      }
      
      // Keep only the most recent sessions
      if (sessions.length > this.MAX_SESSIONS) {
        sessions.splice(this.MAX_SESSIONS);
      }
      
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  async getSessions(): Promise<ConversationSession[]> {
    try {
      const stored = localStorage.getItem(this.SESSIONS_KEY);
      if (!stored) return [];
      
      const sessions = JSON.parse(stored);
      return sessions.map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        lastActivity: new Date(s.lastActivity),
        messages: s.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  async getSession(sessionId: string): Promise<ConversationSession | null> {
    const sessions = await this.getSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  async createSession(): Promise<ConversationSession> {
    const session: ConversationSession = {
      id: this.generateId(),
      startTime: new Date(),
      lastActivity: new Date(),
      messages: [],
      ideaSummary: '',
      agentMemories: []
    };
    
    await this.saveSession(session);
    return session;
  }

  async addMessageToSession(sessionId: string, message: {
    role: 'user' | 'agent';
    content: string;
    agentType?: string;
  }): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;
    
    session.messages.push({
      ...message,
      timestamp: new Date()
    });
    session.lastActivity = new Date();
    
    await this.saveSession(session);
  }

  async updateSessionSummary(sessionId: string, summary: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;
    
    session.ideaSummary = summary;
    session.lastActivity = new Date();
    
    await this.saveSession(session);
  }

  async addMemoryToSession(sessionId: string, memory: AgentMemory): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;
    
    session.agentMemories.push(memory);
    session.lastActivity = new Date();
    
    await this.saveSession(session);
  }

  // Utility functions
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async clearAllData(): Promise<void> {
    try {
      localStorage.removeItem(this.MEMORY_KEY);
      localStorage.removeItem(this.SESSIONS_KEY);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  async exportData(): Promise<{ memories: AgentMemory[], sessions: ConversationSession[] }> {
    const memories = await this.getMemories();
    const sessions = await this.getSessions();
    
    return { memories, sessions };
  }

  async importData(data: { memories: AgentMemory[], sessions: ConversationSession[] }): Promise<void> {
    try {
      localStorage.setItem(this.MEMORY_KEY, JSON.stringify(data.memories));
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(data.sessions));
    } catch (error) {
      console.error('Error importing data:', error);
    }
  }
}

// Export singleton instance
export const agentStorage = new AgentStorage();
