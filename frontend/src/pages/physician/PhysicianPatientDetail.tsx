import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, AlertTriangle, Clock, Pill, Users,
  Heart, FileText, Stethoscope, AlertCircle, Plus, ChevronRight,
  Activity, ShieldCheck, ClipboardList,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import TimelineView from '../../components/timeline/TimelineView';
import VerificationBadge from '../../components/shared/VerificationBadge';
import VisitFormModal from '../../components/physician/VisitFormModal';
import { physicianService } from '../../services/physicianService';
import { timelineService } from '../../services/timelineService';
import type { Patient, TimelineNode, UploadedDoc, AccessRequest, SymptomDetails } from '../../types';

type TabKey = 'overview' | 'timeline' | 'documents' | 'visit_notes';

// ─── Patient header ───────────────────────────────────────────────────────────

function PatientHeader({ patient, accessRequests, onBack }: {
  patient: Patient;
  accessRequests: AccessRequest[];
  onBack: () => void;
}) {
  const access = accessRequests.find(r => r.status === 'APPROVED');
  const initials = patient.name.split(' ').map(n => n[0]).join('');

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
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
                <span className="text-sm text-gray-500">{patient.age} y/o · {patient.gender}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {patient.conditions.map(c => (
                  <span key={c} className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-100">{c}</span>
                ))}
                {patient.allergies.map(a => (
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
            <p className="text-xs text-gray-400 mt-1">Last appointment: {patient.lastAppointment}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Patient snapshot sidebar ─────────────────────────────────────────────────

function PatientSidebar({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Conditions</p>
        <div className="space-y-1">
          {patient.conditions.map(c => (
            <div key={c} className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-sm text-gray-700">{c}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">⚠ Allergies</p>
        <div className="space-y-1">
          {patient.allergies.map(a => (
            <p key={a} className="text-sm font-semibold text-red-700">{a}</p>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Current medications</p>
        <div className="space-y-2">
          {patient.medications.map(m => (
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

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Family history</p>
        <div className="space-y-2">
          {patient.familyHistory.map(f => (
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

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Care team</p>
        <div className="space-y-2">
          {patient.careTeam.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <Stethoscope className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-gray-700">{d.name}</span>
                <span className="text-xs text-gray-400"> · {d.specialty}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center">Last updated {patient.lastUpdated}</div>
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

function SinceLastVisit({ nodes, lastAppointment, patientName, onOpenTimeline, onOpenVisitForm }: {
  nodes: TimelineNode[];
  lastAppointment: string;
  patientName: string;
  onOpenTimeline: () => void;
  onOpenVisitForm: () => void;
}) {
  const sinceNodes = nodes.filter(n => lastAppointment && n.eventDate > lastAppointment);
  const symptoms = sinceNodes.filter(n => n.type === 'PATIENT_SYMPTOM');
  const docs = sinceNodes.filter(n => n.type === 'UPLOADED_DOCUMENT');
  const needsReview = sinceNodes.filter(n => n.verificationStatus === 'NEEDS_REVIEW');

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-blue-900 mb-1">
        Since last visit{lastAppointment ? ` — ${new Date(lastAppointment).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}
      </h3>
      <p className="text-sm text-blue-700 leading-relaxed mb-4">
        {patientName}
        {symptoms.length > 0
          ? ` reported ${symptoms.length} new symptom${symptoms.length > 1 ? 's' : ''} since the last appointment.`
          : ' has no new symptoms since the last appointment.'}
        {docs.length > 0 ? ` Uploaded ${docs.length} document${docs.length > 1 ? 's' : ''}.` : ''}
        {needsReview.length > 0 ? ` ${needsReview.length} item${needsReview.length > 1 ? 's' : ''} need${needsReview.length === 1 ? 's' : ''} review.` : ''}
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

function SymptomCards({ nodes, lastAppointment, onTimelineClick }: {
  nodes: TimelineNode[];
  lastAppointment: string;
  onTimelineClick: () => void;
}) {
  const symptoms = nodes
    .filter(n => n.type === 'PATIENT_SYMPTOM' && (!lastAppointment || n.eventDate > lastAppointment))
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
                      d?.severity === 'SEVERE' ? 'text-red-600' : d?.severity === 'MODERATE' ? 'text-amber-600' : 'text-green-600'
                    }>{d?.severity}</strong></span>
                    <span>Status: {d?.status}</span>
                    {d?.frequency && <span>Frequency: {d.frequency}</span>}
                  </div>
                  {d?.triggers && (
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

function VisitNotesTab({ patientId, nodes, onNodeAdded }: {
  patientId: string;
  nodes: TimelineNode[];
  onNodeAdded: (node: TimelineNode) => void;
}) {
  const [form, setForm] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    reason: '',
    summary: '',
    assessment: '',
    plan: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const existingNotes = nodes
    .filter(n => n.type === 'PHYSICIAN_ENTERED' && n.contributorRole === 'PHYSICIAN')
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.summary.trim() || saving) return;
    setSaving(true);

    const now = new Date().toISOString();
    const nodePayload: Partial<TimelineNode> = {
      nodeId: `node-visit-${Date.now()}`,
      patientId,
      type: 'PHYSICIAN_ENTERED',
      title: `Visit note — ${new Date(form.visitDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      summary: form.summary.trim(),
      eventDate: form.visitDate,
      datePrecision: 'EXACT',
      tags: ['visit-note', 'physician'],
      details: {
        entryType: 'VISIT_SUMMARY',
        note: form.summary.trim(),
        assessment: form.assessment.trim() || undefined,
        changesMade: form.reason.trim() || 'Physician visit',
        followUpPlan: form.plan.trim() || undefined,
      },
      physicianNotes: [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      const saved = await timelineService.addPhysicianNode(patientId, nodePayload);
      onNodeAdded(saved);
      setForm({ visitDate: new Date().toISOString().split('T')[0], reason: '', summary: '', assessment: '', plan: '' });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.error('Failed to save visit note:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            disabled={saving}
            className="w-full bg-violet-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> {saving ? 'Saving…' : 'Add visit note to timeline'}
          </button>
        </form>
      </div>

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

function DocumentsTab({ documents }: { documents: UploadedDoc[] }) {
  const statusConfig = {
    EXTRACTED: { label: 'Extracted', classes: 'bg-green-100 text-green-700' },
    PENDING: { label: 'Processing', classes: 'bg-amber-100 text-amber-700' },
    NEEDS_REVIEW: { label: 'Needs review', classes: 'bg-amber-100 text-amber-700' },
    FAILED: { label: 'Failed', classes: 'bg-red-100 text-red-600' },
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Patient documents <span className="text-gray-400 font-normal">({documents.length})</span>
      </h3>
      <div className="grid gap-3">
        {documents.map(doc => {
          const sc = statusConfig[doc.extractionStatus];
          return (
            <div key={doc.documentId} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{doc.fileName}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.classes}`}>
                      {sc.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {doc.documentType} · Uploaded by {doc.uploadedBy}
                  </p>
                  {doc.documentDate && (
                    <p className="text-xs text-gray-400">Document date: {doc.documentDate}</p>
                  )}
                  {doc.extractedItems && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(doc.extractedItems).map(([k, vals]) =>
                        vals && vals.length > 0 ? (
                          <div key={k} className="flex flex-wrap gap-1">
                            <span className="text-xs text-gray-400 mr-1 capitalize">{k}:</span>
                            {vals.slice(0, 3).map((v, i) => (
                              <span key={i} className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{v}</span>
                            ))}
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {documents.length === 0 && (
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
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showVisitForm, setShowVisitForm] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [timeline, setTimeline] = useState<TimelineNode[]>([]);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);

  useEffect(() => {
    if (!patientId) return;
    setIsLoading(true);
    physicianService.getPatientDetail(patientId)
      .then(data => {
        setPatient(data.patient);
        setTimeline(data.timeline);
        setDocuments(data.documents);
        setAccessRequests(data.accessRequests);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [patientId]);

  const handleNodeAdded = useCallback((node: TimelineNode) => {
    setTimeline(prev => [node, ...prev]);
  }, []);

  const patientNodes = useMemo(
    () => timeline.filter(n => n.patientId === patientId),
    [timeline, patientId]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-sm text-gray-400">Loading patient data…</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <p className="text-gray-500">Patient not found.</p>
        <button onClick={() => navigate('/physician')} className="mt-4 text-teal-600 hover:underline text-sm">
          Back to patient list
        </button>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'documents', label: 'Documents' },
    { key: 'visit_notes', label: 'Visit notes' },
  ];

  return (
    <div>
      <PatientHeader patient={patient} accessRequests={accessRequests} onBack={() => navigate('/physician')} />

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-10">
        <div className="max-w-screen-xl mx-auto px-6 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-6 py-6">

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <SinceLastVisit
                nodes={patientNodes}
                lastAppointment={patient.lastAppointment}
                patientName={patient.name}
                onOpenTimeline={() => setActiveTab('timeline')}
                onOpenVisitForm={() => setShowVisitForm(true)}
              />
              <SymptomCards nodes={patientNodes} lastAppointment={patient.lastAppointment} onTimelineClick={() => setActiveTab('timeline')} />
              <MissingInfoPanel />
            </div>
            <div>
              <PatientSidebar patient={patient} />
            </div>
          </div>
        )}

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
              <PatientSidebar patient={patient} />
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DocumentsTab documents={documents} />
            </div>
            <div className="hidden lg:block">
              <PatientSidebar patient={patient} />
            </div>
          </div>
        )}

        {activeTab === 'visit_notes' && (
          <VisitNotesTab
            patientId={patientId!}
            nodes={patientNodes}
            onNodeAdded={handleNodeAdded}
          />
        )}
      </div>

      {showVisitForm && (
        <VisitFormModal
          nodes={patientNodes}
          patient={patient}
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
