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

// ─── AI shared output types ───────────────────────────────────────────────────

export interface SourceReference {
  sourceId: string;
  sourceType: 'TIMELINE_NODE' | 'DOCUMENT' | 'EMR_RECORD' | 'PHYSICIAN_NOTE' | 'PATIENT_PROFILE';
  label: string;
  excerpt?: string;
  date?: string;
}

export interface SourceLinkedText {
  text: string;
  sourceIds: string[];
  verificationStatus?: string;
  confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RequisitionField {
  fieldId: string;
  fieldName?: string;  // actual AcroForm field name from the uploaded PDF
  label: string;
  value: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  sourceIds: string[];
  needsPhysicianReview: boolean;
  editable: boolean;
}

// ─── AI input types (match frontend data shapes) ─────────────────────────────

export interface AIPhysicianNote {
  noteId: string;
  physicianName: string;
  specialty?: string;
  content: string;
  noteType?: string;
  createdAt: string;
}

export interface AITimelineNode {
  nodeId: string;
  type: string;
  title: string;
  summary: string;
  eventDate: string;
  sourceType: string;
  verificationStatus: string;
  confidenceLevel?: string;
  contributorName?: string;
  contributorRole?: string;
  tags: string[];
  physicianNotes: AIPhysicianNote[];
}

export interface AIDocument {
  documentId: string;
  fileName: string;
  documentType: string;
  uploadedBy?: string;
  uploadedAt: string;
  documentDate?: string;
  extractionStatus: string;
  extractedItems?: Record<string, string[]>;
}

export interface AIPatientProfile {
  patientId: string;
  name: string;
  age?: number;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  conditions: string[];
  allergies: string[];
  medications: { name: string; dose: string; frequency: string }[];
  familyHistory: { relationship: string; conditions: string[] }[];
  careTeam?: { name: string; specialty: string; clinic: string }[];
  lastAppointment?: string;
}

// ─── AI request types ─────────────────────────────────────────────────────────

export interface BriefOptions {
  timeRange: 'SINCE_LAST_VISIT' | 'LAST_30_DAYS' | 'LAST_6_MONTHS' | 'FULL_TIMELINE' | 'CUSTOM';
  customStartDate?: string;
  customEndDate?: string;
  includeSymptoms: boolean;
  includeDocuments: boolean;
  includeEMR: boolean;
  includePhysicianNotes: boolean;
  includeMedications: boolean;
  includeAllergies: boolean;
  includeFamilyHistory: boolean;
  outputStyle: 'ULTRA_BRIEF' | 'STANDARD' | 'DETAILED';
  focusArea: 'GENERAL' | 'RESPIRATORY' | 'DERMATOLOGY' | 'ALLERGIES' | 'MEDICATIONS' | 'CUSTOM';
  customFocusArea?: string;
}

export interface VisitBriefRequest {
  patientId: string;
  lastVisitDate: string;
  currentVisitDate: string;
  patientProfile: AIPatientProfile;
  timelineNodes: AITimelineNode[];
  documents: AIDocument[];
  physicianNotes: AIPhysicianNote[];
  briefOptions?: BriefOptions;
}

export type PackageType =
  | 'LAB_REQUISITION'
  | 'IMAGING_REQUISITION'
  | 'SPECIALIST_REFERRAL'
  | 'GENERAL_HANDOFF';

export interface ReferralPackageRequest {
  patientId: string;
  recipientName?: string;
  recipientSpecialty: string;
  packageType: PackageType;
  reasonForRequest: string;
  dateRange?: { startDate?: string; endDate?: string };
  includeOptions: {
    medications: boolean;
    allergies: boolean;
    conditions: boolean;
    symptoms: boolean;
    familyHistory: boolean;
    documents: boolean;
    physicianNotes: boolean;
  };
  patientProfile: AIPatientProfile;
  timelineNodes: AITimelineNode[];
  documents: AIDocument[];
  physicianNotes: AIPhysicianNote[];
}

// Keep backward-compat alias so existing backend code compiles without changes
export type ReferencePackageRequest = ReferralPackageRequest;

export type RequisitionType = 'LAB' | 'IMAGING' | 'SPECIALIST_REFERRAL' | 'OTHER';

export interface RequisitionDraftRequest {
  patientId: string;
  requisitionType: RequisitionType;
  reasonForRequest: string;
  requestedService?: string;
  uploadedTemplate?: { fileName: string; templateType: string };
  detectedPdfFields?: { fieldName: string; fieldType: string }[];
  patientProfile: AIPatientProfile;
  timelineNodes: AITimelineNode[];
  documents: AIDocument[];
  physicianNotes: AIPhysicianNote[];
}

// ─── AI response types ────────────────────────────────────────────────────────

export interface VisitBriefResponse {
  summary: string;
  sinceLastVisit: SourceLinkedText[];
  needsReview: SourceLinkedText[];
  relevantTimelineNodeIds: string[];
  suggestedVisitNoteStarter: string;
  sourceMap: SourceReference[];
  warnings: string[];
  generatedAt: string;
  briefOptions?: BriefOptions;
}

export interface ReferralPackageResponse {
  packageId: string;
  status: 'DRAFT' | 'NEEDS_REVIEW' | 'APPROVED';
  recipientContext: {
    recipientName?: string;
    recipientSpecialty: string;
    packageType: string;
    reasonForRequest: string;
  };
  relevantMedicalHistory: SourceLinkedText[];
  currentRelevantSymptoms: SourceLinkedText[];
  relevantConditions: SourceLinkedText[];
  relevantMedications: SourceLinkedText[];
  relevantAllergies: SourceLinkedText[];
  relevantFamilyHistory: SourceLinkedText[];
  documentsToInclude: {
    documentId: string;
    fileName: string;
    relevanceReason: string;
    sourceTimelineNodeIds: string[];
  }[];
  timelineSnapshot: {
    nodeId: string;
    date: string;
    title: string;
    summary: string;
    sourceType: string;
    verificationStatus: string;
  }[];
  missingOrUnverifiedInfo: SourceLinkedText[];
  notesForRecipient: string;
  sourceMap: SourceReference[];
  warnings: string[];
  generatedAt: string;
}

// Keep backward-compat alias
export type ReferencePackageResponse = ReferralPackageResponse;

export interface RequisitionDraftResponse {
  requisitionDraftId: string;
  status: 'DRAFT' | 'NEEDS_REVIEW' | 'APPROVED';
  formTitle: string;
  templateFileName?: string;
  fillMode?: 'ACROFORM' | 'OVERLAY' | 'NOT_FILLABLE' | 'UNKNOWN';
  filledFields: RequisitionField[];
  sourceMap: SourceReference[];
  warnings: string[];
  generatedAt: string;
}
