import type { AssistantMessage, Message, PendingAction } from "../types/chat";

const BASE = "";

function getAuthHeader(): string {
  const patientId = localStorage.getItem("patientId") ?? "";
  return `Bearer ${patientId}`;
}

export async function sendMessage(
  history: Message[],
  pendingActions: PendingAction[],
): Promise<{ message: string; actions?: AssistantMessage["actions"]; expires_action_ids?: string[] }> {
  const backendHistory = history.map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      history: backendHistory,
      pending_actions: pendingActions,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chat request failed: ${res.status} ${err}`);
  }
  return res.json();
}

export async function applyAction(action: PendingAction): Promise<{ record: unknown }> {
  const { id: _id, status: _status, turnIndex: _turnIndex, ...actionPayload } = action;

  const res = await fetch(`${BASE}/actions/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({ action: actionPayload }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Apply action failed: ${res.status} ${err}`);
  }
  return res.json();
}
