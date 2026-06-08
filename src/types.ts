export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  codeSnippet?: string;
  systemPrompt: string;
  category: 'system' | 'custom' | 'browser' | 'database';
  enabled: boolean;
  createdAt: string;
}

export interface SystemStatus {
  online: boolean;
  uptime: string;
  autoMode: boolean; // Safe mode with approvals vs Auto mode
  llmModel: string;
  connectedPlatforms: {
    cli: boolean;
    slack: boolean;
    telegram: boolean;
    webhook: boolean;
  };
  metrics: {
    cpu: number;
    memory: {
      used: number;
      total: number;
    };
    tokensToday: number;
    stepsExecuted: number;
  };
}

export interface MemoryEntry {
  id: string;
  content: string;
  category: 'user_preference' | 'system_state' | 'task_result';
  timestamp: string;
}

export interface AgentStep {
  id: string;
  timestamp: string;
  type: 'thought' | 'tool_call' | 'tool_output' | 'approval_required' | 'response';
  title: string;
  message: string;
  metadata?: any;
}

export interface ConversationThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  steps: AgentStep[];
  answer: string;
}

export interface SystemLog {
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'dev';
  message: string;
}

export interface RunAgentRequest {
  prompt: string;
  activeSkillId?: string;
  autoMode: boolean;
  threadId: string;
}

export interface RunAgentResponse {
  answer: string;
  steps: AgentStep[];
}

export interface ApprovalRequest {
  id: string;
  timestamp: string;
  agentId: string;
  actionType: 'file_edit' | 'external_communication' | 'code_execution';
  description: string;
  payload: any;
  status: 'pending' | 'approved' | 'rejected';
}

