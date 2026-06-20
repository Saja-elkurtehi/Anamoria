from fastapi import Header, HTTPException

from db import db


async def get_current_patient(authorization: str = Header(...)) -> dict:
    """Resolves patient from Bearer <patient_id> token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    patient_id = authorization.removeprefix("Bearer ").strip()
    patient = await db.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
