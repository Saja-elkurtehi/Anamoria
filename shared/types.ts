// ─── Enums ────────────────────────────────────────────────────────────────────

export enum SymptomStatus {
  ONGOING = 'ONGOING',
  RESOLVED = 'RESOLVED',
  INTERMITTENT = 'INTERMITTENT',
  UNKNOWN = 'UNKNOWN',
}

export enum VerificationStatus {
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  PATIENT_REPORTED_ONLY = 'PATIENT_REPORTED_ONLY',
  VERIFIED_BY_PHYSICIAN = 'VERIFIED_BY_PHYSICIAN',
  VERIFIED_BY_EMR = 'VERIFIED_BY_EMR',
  REVIEWED_NOT_VERIFIED = 'REVIEWED_NOT_VERIFIED',
  CONFLICTING_INFORMATION = 'CONFLICTING_INFORMATION',
}

export enum ExtractionStatus {
  PENDING = 'PENDING',
  EXTRACTED = 'EXTRACTED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  FAILED = 'FAILED',
}

export enum SourceType {
  PATIENT_REPORTED = 'PATIENT_REPORTED',
  UPLOADED_RECORD = 'UPLOADED_RECORD',
  EMR_DATABASE = 'EMR_DATABASE',
  PHYSICIAN_CONTRIBUTION = 'PHYSICIAN_CONTRIBUTION',
}

export enum AccessRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
}

// ─── Patient sub-types ────────────────────────────────────────────────────────

export interface Condition {
  name: string;
  diagnosedDate?: string;
  diagnosedBy?: string;
  status?: string;
  icdCode?: string;
  verificationStatus?: VerificationStatus;
}

export interface Medication {
  name: string;
  dose: string;
  frequency: string;
  startDate?: string;
  prescribedBy?: string;
  status?: string;
}

export interface Allergy {
  allergen: string;
  reaction: string;
  severity: string;
  confirmedBy?: string;
}

export interface Surgery {
  procedure: string;
  date: string;
  hospital: string;
  surgeon?: string;
  outcome?: string;
}

export interface HospitalVisit {
  date: string;
  reason: string;
  facility: string;
  outcome?: string;
}

export interface TestLab {
  name: string;
  date: string;
  result: string;
  facility: string;
  flagged?: boolean;
}

export interface ImagingRecord {
  type: string;
  date: string;
  findings: string;
  facility: string;
}

export interface FamilyMember {
  familyMemberId: string;
  patientId: string;
  name?: string;
  relationship: string;
  conditions: string[];
  notes?: string;
}

export interface ExtractedItems {
  dates?: string[];
  conditions?: string[];
  medications?: string[];
  findings?: string[];
  doctors?: string[];
  followUp?: string[];
}

export interface UploadedRecord {
  recordId: string;
  patientId: string;
  fileName: string;
  documentType: string;
  source: string;
  uploadedAt: string;
  extractionStatus: ExtractionStatus;
  extractedItems: ExtractedItems;
}

export interface SymptomEntry {
  symptomId: string;
  patientId: string;
  name: string;
  startDate: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  frequency: string;
  notes: string;
  triggers: string;
  status: SymptomStatus;
  supportingDocuments: string[];
  reviewedByDoctor: boolean;
}

export interface Patient {
  patientId: string;
  name: string;
  dateOfBirth: string;
  demographics: {
    gender: string;
    bloodType?: string;
    phone?: string;
    email?: string;
  };
  conditions: Condition[];
  medications: Medication[];
  allergies: Allergy[];
  surgeries: Surgery[];
  hospitalVisits: HospitalVisit[];
  symptoms: SymptomEntry[];
  testsLabs: TestLab[];
  imaging: ImagingRecord[];
  familyHistory: FamilyMember[];
  uploadedDocuments: UploadedRecord[];
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export interface PhysicianNote {
  noteId: string;
  nodeId: string;
  physicianId: string;
  physicianName: string;
  note: string;
  createdAt: string;
}

export interface TimelineNode {
  nodeId: string;
  patientId: string;
  eventDate: string;
  title: string;
  summary: string;
  sourceType: SourceType;
  contributorId: string;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  verificationStatus: VerificationStatus;
  relatedDocuments: string[];
  physicianNotes: PhysicianNote[];
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Access requests ──────────────────────────────────────────────────────────

export interface AccessRequest {
  requestId: string;
  patientId: string;
  physicianId: string;
  physicianName: string;
  specialty: string;
  clinicName: string;
  status: AccessRequestStatus;
  permissions: string[];
  requestedAt: string;
  respondedAt?: string;
}

// ─── Physician ────────────────────────────────────────────────────────────────

export interface Physician {
  physicianId: string;
  name: string;
  clinicId: string;
  clinicName: string;
  specialty: string;
  npi?: string;
}

// ─── Referral ─────────────────────────────────────────────────────────────────

export interface ReferralPacket {
  packetId: string;
  patientId: string;
  physicianId: string;
  recipientName: string;
  recipientSpecialty: string;
  reasonForReferral: string;
  includedTimelineNodeIds: string[];
  includeFamilyHistory: boolean;
  includePhysicianNotes: boolean;
  generatedAt: string;
}
