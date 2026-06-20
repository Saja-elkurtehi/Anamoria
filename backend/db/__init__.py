import json
import uuid
from pathlib import Path
from types import SimpleNamespace

import aiosqlite

DB_PATH = Path(__file__).parent.parent / "anamoria.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    record TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS symptoms (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    severity TEXT NOT NULL,
    onset TEXT NOT NULL,
    notes TEXT,
    source TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS conditions (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icd10 TEXT,
    date_onset TEXT,
    source TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS medications (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    dose TEXT,
    frequency TEXT,
    source TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS flags (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    record_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS document_requests (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    document_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    extracted_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

_DEMO_PATIENT_RECORD = {
    "conditions": [
        {"name": "Type 2 Diabetes", "since": "2019", "verified": True}
    ],
    "medications": [
        {"name": "Metformin", "dose": "500mg", "frequency": "twice daily"}
    ],
    "symptoms": [],
    "allergies": ["Penicillin"],
}


class Collection:
    def __init__(self, table: str):
        self.table = table

    async def create(self, data: dict) -> dict:
        row = {"id": str(uuid.uuid4()), **data}
        cols = ", ".join(row.keys())
        placeholders = ", ".join("?" for _ in row)
        async with aiosqlite.connect(DB_PATH) as conn:
            await conn.execute(
                f"INSERT INTO {self.table} ({cols}) VALUES ({placeholders})",
                list(row.values()),
            )
            await conn.commit()
        return row

    async def find(self, **filters) -> list[dict]:
        where = " AND ".join(f"{k} = ?" for k in filters)
        clause = f"WHERE {where}" if where else ""
        async with aiosqlite.connect(DB_PATH) as conn:
            conn.row_factory = aiosqlite.Row
            async with conn.execute(
                f"SELECT * FROM {self.table} {clause}", list(filters.values())
            ) as cur:
                rows = await cur.fetchall()
        return [dict(r) for r in rows]

    async def get_by_id(self, id: str) -> dict | None:
        async with aiosqlite.connect(DB_PATH) as conn:
            conn.row_factory = aiosqlite.Row
            async with conn.execute(
                f"SELECT * FROM {self.table} WHERE id = ?", [id]
            ) as cur:
                row = await cur.fetchone()
        return dict(row) if row else None


class DocumentCollection(Collection):
    async def find(self, **filters) -> list[SimpleNamespace]:
        rows = await super().find(**filters)
        return [SimpleNamespace(**r) for r in rows]


class Database:
    def __init__(self):
        self.symptoms = Collection("symptoms")
        self.conditions = Collection("conditions")
        self.medications = Collection("medications")
        self.flags = Collection("flags")
        self.document_requests = Collection("document_requests")
        self.documents = DocumentCollection("documents")
        self._patients = Collection("patients")

    async def initialize(self):
        async with aiosqlite.connect(DB_PATH) as conn:
            await conn.executescript(_SCHEMA)
            await conn.commit()

    async def get_patient(self, patient_id: str) -> dict | None:
        row = await self._patients.get_by_id(patient_id)
        if row and isinstance(row.get("record"), str):
            row["record"] = json.loads(row["record"])
        return row

    async def seed_demo_patient(self) -> str:
        existing = await self._patients.find()
        if existing:
            row = existing[0]
            if isinstance(row.get("record"), str):
                row["record"] = json.loads(row["record"])
            return row["id"]

        patient_id = str(uuid.uuid4())
        async with aiosqlite.connect(DB_PATH) as conn:
            await conn.execute(
                "INSERT INTO patients (id, name, record) VALUES (?, ?, ?)",
                [patient_id, "Jane Smith", json.dumps(_DEMO_PATIENT_RECORD)],
            )
            await conn.commit()
        return patient_id


db = Database()
