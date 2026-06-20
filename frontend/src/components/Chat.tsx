import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useApp } from "../context/AppContext";
import { MessageBubble } from "./MessageBubble";
import type { TimelineNode } from "../types";

export function Chat() {
  const { history, pendingActions, isLoading, error, sendUserMessage, acceptAction, denyAction } =
    useChat();
  const { addTimelineNode } = useApp();

  const handleAccept = useCallback(async (actionId: string) => {
    const record = await acceptAction(actionId);
    if (record && (record as TimelineNode).nodeId) {
      addTimelineNode(record as TimelineNode, false);
    }
  }, [acceptAction, addTimelineNode]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendUserMessage(text);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-12">
            Hi! Tell me what's on your mind today.
          </p>
        )}

        {history.map((message, i) => (
          <MessageBubble
            key={i}
            message={message}
            turnIndex={i}
            pendingActions={pendingActions}
            onAccept={handleAccept}
            onDeny={denyAction}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-gray-100">
              <span className="inline-flex gap-1 text-gray-400">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce [animation-delay:0.15s]">•</span>
                <span className="animate-bounce [animation-delay:0.3s]">•</span>
              </span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-red-500">Error: {error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-100 bg-white p-4 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={isLoading}
          className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-blue-300 focus:bg-white disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
