export type DataSource =
  | 'UPLOAD'
  | 'INTAKE_FORM'
  | 'CHAT_ASSISTANT'
  | 'PROFILE'
  | 'EMR_INGEST'
  | 'PHYSICIAN_EDIT';

export type VerificationStatus =
  | 'PHYSICIAN_VERIFIED'
  | 'PATIENT_REPORTED'
  | 'NEEDS_REVIEW'
  | 'FLAGGED'
  | 'CONFIRMED_BY_EMR'
  | 'CLARIFICATION_REQUESTED';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type NodeCategory =
  | 'DIAGNOSIS'
  | 'MEDICATION'
  | 'SYMPTOM'
  | 'PROCEDURE'
  | 'LAB'
  | 'IMAGING'
  | 'VISIT'
  | 'REFERRAL'
  | 'ALLERGY'
  | 'FAMILY_HISTORY'
  | 'NOTE';

export interface PhysicianNote {
  noteId: string;
  physicianId: string;
  physicianName: string;
  content: string;
  addedAt: string;
  noteType: 'NOTE' | 'CORRECTION' | 'VERIFICATION' | 'CLARIFICATION_REQUEST';
}

export interface TimelineNode {
  nodeId: string;
  eventDate: string;
  approximateDate: boolean;
  title: string;
  summary: string;
  details: string;
  sourceType: DataSource;
  contributorId: string;
  contributorName: string;
  contributorRole: 'PATIENT' | 'PHYSICIAN' | 'SYSTEM';
  confidenceLevel: ConfidenceLevel;
  verificationStatus: VerificationStatus;
  relatedDocuments: string[];
  physicianNotes: PhysicianNote[];
  category: NodeCategory;
  tags: string[];
  missingInfo?: string[];
}

export interface UploadedDocument {
  docId: string;
  fileName: string;
  documentType: string;
  uploadDate: string;
  extractionStatus: 'COMPLETE' | 'PROCESSING' | 'PARTIAL' | 'FAILED';
  extractedItems: {
    dates?: string[];
    conditions?: string[];
    medications?: string[];
    findings?: string[];
    doctors?: string[];
    followUp?: string[];
  };
  fileSize: string;
  pages?: number;
}

export interface Medication {
  name: string;
  dose: string;
  frequency: string;
  startDate: string;
  prescribedBy: string;
  status: 'ACTIVE' | 'DISCONTINUED' | 'AS_NEEDED';
}

export interface Condition {
  name: string;
  diagnosedDate: string;
  diagnosedBy: string;
  status: 'ACTIVE' | 'RESOLVED' | 'MANAGED';
  icdCode?: string;
  verificationStatus: VerificationStatus;
}

export interface Allergy {
  allergen: string;
  reaction: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  confirmedBy: string;
}

export interface Surgery {
  procedure: string;
  date: string;
  hospital: string;
  surgeon?: string;
  outcome: string;
}

export interface HospitalVisit {
  date: string;
  reason: string;
  facility: string;
  outcome: string;
}

export interface Symptom {
  symptomId: string;
  name: string;
  startDate: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  frequency: string;
  notes: string;
  triggers: string;
  ongoing: boolean;
  hasDocuments: boolean;
  doctorReviewed: boolean;
  verificationStatus: VerificationStatus;
}

export interface LabTest {
  name: string;
  date: string;
  result: string;
  facility: string;
  flagged: boolean;
}

export interface Imaging {
  type: string;
  date: string;
  findings: string;
  facility: string;
}

export interface Relative {
  relationshipId: string;
  relationship: string;
  name?: string;
  age?: number;
  deceased?: boolean;
  conditions: string[];
}

export interface AccessRequest {
  requestId: string;
  physicianId: string;
  physicianName: string;
  specialty: string;
  clinic: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  permissions: string[];
}

export interface Patient {
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  phone: string;
  email: string;
  primaryPhysician: string;
  conditions: Condition[];
  medications: Medication[];
  allergies: Allergy[];
  surgeries: Surgery[];
  hospitalVisits: HospitalVisit[];
  symptoms: Symptom[];
  testsLabs: LabTest[];
  imaging: Imaging[];
  familyHistory: Relative[];
  uploadedDocuments: UploadedDocument[];
  accessRequests: AccessRequest[];
}

export interface Physician {
  physicianId: string;
  name: string;
  specialty: string;
  clinic: string;
  npi: string;
}

export interface MissingInfo {
  id: string;
  description: string;
  relatedNodeId?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'ASKED' | 'RESOLVED';
}

export interface ChatMessage {
  messageId: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

export type ViewMode = 'BRIEF' | 'DEEP';
export type AppMode = 'patient' | 'physician';
