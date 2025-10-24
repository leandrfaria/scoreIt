// src/lib/ai/schema.ts
export type Role = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  name?: string;
  tool_call_id?: string;
}
