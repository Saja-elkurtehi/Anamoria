import logging
import os
import time

import cohere
import instructor
from tenacity import Retrying, stop_after_attempt, wait_none

from models.actions import AgentResponse, ChatRequest
from services.context_engine import build_context

logger = logging.getLogger(__name__)

_cohere_client = cohere.ClientV2(api_key=os.environ["COHERE_API_KEY"])
_client = instructor.from_cohere(_cohere_client, mode=instructor.Mode.COHERE_TOOLS)

# Lifetime counters — reset on process restart
stats = {"calls": 0, "validation_failures": 0, "hard_failures": 0}


def _verbose() -> bool:
    return os.getenv("VERBOSE", "0") == "1"


def _make_retry(call_id: int) -> Retrying:
    def _after(retry_state):
        stats["validation_failures"] += 1
        if _verbose():
            exc = retry_state.outcome.exception()
            logger.debug(
                "[call #%d] validation failure on attempt %d — %s: %s",
                call_id,
                retry_state.attempt_number,
                type(exc).__name__,
                exc,
            )

    return Retrying(
        stop=stop_after_attempt(3),
        wait=wait_none(),
        after=_after,
        reraise=True,
    )


async def run_agent(patient: dict, req: ChatRequest) -> AgentResponse:
    system_prompt, messages = await build_context(
        patient, req.history, req.pending_actions
    )

    stats["calls"] += 1
    call_id = stats["calls"]
    verbose = _verbose()

    if verbose:
        divider = "─" * 72
        logger.debug(divider)
        logger.debug("[call #%d] SYSTEM PROMPT", call_id)
        logger.debug("%s", system_prompt)
        logger.debug(divider)
        logger.debug("[call #%d] MESSAGES (%d)", call_id, len(messages))
        for i, m in enumerate(messages):
            logger.debug("  [%d] %s: %s", i, m["role"].upper(), m["content"])
        logger.debug(divider)

    t0 = time.perf_counter()
    try:
        response: AgentResponse = _client.chat.completions.create(
            model="command-a-plus-05-2026",
            response_model=AgentResponse,
            max_retries=_make_retry(call_id),
            messages=[
                {"role": "system", "content": system_prompt},
                *messages,
            ],
        )
    except Exception as exc:
        stats["hard_failures"] += 1
        logger.error("[call #%d] hard failure after all retries: %s", call_id, exc)
        raise
    finally:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.info(
            "[call #%d] %.0f ms | calls=%d  val_failures=%d  hard_failures=%d",
            call_id,
            elapsed_ms,
            stats["calls"],
            stats["validation_failures"],
            stats["hard_failures"],
        )

    if verbose:
        logger.debug("[call #%d] RESPONSE", call_id)
        logger.debug("  message     : %s", response.message)
        logger.debug("  actions     : %s", response.actions)
        logger.debug("  expires_ids : %s", response.expires_action_ids)

    return response
