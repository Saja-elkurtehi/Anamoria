export type Role = 'patient' | 'physician';

export type TimelineNodeType =
  | 'PATIENT_SYMPTOM'
  | 'EMR_RECORD'
  | 'REQUISITION'
  | 'PHYSICIAN_ENTERED'
  | 'UPLOADED_DOCUMENT'
  | 'PATIENT_HISTORY';

export type SourceType =
  | 'PATIENT_REPORTED'
  | 'UPLOADED_RECORD'
  | 'EMR_DATABASE'
  | 'PHYSICIAN_CONTRIBUTION'
  | 'PATIENT_REPORTED_VERIFIED'
  | 'INTAKE_FORM'
  | 'CHAT_ASSISTANT';

export type VerificationStatus =
  | 'NEEDS_REVIEW'
  | 'PATIENT_REPORTED_ONLY'
  | 'VERIFIED_BY_PHYSICIAN'
  | 'VERIFIED_BY_EMR'
  | 'REVIEWED_NOT_VERIFIED'
  | 'CONFLICTING_INFORMATION';

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type DatePrecision = 'EXACT' | 'APPROXIMATE' | 'UNKNOWN';
export type ContributorRole = 'PATIENT' | 'PHYSICIAN' | 'EMR' | 'SYSTEM';

export interface PhysicianNote {
  noteId: string;
  physicianId: string;
  physicianName: string;
  specialty: string;
  content: string;
  noteType: 'NOTE' | 'CORRECTION' | 'VERIFICATION' | 'REVIEW';
  createdAt: string;
}

export interface SymptomDetails {
  symptomName: string;
  onsetDate: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  frequency: string;
  duration: string;
  status: 'ONGOING' | 'RESOLVED' | 'INTERMITTENT' | 'UNKNOWN';
  description: string;
  triggers: string;
  relievingFactors: string;
  associatedSymptoms: string[];
  patientNotes: string;
  doctorReviewed: boolean;
  doctorReviewNote?: string;
  clarificationNeeded: boolean;
}

export interface EMRDetails {
  emrSource: string;
  organization: string;
  recordType: 'DIAGNOSIS' | 'MEDICATION' | 'ALLERGY' | 'VISIT' | 'LAB' | 'IMAGING' | 'PROCEDURE';
  originalRecordDate: string;
  extractedFields: Record<string, string>;
  clinicianName?: string;
  clinicName?: string;
  importDate: string;
  matchedPatientReported: boolean;
  reliabilityNotes?: string;
}

export interface RequisitionDetails {
  requisitionType: 'LAB' | 'IMAGING' | 'SPECIALIST_REFERRAL' | 'PROCEDURE' | 'OTHER';
  orderingPhysician: string;
  orderingClinic: string;
  reasonForOrder: string;
  testsOrdered: string[];
  imagingOrdered?: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  requisitionStatus: 'ORDERED' | 'SENT' | 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'UNKNOWN';
  followUpNeeded: boolean;
  followUpInstructions?: string;
  resultNodeId?: string;
}

export interface PhysicianEnteredDetails {
  entryType: 'VISIT_SUMMARY' | 'CLINICAL_NOTE' | 'DIAGNOSIS' | 'MEDICATION_CHANGE' | 'CORRECTION' | 'VERIFICATION' | 'FAMILY_HISTORY_UPDATE';
  physicianName: string;
  specialty: string;
  clinic: string;
  note: string;
  assessment?: string;
  linkedSymptomIds: string[];
  linkedRecordIds: string[];
  linkedRequisitionIds: string[];
  changesMade: string;
  followUpPlan?: string;
}

export interface UploadedDocumentDetails {
  documentId: string;
  fileName: string;
  documentType: 'LAB_REPORT' | 'DISCHARGE_SUMMARY' | 'SPECIALIST_LETTER' | 'MEDICATION_LIST' | 'IMAGING_REPORT' | 'OTHER';
  uploadedBy: string;
  uploadedAt: string;
  documentDate: string;
  issuingOrganization: string;
  authorClinician?: string;
  extractionStatus: 'PENDING' | 'EXTRACTED' | 'NEEDS_REVIEW' | 'FAILED';
  extractedItems: {
    conditions?: string[];
    medications?: string[];
    findings?: string[];
    dates?: string[];
    doctors?: string[];
    followUp?: string[];
  };
  supportedNodeIds: string[];
}

export interface PatientHistoryDetails {
  category: 'CONDITION' | 'MEDICATION' | 'ALLERGY' | 'SURGERY' | 'HOSPITAL_VISIT' | 'FAMILY_HISTORY' | 'SOCIAL_CONTEXT' | 'OTHER';
  patientStatement: string;
  approximateDate: string;
  confirmedByPatient: boolean;
  confirmedByPhysician: boolean;
  confirmedByEMR: boolean;
  matchingRecordIds: string[];
  clarificationNeeded: boolean;
}

export type NodeDetails =
  | SymptomDetails
  | EMRDetails
  | RequisitionDetails
  | PhysicianEnteredDetails
  | UploadedDocumentDetails
  | PatientHistoryDetails;

export interface TimelineNode {
  nodeId: string;
  patientId: string;
  type: TimelineNodeType;
  title: string;
  summary: string;
  eventDate: string;
  datePrecision: DatePrecision;
  sourceType: SourceType;
  verificationStatus: VerificationStatus;
  confidenceLevel: ConfidenceLevel;
  contributorName: string;
  contributorRole: ContributorRole;
  relatedDocumentIds: string[];
  relatedNodeIds: string[];
  tags: string[];
  details: NodeDetails;
  physicianNotes: PhysicianNote[];
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  name: string;
  dose: string;
  frequency: string;
}

export interface Patient {
  patientId: string;
  name: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  bloodType: string;
  phone: string;
  email: string;
  conditions: string[];
  allergies: string[];
  medications: Medication[];
  familyHistory: { relationship: string; conditions: string[] }[];
  careTeam: { name: string; specialty: string; clinic: string }[];
  lastAppointment: string;
  lastUpdated: string;
}

export interface PhysicianPatientSummary {
  patientId: string;
  name: string;
  age: number;
  conditions: string[];
  allergies: string[];
  lastAppointment: string;
  newSymptomsSince: number;
  newDocumentsSince: number;
  needsReviewCount: number;
  accessStatus: 'APPROVED' | 'PENDING' | 'DENIED';
}

export interface UploadedDoc {
  documentId: string;
  patientId: string;
  fileName: string;
  documentType: string;
  uploadedBy: string;
  uploadedAt: string;
  documentDate?: string;
  issuingOrganization?: string;
  extractionStatus: 'PENDING' | 'EXTRACTED' | 'NEEDS_REVIEW' | 'FAILED';
  extractedItems?: Record<string, string[]>;
  linkedNodeIds: string[];
}

export interface AccessRequest {
  requestId: string;
  patientId: string;
  physicianId: string;
  physicianName: string;
  specialty: string;
  clinic: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  permissions: string[];
  respondedAt?: string;
}

export interface MissingInfoItem {
  id: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  relatedNodeId?: string;
  status: 'OPEN' | 'ASKED' | 'RESOLVED';
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}
