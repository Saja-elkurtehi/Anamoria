from __future__ import annotations

import inspect
import typing
from typing import Literal, Optional, Union, get_args, get_origin

from pydantic import BaseModel, Field


# ── Payload models ─────────────────────────────────────────────────────────────

class AddSymptomPayload(BaseModel):
    """Log a symptom the patient is currently experiencing."""
    name: str
    severity: Literal["mild", "moderate", "severe"]
    onset: str
    notes: Optional[str] = None


class AddConditionPayload(BaseModel):
    """Record a diagnosed or suspected medical condition."""
    name: str
    icd10: Optional[str] = None
    date_onset: Optional[str] = None


class AddMedicationPayload(BaseModel):
    """Record a medication the patient is taking."""
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None


class FlagReviewPayload(BaseModel):
    """Flag an existing record for physician review."""
    record_id: str
    reason: str


class RequestDocumentPayload(BaseModel):
    """Request a specific document or report from the patient."""
    document_type: str
    reason: str


# ── Action models ──────────────────────────────────────────────────────────────

class AddSymptomAction(BaseModel):
    type: Literal["ADD_SYMPTOM"]
    payload: AddSymptomPayload


class AddConditionAction(BaseModel):
    type: Literal["ADD_CONDITION"]
    payload: AddConditionPayload


class AddMedicationAction(BaseModel):
    type: Literal["ADD_MEDICATION"]
    payload: AddMedicationPayload


class FlagReviewAction(BaseModel):
    type: Literal["FLAG_REVIEW"]
    payload: FlagReviewPayload


class RequestDocumentAction(BaseModel):
    type: Literal["REQUEST_DOCUMENT"]
    payload: RequestDocumentPayload


SuggestedAction = Union[
    AddSymptomAction,
    AddConditionAction,
    AddMedicationAction,
    FlagReviewAction,
    RequestDocumentAction,
]


# ── Response / request models ──────────────────────────────────────────────────

class AgentResponse(BaseModel):
    message: str = Field(
        description="Conversational reply shown in the chat bubble."
    )
    actions: Optional[list[SuggestedAction]] = Field(
        default=None,
        description=(
            "Suggested record updates for user approval. "
            "Only include when clearly warranted and you have enough detail."
        ),
    )
    expires_action_ids: Optional[list[str]] = Field(
        default=None,
        description=(
            "IDs of currently pending actions this response supersedes. "
            "Only expire actions whose content directly contradicts or updates a new suggestion. "
            "Leave unrelated pending actions alone."
        ),
    )


class PendingActionDTO(BaseModel):
    id: str
    type: str
    payload: dict
    status: Literal["PENDING", "ACCEPTED", "DENIED", "EXPIRED"]


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    history: list[Message]
    pending_actions: list[PendingActionDTO] = []


# ── Schema description generator ───────────────────────────────────────────────

def _describe_payload(payload_model: type[BaseModel]) -> str:
    parts = []
    for name, annotation in typing.get_type_hints(payload_model).items():
        args = get_args(annotation)
        is_optional = get_origin(annotation) is Union and type(None) in args
        inner = (
            next(a for a in args if a is not type(None))
            if is_optional
            else annotation
        )

        if get_origin(inner) is Literal or (
            hasattr(inner, "__args__") and get_origin(inner) is Union
        ):
            try:
                type_str = "|".join(str(a) for a in get_args(inner))
            except Exception:
                type_str = getattr(inner, "__name__", str(inner))
        else:
            type_str = getattr(inner, "__name__", str(inner))

        suffix = "?" if is_optional else ""
        parts.append(f"{name}{suffix}: {type_str}")

    return "{ " + ", ".join(parts) + " }"


def generate_action_schema_description() -> str:
    action_types = get_args(SuggestedAction)
    lines = [
        "You may suggest the following actions. "
        "Only include them when clearly warranted.\n"
    ]
    for action_cls in action_types:
        hints = typing.get_type_hints(action_cls)
        type_literal = get_args(hints["type"])[0]
        payload_cls = hints["payload"]
        schema = _describe_payload(payload_cls)
        doc = inspect.getdoc(payload_cls)
        desc = f"  # {doc}" if doc else ""
        lines.append(f"- {type_literal}: {schema}{desc}")

    lines += [
        "",
        "expires_action_ids: IDs of currently pending actions this response directly",
        "supersedes. Only expire actions whose content contradicts a new suggestion.",
        "Leave unrelated pending actions alone.",
    ]
    return "\n".join(lines)


# Generated once at import — not hardcoded
ACTION_SCHEMA_DESCRIPTION = generate_action_schema_description()
