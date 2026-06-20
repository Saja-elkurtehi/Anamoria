import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, AlertTriangle, Clock, Pill, Users,
  Heart, FileText, AlertCircle, Plus, ChevronRight,
  Activity, ShieldCheck, ClipboardList, Sparkles,
  Package, User2, Loader2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { demoPatient, DEMO_PATIENT_ID, DEMO_PHYSICIAN_ID, LAST_APPOINTMENT } from '../../data/mockData';
import TimelineView from '../../components/timeline/TimelineView';
import VerificationBadge from '../../components/shared/VerificationBadge';
import SourceBadge from '../../components/shared/SourceBadge';
import VisitFormModal from '../../components/physician/VisitFormModal';
import AIBriefTab from '../../components/physician/AIBriefTab';
import ReferencePackageTab from '../../components/physician/ReferencePackageTab';
import RequisitionDraftTab from '../../components/physician/RequisitionDraftTab';
import PatientProfileTab from '../../components/physician/PatientProfileTab';
import type { TimelineNode, SymptomDetails } from '../../types';

type TabKey = 'overview' | 'timeline' | 'documents' | 'visit_notes' | 'ai_brief' | 'referral_package' | 'requisition' | 'profile';

// ─── Patient header ───────────────────────────────────────────────────────────

function PatientHeader({ onBack }: { onBack: () => void }) {
  const { state } = useApp();
  const access = state.accessRequests.find(
    r => r.patientId === DEMO_PATIENT_ID && r.status === 'APPROVED'
  );

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to patients
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg flex-shrink-0">
              LH
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{demoPatient.name}</h1>
                <span className="text-sm text-gray-500">{demoPatient.age} y/o · {demoPatient.gender}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {demoPatient.conditions.map(c => (
                  <span key={c} className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-100">{c}</span>
                ))}
                {demoPatient.allergies.map(a => (
                  <span key={a} className="flex items-center gap-1 bg-red-50 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full border border-red-100">
                    <AlertTriangle className="w-3 h-3" /> {a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="text-right">
            {access ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <ShieldCheck className="w-4 h-4" />
                Access approved
                {access.respondedAt && ` · ${new Date(access.respondedAt).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}`}
              </div>
            ) : (
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Access pending
              </span>
            )}
            <p className="text-xs text-gray-400 mt-1">Last appointment: {demoPatient.lastAppointment}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Patient snapshot sidebar ─────────────────────────────────────────────────

function PatientSidebar() {
  return (
    <div className="space-y-4">
      {/* Conditions */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Conditions</p>
        <div className="space-y-1">
          {demoPatient.conditions.map(c => (
            <div key={c} className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-sm text-gray-700">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">⚠ Allergies</p>
        <div className="space-y-1">
          {demoPatient.allergies.map(a => (
            <p key={a} className="text-sm font-semibold text-red-700">{a}</p>
          ))}
        </div>
      </div>

      {/* Medications */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Current medications</p>
        <div className="space-y-2">
          {demoPatient.medications.map(m => (
            <div key={m.name} className="flex items-start gap-2">
              <Pill className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-700">{m.name}</p>
                <p className="text-xs text-gray-400">{m.dose} · {m.frequency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Family history */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Family history</p>
        <div className="space-y-2">
          {demoPatient.familyHistory.map(f => (
            <div key={f.relationship} className="flex items-start gap-2">
              <Users className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-gray-600">{f.relationship}: </span>
                <span className="text-xs text-gray-500">{f.conditions.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center">Last updated {demoPatient.lastUpdated}</div>
    </div>
  );
}

// ─── Missing info panel ───────────────────────────────────────────────────────

function MissingInfoPanel() {
  const { state, updateMissingInfo } = useApp();
  const open = state.missingInfo.filter(m => m.status !== 'RESOLVED');

  if (open.length === 0) return null;

  const priorityColor: Record<string, string> = {
    HIGH: 'text-red-500',
    MEDIUM: 'text-amber-500',
    LOW: 'text-gray-400',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-900">
          Needs attention <span className="text-gray-400 font-normal">({open.length})</span>
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {open.map(item => (
          <div key={item.id} className="p-3 flex items-start gap-3">
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${priorityColor[item.priority]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 leading-relaxed">{item.description}</p>
              {item.status === 'ASKED' && (
                <span className="text-xs text-blue-500 font-medium">Clarification requested</span>
              )}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {item.status === 'OPEN' && (
                <button
                  onClick={() => updateMissingInfo(item.id, 'ASKED')}
                  className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                >
                  Ask patient
                </button>
              )}
              <button
                onClick={() => updateMissingInfo(item.id, 'RESOLVED')}
                className="text-xs text-green-600 hover:underline whitespace-nowrap"
              >
                Resolve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Since last visit ─────────────────────────────────────────────────────────

function SinceLastVisit({ nodes, onOpenTimeline, onOpenVisitForm }: { nodes: TimelineNode[]; onOpenTimeline: () => void; onOpenVisitForm: () => void }) {
  const sinceNodes = nodes.filter(n => n.eventDate > LAST_APPOINTMENT);
  const symptoms = sinceNodes.filter(n => n.type === 'PATIENT_SYMPTOM');
  const docs = sinceNodes.filter(n => n.type === 'UPLOADED_DOCUMENT');
  const needsReview = sinceNodes.filter(n => n.verificationStatus === 'NEEDS_REVIEW');

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-blue-900 mb-1">
        Since last visit — {new Date(LAST_APPOINTMENT).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
      </h3>
      <p className="text-sm text-blue-700 leading-relaxed mb-4">
        Layla has a confirmed history of asthma and eczema.
        {symptoms.length > 0
          ? ` Since her last appointment, she reported ${symptoms.length} new symptom${symptoms.length > 1 ? 's' : ''}.`
          : ' No new symptoms reported.'}
        {docs.length > 0
          ? ` She also uploaded ${docs.length} document${docs.length > 1 ? 's' : ''}.`
          : ''}
        {needsReview.length > 0
          ? ` ${needsReview.length} item${needsReview.length > 1 ? 's' : ''} still need${needsReview.length === 1 ? 's' : ''} review.`
          : ''}
      </p>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'New symptoms', count: symptoms.length, color: 'bg-amber-100 text-amber-700', icon: Activity },
          { label: 'New documents', count: docs.length, color: 'bg-blue-100 text-blue-700', icon: FileText },
          { label: 'Needs review', count: needsReview.length, color: 'bg-red-100 text-red-600', icon: AlertTriangle },
        ].map(item => (
          <div key={item.label} className={`${item.color} rounded-lg px-3 py-2.5 text-center`}>
            <p className="text-xl font-bold">{item.count}</p>
            <p className="text-xs font-medium mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
        {sinceNodes.length > 0 && (
          <button
            onClick={onOpenTimeline}
            className="text-sm font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1 transition-colors"
          >
            View changes in timeline <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onOpenVisitForm}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
        >
          <ClipboardList className="w-4 h-4" />
          Generate Prefilled Visit Form
        </button>
      </div>
    </div>
  );
}

// ─── Symptom cards ────────────────────────────────────────────────────────────

function SymptomCards({ nodes, onTimelineClick }: { nodes: TimelineNode[]; onTimelineClick: () => void }) {
  const symptoms = nodes
    .filter(n => n.type === 'PATIENT_SYMPTOM' && n.eventDate > LAST_APPOINTMENT)
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  if (symptoms.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Symptoms since last visit
        <span className="ml-2 text-xs font-normal text-gray-400">({symptoms.length})</span>
      </h3>
      <div className="space-y-3">
        {symptoms.map(node => {
          const d = node.details as SymptomDetails;
          const reviewed = node.verificationStatus !== 'NEEDS_REVIEW';

          return (
            <div key={node.nodeId} className={`bg-white border rounded-xl p-4 ${reviewed ? 'border-gray-200' : 'border-amber-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{node.title}</p>
                    <VerificationBadge status={node.verificationStatus} size="sm" />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Reported {new Date(node.eventDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>Severity: <strong className={
                      d.severity === 'SEVERE' ? 'text-red-600' : d.severity === 'MODERATE' ? 'text-amber-600' : 'text-green-600'
                    }>{d.severity}</strong></span>
                    <span>Status: {d.status}</span>
                    {d.frequency && <span>Frequency: {d.frequency}</span>}
                  </div>
                  {d.triggers && (
                    <p className="text-xs text-gray-400 mt-1">Triggers: {d.triggers}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onTimelineClick}
                className="mt-3 text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
              >
                Review in timeline <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Visit notes tab ──────────────────────────────────────────────────────────

function VisitNotesTab() {
  const { state, addTimelineNode } = useApp();
  const [form, setForm] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    reason: '',
    summary: '',
    assessment: '',
    plan: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const existingNotes = state.timelineNodes.filter(
    n => n.type === 'PHYSICIAN_ENTERED' && n.contributorRole === 'PHYSICIAN'
  ).sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.summary.trim()) return;

    const now = new Date().toISOString();
    const node: TimelineNode = {
      nodeId: `node-visit-${Date.now()}`,
      patientId: DEMO_PATIENT_ID,
      type: 'PHYSICIAN_ENTERED',
      title: `Visit note — ${new Date(form.visitDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      summary: form.summary.trim(),
      eventDate: form.visitDate,
      datePrecision: 'EXACT',
      sourceType: 'PHYSICIAN_CONTRIBUTION',
      verificationStatus: 'VERIFIED_BY_PHYSICIAN',
      confidenceLevel: 'HIGH',
      contributorName: 'Dr. Amir Khan',
      contributorRole: 'PHYSICIAN',
      relatedDocumentIds: [],
      relatedNodeIds: [],
      tags: ['visit-note', 'physician'],
      details: {
        entryType: 'VISIT_SUMMARY',
        physicianName: 'Dr. Amir Khan',
        specialty: 'Dermatology',
        clinic: 'Riverside Family Health Clinic',
        note: form.summary.trim(),
        assessment: form.assessment.trim() || undefined,
        linkedSymptomIds: [],
        linkedRecordIds: [],
        linkedRequisitionIds: [],
        changesMade: form.reason.trim() || 'Physician visit',
        followUpPlan: form.plan.trim() || undefined,
      },
      physicianNotes: [],
      createdAt: now,
      updatedAt: now,
    };

    addTimelineNode(node);
    setForm({ visitDate: new Date().toISOString().split('T')[0], reason: '', summary: '', assessment: '', plan: '' });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Plus className="w-4 h-4 text-violet-600" />
          <h3 className="text-sm font-semibold text-gray-900">Add visit note</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Visit date</label>
            <input
              type="date"
              value={form.visitDate}
              onChange={e => setForm(f => ({ ...f, visitDate: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason for visit</label>
            <input
              type="text"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Follow-up — eczema flare"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Summary note *</label>
            <textarea
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="Clinical summary for this visit…"
              rows={4}
              required
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assessment / impression</label>
            <textarea
              value={form.assessment}
              onChange={e => setForm(f => ({ ...f, assessment: e.target.value }))}
              placeholder="Clinical assessment or diagnostic impression…"
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Plan / follow-up</label>
            <textarea
              value={form.plan}
              onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
              placeholder="Follow-up instructions, next steps, referrals…"
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {submitted && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-sm text-green-700 font-medium">Visit note added to timeline.</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-violet-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add visit note to timeline
          </button>
        </form>
      </div>

      {/* Previous notes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Previous physician notes</h3>
        <div className="space-y-3">
          {existingNotes.slice(0, 5).map(n => (
            <div key={n.nodeId} className="bg-white border border-violet-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-violet-700">{n.contributorName}</p>
                <p className="text-xs text-gray-400">{new Date(n.eventDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{n.summary}</p>
            </div>
          ))}
          {existingNotes.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No physician notes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Documents tab ────────────────────────────────────────────────────────────

const MOCK_EXTRACTIONS: Record<string, { findings: string[]; medications?: string[]; doctors: string[]; followUp: string[] }> = {
  default: {
    findings: ['Relevant clinical findings extracted from document', 'Additional lab or diagnostic values noted'],
    medications: ['Current medications identified in document'],
    doctors: ['Referring/ordering physician identified'],
    followUp: ['Follow-up recommendations extracted'],
  },
};

function DocumentsTab() {
  const { state } = useApp();
  const [extractionState, setExtractionState] = useState<Record<string, 'idle' | 'extracting' | 'done'>>({});
  const [includeInReferral, setIncludeInReferral] = useState<Record<string, boolean>>({});

  function handleExtract(docId: string) {
    setExtractionState(s => ({ ...s, [docId]: 'extracting' }));
    setTimeout(() => {
      setExtractionState(s => ({ ...s, [docId]: 'done' }));
    }, 1500);
  }

  const statusConfig = {
    EXTRACTED: { label: 'Extracted', classes: 'bg-green-100 text-green-700' },
    PENDING: { label: 'Pending', classes: 'bg-amber-100 text-amber-700' },
    NEEDS_REVIEW: { label: 'Needs review', classes: 'bg-amber-100 text-amber-700' },
    FAILED: { label: 'Failed', classes: 'bg-red-100 text-red-600' },
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Patient documents <span className="text-gray-400 font-normal">({state.documents.length})</span>
      </h3>
      <div className="grid gap-4">
        {state.documents.map(doc => {
          const sc = statusConfig[doc.extractionStatus];
          const exState = extractionState[doc.documentId] ?? 'idle';
          const isExtracted = doc.extractionStatus === 'EXTRACTED' || exState === 'done';
          const mockExtract = MOCK_EXTRACTIONS.default;
          const includedInReferral = includeInReferral[doc.documentId] ?? false;

          return (
            <div key={doc.documentId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{doc.fileName}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isExtracted ? 'bg-green-100 text-green-700' : sc.classes
                    }`}>
                      {isExtracted ? 'Extracted' : sc.label}
                    </span>
                    {includedInReferral && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                        In referral
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {doc.documentType} · Uploaded by {doc.uploadedBy}
                  </p>
                  {doc.documentDate && (
                    <p className="text-xs text-gray-400">Document date: {doc.documentDate}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isExtracted && exState !== 'extracting' && (
                    <button
                      onClick={() => handleExtract(doc.documentId)}
                      className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1.5 hover:bg-blue-50 transition-colors"
                    >
                      Extract Info
                    </button>
                  )}
                  {exState === 'extracting' && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Extracting…
                    </span>
                  )}
                </div>
              </div>

              {/* Extracted fields */}
              {isExtracted && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
                  {Object.entries(doc.extractedItems ?? mockExtract).map(([k, vals]) =>
                    vals && vals.length > 0 ? (
                      <div key={k}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 capitalize">{k}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {vals.slice(0, 4).map((v, i) => (
                            <span key={i} className="bg-white border border-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full shadow-sm">{v}</span>
                          ))}
                          {vals.length > 4 && <span className="text-xs text-gray-400">+{vals.length - 4} more</span>}
                        </div>
                      </div>
                    ) : null
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <button className="text-xs text-violet-600 border border-violet-200 rounded-lg px-2.5 py-1.5 hover:bg-violet-50 transition-colors font-medium">
                        Create Timeline Node
                      </button>
                      <button className="text-xs text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 transition-colors font-medium">
                        Link to Existing
                      </button>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includedInReferral}
                        onChange={e => setIncludeInReferral(s => ({ ...s, [doc.documentId]: e.target.checked }))}
                        className="w-3.5 h-3.5 accent-teal-600"
                      />
                      <span className="text-xs text-gray-700 font-medium">Include in referral package</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {state.documents.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No documents uploaded.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main physician patient detail ────────────────────────────────────────────

export default function PhysicianPatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showVisitForm, setShowVisitForm] = useState(false);

  const patientNodes = useMemo(
    () => state.timelineNodes.filter(n => n.patientId === DEMO_PATIENT_ID),
    [state.timelineNodes]
  );

  if (patientId !== DEMO_PATIENT_ID) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <p className="text-gray-500">Patient not found in demo data.</p>
        <button onClick={() => navigate('/physician')} className="mt-4 text-teal-600 hover:underline text-sm">
          Back to patient list
        </button>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon?: React.ReactNode }[] = [
    { key: 'overview',        label: 'Overview' },
    { key: 'profile',         label: 'Patient Profile', icon: <User2 className="w-3.5 h-3.5" /> },
    { key: 'timeline',        label: 'Timeline' },
    { key: 'documents',       label: 'Documents' },
    { key: 'visit_notes',     label: 'Visit notes' },
    { key: 'ai_brief',        label: 'AI Brief',          icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'referral_package',label: 'Referral Package',  icon: <Package className="w-3.5 h-3.5" /> },
    { key: 'requisition',     label: 'Requisition',       icon: <ClipboardList className="w-3.5 h-3.5" /> },
  ];

  return (
    <div>
      <PatientHeader onBack={() => navigate('/physician')} />

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-10">
        <div className="max-w-screen-xl mx-auto px-6 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-6 py-6">

        {/* ── Overview tab ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <SinceLastVisit
                nodes={patientNodes}
                onOpenTimeline={() => setActiveTab('timeline')}
                onOpenVisitForm={() => setShowVisitForm(true)}
              />
              <SymptomCards nodes={patientNodes} onTimelineClick={() => setActiveTab('timeline')} />
              <MissingInfoPanel />
            </div>
            <div>
              <PatientSidebar />
            </div>
          </div>
        )}

        {/* ── Timeline tab ─────────────────────────────────────────────────── */}
        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TimelineView
                nodes={patientNodes}
                role="physician"
                availableFilters={['all', 'needs_review', 'verified', 'patient_reported', 'physician', 'documents_emr', 'conflicts']}
              />
            </div>
            <div className="hidden lg:block">
              <PatientSidebar />
            </div>
          </div>
        )}

        {/* ── Documents tab ─────────────────────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DocumentsTab />
            </div>
            <div className="hidden lg:block">
              <PatientSidebar />
            </div>
          </div>
        )}

        {/* ── Visit notes tab ───────────────────────────────────────────────── */}
        {activeTab === 'visit_notes' && (
          <VisitNotesTab />
        )}

        {/* ── AI Brief tab ──────────────────────────────────────────────────── */}
        {activeTab === 'ai_brief' && (
          <AIBriefTab
            patientProfile={demoPatient}
            timelineNodes={patientNodes}
            documents={state.documents}
            lastVisitDate={LAST_APPOINTMENT}
          />
        )}

        {/* ── Patient Profile tab ───────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <PatientProfileTab />
        )}

        {/* ── Referral Package tab ──────────────────────────────────────────── */}
        {activeTab === 'referral_package' && (
          <ReferencePackageTab
            patientProfile={demoPatient}
            timelineNodes={patientNodes}
            documents={state.documents}
          />
        )}

        {/* ── Requisition tab ───────────────────────────────────────────────── */}
        {activeTab === 'requisition' && (
          <RequisitionDraftTab
            patientProfile={demoPatient}
            timelineNodes={patientNodes}
            documents={state.documents}
          />
        )}
      </div>

      {/* ── Prefilled visit form modal ─────────────────────────────────────── */}
      {showVisitForm && (
        <VisitFormModal
          nodes={patientNodes}
          onClose={() => setShowVisitForm(false)}
          onAddedToTimeline={() => {
            setShowVisitForm(false);
            setActiveTab('timeline');
          }}
        />
      )}
    </div>
  );
}
