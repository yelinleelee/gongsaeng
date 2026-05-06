import type { PropertyHost } from "./property";

export type Message = {
  ID: number;
  CreatedAt: string;
  conversation_id: string;
  sender_id: number;
  sender: PropertyHost;
  receiver_id: number;
  receiver: PropertyHost;
  content: string;
  is_read: boolean;
};

export type ConversationSummary = {
  conversation_id: string;
  peer: PropertyHost & { phone?: string; role?: string; is_verified?: boolean };
  last_message: string;
  last_at: string;
  unread_count: number;
};

export type SendMessageInput = {
  receiver_id: number;
  content: string;
};
