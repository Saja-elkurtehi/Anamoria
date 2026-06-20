import json

from db import db
from models.actions import ACTION_SCHEMA_DESCRIPTION, Message, PendingActionDTO


async def load_patient_documents(patient_id: str) -> list[str]:
    docs = await db.documents.find(patient_id=patient_id)
    return [doc.extracted_text for doc in docs if doc.extracted_text]


def format_documents(documents: list[str]) -> str:
    if not documents:
        return ""
    chunks = "\n\n---\n\n".join(documents)
    return f"\n\nUploaded documents:\n{chunks}"


def format_pending_actions(pending_actions: list[PendingActionDTO]) -> str:
    active = [p for p in pending_actions if p.status == "PENDING"]
    if not active:
        return ""
    items = [
        f"  - id={p.id}  type={p.type}  payload={json.dumps(p.payload)}"
        for p in active
    ]
    return "\n\nCurrently pending actions (awaiting patient approval):\n" + "\n".join(items)


def build_system_prompt(
    patient: dict,
    document_context: str,
    pending_actions: list[PendingActionDTO],
) -> str:
    return f"""You are Anamoria, a medical history assistant for {patient['name']}.
You help patients capture and manage their medical history through conversation.

Patient record:
{json.dumps(patient['record'], indent=2)}
{document_context}
{format_pending_actions(pending_actions)}

Guidelines:
- Be conversational and empathetic. Ask clarifying questions before suggesting actions.
- Never make diagnoses. Only help record what the patient reports.
- Suggest actions only when you have enough detail to populate them accurately.
- If correcting a previous suggestion, include the old action's id in expires_action_ids.

{ACTION_SCHEMA_DESCRIPTION}

Respond as valid JSON matching the AgentResponse schema."""


async def build_context(
    patient: dict,
    history: list[Message],
    pending_actions: list[PendingActionDTO],
) -> tuple[str, list[dict]]:
    documents = await load_patient_documents(patient["id"])
    document_context = format_documents(documents)
    system_prompt = build_system_prompt(patient, document_context, pending_actions)
    messages = [{"role": m.role, "content": m.content} for m in history]
    return system_prompt, messages
