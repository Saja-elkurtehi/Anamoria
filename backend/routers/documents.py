from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from auth import get_current_patient
from db import db
from services.document_extractor import extract_text

documents_router = APIRouter(prefix="/documents")

MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@documents_router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    patient: dict = Depends(get_current_patient),
):
    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    try:
        extracted_text = await extract_text(file.filename or "upload", content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    doc = await db.documents.create({
        "patient_id": patient["id"],
        "filename": file.filename or "upload",
        "extracted_text": extracted_text,
    })
    # Don't return extracted_text — it can be huge
    return {"id": doc["id"], "filename": doc["filename"], "created_at": doc.get("created_at")}


@documents_router.get("")
async def list_documents(patient: dict = Depends(get_current_patient)):
    docs = await db.documents.find(patient_id=patient["id"])
    return [
        {"id": d["id"], "filename": d["filename"], "created_at": d.get("created_at")}
        for d in docs
    ]
