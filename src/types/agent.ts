export interface Intent {
  domain: "schedule" | "expense" | "chat" | "unknown";
  action: "create" | "read" | "update" | "delete" | "chat";
  confidence: number;
  parameters: Record<string, unknown>;
  rawMessage: string;
}

export interface ExecutionPlan {
  id: string;
  domain: "schedule" | "expense";
  action: "create" | "update" | "delete" | "query";
  description: string;
  toolName: string;
  parameters: Record<string, unknown>;
  requiresConfirmation: boolean;
}

export interface ExecutionResult {
  planId: string;
  success: boolean;
  data: unknown;
  error?: string;
}

export interface OrchestratorResponse {
  type: "plan" | "result" | "clarification" | "chat" | "error";
  text?: string;
  plan?: ExecutionPlan;
  result?: ExecutionResult;
}
