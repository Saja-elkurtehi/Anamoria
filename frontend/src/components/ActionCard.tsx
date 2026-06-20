import type { PendingAction } from "../types/chat";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "border-blue-200 bg-blue-50",
  ACCEPTED: "border-green-200 bg-green-50 opacity-60",
  DENIED: "border-gray-200 bg-gray-50 opacity-40",
  EXPIRED: "border-gray-200 bg-gray-50 opacity-40",
};

const ACTION_LABELS: Record<string, string> = {
  ADD_SYMPTOM: "Log Symptom",
  ADD_CONDITION: "Add Condition",
  ADD_MEDICATION: "Add Medication",
  FLAG_REVIEW: "Flag for Review",
  REQUEST_DOCUMENT: "Request Document",
};

interface Props {
  action: PendingAction;
  onAccept: (id: string) => void;
  onDeny: (id: string) => void;
}

export function ActionCard({ action, onAccept, onDeny }: Props) {
  const isPending = action.status === "PENDING";
  const label = ACTION_LABELS[action.type] ?? action.type;

  return (
    <div className={`rounded-lg border p-3 text-sm ${STATUS_STYLES[action.status]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="font-medium text-gray-700">{label}</span>
          <ul className="mt-1 space-y-0.5 text-gray-600">
            {Object.entries(action.payload).map(([k, v]) =>
              v != null ? (
                <li key={k}>
                  <span className="text-gray-400">{k}:</span>{" "}
                  <span>{String(v)}</span>
                </li>
              ) : null,
            )}
          </ul>
        </div>

        {isPending && (
          <div className="flex shrink-0 gap-1.5">
            <button
              onClick={() => onAccept(action.id)}
              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Accept
            </button>
            <button
              onClick={() => onDeny(action.id)}
              className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Deny
            </button>
          </div>
        )}

        {!isPending && (
          <span className="shrink-0 rounded px-2 py-0.5 text-xs font-medium text-gray-500">
            {action.status}
          </span>
        )}
      </div>
    </div>
  );
}
