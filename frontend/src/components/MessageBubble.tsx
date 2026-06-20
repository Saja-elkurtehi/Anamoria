import { ActionCard } from "./ActionCard";
import type { AssistantMessage, Message, PendingAction } from "../types/chat";

interface Props {
  message: Message;
  turnIndex: number;
  pendingActions: PendingAction[];
  onAccept: (id: string) => void;
  onDeny: (id: string) => void;
}

export function MessageBubble({ message, turnIndex, pendingActions, onAccept, onDeny }: Props) {
  const isUser = message.role === "user";

  const actionsForTurn = pendingActions.filter((a) => a.turnIndex === turnIndex);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-800 shadow-sm ring-1 ring-gray-100"
          }`}
        >
          {message.content}
        </div>

        {!isUser && actionsForTurn.length > 0 && (
          <div className="w-full space-y-2">
            {actionsForTurn.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onAccept={onAccept}
                onDeny={onDeny}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
