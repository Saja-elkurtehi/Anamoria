import json
import uuid
from pathlib import Path

import aiosqlite

DB_PATH = Path(__file__).parent.parent / "anamoria.db"

DEMO_PATIENT_ID = "pat-001"
DEMO_PHYSICIAN_ID = "phys-001"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    record TEXT NOT NULL DEFAULT '{}',
    profile TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS physicians (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT,
    clinic TEXT,
    email TEXT
);
CREATE TABLE IF NOT EXISTS timeline_nodes (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    event_date TEXT NOT NULL,
    data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS access_requests (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    physician_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    data TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    extracted_text TEXT,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
"""

# ── Seed data ──────────────────────────────────────────────────────────────────

_DEMO_PATIENT_PROFILE = {
    "dateOfBirth": "March 12, 1998",
    "age": 28,
    "gender": "Female",
    "bloodType": "A+",
    "phone": "+1 (416) 555-0182",
    "email": "layla.hassan@email.com",
    "conditions": ["Asthma", "Atopic Dermatitis (Eczema)"],
    "allergies": ["Penicillin", "Shellfish"],
    "medications": [
        {"name": "Salbutamol (Ventolin) Inhaler", "dose": "100mcg", "frequency": "As needed"},
        {"name": "Cetirizine (Reactine)", "dose": "10mg", "frequency": "Once daily"},
        {"name": "Mometasone Furoate Cream", "dose": "0.1%", "frequency": "Twice daily to affected areas"},
        {"name": "Fluticasone Propionate (Flovent)", "dose": "125mcg", "frequency": "Twice daily"},
    ],
    "familyHistory": [
        {"relationship": "Mother", "conditions": ["Asthma", "Seasonal Allergic Rhinitis"]},
        {"relationship": "Maternal Aunt", "conditions": ["Rheumatoid Arthritis"]},
        {"relationship": "Father", "conditions": ["Type 2 Diabetes", "Hypertension"]},
    ],
    "careTeam": [
        {"name": "Dr. Amir Khan", "specialty": "Dermatology", "clinic": "Riverside Family Health Clinic"},
        {"name": "Dr. Omar Benali", "specialty": "Family Medicine", "clinic": "Riverside Family Health Clinic"},
    ],
    "lastAppointment": "May 4, 2026",
    "lastUpdated": "June 12, 2026",
}

_DEMO_PATIENT_RECORD = {
    "conditions": [
        {"name": "Asthma", "since": "2018", "icd10": "J45.1", "verified": True},
        {"name": "Atopic Dermatitis (Eczema)", "since": "2021", "icd10": "L20.9", "verified": True},
    ],
    "medications": [
        {"name": "Salbutamol (Ventolin) Inhaler", "dose": "100mcg", "frequency": "As needed"},
        {"name": "Cetirizine (Reactine)", "dose": "10mg", "frequency": "Once daily"},
        {"name": "Mometasone Furoate Cream", "dose": "0.1%", "frequency": "Twice daily"},
        {"name": "Fluticasone Propionate (Flovent)", "dose": "125mcg", "frequency": "Twice daily"},
    ],
    "allergies": ["Penicillin", "Shellfish"],
    "symptoms": [],
}

_DEMO_TIMELINE_NODES = [
    {
        "nodeId": "node-001", "patientId": DEMO_PATIENT_ID,
        "type": "PATIENT_HISTORY", "title": "Appendectomy",
        "summary": "Emergency appendectomy at CHEO. Uncomplicated recovery.",
        "eventDate": "2015-08-22", "datePrecision": "EXACT",
        "sourceType": "PATIENT_REPORTED_VERIFIED", "verificationStatus": "VERIFIED_BY_PHYSICIAN",
        "confidenceLevel": "HIGH", "contributorName": "Layla Hassan", "contributorRole": "PATIENT",
        "relatedDocumentIds": [], "relatedNodeIds": [], "tags": ["surgery", "appendix"],
        "details": {
            "category": "SURGERY",
            "patientStatement": "Emergency appendix removal at CHEO, age 17. Surgeon was Dr. Lefebvre. One night hospital stay, full recovery.",
            "approximateDate": "2015-08-22", "confirmedByPatient": True,
            "confirmedByPhysician": True, "confirmedByEMR": False,
            "matchingRecordIds": [], "clarificationNeeded": False,
        },
        "physicianNotes": [], "createdAt": "2024-09-01T00:00:00Z", "updatedAt": "2024-09-01T00:00:00Z",
    },
    {
        "nodeId": "node-002", "patientId": DEMO_PATIENT_ID,
        "type": "PATIENT_HISTORY", "title": "Anaphylactic reaction — shellfish",
        "summary": "Severe anaphylaxis following accidental shellfish ingestion. EpiPen administered. Ottawa General ER.",
        "eventDate": "2017-06-04", "datePrecision": "EXACT",
        "sourceType": "PATIENT_REPORTED", "verificationStatus": "PATIENT_REPORTED_ONLY",
        "confidenceLevel": "MEDIUM", "contributorName": "Layla Hassan", "contributorRole": "PATIENT",
        "relatedDocumentIds": [], "relatedNodeIds": [], "tags": ["allergy", "anaphylaxis", "shellfish", "ER"],
        "details": {
            "category": "HOSPITAL_VISIT",
            "patientStatement": "Severe allergic reaction at a restaurant. Paramedics used an EpiPen. Taken to Ottawa General ER, kept for 4 hours, discharged with prescription for EpiPen and referral to allergist.",
            "approximateDate": "2017-06-04", "confirmedByPatient": True,
            "confirmedByPhysician": False, "confirmedByEMR": False,
            "matchingRecordIds": [], "clarificationNeeded": True,
        },
        "physicianNotes": [], "createdAt": "2024-09-01T00:00:00Z", "updatedAt": "2024-09-01T00:00:00Z",
    },
    {
        "nodeId": "node-003", "patientId": DEMO_PATIENT_ID,
        "type": "EMR_RECORD", "title": "Asthma diagnosis — EMR confirmed",
        "summary": "Moderate persistent asthma confirmed in Riverside Family Health Clinic EMR. Initiated on Salbutamol inhaler.",
        "eventDate": "2018-03-15", "datePrecision": "EXACT",
        "sourceType": "EMR_DATABASE", "verificationStatus": "VERIFIED_BY_EMR",
        "confidenceLevel": "HIGH", "contributorName": "System (EMR import)", "contributorRole": "EMR",
        "relatedDocumentIds": [], "relatedNodeIds": ["node-009"], "tags": ["asthma", "diagnosis", "respiratory"],
        "details": {
            "emrSource": "Riverside Clinic EMR", "organization": "Riverside Family Health Clinic",
            "recordType": "DIAGNOSIS", "originalRecordDate": "2018-03-15",
            "extractedFields": {
                "Diagnosis": "Moderate persistent asthma (J45.1)",
                "Prescribed by": "Dr. Omar Benali, Family Medicine",
                "Treatment": "Salbutamol 100mcg inhaler PRN",
                "Follow-up": "Annual spirometry",
            },
            "clinicianName": "Dr. Omar Benali", "clinicName": "Riverside Family Health Clinic",
            "importDate": "2024-09-01", "matchedPatientReported": True,
        },
        "physicianNotes": [], "createdAt": "2024-09-01T00:00:00Z", "updatedAt": "2024-09-01T00:00:00Z",
    },
    {
        "nodeId": "node-004", "patientId": DEMO_PATIENT_ID,
        "type": "EMR_RECORD", "title": "Atopic dermatitis (eczema) — EMR confirmed",
        "summary": "Atopic dermatitis confirmed by specialist. Referred to dermatology. Cetirizine initiated.",
        "eventDate": "2021-06-15", "datePrecision": "EXACT",
        "sourceType": "EMR_DATABASE", "verificationStatus": "VERIFIED_BY_EMR",
        "confidenceLevel": "HIGH", "contributorName": "System (EMR import)", "contributorRole": "EMR",
        "relatedDocumentIds": [], "relatedNodeIds": [], "tags": ["eczema", "dermatitis", "atopic", "diagnosis"],
        "details": {
            "emrSource": "Riverside Clinic EMR", "organization": "Riverside Family Health Clinic",
            "recordType": "DIAGNOSIS", "originalRecordDate": "2021-06-15",
            "extractedFields": {
                "Diagnosis": "Atopic dermatitis (L20.9)",
                "Prescribed by": "Dr. Sarah Patel, Dermatology",
                "Treatment": "Cetirizine 10mg daily, emollient therapy",
                "Referral": "Dermatology — Riverside",
            },
            "clinicianName": "Dr. Sarah Patel", "clinicName": "Riverside Dermatology",
            "importDate": "2024-09-01", "matchedPatientReported": True,
        },
        "physicianNotes": [], "createdAt": "2024-09-01T00:00:00Z", "updatedAt": "2024-09-01T00:00:00Z",
    },
    {
        "nodeId": "node-005", "patientId": DEMO_PATIENT_ID,
        "type": "REQUISITION", "title": "Spirometry requisition — pulmonary function",
        "summary": "Annual spirometry ordered by Dr. Benali. Mild obstructive pattern consistent with controlled asthma.",
        "eventDate": "2023-03-20", "datePrecision": "EXACT",
        "sourceType": "PHYSICIAN_CONTRIBUTION", "verificationStatus": "VERIFIED_BY_PHYSICIAN",
        "confidenceLevel": "HIGH", "contributorName": "Dr. Omar Benali", "contributorRole": "PHYSICIAN",
        "relatedDocumentIds": ["doc-003"], "relatedNodeIds": ["node-003"],
        "tags": ["spirometry", "asthma", "lung function"],
        "details": {
            "requisitionType": "LAB", "orderingPhysician": "Dr. Omar Benali",
            "orderingClinic": "Riverside Family Health Clinic",
            "reasonForOrder": "Annual asthma monitoring. Assess lung function trend.",
            "testsOrdered": ["Spirometry — FEV1, FVC, FEV1/FVC ratio", "Bronchodilator reversibility test"],
            "priority": "ROUTINE", "requisitionStatus": "COMPLETED",
            "followUpNeeded": False, "followUpInstructions": "Review in one year. No significant change from 2022.",
        },
        "physicianNotes": [], "createdAt": "2023-03-20T10:00:00Z", "updatedAt": "2023-03-20T10:00:00Z",
    },
    {
        "nodeId": "node-006", "patientId": DEMO_PATIENT_ID,
        "type": "UPLOADED_DOCUMENT", "title": "LifeLabs blood panel — Sept 2024",
        "summary": "CBC and total IgE results. WBC mildly elevated. IgE significantly elevated at 380 IU/mL.",
        "eventDate": "2024-09-15", "datePrecision": "EXACT",
        "sourceType": "UPLOADED_RECORD", "verificationStatus": "REVIEWED_NOT_VERIFIED",
        "confidenceLevel": "HIGH", "contributorName": "Layla Hassan", "contributorRole": "PATIENT",
        "relatedDocumentIds": ["doc-001"], "relatedNodeIds": [], "tags": ["lab", "bloodwork", "IgE", "CBC"],
        "details": {
            "documentId": "doc-001", "fileName": "LifeLabs_Sept2024_BloodPanel.pdf",
            "documentType": "LAB_REPORT", "uploadedBy": "Layla Hassan",
            "uploadedAt": "2024-09-20T10:30:00Z", "documentDate": "2024-09-15",
            "issuingOrganization": "LifeLabs Ottawa", "extractionStatus": "EXTRACTED",
            "extractedItems": {
                "findings": ["WBC 11.2 x10⁹/L (H)", "Total IgE 380 IU/mL (H, ref <100)", "Eosinophils 0.6 x10⁹/L (H)"],
                "doctors": ["Dr. Omar Benali"],
                "followUp": ["Repeat CBC in 3 months", "IgE elevation — consider allergy workup"],
            },
            "supportedNodeIds": [],
        },
        "physicianNotes": [
            {
                "noteId": "pnote-001", "physicianId": DEMO_PHYSICIAN_ID,
                "physicianName": "Dr. Amir Khan", "specialty": "Dermatology",
                "content": "IgE elevation consistent with atopic presentation. Eosinophilia mildly elevated — correlates with active eczema flare. Will repeat CBC in 3 months. Does not change current management.",
                "noteType": "NOTE", "createdAt": "2024-10-10T15:30:00Z",
            }
        ],
        "createdAt": "2024-09-20T10:30:00Z", "updatedAt": "2024-10-10T15:30:00Z",
    },
    {
        "nodeId": "node-007", "patientId": DEMO_PATIENT_ID,
        "type": "PHYSICIAN_ENTERED", "title": "Dermatology consultation — Dr. Amir Khan",
        "summary": "Atopic dermatitis flare with lichenification on forearms. Positive dust mite scratch test. Mometasone initiated.",
        "eventDate": "2024-10-10", "datePrecision": "EXACT",
        "sourceType": "PHYSICIAN_CONTRIBUTION", "verificationStatus": "VERIFIED_BY_PHYSICIAN",
        "confidenceLevel": "HIGH", "contributorName": "Dr. Amir Khan", "contributorRole": "PHYSICIAN",
        "relatedDocumentIds": ["doc-002"], "relatedNodeIds": ["node-004", "node-006"],
        "tags": ["eczema", "dermatology", "mometasone", "consultation"],
        "details": {
            "entryType": "VISIT_SUMMARY", "physicianName": "Dr. Amir Khan",
            "specialty": "Dermatology", "clinic": "Riverside Family Health Clinic",
            "note": "Patient presenting with worsening atopic dermatitis on bilateral forearms and behind knees. Lichenification noted. Positive scratch test to house dust mite (Dermatophagoides pteronyssinus). Elevated IgE consistent with atopic triad.",
            "assessment": "Moderate atopic dermatitis flare. Dust mite sensitization confirmed. IgE elevated (see recent bloodwork). Consider dupilumab if insufficient response to current topical therapy.",
            "linkedSymptomIds": [], "linkedRecordIds": ["doc-002"], "linkedRequisitionIds": [],
            "changesMade": "Started Mometasone Furoate 0.1% cream BID. Continued Cetirizine 10mg daily.",
            "followUpPlan": "Review in 6 weeks. If no improvement, refer for dupilumab assessment.",
        },
        "physicianNotes": [], "createdAt": "2024-10-10T16:00:00Z", "updatedAt": "2024-10-10T16:00:00Z",
    },
    {
        "nodeId": "node-008", "patientId": DEMO_PATIENT_ID,
        "type": "PHYSICIAN_ENTERED", "title": "Follow-up visit — Dr. Khan (May 4, 2026)",
        "summary": "Dermatology follow-up. Eczema moderately controlled. Asthma stable. Continue current medications.",
        "eventDate": "2026-05-04", "datePrecision": "EXACT",
        "sourceType": "PHYSICIAN_CONTRIBUTION", "verificationStatus": "VERIFIED_BY_PHYSICIAN",
        "confidenceLevel": "HIGH", "contributorName": "Dr. Amir Khan", "contributorRole": "PHYSICIAN",
        "relatedDocumentIds": [], "relatedNodeIds": ["node-007"],
        "tags": ["follow-up", "dermatology", "eczema", "asthma"],
        "details": {
            "entryType": "VISIT_SUMMARY", "physicianName": "Dr. Amir Khan",
            "specialty": "Dermatology", "clinic": "Riverside Family Health Clinic",
            "note": "Patient reports moderate improvement since starting Mometasone. Forearm lesions partially resolved but still active behind knees. Asthma appears stable — using Ventolin ~2x/week.",
            "assessment": "Partially controlled atopic dermatitis. Asthma clinically stable. No respiratory complaints today.",
            "linkedSymptomIds": [], "linkedRecordIds": [], "linkedRequisitionIds": [],
            "changesMade": "No medication changes. Continue Mometasone BID.",
            "followUpPlan": "Return in 6–8 weeks or sooner if respiratory symptoms worsen. Order allergy bloodwork panel.",
        },
        "physicianNotes": [], "createdAt": "2026-05-04T14:00:00Z", "updatedAt": "2026-05-04T14:00:00Z",
    },
    {
        "nodeId": "node-009", "patientId": DEMO_PATIENT_ID,
        "type": "PATIENT_SYMPTOM", "title": "Shortness of breath after exercise",
        "summary": "Patient reports intermittent dyspnoea during moderate exercise. Occurs 2–3× per week. Relieved by Ventolin.",
        "eventDate": "2026-06-12", "datePrecision": "EXACT",
        "sourceType": "PATIENT_REPORTED", "verificationStatus": "NEEDS_REVIEW",
        "confidenceLevel": "LOW", "contributorName": "Layla Hassan", "contributorRole": "PATIENT",
        "relatedDocumentIds": [], "relatedNodeIds": ["node-003"],
        "tags": ["dyspnoea", "asthma", "exercise", "respiratory"],
        "details": {
            "symptomName": "Shortness of breath after exercise",
            "onsetDate": "2026-06-01", "severity": "MODERATE",
            "frequency": "2–3 times per week", "duration": "Approximately 10–15 minutes per episode",
            "status": "ONGOING",
            "description": "Shortness of breath and chest tightness that occurs during moderate physical activity (brisk walking, climbing stairs). Eases within 10–15 minutes with rest or Ventolin use.",
            "triggers": "Exercise, cold air, occasionally humidity",
            "relievingFactors": "Rest, Salbutamol inhaler",
            "associatedSymptoms": ["Mild chest tightness", "Occasional dry cough"],
            "patientNotes": "Feels like my asthma is flaring up more than usual. Last month it was much better. Not sure if it is related to pollen season.",
            "doctorReviewed": False, "clarificationNeeded": True,
        },
        "physicianNotes": [], "createdAt": "2026-06-12T09:00:00Z", "updatedAt": "2026-06-12T09:00:00Z",
    },
]

_DEMO_DOCUMENTS = [
    {
        "id": "doc-001", "patient_id": DEMO_PATIENT_ID,
        "filename": "LifeLabs_Sept2024_BloodPanel.pdf",
        "extracted_text": "CBC and total IgE panel. WBC 11.2 x10⁹/L (H). Total IgE 380 IU/mL (H). Eosinophils 0.6 x10⁹/L (H). Ordered by Dr. Omar Benali.",
        "metadata": json.dumps({
            "documentId": "doc-001", "patientId": DEMO_PATIENT_ID,
            "fileName": "LifeLabs_Sept2024_BloodPanel.pdf", "documentType": "Lab Results",
            "uploadedBy": "Layla Hassan", "uploadedAt": "2024-09-20T10:30:00Z",
            "documentDate": "2024-09-15", "issuingOrganization": "LifeLabs Ottawa",
            "extractionStatus": "EXTRACTED",
            "extractedItems": {
                "findings": ["WBC 11.2 x10⁹/L (H)", "Total IgE 380 IU/mL (H)", "Eosinophils 0.6 (H)"],
                "doctors": ["Dr. Omar Benali"],
            },
            "linkedNodeIds": ["node-006"],
        }),
    },
    {
        "id": "doc-002", "patient_id": DEMO_PATIENT_ID,
        "filename": "DermatologyConsult_AK_Oct2024.pdf",
        "extracted_text": "Dermatology consultation. Atopic dermatitis flare. Lichenification bilateral forearms. Positive dust mite scratch test. Started Mometasone Furoate 0.1% cream BID.",
        "metadata": json.dumps({
            "documentId": "doc-002", "patientId": DEMO_PATIENT_ID,
            "fileName": "DermatologyConsult_AK_Oct2024.pdf", "documentType": "Specialist Consultation",
            "uploadedBy": "Dr. Amir Khan", "uploadedAt": "2024-10-15T14:00:00Z",
            "documentDate": "2024-10-10", "issuingOrganization": "Riverside Family Health Clinic",
            "extractionStatus": "EXTRACTED",
            "extractedItems": {
                "conditions": ["Atopic Dermatitis"],
                "medications": ["Mometasone Furoate 0.1%"],
                "findings": ["Lichenification bilateral forearms", "Positive dust mite scratch test"],
                "followUp": ["Review in 6 weeks", "Consider dupilumab if no improvement"],
            },
            "linkedNodeIds": ["node-007"],
        }),
    },
    {
        "id": "doc-003", "patient_id": DEMO_PATIENT_ID,
        "filename": "Spirometry_March2023.pdf",
        "extracted_text": "Pulmonary function test. FEV1/FVC 0.72. Mild obstructive pattern. Reversibility: +12% post-bronchodilator.",
        "metadata": json.dumps({
            "documentId": "doc-003", "patientId": DEMO_PATIENT_ID,
            "fileName": "Spirometry_March2023.pdf", "documentType": "Pulmonary Function Test",
            "uploadedBy": "Layla Hassan", "uploadedAt": "2023-03-25T09:00:00Z",
            "documentDate": "2023-03-20", "issuingOrganization": "Riverside Family Health Clinic",
            "extractionStatus": "EXTRACTED",
            "extractedItems": {
                "findings": ["FEV1/FVC 0.72", "Mild obstructive pattern", "Reversibility: +12% post-bronchodilator"],
                "doctors": ["Dr. Omar Benali"],
            },
            "linkedNodeIds": ["node-005"],
        }),
    },
]

_DEMO_ACCESS_REQUESTS = [
    {
        "id": "req-001", "patient_id": DEMO_PATIENT_ID, "physician_id": DEMO_PHYSICIAN_ID,
        "status": "APPROVED",
        "data": json.dumps({
            "requestId": "req-001", "patientId": DEMO_PATIENT_ID, "physicianId": DEMO_PHYSICIAN_ID,
            "physicianName": "Dr. Amir Khan", "specialty": "Dermatology",
            "clinic": "Riverside Family Health Clinic", "requestedAt": "2024-09-28T09:00:00Z",
            "status": "APPROVED",
            "permissions": ["View timeline", "View documents", "Add physician notes", "Verify information", "Generate referral packet"],
            "respondedAt": "2024-09-29T10:30:00Z",
        }),
    },
    {
        "id": "req-002", "patient_id": DEMO_PATIENT_ID, "physician_id": "phys-002",
        "status": "PENDING",
        "data": json.dumps({
            "requestId": "req-002", "patientId": DEMO_PATIENT_ID, "physicianId": "phys-002",
            "physicianName": "Dr. Priya Mehta", "specialty": "Pulmonology",
            "clinic": "Ottawa Lung Centre", "requestedAt": "2026-06-18T14:00:00Z",
            "status": "PENDING", "permissions": ["View timeline", "View documents"],
        }),
    },
]


# ── Collection helpers ─────────────────────────────────────────────────────────

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
    async def find(self, **filters):
        rows = await super().find(**filters)
        # Expose extracted_text as an attribute for context_engine compatibility
        from types import SimpleNamespace
        return [SimpleNamespace(**r) for r in rows]


# ── Database ───────────────────────────────────────────────────────────────────

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
            # Add profile column if this is an older DB without it
            try:
                await conn.execute("ALTER TABLE patients ADD COLUMN profile TEXT DEFAULT '{}'")
            except Exception:
                pass
            # Add metadata column to documents if missing
            try:
                await conn.execute("ALTER TABLE documents ADD COLUMN metadata TEXT DEFAULT '{}'")
            except Exception:
                pass
            await conn.commit()

    async def seed_demo_data(self) -> None:
        existing = await self.get_patient(DEMO_PATIENT_ID)
        if existing:
            return  # Already seeded

        async with aiosqlite.connect(DB_PATH) as conn:
            # Patient
            await conn.execute(
                "INSERT INTO patients (id, name, record, profile) VALUES (?, ?, ?, ?)",
                [DEMO_PATIENT_ID, "Layla Hassan",
                 json.dumps(_DEMO_PATIENT_RECORD),
                 json.dumps(_DEMO_PATIENT_PROFILE)],
            )
            # Physician
            await conn.execute(
                "INSERT INTO physicians (id, name, specialty, clinic, email) VALUES (?, ?, ?, ?, ?)",
                [DEMO_PHYSICIAN_ID, "Dr. Amir Khan", "Dermatology",
                 "Riverside Family Health Clinic", "a.khan@riverside.ca"],
            )
            # Timeline nodes
            for node in _DEMO_TIMELINE_NODES:
                await conn.execute(
                    "INSERT INTO timeline_nodes (id, patient_id, event_date, data) VALUES (?, ?, ?, ?)",
                    [node["nodeId"], node["patientId"], node["eventDate"], json.dumps(node)],
                )
            # Documents
            for doc in _DEMO_DOCUMENTS:
                await conn.execute(
                    "INSERT INTO documents (id, patient_id, filename, extracted_text, metadata) VALUES (?, ?, ?, ?, ?)",
                    [doc["id"], doc["patient_id"], doc["filename"],
                     doc.get("extracted_text"), doc.get("metadata", "{}")],
                )
            # Access requests
            for req in _DEMO_ACCESS_REQUESTS:
                await conn.execute(
                    "INSERT INTO access_requests (id, patient_id, physician_id, status, data) VALUES (?, ?, ?, ?, ?)",
                    [req["id"], req["patient_id"], req["physician_id"], req["status"], req["data"]],
                )
            await conn.commit()

    # ── Patient ────────────────────────────────────────────────────────────────

    async def get_patient(self, patient_id: str) -> dict | None:
        row = await self._patients.get_by_id(patient_id)
        if not row:
            return None
        if isinstance(row.get("record"), str):
            row["record"] = json.loads(row["record"])
        if isinstance(row.get("profile"), str):
            row["profile"] = json.loads(row["profile"])
        return row

    async def update_patient_record(self, patient_id: str, record: dict) -> None:
        async with aiosqlite.connect(DB_PATH) as conn:
            await conn.execute(
                "UPDATE patients SET record = ? WHERE id = ?",
                [json.dumps(record), patient_id],
            )
            await conn.commit()

    # ── Physician ──────────────────────────────────────────────────────────────

    async def get_physician(self, physician_id: str) -> dict | None:
        async with aiosqlite.connect(DB_PATH) as conn:
            conn.row_factory = aiosqlite.Row
            async with conn.execute(
                "SELECT * FROM physicians WHERE id = ?", [physician_id]
            ) as cur:
                row = await cur.fetchone()
        return dict(row) if row else None

    # ── Timeline nodes ─────────────────────────────────────────────────────────

    async def get_timeline_nodes(self, patient_id: str) -> list[dict]:
        async with aiosqlite.connect(DB_PATH) as conn:
            conn.row_factory = aiosqlite.Row
            async with conn.execute(
                "SELECT data FROM timeline_nodes WHERE patient_id = ? ORDER BY event_date DESC",
                [patient_id],
            ) as cur:
                rows = await cur.fetchall()
        return [json.loads(row["data"]) for row in rows]

    async def add_timeline_node(self, node: dict) -> dict:
        async with aiosqlite.connect(DB_PATH) as conn:
            await conn.execute(
                "INSERT OR REPLACE INTO timeline_nodes (id, patient_id, event_date, data) VALUES (?, ?, ?, ?)",
                [node["nodeId"], node["patientId"], node["eventDate"], json.dumps(node)],
            )
            await conn.commit()
        return node

    async def update_timeline_node(self, node_id: str, updates: dict) -> dict | None:
        async with aiosqlite.connect(DB_PATH) as conn:
            conn.row_factory = aiosqlite.Row
            async with conn.execute(
                "SELECT data FROM timeline_nodes WHERE id = ?", [node_id]
            ) as cur:
                row = await cur.fetchone()
            if not row:
                return None
            node = json.loads(row["data"])
            node.update(updates)
            await conn.execute(
                "UPDATE timeline_nodes SET data = ? WHERE id = ?",
                [json.dumps(node), node_id],
            )
            await conn.commit()
        return node

    # ── Access requests ────────────────────────────────────────────────────────

    async def get_access_requests(self, patient_id: str) -> list[dict]:
        async with aiosqlite.connect(DB_PATH) as conn:
            conn.row_factory = aiosqlite.Row
            async with conn.execute(
                "SELECT data, status FROM access_requests WHERE patient_id = ?",
                [patient_id],
            ) as cur:
                rows = await cur.fetchall()
        result = []
        for row in rows:
            req = json.loads(row["data"])
            req["status"] = row["status"]  # always return live status
            result.append(req)
        return result

    async def update_access_request_status(self, request_id: str, status: str) -> dict | None:
        from datetime import datetime, timezone
        responded_at = datetime.now(timezone.utc).isoformat()
        async with aiosqlite.connect(DB_PATH) as conn:
            conn.row_factory = aiosqlite.Row
            async with conn.execute(
                "SELECT data FROM access_requests WHERE id = ?", [request_id]
            ) as cur:
                row = await cur.fetchone()
            if not row:
                return None
            req = json.loads(row["data"])
            req["status"] = status
            req["respondedAt"] = responded_at
            await conn.execute(
                "UPDATE access_requests SET status = ?, data = ? WHERE id = ?",
                [status, json.dumps(req), request_id],
            )
            await conn.commit()
        return req

    # ── Documents (rich format for frontend) ───────────────────────────────────

    async def get_patient_documents(self, patient_id: str) -> list[dict]:
        async with aiosqlite.connect(DB_PATH) as conn:
            conn.row_factory = aiosqlite.Row
            async with conn.execute(
                "SELECT id, filename, metadata, created_at FROM documents WHERE patient_id = ? ORDER BY created_at DESC",
                [patient_id],
            ) as cur:
                rows = await cur.fetchall()
        result = []
        for row in rows:
            if row["metadata"] and row["metadata"] != "{}":
                doc = json.loads(row["metadata"])
            else:
                doc = {
                    "documentId": row["id"],
                    "patientId": patient_id,
                    "fileName": row["filename"],
                    "documentType": "Other",
                    "uploadedBy": "Patient",
                    "uploadedAt": row["created_at"] or "",
                    "extractionStatus": "EXTRACTED",
                    "extractedItems": {},
                    "linkedNodeIds": [],
                }
            result.append(doc)
        return result

    async def add_document_with_metadata(
        self, patient_id: str, filename: str, extracted_text: str | None, metadata: dict
    ) -> dict:
        doc_id = str(uuid.uuid4())
        metadata["documentId"] = doc_id
        metadata["patientId"] = patient_id
        metadata["fileName"] = filename
        async with aiosqlite.connect(DB_PATH) as conn:
            await conn.execute(
                "INSERT INTO documents (id, patient_id, filename, extracted_text, metadata) VALUES (?, ?, ?, ?, ?)",
                [doc_id, patient_id, filename, extracted_text, json.dumps(metadata)],
            )
            await conn.commit()
        return metadata

    # ── Physician helpers ──────────────────────────────────────────────────────

    async def get_physician_patient_summaries(self, physician_id: str) -> list[dict]:
        # Find all patients where this physician has an approved or pending access request
        async with aiosqlite.connect(DB_PATH) as conn:
            conn.row_factory = aiosqlite.Row
            async with conn.execute(
                """SELECT ar.patient_id, ar.status, p.name, p.profile
                   FROM access_requests ar
                   JOIN patients p ON ar.patient_id = p.id
                   WHERE ar.physician_id = ?""",
                [physician_id],
            ) as cur:
                rows = await cur.fetchall()

        summaries = []
        for row in rows:
            profile = json.loads(row["profile"]) if row["profile"] else {}
            # Count timeline nodes needing review
            nodes = await self.get_timeline_nodes(row["patient_id"])
            needs_review = sum(1 for n in nodes if n.get("verificationStatus") == "NEEDS_REVIEW")
            new_symptoms = sum(
                1 for n in nodes
                if n.get("type") == "PATIENT_SYMPTOM" and n.get("eventDate", "") > "2026-05-04"
            )
            summaries.append({
                "patientId": row["patient_id"],
                "name": row["name"],
                "age": profile.get("age", 0),
                "conditions": profile.get("conditions", []),
                "allergies": profile.get("allergies", []),
                "lastAppointment": profile.get("lastAppointment", ""),
                "newSymptomsSince": new_symptoms,
                "newDocumentsSince": 0,
                "needsReviewCount": needs_review,
                "accessStatus": row["status"],
            })
        return summaries


db = Database()
