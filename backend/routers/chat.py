from fastapi import APIRouter, Depends

from auth import get_current_patient
from models.actions import AgentResponse, ChatRequest
from services.agent import run_agent

chat_router = APIRouter()


@chat_router.post("/chat", response_model=AgentResponse)
async def chat(
    req: ChatRequest,
    patient: dict = Depends(get_current_patient),
):
    return await run_agent(patient, req)
