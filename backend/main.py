from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

import logging_config  # noqa: E402
logging_config.setup()

from db import db  # noqa: E402
from routers.actions import actions_router
from routers.chat import chat_router
from routers.documents import documents_router
from services.agent import stats as agent_stats

import logging
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.initialize()
    demo_id = await db.seed_demo_patient()
    logger.info("Demo patient ID (use as Bearer token): %s", demo_id)
    yield


app = FastAPI(title="Anamoria", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(actions_router)
app.include_router(documents_router)


@app.get("/debug/stats")
def debug_stats():
    return agent_stats
