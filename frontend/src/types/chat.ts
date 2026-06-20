export type ActionStatus = "PENDING" | "ACCEPTED" | "DENIED" | "EXPIRED";

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: string;
  actions?: SuggestedAction[];
  expiresActionIds?: string[];
}

export type Message = UserMessage | AssistantMessage;

export interface SuggestedAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
}

export interface PendingAction extends SuggestedAction {
  status: ActionStatus;
  turnIndex: number;
}

export interface ChatState {
  history: Message[];
  pendingActions: PendingAction[];
}

export function resolveActionStatuses(
  pendingActions: PendingAction[],
  history: Message[],
): PendingAction[] {
  const expiredIds = new Set(
    history
      .filter((m): m is AssistantMessage => m.role === "assistant")
      .flatMap((m) => m.expiresActionIds ?? []),
  );

  return pendingActions.map((a) =>
    a.status === "PENDING" && expiredIds.has(a.id)
      ? { ...a, status: "EXPIRED" as ActionStatus }
      : a,
  );
}
