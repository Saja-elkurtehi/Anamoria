from fastapi import Header, HTTPException

from db import db


async def get_current_user(authorization: str = Header(...)) -> dict:
    """Resolves patient or physician from Bearer <id> token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.removeprefix("Bearer ").strip()

    patient = await db.get_patient(token)
    if patient:
        return {**patient, "role": "patient"}

    physician = await db.get_physician(token)
    if physician:
        return {**physician, "role": "physician"}

    raise HTTPException(status_code=404, detail="User not found")


async def get_current_patient(authorization: str = Header(...)) -> dict:
    user = await get_current_user(authorization)
    if user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Patient access required")
    return user


async def get_current_physician(authorization: str = Header(...)) -> dict:
    user = await get_current_user(authorization)
    if user.get("role") != "physician":
        raise HTTPException(status_code=403, detail="Physician access required")
    return user
