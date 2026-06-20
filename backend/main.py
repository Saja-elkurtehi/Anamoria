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
from routers.patient import patient_router
from routers.physician import physician_router
from services.agent import stats as agent_stats

import logging
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.initialize()
    await db.seed_demo_data()
    logger.info("Demo patient token: %s", db.DEMO_PATIENT_ID if hasattr(db, 'DEMO_PATIENT_ID') else 'pat-001')
    logger.info("Demo physician token: %s", db.DEMO_PHYSICIAN_ID if hasattr(db, 'DEMO_PHYSICIAN_ID') else 'phys-001')
    yield


app = FastAPI(title="Anamoria", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(actions_router)
app.include_router(documents_router)
app.include_router(patient_router)
app.include_router(physician_router)


@app.get("/debug/stats")
def debug_stats():
    return agent_stats
