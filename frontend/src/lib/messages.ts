import { api } from "./api";
import type {
  ConversationSummary,
  Message,
  SendMessageInput,
} from "../types/message";

export function listConversations(): Promise<ConversationSummary[]> {
  return api<ConversationSummary[]>("/messages/conversations");
}

export function getConversation(peerId: number): Promise<Message[]> {
  return api<Message[]>(`/messages/with/${peerId}`);
}

export function sendMessage(input: SendMessageInput): Promise<Message> {
  return api<Message>("/messages", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function markMessageRead(id: number): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>(`/messages/${id}/read`, { method: "PATCH" });
}
