import { ExecutionResult } from "./agent";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "result";
  content: string;
  result?: ExecutionResult;
  timestamp: Date;
}
