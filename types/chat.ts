export type ChatRole = "user" | "assistant";
export type ChatMessage = { id: string; role: ChatRole; content: string; createdAt?: unknown };
export type Conversation = { id: string; title: string; userId: string; updatedAt?: unknown };