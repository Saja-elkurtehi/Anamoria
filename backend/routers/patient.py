import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_patient
from db import db

patient_router = APIRouter(prefix="/patient")


@patient_router.get("/me")
async def get_me(patient: dict = Depends(get_current_patient)):
    profile = patient.get("profile") or {}
    return {"patientId": patient["id"], "name": patient["name"], **profile}


@patient_router.get("/documents")
async def get_documents(patient: dict = Depends(get_current_patient)):
    return await db.get_patient_documents(patient["id"])


@patient_router.get("/timeline")
async def get_timeline(patient: dict = Depends(get_current_patient)):
    return await db.get_timeline_nodes(patient["id"])


@patient_router.post("/timeline")
async def add_timeline_node(node: dict, patient: dict = Depends(get_current_patient)):
    node["patientId"] = patient["id"]
    if not node.get("nodeId"):
        node["nodeId"] = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    node.setdefault("createdAt", now)
    node["updatedAt"] = now
    node.setdefault("physicianNotes", [])
    return await db.add_timeline_node(node)


@patient_router.get("/access-requests")
async def get_access_requests(patient: dict = Depends(get_current_patient)):
    return await db.get_access_requests(patient["id"])


class RespondBody(BaseModel):
    status: str


@patient_router.post("/access-requests/{request_id}/respond")
async def respond_access_request(
    request_id: str,
    body: RespondBody,
    patient: dict = Depends(get_current_patient),
):
    if body.status not in ("APPROVED", "DENIED"):
        raise HTTPException(status_code=400, detail="status must be APPROVED or DENIED")
    updated = await db.update_access_request_status(request_id, body.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Access request not found")
    return updated
