from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth import get_current_patient
from models.actions import SuggestedAction
from services.action_registry import apply_action

actions_router = APIRouter()


class ApplyActionRequest(BaseModel):
    action: SuggestedAction


@actions_router.post("/actions/apply")
async def apply(
    req: ApplyActionRequest,
    patient: dict = Depends(get_current_patient),
):
    # Revalidate before writing — guards against malformed or tampered payloads
    SuggestedAction.model_validate(req.action.model_dump())
    record = await apply_action(req.action, patient["id"])
    return {"record": record}
