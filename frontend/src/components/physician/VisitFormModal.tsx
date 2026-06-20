import { useState, useEffect } from 'react';
import {
  X, ClipboardList, User, CheckCircle, AlertTriangle,
  FileText, Stethoscope,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { timelineService } from '../../services/timelineService';
import type { Patient, TimelineNode, UploadedDoc, SymptomDetails } from '../../types';

interface Props {
  nodes: TimelineNode[];
  patient: Patient;
  onClose: () => void;
  onAddedToTimeline: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SourceColor = 'gray' | 'amber' | 'blue' | 'violet' | 'green';

const sourceColorMap: Record<SourceColor, string> = {
  gray:   'bg-gray-100 text-gray-500 border-gray-200',
  amber:  'bg-amber-50 text-amber-600 border-amber-200',
  blue:   'bg-blue-50 text-blue-600 border-blue-200',
  violet: 'bg-violet-50 text-violet-600 border-violet-200',
  green:  'bg-green-50 text-green-600 border-green-200',
};

function SectionHeader({
  num, title, source, color = 'gray',
}: {
  num: number; title: string; source: string; color?: SourceColor;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-semibold text-gray-800">
        <span className="text-gray-400 mr-1">{num}.</span>{title}
      </h4>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${sourceColorMap[color]}`}>
        {source}
      </span>
    </div>
  );
}

function EditableArea({
  num, title, source, color = 'gray', value, onChange, placeholder, rows = 3,
}: {
  num: number; title: string; source: string; color?: SourceColor;
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <SectionHeader num={num} title={title} source={source} color={color} />
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-200 text-gray-700 leading-relaxed"
      />
    </div>
  );
}

function ClinicalArea({
  num, title, hint, value, onChange, placeholder, rows = 4,
}: {
  num: number; title: string; hint: string;
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <SectionHeader num={num} title={title} source="Physician to complete" color="green" />
      <div className="bg-green-50 border border-green-100 border-b-0 rounded-t-xl px-3 py-2 text-xs text-green-700">
        {hint}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full text-sm border border-green-100 rounded-b-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-green-200 text-gray-700 leading-relaxed"
      />
    </div>
  );
}

// ─── Verification label map ───────────────────────────────────────────────────

const verifLabel: Record<string, { label: string; classes: string }> = {
  NEEDS_REVIEW:              { label: 'Needs review',          classes: 'bg-amber-100 text-amber-600' },
  VERIFIED_BY_PHYSICIAN:     { label: 'Verified by physician', classes: 'bg-violet-100 text-violet-600' },
  VERIFIED_BY_EMR:           { label: 'Verified by EMR',       classes: 'bg-blue-100 text-blue-600' },
  REVIEWED_NOT_VERIFIED:     { label: 'Reviewed',              classes: 'bg-gray-100 text-gray-500' },
  CONFLICTING_INFORMATION:   { label: 'Conflicting',           classes: 'bg-red-100 text-red-600' },
  PATIENT_REPORTED_VERIFIED: { label: 'Verified report',       classes: 'bg-green-100 text-green-600' },
};

const nodeTypeLabel: Record<string, string> = {
  PATIENT_SYMPTOM:   'Patient-reported',
  UPLOADED_DOCUMENT: 'Uploaded document',
  EMR_RECORD:        'EMR record',
  PHYSICIAN_ENTERED: 'Physician note',
  REQUISITION:       'Requisition',
  PATIENT_HISTORY:   'Patient history',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function VisitFormModal({ nodes, patient, onClose, onAddedToTimeline }: Props) {
  const { state } = useApp();

  const lastAppointment = patient.lastAppointment;
  const recentNodes    = nodes.filter(n => lastAppointment && n.eventDate > lastAppointment);
  const recentSymptoms = recentNodes.filter(n => n.type === 'PATIENT_SYMPTOM');
  const recentDocNodes = recentNodes.filter(n => n.type === 'UPLOADED_DOCUMENT');
  const allEMRNodes    = nodes.filter(n => n.type === 'EMR_RECORD');

  // Use local documents from state (the physician detail page loads these via API)
  // Fall back to state.documents in case the modal is opened from a context that has them
  const documents: UploadedDoc[] = state.documents;

  // ── Prefill ────────────────────────────────────────────────────────────────

  const prefillReason = [
    recentSymptoms.length > 0
      ? `Follow-up regarding patient-reported ${recentSymptoms.map(s => s.title.toLowerCase()).join(' and ')}.`
      : null,
    recentDocNodes.length > 0
      ? `Physician to review ${recentDocNodes.length} newly uploaded document${recentDocNodes.length > 1 ? 's' : ''}.`
      : null,
  ].filter(Boolean).join(' ') || 'Routine follow-up.';

  const prefillSinceLast = [
    ...recentSymptoms.map(s => {
      const d = new Date(s.eventDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
      return `• Patient reported ${s.title.toLowerCase()} (${d}).`;
    }),
    ...documents.map(d => `• Patient uploaded ${d.fileName}.`),
    ...state.missingInfo
      .filter(m => m.status === 'OPEN')
      .slice(0, 2)
      .map(m => `• Pending clarification: ${m.description.split('—')[0].trim()}.`),
  ].join('\n') || '• No new activity since last appointment.';

  const prefillSubjective = recentSymptoms.length > 0
    ? recentSymptoms.map(s => {
        const d = s.details as SymptomDetails;
        const parts = [s.summary];
        if (d?.frequency)        parts.push(`Frequency: ${d.frequency}.`);
        if (d?.triggers)         parts.push(`Triggers: ${d.triggers}.`);
        if (d?.relievingFactors) parts.push(`Relieving factors: ${d.relievingFactors}.`);
        if (d?.patientNotes)     parts.push(`Patient note: "${d.patientNotes}"`);
        return parts.join(' ');
      }).join('\n\n')
    : 'No new patient-reported symptoms since last appointment.';

  const prefillObjective = [
    allEMRNodes.length > 0
      ? `EMR records reviewed: ${allEMRNodes.slice(0, 3).map(n => n.title).join('; ')}.`
      : null,
    documents.length > 0
      ? `Uploaded documents reviewed: ${documents.map(d => d.fileName).join(', ')}.`
      : null,
  ].filter(Boolean).join('\n') || 'No EMR records or uploaded documents on file.';

  // ── State ──────────────────────────────────────────────────────────────────

  const [form, setForm] = useState({
    reasonForVisit: prefillReason,
    sinceLast:      prefillSinceLast,
    subjective:     prefillSubjective,
    objective:      prefillObjective,
    assessment:     '',
    plan:           '',
  });

  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(
    () => new Set(recentNodes.map(n => n.nodeId))
  );
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(
    () => new Set(documents.map(d => d.documentId))
  );
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Escape key ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Checkbox toggles ───────────────────────────────────────────────────────

  function toggleNode(id: string) {
    setSelectedNodeIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleDoc(id: string) {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleAddToTimeline() {
    if (saving) return;
    setSaving(true);

    const now = new Date().toISOString();
    const visitDate = now.split('T')[0];

    const noteContent = [
      `Reason for visit: ${form.reasonForVisit}`,
      `Since last visit:\n${form.sinceLast}`,
      `Subjective:\n${form.subjective}`,
      `Objective:\n${form.objective}`,
      form.assessment ? `Assessment:\n${form.assessment}` : 'Assessment: [Physician to complete]',
      form.plan ? `Plan:\n${form.plan}` : 'Plan: [Physician to complete]',
    ].join('\n\n');

    const linkedNodes = nodes.filter(n => selectedNodeIds.has(n.nodeId));
    const linkedDocs  = documents.filter(d => selectedDocIds.has(d.documentId));

    const nodePayload: Partial<TimelineNode> = {
      nodeId:            `node-visit-${Date.now()}`,
      patientId:         patient.patientId,
      type:              'PHYSICIAN_ENTERED',
      title:             `Visit note (${new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })})`,
      summary:           form.reasonForVisit,
      eventDate:         visitDate,
      datePrecision:     'EXACT',
      tags:              ['visit-note', 'physician', 'prefilled-emr'],
      details: {
        entryType:            'VISIT_SUMMARY',
        note:                 noteContent,
        assessment:           form.assessment || undefined,
        linkedSymptomIds:     linkedNodes.filter(n => n.type === 'PATIENT_SYMPTOM').map(n => n.nodeId),
        linkedRecordIds:      linkedDocs.map(d => d.documentId),
        linkedRequisitionIds: [],
        changesMade:          form.reasonForVisit,
        followUpPlan:         form.plan || undefined,
      },
      relatedDocumentIds: linkedDocs.map(d => d.documentId),
      relatedNodeIds:    linkedNodes.map(n => n.nodeId),
      physicianNotes: [],
      createdAt:      now,
      updatedAt:      now,
    };

    try {
      await timelineService.addPhysicianNode(patient.patientId, nodePayload);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        onAddedToTimeline();
      }, 1800);
    } catch (err) {
      console.error('Failed to save visit note:', err);
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col pointer-events-auto overflow-hidden">

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="bg-violet-50 border-b border-violet-100 px-6 py-4 flex items-start justify-between flex-shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <ClipboardList className="w-5 h-5 text-violet-600 flex-shrink-0" />
                <h2 className="text-base font-bold text-gray-900">Prefilled Visit Form</h2>
                <span className="text-xs bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-medium">
                  Demo · not a real EMR
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Patient context and timeline highlights are prefilled from verified and patient-reported records.
                Complete the clinical sections.&nbsp;
                <strong className="text-amber-600">This tool organizes information only — it does not diagnose or recommend treatment.</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-violet-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Scrollable body ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-7">

              {/* 1 · Patient Context — read only */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-700">1. Patient Context</h4>
                  <span className="text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                    Read-only · From patient profile
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Patient',             value: patient.name,                                       red: false },
                    { label: 'Age / Sex',            value: `${patient.age} y/o · ${patient.gender}`,          red: false },
                    { label: 'Last appointment',    value: patient.lastAppointment,                            red: false },
                    { label: 'Known conditions',    value: patient.conditions.join(', '),                      red: false },
                    { label: '⚠ Allergies',         value: patient.allergies.join(', '),                       red: true  },
                    { label: 'Current medications', value: patient.medications.map(m => m.name).join(', '),    red: false },
                  ].map(({ label, value, red }) => (
                    <div key={label}>
                      <p className={`text-xs uppercase tracking-wide font-medium mb-0.5 ${red ? 'text-red-400' : 'text-gray-400'}`}>
                        {label}
                      </p>
                      <p className={`text-sm ${red ? 'font-semibold text-red-700' : 'font-medium text-gray-800'}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">
                    Editable sections below — review and complete before adding to timeline
                  </span>
                </div>
              </div>

              {/* 2 · Reason for Visit */}
              <EditableArea
                num={2}
                title="Reason for Visit"
                source="Prefilled from recent symptoms"
                color="amber"
                value={form.reasonForVisit}
                onChange={v => setForm(f => ({ ...f, reasonForVisit: v }))}
                rows={2}
              />

              {/* 3 · Since Last Visit */}
              <EditableArea
                num={3}
                title="Since Last Visit"
                source="Prefilled from timeline"
                color="blue"
                value={form.sinceLast}
                onChange={v => setForm(f => ({ ...f, sinceLast: v }))}
                rows={recentSymptoms.length + documents.length + 2}
                placeholder="• No new activity since last appointment."
              />

              {/* 4 · Subjective */}
              <EditableArea
                num={4}
                title="Subjective / Patient-Reported"
                source="Prefilled from patient-reported data"
                color="amber"
                value={form.subjective}
                onChange={v => setForm(f => ({ ...f, subjective: v }))}
                rows={5}
                placeholder="Patient-reported symptoms, history, and notes…"
              />

              {/* 5 · Objective */}
              <EditableArea
                num={5}
                title="Objective / Records Reviewed"
                source="Prefilled from EMR & uploaded records"
                color="blue"
                value={form.objective}
                onChange={v => setForm(f => ({ ...f, objective: v }))}
                rows={3}
                placeholder="EMR records, lab results, and uploaded documents reviewed…"
              />

              {/* 6 · Assessment */}
              <ClinicalArea
                num={6}
                title="Assessment / Impression"
                hint="Requires clinical judgment — do not auto-diagnose. Write your own clinical impression below."
                value={form.assessment}
                onChange={v => setForm(f => ({ ...f, assessment: v }))}
                placeholder="Physician to complete assessment / clinical impression."
                rows={4}
              />

              {/* 7 · Plan */}
              <ClinicalArea
                num={7}
                title="Plan / Follow-Up"
                hint="Requires clinical review — include follow-up, referrals, documentation requests, or instructions."
                value={form.plan}
                onChange={v => setForm(f => ({ ...f, plan: v }))}
                placeholder="Physician to enter plan, follow-up instructions, referrals, or documentation requests."
                rows={4}
              />

              {/* 8 · Linked Timeline Items */}
              <div>
                <SectionHeader
                  num={8}
                  title="Linked Timeline Items"
                  source={`${selectedNodeIds.size} of ${recentNodes.length} selected`}
                  color="violet"
                />
                {recentNodes.length === 0 ? (
                  <div className="border border-gray-200 rounded-xl px-4 py-6 text-center">
                    <p className="text-sm text-gray-400">No timeline items since last appointment.</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                    {recentNodes.map(node => {
                      const v = verifLabel[node.verificationStatus] ?? { label: node.verificationStatus, classes: 'bg-gray-100 text-gray-500' };
                      return (
                        <label
                          key={node.nodeId}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedNodeIds.has(node.nodeId)}
                            onChange={() => toggleNode(node.nodeId)}
                            className="mt-0.5 accent-violet-600 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 leading-snug">{node.title}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-xs text-gray-400">
                                {new Date(node.eventDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                {nodeTypeLabel[node.type] ?? node.type}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${v.classes}`}>
                                {v.label}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 9 · Documents Reviewed */}
              <div>
                <SectionHeader
                  num={9}
                  title="Documents Reviewed"
                  source={`${selectedDocIds.size} of ${documents.length} selected`}
                  color="blue"
                />
                {documents.length === 0 ? (
                  <div className="border border-gray-200 rounded-xl px-4 py-6 text-center">
                    <p className="text-sm text-gray-400">No documents uploaded.</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                    {documents.map(doc => (
                      <label
                        key={doc.documentId}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocIds.has(doc.documentId)}
                          onChange={() => toggleDoc(doc.documentId)}
                          className="accent-violet-600 flex-shrink-0"
                        />
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{doc.fileName}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {doc.documentType}{doc.documentDate ? ` · ${doc.documentDate}` : ''} · Uploaded by {doc.uploadedBy}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-2" />
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex-shrink-0">
            {submitted ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Visit note added to timeline.</p>
                  <p className="text-xs text-green-600">Navigating to timeline…</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-end gap-2 flex-wrap">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    Save draft
                  </button>
                  <button
                    onClick={handleAddToTimeline}
                    disabled={saving}
                    className="px-5 py-2 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <Stethoscope className="w-4 h-4" />
                    {saving ? 'Saving…' : 'Add visit note to timeline'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">
                  Creates a purple physician contribution node linked to selected items.
                </p>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
