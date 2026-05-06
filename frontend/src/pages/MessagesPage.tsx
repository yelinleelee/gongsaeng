import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Send } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import {
  getConversation,
  listConversations,
  sendMessage,
} from "../lib/messages";
import type { ConversationSummary, Message } from "../types/message";
import { ApiError } from "../lib/api";

export function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const tailRef = useRef<HTMLDivElement | null>(null);

  const reloadConversations = useCallback(async () => {
    try {
      const list = await listConversations();
      setConversations(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "대화 목록을 불러오지 못했습니다");
    }
  }, []);

  useEffect(() => {
    reloadConversations();
  }, [reloadConversations]);

  // Initialize selected peer from ?peer=N or first conversation.
  useEffect(() => {
    const queryPeer = searchParams.get("peer");
    if (queryPeer) {
      setSelectedPeer(Number(queryPeer));
      return;
    }
    if (selectedPeer == null && conversations.length > 0) {
      setSelectedPeer(conversations[0].peer.id);
    }
  }, [searchParams, conversations, selectedPeer]);

  // Load conversation when peer changes.
  useEffect(() => {
    if (selectedPeer == null) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    getConversation(selectedPeer)
      .then((list) => {
        if (cancelled) return;
        setMessages(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "대화를 불러오지 못했습니다");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPeer]);

  // Auto-scroll to bottom when messages change.
  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectPeer(id: number) {
    setSelectedPeer(id);
    const next = new URLSearchParams(searchParams);
    next.set("peer", String(id));
    setSearchParams(next, { replace: true });
  }

  async function onSend() {
    if (!draft.trim() || selectedPeer == null) return;
    setSending(true);
    setError(null);
    try {
      const msg = await sendMessage({ receiver_id: selectedPeer, content: draft.trim() });
      setMessages((prev) => [...prev, msg]);
      setDraft("");
      reloadConversations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "전송 실패");
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  return (
    <section className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr]">
      <aside className="overflow-y-auto rounded-lg border border-slate-200">
        <header className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold">메시지</h2>
        </header>
        {conversations.length === 0 && (
          <p className="p-4 text-sm text-slate-500">대화가 없습니다.</p>
        )}
        <ul>
          {conversations.map((c) => (
            <li key={c.conversation_id}>
              <button
                type="button"
                onClick={() => selectPeer(c.peer.id)}
                className={`flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  selectedPeer === c.peer.id ? "bg-slate-50" : ""
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium">{c.peer.name}</span>
                  {c.unread_count > 0 && (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">
                      {c.unread_count}
                    </span>
                  )}
                </div>
                <span className="line-clamp-1 text-xs text-slate-500">{c.last_message}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex flex-col rounded-lg border border-slate-200">
        {selectedPeer == null ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            대화를 선택하세요.
          </div>
        ) : (
          <>
            <header className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">
              {conversations.find((c) => c.peer.id === selectedPeer)?.peer.name ?? "대화"}
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => {
                const mine = m.sender_id === user.id;
                return (
                  <div key={m.ID} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        mine ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          mine ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {new Date(m.CreatedAt).toLocaleString("ko-KR")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={tailRef} />
            </div>

            {error && <p className="px-4 pb-1 text-sm text-red-600">{error}</p>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSend();
              }}
              className="flex items-center gap-2 border-t border-slate-200 p-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="메시지를 입력하세요"
                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="flex items-center gap-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Send className="size-4" />
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
