import OpenAI from 'openai';
import { z } from 'zod';
import type {
  VisitBriefRequest,
  VisitBriefResponse,
  ReferencePackageRequest,
  ReferencePackageResponse,
  RequisitionDraftRequest,
  RequisitionDraftResponse,
} from '../../../shared/types';

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
const USE_MOCK = process.env.USE_MOCK_AI === 'true';

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it to backend/.env or set USE_MOCK_AI=true for demo mode.'
    );
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a medical information organization assistant helping physicians prepare for patient visits.

MANDATORY RULES — follow without exception:
1. Do NOT diagnose any condition.
2. Do NOT recommend any treatment, medication, or clinical action.
3. Do NOT invent, assume, or infer information not present in the provided data.
4. ALWAYS clearly label the source and verification status of every claim.
5. Use these exact phrases when information is uncertain or missing:
   - "patient-reported, needs physician verification"
   - "not documented in available records"
   - "source not available"
   - "conflicting information — physician review required"
6. NEVER present unverified patient-reported information as confirmed fact.
7. Output MUST be valid JSON matching the schema specified in the user message.
8. Every claim MUST include the source IDs it was derived from.
9. Your role is ONLY to organize and summarize existing documented information.
10. Physician review is required before any generated content can be used clinically.`;

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const VALID_SOURCE_TYPES = [
  'TIMELINE_NODE', 'DOCUMENT', 'EMR_RECORD', 'PHYSICIAN_NOTE', 'PATIENT_PROFILE',
] as const;

const NODE_TYPE_REMAP: Record<string, typeof VALID_SOURCE_TYPES[number]> = {
  PATIENT_HISTORY: 'TIMELINE_NODE',
  PATIENT_SYMPTOM: 'TIMELINE_NODE',
  REQUISITION: 'TIMELINE_NODE',
  PHYSICIAN_ENTERED: 'PHYSICIAN_NOTE',
  UPLOADED_DOCUMENT: 'DOCUMENT',
  EMR_RECORD: 'EMR_RECORD',
};

const normaliseSourceType = z.string().transform(
  (v): typeof VALID_SOURCE_TYPES[number] =>
    VALID_SOURCE_TYPES.includes(v as typeof VALID_SOURCE_TYPES[number])
      ? (v as typeof VALID_SOURCE_TYPES[number])
      : (NODE_TYPE_REMAP[v] ?? 'TIMELINE_NODE')
);

const SourceReferenceSchema = z.object({
  sourceId: z.string(),
  sourceType: normaliseSourceType,
  label: z.string(),
  excerpt: z.string().optional(),
  date: z.string().optional(),
});

const SourceLinkedTextSchema = z.object({
  text: z.string(),
  sourceIds: z.array(z.string()).default([]),
  verificationStatus: z.string().optional(),
  confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']).catch('MEDIUM').optional(),
});

const VisitBriefAISchema = z.object({
  summary: z.string(),
  sinceLastVisit: z.array(SourceLinkedTextSchema).default([]),
  needsReview: z.array(SourceLinkedTextSchema).default([]),
  relevantTimelineNodeIds: z.array(z.string()).default([]),
  suggestedVisitNoteStarter: z.string(),
  sourceMap: z.array(SourceReferenceSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

const ReferencePackageAISchema = z.object({
  recipientContext: z.object({
    recipientName: z.string().optional(),
    recipientSpecialty: z.string(),
    packageType: z.string(),
    reasonForRequest: z.string(),
  }),
  relevantMedicalHistory: z.array(SourceLinkedTextSchema).default([]),
  currentRelevantSymptoms: z.array(SourceLinkedTextSchema).default([]),
  relevantConditions: z.array(SourceLinkedTextSchema).default([]),
  relevantMedications: z.array(SourceLinkedTextSchema).default([]),
  relevantAllergies: z.array(SourceLinkedTextSchema).default([]),
  relevantFamilyHistory: z.array(SourceLinkedTextSchema).default([]),
  documentsToInclude: z.array(z.object({
    documentId: z.string(),
    fileName: z.string(),
    relevanceReason: z.string(),
    sourceTimelineNodeIds: z.array(z.string()).default([]),
  })).default([]),
  timelineSnapshot: z.array(z.object({
    nodeId: z.string(),
    date: z.string(),
    title: z.string(),
    summary: z.string(),
    sourceType: z.string(),
    verificationStatus: z.string(),
  })).default([]),
  missingOrUnverifiedInfo: z.array(SourceLinkedTextSchema).default([]),
  notesForRecipient: z.string().default(''),
  sourceMap: z.array(SourceReferenceSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

const RequisitionFieldSchema = z.object({
  fieldId: z.string(),
  fieldName: z.string().optional(),
  label: z.string(),
  value: z.string(),
  confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']).catch('MEDIUM'),
  sourceIds: z.array(z.string()).default([]),
  needsPhysicianReview: z.boolean().catch(false),
  editable: z.boolean().catch(true),
});

const RequisitionDraftAISchema = z.object({
  formTitle: z.string(),
  fillMode: z.enum(['ACROFORM', 'OVERLAY', 'NOT_FILLABLE', 'UNKNOWN']).catch('UNKNOWN'),
  filledFields: z.array(RequisitionFieldSchema).default([]),
  sourceMap: z.array(SourceReferenceSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

// ─── Core API caller ──────────────────────────────────────────────────────────

async function callOpenAI(userPrompt: string): Promise<unknown> {
  console.log(`[OpenAI] Starting request — model=${MODEL}, prompt_chars=${userPrompt.length}`);
  const client = getClient();
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 4096,
    });
    const content = completion.choices[0]?.message?.content ?? '{}';
    console.log(`[OpenAI] Response received — output_chars=${content.length}`);
    return JSON.parse(content);
  } catch (err) {
    console.error('[OpenAI] Request failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}

// ─── Mock responses ───────────────────────────────────────────────────────────

const MOCK_NOTE = '[MOCK MODE] Set USE_MOCK_AI=false and add OPENAI_API_KEY in backend/.env for real AI responses.';

function mockVisitBrief(input: VisitBriefRequest): VisitBriefResponse {
  console.log('[AI] Returning mock visit brief');
  const patientName = input.patientProfile.name;
  const firstNode = input.timelineNodes[0];
  const mockSourceId = firstNode?.nodeId ?? 'patient_profile';
  const mockLabel = firstNode?.title ?? 'Patient profile';
  const mockDate = firstNode?.eventDate ?? input.lastVisitDate;
  return {
    summary: `[MOCK] ${patientName} is presenting for a follow-up. Since the last visit on ${input.lastVisitDate}, ${input.timelineNodes.length} timeline event(s) have been recorded. This is a mock response for demonstration purposes.`,
    sinceLastVisit: input.timelineNodes.slice(0, 3).map(n => ({
      text: n.title,
      sourceIds: [n.nodeId],
      verificationStatus: 'patient-reported, needs physician verification',
      confidence: 'MEDIUM' as const,
    })),
    needsReview: [{
      text: 'All items in this mock response require physician verification.',
      sourceIds: [mockSourceId],
      verificationStatus: 'patient-reported, needs physician verification',
      confidence: 'LOW' as const,
    }],
    relevantTimelineNodeIds: input.timelineNodes.slice(0, 3).map(n => n.nodeId),
    suggestedVisitNoteStarter: `[MOCK] ${patientName} presents for follow-up. Timeline events since ${input.lastVisitDate} include: ${input.timelineNodes.slice(0, 2).map(n => n.title).join(', ')}. Please review and update this note.`,
    sourceMap: [
      { sourceId: mockSourceId, sourceType: 'TIMELINE_NODE', label: mockLabel, date: mockDate },
      { sourceId: 'patient_profile', sourceType: 'PATIENT_PROFILE', label: 'Patient Profile', date: 'current' },
    ],
    warnings: [MOCK_NOTE],
    generatedAt: new Date().toISOString(),
    briefOptions: input.briefOptions,
  };
}

function mockReferencePackage(input: ReferencePackageRequest): ReferencePackageResponse {  // ReferencePackageRequest = ReferralPackageRequest alias
  console.log('[AI] Returning mock reference package');
  const patientName = input.patientProfile.name;
  const firstNode = input.timelineNodes[0];
  const mockSourceId = firstNode?.nodeId ?? 'patient_profile';
  const mockLabel = firstNode?.title ?? 'Patient profile';
  const mockDate = firstNode?.eventDate ?? 'current';
  return {
    packageId: `pkg-mock-${Date.now()}`,
    status: 'DRAFT',
    recipientContext: {
      recipientName: input.recipientName,
      recipientSpecialty: input.recipientSpecialty,
      packageType: input.packageType,
      reasonForRequest: input.reasonForRequest,
    },
    relevantMedicalHistory: [{
      text: `[MOCK] ${patientName} has documented medical history. This is a placeholder response.`,
      sourceIds: ['patient_profile'],
      verificationStatus: 'patient-reported, needs physician verification',
      confidence: 'MEDIUM' as const,
    }],
    currentRelevantSymptoms: input.timelineNodes.slice(0, 2).map(n => ({
      text: n.title,
      sourceIds: [n.nodeId],
      verificationStatus: 'patient-reported, needs physician verification',
      confidence: 'MEDIUM' as const,
    })),
    relevantConditions: input.patientProfile.conditions.map((c, i) => ({
      text: c,
      sourceIds: ['patient_profile'],
      verificationStatus: 'documented in patient profile',
      confidence: 'HIGH' as const,
    })),
    relevantMedications: input.patientProfile.medications.map(m => ({
      text: `${m.name} — ${m.dose}, ${m.frequency}`,
      sourceIds: ['patient_profile'],
      verificationStatus: 'documented in patient profile',
      confidence: 'HIGH' as const,
    })),
    relevantAllergies: input.patientProfile.allergies.map(a => ({
      text: a,
      sourceIds: ['patient_profile'],
      verificationStatus: 'documented in patient profile',
      confidence: 'HIGH' as const,
    })),
    documentsToInclude: input.documents.slice(0, 2).map(d => ({
      documentId: d.documentId,
      fileName: d.fileName,
      relevanceReason: '[MOCK] Included as potentially relevant.',
      sourceTimelineNodeIds: [],
    })),
    timelineSnapshot: input.timelineNodes.slice(0, 3).map(n => ({
      nodeId: n.nodeId,
      date: n.eventDate,
      title: n.title,
      summary: n.summary,
      sourceType: 'TIMELINE_NODE',
      verificationStatus: n.verificationStatus,
    })),
    relevantFamilyHistory: input.patientProfile.familyHistory.map(f => ({
      text: `${f.relationship}: ${f.conditions.join(', ')}`,
      sourceIds: ['patient_profile'],
      verificationStatus: 'patient-reported',
      confidence: 'MEDIUM' as const,
    })),
    missingOrUnverifiedInfo: [{
      text: '[MOCK] Some information may be missing or unverified. Physician review required.',
      sourceIds: [],
      confidence: 'LOW' as const,
    }],
    notesForRecipient: '',
    sourceMap: [
      { sourceId: 'patient_profile', sourceType: 'PATIENT_PROFILE', label: 'Patient Profile', date: 'current' },
      { sourceId: mockSourceId, sourceType: 'TIMELINE_NODE', label: mockLabel, date: mockDate },
    ],
    warnings: [MOCK_NOTE],
    generatedAt: new Date().toISOString(),
  };
}

function resolveFieldForName(
  fieldName: string,
  p: RequisitionDraftRequest['patientProfile'],
  input: RequisitionDraftRequest,
): { label: string; value: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; review: boolean; sourceIds: string[] } {
  const n = fieldName.toLowerCase().replace(/[\s\-]/g, '_');
  if (n.includes('last') && n.includes('name')) return { label: 'Last Name', value: p.name.split(' ').slice(-1)[0], confidence: 'HIGH', review: false, sourceIds: ['patient_profile'] };
  if (n.includes('first') && n.includes('name')) return { label: 'First Name', value: p.name.split(' ')[0], confidence: 'HIGH', review: false, sourceIds: ['patient_profile'] };
  if (n.includes('patient') && n.includes('name')) return { label: 'Patient Name', value: p.name, confidence: 'HIGH', review: false, sourceIds: ['patient_profile'] };
  if (n === 'name' || n === 'full_name' || n === 'patient') return { label: 'Patient Name', value: p.name, confidence: 'HIGH', review: false, sourceIds: ['patient_profile'] };
  if (n.includes('birth') || n === 'dob' || n.endsWith('_dob')) return { label: 'Date of Birth', value: (p as { dateOfBirth?: string }).dateOfBirth ?? 'Not on file', confidence: 'HIGH', review: false, sourceIds: ['patient_profile'] };
  if (n.includes('health') && n.includes('card')) return { label: 'Health Card Number', value: 'Not available — physician to complete', confidence: 'LOW', review: true, sourceIds: [] };
  if (n.includes('ohip')) return { label: 'OHIP Number', value: 'Not available — physician to complete', confidence: 'LOW', review: true, sourceIds: [] };
  if (n === 'age') return { label: 'Age', value: String(p.age), confidence: 'HIGH', review: false, sourceIds: ['patient_profile'] };
  if (n.includes('gender') || n === 'sex') return { label: 'Gender', value: p.gender ?? 'Not specified', confidence: 'HIGH', review: false, sourceIds: ['patient_profile'] };
  if (n.includes('allerg')) return { label: 'Known Allergies', value: p.allergies.join(', ') || 'NKDA', confidence: 'HIGH', review: true, sourceIds: ['patient_profile'] };
  if (n.includes('condition') || n.includes('diagnos')) return { label: 'Relevant Conditions', value: p.conditions.join(', ') || 'None documented', confidence: 'HIGH', review: false, sourceIds: ['patient_profile'] };
  if (n.includes('medication') || n.includes('drug') || n.startsWith('rx') || n.includes('current_med')) return { label: 'Current Medications', value: p.medications.map(m => `${m.name} ${m.dose}`).join('; ') || 'None', confidence: 'HIGH', review: false, sourceIds: ['patient_profile'] };
  if (n.includes('reason') || n.includes('indication') || n.includes('clinical_info') || n.includes('history')) return { label: 'Clinical Indication', value: input.reasonForRequest, confidence: 'HIGH', review: false, sourceIds: ['physician_input'] };
  if (n.includes('test') || n.includes('service') || n.includes('procedure') || n.includes('requested')) return { label: 'Requested Service', value: input.requestedService ?? 'Not specified — physician to complete', confidence: input.requestedService ? 'HIGH' : 'LOW', review: !input.requestedService, sourceIds: ['physician_input'] };
  if (n.includes('physician') || n.includes('doctor') || n.includes('provider') || n.includes('referring') || n.includes('ordering')) return { label: 'Ordering Physician', value: 'Not available — physician to complete', confidence: 'LOW', review: true, sourceIds: [] };
  if (n.includes('priority') || n.includes('urgent')) return { label: 'Priority', value: 'ROUTINE', confidence: 'MEDIUM', review: true, sourceIds: ['physician_input'] };
  if (n.includes('date') && !n.includes('birth') && n !== 'dob') return { label: 'Date', value: new Date().toISOString().slice(0, 10), confidence: 'HIGH', review: false, sourceIds: ['physician_input'] };
  if (n.includes('phone') || n.includes('tel')) return { label: 'Phone', value: 'Not available — physician to complete', confidence: 'LOW', review: true, sourceIds: [] };
  if (n.includes('address')) return { label: 'Address', value: 'Not available — physician to complete', confidence: 'LOW', review: true, sourceIds: [] };
  return { label: fieldName, value: 'Not available — physician to complete', confidence: 'LOW', review: true, sourceIds: [] };
}

function mockRequisitionDraft(input: RequisitionDraftRequest): RequisitionDraftResponse {
  console.log('[AI] Returning mock requisition draft');
  const p = input.patientProfile;
  const titleMap: Record<string, string> = {
    LAB: 'Laboratory Requisition',
    IMAGING: 'Imaging Requisition',
    SPECIALIST_REFERRAL: 'Specialist Referral Form',
    OTHER: 'Medical Requisition',
  };

  const hasPdfFields = (input.detectedPdfFields?.length ?? 0) > 0;

  let filledFields: RequisitionDraftResponse['filledFields'];
  let fillMode: RequisitionDraftResponse['fillMode'];

  if (hasPdfFields) {
    filledFields = input.detectedPdfFields!.map(df => {
      const r = resolveFieldForName(df.fieldName, p, input);
      return {
        fieldId: df.fieldName,
        fieldName: df.fieldName,
        label: r.label,
        value: r.value,
        confidence: r.confidence,
        sourceIds: r.sourceIds,
        needsPhysicianReview: r.review,
        editable: true,
      };
    });
    fillMode = 'ACROFORM';
  } else {
    filledFields = [
      { fieldId: 'patient_name', label: 'Patient Name', value: p.name, confidence: 'HIGH', sourceIds: ['patient_profile'], needsPhysicianReview: false, editable: true },
      { fieldId: 'date_of_birth', label: 'Date of Birth', value: (p as { dateOfBirth?: string }).dateOfBirth ?? 'Not on file', confidence: 'HIGH', sourceIds: ['patient_profile'], needsPhysicianReview: false, editable: true },
      { fieldId: 'age', label: 'Age', value: String(p.age), confidence: 'HIGH', sourceIds: ['patient_profile'], needsPhysicianReview: false, editable: true },
      { fieldId: 'conditions', label: 'Relevant Conditions', value: p.conditions.join(', '), confidence: 'HIGH', sourceIds: ['patient_profile'], needsPhysicianReview: false, editable: true },
      { fieldId: 'allergies', label: 'Known Allergies', value: p.allergies.join(', '), confidence: 'HIGH', sourceIds: ['patient_profile'], needsPhysicianReview: true, editable: true },
      { fieldId: 'medications', label: 'Current Medications', value: p.medications.map(m => `${m.name} ${m.dose}`).join('; '), confidence: 'HIGH', sourceIds: ['patient_profile'], needsPhysicianReview: false, editable: true },
      { fieldId: 'reason', label: 'Reason for Request', value: input.reasonForRequest, confidence: 'HIGH', sourceIds: ['physician_input'], needsPhysicianReview: false, editable: true },
      { fieldId: 'requested_service', label: 'Requested Service', value: input.requestedService ?? 'Not specified — physician to complete', confidence: input.requestedService ? 'HIGH' : 'LOW', sourceIds: ['physician_input'], needsPhysicianReview: !input.requestedService, editable: true },
      { fieldId: 'ordering_physician', label: 'Ordering Physician', value: 'Not available — physician to complete', confidence: 'LOW', sourceIds: [], needsPhysicianReview: true, editable: true },
      { fieldId: 'priority', label: 'Priority', value: 'ROUTINE', confidence: 'MEDIUM', sourceIds: ['physician_input'], needsPhysicianReview: true, editable: true },
    ];
    fillMode = 'NOT_FILLABLE';
  }

  return {
    requisitionDraftId: `req-mock-${Date.now()}`,
    status: 'DRAFT',
    formTitle: `[MOCK] ${titleMap[input.requisitionType] ?? 'Requisition'}`,
    templateFileName: input.uploadedTemplate?.fileName,
    fillMode,
    filledFields,
    sourceMap: [
      { sourceId: 'patient_profile', sourceType: 'PATIENT_PROFILE', label: 'Patient Profile', date: 'current' },
      { sourceId: 'physician_input', sourceType: 'PHYSICIAN_NOTE', label: 'Physician Input', date: 'current' },
    ],
    warnings: [
      MOCK_NOTE,
      ...(hasPdfFields ? [`Mapped values to ${input.detectedPdfFields!.length} detected PDF fields.`] : ['No fillable PDF uploaded — showing generic fields.']),
    ],
    generatedAt: new Date().toISOString(),
  };
}

// ─── Visit brief ──────────────────────────────────────────────────────────────

export async function generateVisitBrief(input: VisitBriefRequest): Promise<VisitBriefResponse> {
  if (USE_MOCK) return mockVisitBrief(input);

  const opts = input.briefOptions;
  const styleNote = opts ? {
    ULTRA_BRIEF: 'Use ultra-brief format: 2-3 sentences per section, bullet points only.',
    STANDARD: 'Use standard clinical brevity.',
    DETAILED: 'Use detailed format with full context for each item.',
  }[opts.outputStyle] ?? '' : '';
  const focusNote = opts && opts.focusArea !== 'GENERAL'
    ? `FOCUS AREA: Emphasize information relevant to ${opts.customFocusArea ?? opts.focusArea} conditions.`
    : '';

  const prompt = `Generate a physician visit brief for the patient visit below.
