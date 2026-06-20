import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_physician
from db import db

physician_router = APIRouter(prefix="/physician")


@physician_router.get("/patients")
async def get_patients(physician: dict = Depends(get_current_physician)):
    return await db.get_physician_patient_summaries(physician["id"])


@physician_router.get("/patients/{patient_id}")
async def get_patient_detail(
    patient_id: str, physician: dict = Depends(get_current_physician)
):
    patient = await db.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    profile = patient.get("profile") or {}
    timeline = await db.get_timeline_nodes(patient_id)
    documents = await db.get_patient_documents(patient_id)
    access_requests = await db.get_access_requests(patient_id)

    return {
        "patient": {"patientId": patient["id"], "name": patient["name"], **profile},
        "timeline": timeline,
        "documents": documents,
        "accessRequests": access_requests,
    }


@physician_router.post("/patients/{patient_id}/timeline")
async def add_physician_timeline_node(
    patient_id: str,
    node: dict,
    physician: dict = Depends(get_current_physician),
):
    patient = await db.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    node["patientId"] = patient_id
    node["contributorName"] = physician["name"]
    node["contributorRole"] = "PHYSICIAN"
    if not node.get("nodeId"):
        node["nodeId"] = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    node.setdefault("createdAt", now)
    node["updatedAt"] = now
    node.setdefault("physicianNotes", [])
    node.setdefault("sourceType", "PHYSICIAN_CONTRIBUTION")
    node.setdefault("verificationStatus", "VERIFIED_BY_PHYSICIAN")
    node.setdefault("confidenceLevel", "HIGH")

    return await db.add_timeline_node(node)
