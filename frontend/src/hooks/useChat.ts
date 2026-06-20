import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { applyAction, sendMessage } from "../api/client";
import {
  type AssistantMessage,
  type Message,
  type PendingAction,
  resolveActionStatuses,
} from "../types/chat";

export function useChat() {
  const [history, setHistory] = useState<Message[]>([]);
  const [rawPendingActions, setRawPendingActions] = useState<PendingAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingActions = resolveActionStatuses(rawPendingActions, history);

  const sendUserMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = { role: "user", content };
      const nextHistory = [...history, userMessage];
      setHistory(nextHistory);
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendMessage(nextHistory, pendingActions);

        const assistantMsg: AssistantMessage = {
          role: "assistant",
          content: response.message,
          actions: response.actions,
          expiresActionIds: response.expires_action_ids,
        };

        setHistory((prev) => [...prev, assistantMsg]);

        if (response.actions?.length) {
          const turnIndex = nextHistory.length; // index of the assistant message
          const newActions: PendingAction[] = response.actions.map((a) => ({
            ...a,
            id: uuidv4(),
            status: "PENDING",
            turnIndex,
          }));
          setRawPendingActions((prev) => [...prev, ...newActions]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    [history, pendingActions],
  );

  const acceptAction = useCallback(
    async (actionId: string): Promise<unknown> => {
      const action = rawPendingActions.find((a) => a.id === actionId);
      if (!action) return null;
      try {
        const result = await applyAction(action);
        setRawPendingActions((prev) =>
          prev.map((a) => (a.id === actionId ? { ...a, status: "ACCEPTED" } : a)),
        );
        return result.record;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to apply action");
        return null;
      }
    },
    [rawPendingActions],
  );

  const denyAction = useCallback((actionId: string) => {
    setRawPendingActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status: "DENIED" } : a)),
    );
  }, []);

  return {
    history,
    pendingActions,
    isLoading,
    error,
    sendUserMessage,
    acceptAction,
    denyAction,
  };
}