${styleNote ? `\nOUTPUT STYLE: ${styleNote}` : ''}
${focusNote ? `\n${focusNote}` : ''}

LAST VISIT DATE: ${input.lastVisitDate}
CURRENT VISIT DATE: ${input.currentVisitDate}

PATIENT PROFILE:
${JSON.stringify(input.patientProfile, null, 2)}

TIMELINE NODES (${input.timelineNodes.length} items — already filtered per physician's time range preference):
${JSON.stringify(input.timelineNodes, null, 2)}

UPLOADED DOCUMENTS (${input.documents.length} items):
${JSON.stringify(input.documents, null, 2)}

PHYSICIAN NOTES (${input.physicianNotes.length} items):
${JSON.stringify(input.physicianNotes, null, 2)}

Return a JSON object with EXACTLY this structure — no extra keys:
{
  "summary": "<one paragraph, clinically concise, physician-readable, focusing on what changed since ${input.lastVisitDate}>",
  "sinceLastVisit": [
    { "text": "<specific change or event>", "sourceIds": ["<nodeId or docId>"], "verificationStatus": "<status>", "confidence": "HIGH|MEDIUM|LOW" }
  ],
  "needsReview": [
    { "text": "<item requiring physician attention>", "sourceIds": ["<sourceId>"], "verificationStatus": "<status>", "confidence": "HIGH|MEDIUM|LOW" }
  ],
  "relevantTimelineNodeIds": ["<nodeId>"],
  "suggestedVisitNoteStarter": "<editable prefilled text for the physician>",
  "sourceMap": [
    { "sourceId": "<id>", "sourceType": "TIMELINE_NODE|DOCUMENT|EMR_RECORD|PHYSICIAN_NOTE|PATIENT_PROFILE", "label": "<human-readable label>", "excerpt": "<short excerpt>", "date": "<date>" }
  ],
  "warnings": ["<data quality issue if any>"]
}

CRITICAL — sourceMap sourceType MUST be exactly one of: "TIMELINE_NODE" | "DOCUMENT" | "EMR_RECORD" | "PHYSICIAN_NOTE" | "PATIENT_PROFILE"
Do NOT use timeline node types (PATIENT_HISTORY, PHYSICIAN_ENTERED, etc.) as sourceType. Use "TIMELINE_NODE" for any timeline event.

RULES:
- Only include what is documented in the provided data
- Focus on changes since ${input.lastVisitDate}
- Use "patient-reported, needs physician verification" for unverified symptoms
- Every sourceId in sinceLastVisit and needsReview must appear in sourceMap
- Do not invent information`;

  const raw = await callOpenAI(prompt);
  const parsed = VisitBriefAISchema.parse(raw);
  return { ...parsed, generatedAt: new Date().toISOString(), briefOptions: input.briefOptions };
}

// ─── Reference package ────────────────────────────────────────────────────────

export async function generateReferencePackage(input: ReferencePackageRequest): Promise<ReferencePackageResponse> {
  if (USE_MOCK) return mockReferencePackage(input);

  const prompt = `Generate a focused medical reference package for a ${input.packageType} referral/requisition.

REQUEST:
- Recipient: ${input.recipientName ?? 'Not specified'} (${input.recipientSpecialty})
- Package Type: ${input.packageType}
- Reason: ${input.reasonForRequest}
- Date Range: ${input.dateRange ? `${input.dateRange.startDate ?? 'all'} to ${input.dateRange.endDate ?? 'present'}` : 'all available'}
- Include sections: ${JSON.stringify(input.includeOptions)}

PATIENT PROFILE:
${JSON.stringify(input.patientProfile, null, 2)}

TIMELINE NODES (${input.timelineNodes.length} items):
${JSON.stringify(input.timelineNodes, null, 2)}

UPLOADED DOCUMENTS (${input.documents.length} items):
${JSON.stringify(input.documents, null, 2)}

PHYSICIAN NOTES (${input.physicianNotes.length} items):
${JSON.stringify(input.physicianNotes, null, 2)}

Return a JSON object with EXACTLY this structure:
{
  "recipientContext": {
    "recipientName": "${input.recipientName ?? 'Not specified'}",
    "recipientSpecialty": "${input.recipientSpecialty}",
    "packageType": "${input.packageType}",
    "reasonForRequest": "${input.reasonForRequest}"
  },
  "relevantMedicalHistory": [{ "text": "...", "sourceIds": [], "verificationStatus": "...", "confidence": "HIGH|MEDIUM|LOW" }],
  "currentRelevantSymptoms": [{ "text": "...", "sourceIds": [], "verificationStatus": "...", "confidence": "HIGH|MEDIUM|LOW" }],
  "relevantConditions": [{ "text": "...", "sourceIds": [], "verificationStatus": "...", "confidence": "HIGH|MEDIUM|LOW" }],
  "relevantMedications": [{ "text": "...", "sourceIds": [], "verificationStatus": "...", "confidence": "HIGH|MEDIUM|LOW" }],
  "relevantAllergies": [{ "text": "...", "sourceIds": [], "verificationStatus": "...", "confidence": "HIGH|MEDIUM|LOW" }],
  "relevantFamilyHistory": [{ "text": "...", "sourceIds": [], "verificationStatus": "...", "confidence": "HIGH|MEDIUM|LOW" }],
  "documentsToInclude": [{ "documentId": "...", "fileName": "...", "relevanceReason": "...", "sourceTimelineNodeIds": [] }],
  "timelineSnapshot": [{ "nodeId": "...", "date": "...", "title": "...", "summary": "...", "sourceType": "...", "verificationStatus": "..." }],
  "missingOrUnverifiedInfo": [{ "text": "...", "sourceIds": [], "confidence": "LOW" }],
  "notesForRecipient": "",
  "sourceMap": [{ "sourceId": "...", "sourceType": "TIMELINE_NODE|DOCUMENT|EMR_RECORD|PHYSICIAN_NOTE|PATIENT_PROFILE", "label": "...", "excerpt": "...", "date": "..." }],
  "warnings": []
}

CRITICAL — sourceMap sourceType MUST be exactly one of: "TIMELINE_NODE" | "DOCUMENT" | "EMR_RECORD" | "PHYSICIAN_NOTE" | "PATIENT_PROFILE"
Do NOT use timeline node types (PATIENT_HISTORY, PHYSICIAN_ENTERED, etc.) as sourceType.

CRITICAL RULES:
- Only include information RELEVANT to ${input.recipientSpecialty} and the reason: "${input.reasonForRequest}"
- Do NOT include the entire patient history — focus on what the receiving physician needs
- Do not diagnose or recommend treatment
- Mark unverified patient-reported items with verificationStatus "patient-reported, needs physician verification"
- Every sourceId must appear in sourceMap
- Only include sections that are enabled in includeOptions`;

  const raw = await callOpenAI(prompt);
  const parsed = ReferencePackageAISchema.parse(raw);
  return {
    packageId: `pkg-${Date.now()}`,
    status: 'DRAFT',
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Requisition draft ────────────────────────────────────────────────────────

export async function generateRequisitionDraft(input: RequisitionDraftRequest): Promise<RequisitionDraftResponse> {
  if (USE_MOCK) return mockRequisitionDraft(input);

  const titleMap: Record<string, string> = {
    LAB: 'Laboratory Requisition',
    IMAGING: 'Imaging Requisition',
    SPECIALIST_REFERRAL: 'Specialist Referral Form',
    OTHER: 'Medical Requisition',
  };
  const formTitle = input.uploadedTemplate?.fileName
    ? `Draft — ${input.uploadedTemplate.fileName}`
    : `Draft — ${titleMap[input.requisitionType] ?? 'Requisition'}`;

  const hasPdfFields = (input.detectedPdfFields?.length ?? 0) > 0;
  const pdfFieldsSection = hasPdfFields
    ? `\nDETECTED PDF FORM FIELDS (${input.detectedPdfFields!.length} AcroForm fields — map values to THESE exact field names):
${input.detectedPdfFields!.map(f => `  - "${f.fieldName}" (${f.fieldType})`).join('\n')}

CRITICAL: You MUST use the exact fieldName values above as both "fieldId" AND "fieldName" in your response.
Only create entries for fields listed above — do not invent new field names.
Set fillMode to "ACROFORM".`
    : `\nNo PDF form uploaded or no fillable fields detected. Generate standard fields for the requisition type.
Set fillMode to "NOT_FILLABLE".`;

  const prompt = `Generate a filled draft for a ${input.requisitionType} requisition form.

REQUISITION DETAILS:
- Type: ${input.requisitionType}
- Reason: ${input.reasonForRequest}
- Requested Service: ${input.requestedService ?? 'Not specified'}
- Template: ${input.uploadedTemplate?.fileName ?? 'Standard form'}
- Form Title: ${formTitle}
${pdfFieldsSection}

PATIENT PROFILE:
${JSON.stringify(input.patientProfile, null, 2)}

TIMELINE NODES (${input.timelineNodes.length} items):
${JSON.stringify(input.timelineNodes, null, 2)}

UPLOADED DOCUMENTS (${input.documents.length} items):
${JSON.stringify(input.documents, null, 2)}

Return a JSON object with EXACTLY this structure:
{
  "formTitle": "${formTitle}",
  "fillMode": "${hasPdfFields ? 'ACROFORM' : 'NOT_FILLABLE'}",
  "filledFields": [
    { "fieldId": "<fieldName>", "fieldName": "<fieldName>", "label": "<human label>", "value": "<value from patient data>", "confidence": "HIGH|MEDIUM|LOW", "sourceIds": ["<sourceId>"], "needsPhysicianReview": false, "editable": true }
  ],
  "sourceMap": [
    { "sourceId": "patient_profile", "sourceType": "PATIENT_PROFILE", "label": "Patient Profile", "date": "current" },
    { "sourceId": "physician_input", "sourceType": "PHYSICIAN_NOTE", "label": "Physician Input", "date": "current" }
  ],
  "warnings": []
}

${hasPdfFields
  ? `Map patient values to the detected PDF field names listed above. fieldId and fieldName must match the exact PDF field name.`
  : `Generate ALL standard fields for a ${input.requisitionType} requisition (name, DOB, health card, conditions, allergies, medications, reason, requested service, physician, priority).`
}

CRITICAL — sourceMap sourceType MUST be exactly one of: "TIMELINE_NODE" | "DOCUMENT" | "EMR_RECORD" | "PHYSICIAN_NOTE" | "PATIENT_PROFILE"

RULES:
- Do not make clinical decisions about what to order
- Populate fields ONLY with information from the provided patient data
- needsPhysicianReview: true for any field where you are uncertain
- confidence: LOW for patient-reported unverified values
- Include sourceIds for every field value
- Mark genuinely unknown fields as value: "Not available — physician to complete"`;

  const raw = await callOpenAI(prompt);
  const parsed = RequisitionDraftAISchema.parse(raw);
  return {
    requisitionDraftId: `req-draft-${Date.now()}`,
    status: 'DRAFT',
    templateFileName: input.uploadedTemplate?.fileName,
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}
