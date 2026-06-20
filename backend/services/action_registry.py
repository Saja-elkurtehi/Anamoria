import uuid
from datetime import datetime, timezone

from db import db
from models.actions import (
    AddConditionAction,
    AddMedicationAction,
    AddSymptomAction,
    FlagReviewAction,
    RequestDocumentAction,
    SuggestedAction,
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def apply_action(action: SuggestedAction, patient_id: str) -> dict:
    match action:
        case AddSymptomAction():
            now = _now()
            node_id = str(uuid.uuid4())
            onset = action.payload.onset or now[:10]
            node = {
                "nodeId": node_id,
                "patientId": patient_id,
                "type": "PATIENT_SYMPTOM",
                "title": action.payload.name,
                "summary": (
                    f"Patient-reported via assistant: {action.payload.name}. "
                    f"Severity: {action.payload.severity}."
                ),
                "eventDate": onset if len(onset) == 10 else now[:10],
                "datePrecision": "APPROXIMATE",
                "sourceType": "CHAT_ASSISTANT",
                "verificationStatus": "NEEDS_REVIEW",
                "confidenceLevel": "LOW",
                "contributorName": "Patient (via assistant)",
                "contributorRole": "PATIENT",
                "relatedDocumentIds": [],
                "relatedNodeIds": [],
                "tags": ["symptom", "chat-reported", "unreviewed"],
                "details": {
                    "symptomName": action.payload.name,
                    "onsetDate": onset,
                    "severity": action.payload.severity.upper(),
                    "frequency": "",
                    "duration": "",
                    "status": "ONGOING",
                    "description": action.payload.notes or "",
                    "triggers": "",
                    "relievingFactors": "",
                    "associatedSymptoms": [],
                    "patientNotes": action.payload.notes or "",
                    "doctorReviewed": False,
                    "clarificationNeeded": True,
                },
                "physicianNotes": [],
                "createdAt": now,
                "updatedAt": now,
            }
            await db.add_timeline_node(node)

            # Keep legacy table for context engine
            await db.symptoms.create({
                **action.payload.model_dump(),
                "patient_id": patient_id,
                "source": "CHAT_ASSISTANT",
                "verification_status": "PATIENT_REPORTED",
            })

            # Update patient record so the AI sees this symptom in future turns
            patient = await db.get_patient(patient_id)
            if patient:
                record = patient.get("record", {})
                symptoms = record.get("symptoms", [])
                symptoms.append({
                    "name": action.payload.name,
                    "severity": action.payload.severity,
                    "onset": onset,
                    "notes": action.payload.notes,
                })
                record["symptoms"] = symptoms
                await db.update_patient_record(patient_id, record)

            return node

        case AddConditionAction():
            now = _now()
            node_id = str(uuid.uuid4())
            node = {
                "nodeId": node_id,
                "patientId": patient_id,
                "type": "PATIENT_HISTORY",
                "title": action.payload.name,
                "summary": f"Condition reported via assistant: {action.payload.name}.",
                "eventDate": (action.payload.date_onset or now[:10])[:10],
                "datePrecision": "APPROXIMATE",
                "sourceType": "CHAT_ASSISTANT",
                "verificationStatus": "NEEDS_REVIEW",
                "confidenceLevel": "LOW",
                "contributorName": "Patient (via assistant)",
                "contributorRole": "PATIENT",
                "relatedDocumentIds": [],
                "relatedNodeIds": [],
                "tags": ["condition", "chat-reported"],
                "details": {
                    "category": "CONDITION",
                    "patientStatement": action.payload.name,
                    "approximateDate": action.payload.date_onset or "",
                    "confirmedByPatient": True,
                    "confirmedByPhysician": False,
                    "confirmedByEMR": False,
                    "matchingRecordIds": [],
                    "clarificationNeeded": True,
                },
                "physicianNotes": [],
                "createdAt": now,
                "updatedAt": now,
            }
            await db.add_timeline_node(node)
            await db.conditions.create({
                **action.payload.model_dump(),
                "patient_id": patient_id,
                "source": "CHAT_ASSISTANT",
                "verification_status": "PATIENT_REPORTED",
            })
            return node

        case AddMedicationAction():
            now = _now()
            node_id = str(uuid.uuid4())
            node = {
                "nodeId": node_id,
                "patientId": patient_id,
                "type": "PATIENT_HISTORY",
                "title": f"Medication: {action.payload.name}",
                "summary": (
                    f"Medication reported via assistant: {action.payload.name} "
                    f"{action.payload.dose or ''} {action.payload.frequency or ''}."
                ).strip(),
                "eventDate": now[:10],
                "datePrecision": "APPROXIMATE",
                "sourceType": "CHAT_ASSISTANT",
                "verificationStatus": "NEEDS_REVIEW",
                "confidenceLevel": "LOW",
                "contributorName": "Patient (via assistant)",
                "contributorRole": "PATIENT",
                "relatedDocumentIds": [],
                "relatedNodeIds": [],
                "tags": ["medication", "chat-reported"],
                "details": {
                    "category": "MEDICATION",
                    "patientStatement": (
                        f"{action.payload.name} {action.payload.dose or ''} {action.payload.frequency or ''}"
                    ).strip(),
                    "approximateDate": now[:10],
                    "confirmedByPatient": True,
                    "confirmedByPhysician": False,
                    "confirmedByEMR": False,
                    "matchingRecordIds": [],
                    "clarificationNeeded": True,
                },
                "physicianNotes": [],
                "createdAt": now,
                "updatedAt": now,
            }
            await db.add_timeline_node(node)
            await db.medications.create({
                **action.payload.model_dump(),
                "patient_id": patient_id,
                "source": "CHAT_ASSISTANT",
                "verification_status": "PATIENT_REPORTED",
            })
            return node

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
