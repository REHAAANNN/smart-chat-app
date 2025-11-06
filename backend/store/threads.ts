// store/threads.ts

export type Message = {
  senderId: string;
  content: string;
  timestamp: number;
};

export type Thread = {
  id: string;
  name: string;
  participants: string[];
  messages: Message[];
};

// ✅ Correct export: threads (lowercase)
export const threads = new Map<string, Thread>();
