from db import db
from models.actions import (
    AddConditionAction,
    AddMedicationAction,
    AddSymptomAction,
    FlagReviewAction,
    RequestDocumentAction,
    SuggestedAction,
)


async def apply_action(action: SuggestedAction, patient_id: str) -> dict:
    match action:
        case AddSymptomAction():
            return await db.symptoms.create({
                **action.payload.model_dump(),
                "patient_id": patient_id,
                "source": "CHAT_ASSISTANT",
                "verification_status": "PATIENT_REPORTED",
            })
        case AddConditionAction():
            return await db.conditions.create({
                **action.payload.model_dump(),
                "patient_id": patient_id,
                "source": "CHAT_ASSISTANT",
                "verification_status": "PATIENT_REPORTED",
            })
        case AddMedicationAction():
            return await db.medications.create({
                **action.payload.model_dump(),
                "patient_id": patient_id,
                "source": "CHAT_ASSISTANT",
                "verification_status": "PATIENT_REPORTED",
            })
        case FlagReviewAction():
            return await db.flags.create({
                **action.payload.model_dump(),
                "patient_id": patient_id,
            })
        case RequestDocumentAction():
            return await db.document_requests.create({
                **action.payload.model_dump(),
                "patient_id": patient_id,
            })
        case _:
            raise ValueError(f"Unhandled action type: {type(action)}")
