import { useState } from 'react';
import {
  Package, AlertCircle, Loader2, ChevronDown, ChevronRight,
  CheckCircle, FileText, RefreshCw, Share2, Copy, Check,
  Download, Pencil, X, Plus, Eye,
} from 'lucide-react';
import type { Patient, TimelineNode, UploadedDoc } from '../../types';
import type {
  ReferralPackageResponse, PackageType,
  AITimelineNode, AIDocument, AIPhysicianNote, SourceLinkedText,
} from '../../../../shared/types';
import { aiService } from '../../services/aiService';
import SourceChip from '../shared/SourceChip';
import { exportReferralPackagePDF } from '../../utils/exportPDF';

interface Props {
  patientProfile: Patient;
  timelineNodes: TimelineNode[];
  documents: UploadedDoc[];
}

function extractError(e: unknown): string {
  if (e && typeof e === 'object' && 'response' in e) {
    const ax = e as { response?: { data?: { error?: string } } };
    if (ax.response?.data?.error) return ax.response.data.error;
  }
  if (e instanceof Error) return e.message;
  return 'Generation failed. Check that the backend is running (cd backend && npm run dev) and your OPENAI_API_KEY is set in backend/.env.';
}

const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  LAB_REQUISITION: 'Lab Requisition',
  IMAGING_REQUISITION: 'Imaging Requisition',
  SPECIALIST_REFERRAL: 'Specialist Referral',
  GENERAL_HANDOFF: 'General Handoff',
};

function mapNodes(nodes: TimelineNode[]): AITimelineNode[] {
  return nodes.map(n => ({
    nodeId: n.nodeId,
    type: n.type,
    title: n.title,
    summary: n.summary,
    eventDate: n.eventDate,
    sourceType: n.sourceType,
    verificationStatus: n.verificationStatus,
    confidenceLevel: n.confidenceLevel,
    contributorName: n.contributorName,
    contributorRole: n.contributorRole,
    tags: n.tags,
    physicianNotes: n.physicianNotes.map(pn => ({
      noteId: pn.noteId,
      physicianName: pn.physicianName,
      specialty: pn.specialty,
      content: pn.content,
      noteType: pn.noteType,
      createdAt: pn.createdAt,
    })),
  }));
}

function mapDocs(docs: UploadedDoc[]): AIDocument[] {
  return docs.map(d => ({
    documentId: d.documentId,
    fileName: d.fileName,
    documentType: d.documentType,
    uploadedBy: d.uploadedBy,
    uploadedAt: d.uploadedAt,
    documentDate: d.documentDate,
    extractionStatus: d.extractionStatus,
    extractedItems: d.extractedItems,
  }));
}

function mapPhysicianNotes(nodes: TimelineNode[]): AIPhysicianNote[] {
  return nodes.flatMap(n =>
    n.physicianNotes.map(pn => ({
      noteId: pn.noteId,
      physicianName: pn.physicianName,
      specialty: pn.specialty,
      content: pn.content,
      noteType: pn.noteType,
      createdAt: pn.createdAt,
    }))
  );
}

// ─── Editable section list ────────────────────────────────────────────────────

function EditableSectionList({
  items,
  sectionKey,
  sourceMap,
  editedItems,
  onEdit,
  onAdd,
  onRemove,
}: {
  items: SourceLinkedText[];
  sectionKey: string;
  sourceMap: ReferralPackageResponse['sourceMap'];
  editedItems: Record<string, string>;
  onEdit: (key: string, val: string) => void;
  onAdd: (sectionKey: string) => void;
  onRemove: (key: string) => void;
}) {
  if (items.length === 0 && !Object.keys(editedItems).some(k => k.startsWith(sectionKey))) {
    return (
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">None documented.</p>
        <button onClick={() => onAdd(sectionKey)} className="text-xs text-teal-600 flex items-center gap-1 hover:underline">
          <Plus className="w-3 h-3" /> Add item
        </button>
      </div>
    );
  }
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => {
        const key = `${sectionKey}_${i}`;
        const edited = editedItems[key];
        const displayText = edited !== undefined ? edited : item.text;
        const isRemoved = edited === '__REMOVED__';
        if (isRemoved) return null;
        return (
          <li key={key} className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
            <div className="flex-1">
              <textarea
                value={displayText}
                onChange={e => onEdit(key, e.target.value)}
                rows={2}
                className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-teal-300"
              />
              {item.verificationStatus && (
                <span className="text-xs text-gray-400 italic">({item.verificationStatus})</span>
              )}
              {item.sourceIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.sourceIds.map(sid => (
                    <SourceChip key={sid} sourceId={sid} sourceMap={sourceMap} />
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => onRemove(key)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </li>
        );
      })}
      <button onClick={() => onAdd(sectionKey)} className="text-xs text-teal-600 flex items-center gap-1 hover:underline mt-1">
        <Plus className="w-3 h-3" /> Add item
      </button>
    </ul>
  );
}

function ReadOnlySectionList({ items, sourceMap }: { items: SourceLinkedText[]; sourceMap: ReferralPackageResponse['sourceMap'] }) {
  if (items.length === 0) return <p className="text-xs text-gray-400">None documented.</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
          <div className="flex-1">
            <span className="text-sm text-gray-800">{item.text}</span>
            {item.verificationStatus && (
              <span className="ml-2 text-xs text-gray-400 italic">({item.verificationStatus})</span>
            )}
            {item.sourceIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.sourceIds.map(sid => (
                  <SourceChip key={sid} sourceId={sid} sourceMap={sourceMap} />
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function CollapsibleSection({
  title, badge, children, editMode, onToggleEdit,
}: {
  title: string;
  badge?: number;
  children: React.ReactNode;
  editMode?: boolean;
  onToggleEdit?: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          {badge !== undefined && badge > 0 && (
            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
          )}
        </button>
        <div className="flex items-center gap-2">
          {onToggleEdit && (
            <button
              onClick={onToggleEdit}
              className={`p-1 rounded-lg transition-colors ${editMode ? 'text-teal-600 bg-teal-50' : 'text-gray-400 hover:text-teal-500'}`}
              title={editMode ? 'Done editing' : 'Edit section'}
            >
              {editMode ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={() => setOpen(v => !v)}>
            {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </div>
      {open && <div className="px-5 pb-4 pt-1">{children}</div>}
    </div>
  );
}

// ─── Share link modal ─────────────────────────────────────────────────────────

function ShareModal({ packageId, onClose }: { packageId: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/share/package/${packageId}`;

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
            <Share2 className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Share Referral Package</h3>
            <p className="text-xs text-gray-500">Approved — ready to share</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3">
          <p className="flex-1 text-xs text-gray-700 font-mono truncate">{shareUrl}</p>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
              copied ? 'bg-green-100 text-green-700' : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
          <p className="text-xs text-amber-800">
            <strong>Demo share link only.</strong> In a real deployment, this link would require authentication,
            have an expiry time, generate an audit log entry, and require patient consent.
          </p>
        </div>

        <button onClick={onClose} className="w-full text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl py-2 hover:bg-gray-50 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReferralPackageTab({ patientProfile, timelineNodes, documents }: Props) {
  const [form, setForm] = useState({
    recipientName: '',
    recipientSpecialty: '',
    packageType: 'SPECIALIST_REFERRAL' as PackageType,
    reasonForRequest: '',
    startDate: '',
    endDate: '',
    medications: true,
    allergies: true,
    conditions: true,
    symptoms: true,
    familyHistory: false,
    docs: true,
    physicianNotes: true,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReferralPackageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'DRAFT' | 'NEEDS_REVIEW' | 'APPROVED'>('DRAFT');
  const [showForm, setShowForm] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareWarning, setShareWarning] = useState(false);

  // Editing state
  const [editedItems, setEditedItems] = useState<Record<string, string>>({});
  const [editSections, setEditSections] = useState<Record<string, boolean>>({});
  const [notesForRecipient, setNotesForRecipient] = useState('');
  const [excludedDocs, setExcludedDocs] = useState<Set<string>>(new Set());
  const [addedItems, setAddedItems] = useState<Record<string, string[]>>({});

  function toggleEditSection(key: string) {
    setEditSections(s => ({ ...s, [key]: !s[key] }));
  }

  function handleEditItem(key: string, val: string) {
    setEditedItems(e => ({ ...e, [key]: val }));
  }

  function handleRemoveItem(key: string) {
    setEditedItems(e => ({ ...e, [key]: '__REMOVED__' }));
  }

  function handleAddItem(sectionKey: string) {
    setAddedItems(a => ({
      ...a,
      [sectionKey]: [...(a[sectionKey] ?? []), ''],
    }));
  }

  async function handleGenerate() {
    if (!form.recipientSpecialty.trim() || !form.reasonForRequest.trim()) return;
    setLoading(true);
    setError(null);
    setStatus('DRAFT');
    setShareWarning(false);
    setEditedItems({});
    setAddedItems({});
    setNotesForRecipient('');
    setExcludedDocs(new Set());
    try {
      const data = await aiService.generateReferralPackage({
        patientId: patientProfile.patientId,
        recipientName: form.recipientName.trim() || undefined,
        recipientSpecialty: form.recipientSpecialty.trim(),
        packageType: form.packageType,
        reasonForRequest: form.reasonForRequest.trim(),
        dateRange: (form.startDate || form.endDate)
          ? { startDate: form.startDate || undefined, endDate: form.endDate || undefined }
          : undefined,
        includeOptions: {
          medications: form.medications,
          allergies: form.allergies,
          conditions: form.conditions,
          symptoms: form.symptoms,
          familyHistory: form.familyHistory,
          documents: form.docs,
          physicianNotes: form.physicianNotes,
        },
        patientProfile: {
          patientId: patientProfile.patientId,
          name: patientProfile.name,
          dateOfBirth: (patientProfile as { dateOfBirth?: string }).dateOfBirth,
          age: patientProfile.age,
          gender: patientProfile.gender,
          bloodType: patientProfile.bloodType,
          conditions: patientProfile.conditions,
          allergies: patientProfile.allergies,
          medications: patientProfile.medications,
          familyHistory: patientProfile.familyHistory,
          careTeam: patientProfile.careTeam,
          lastAppointment: patientProfile.lastAppointment,
        },
        timelineNodes: mapNodes(timelineNodes),
        documents: mapDocs(documents),
        physicianNotes: mapPhysicianNotes(timelineNodes),
      });
      setResult(data);
      setShowForm(false);
      localStorage.setItem(`anamoria_pkg_${data.packageId}`, JSON.stringify(data));
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  }

  function getEffectiveItems(sectionKey: string, rawItems: SourceLinkedText[]): SourceLinkedText[] {
    const live = rawItems
      .map((item, i) => {
        const key = `${sectionKey}_${i}`;
        const edited = editedItems[key];
        if (edited === '__REMOVED__') return null;
        return { ...item, text: edited !== undefined ? edited : item.text };
      })
      .filter(Boolean) as SourceLinkedText[];

    const extras = (addedItems[sectionKey] ?? [])
      .filter(t => t.trim())
      .map(text => ({ text, sourceIds: [], confidence: 'MEDIUM' as const }));

    return [...live, ...extras];
  }

  function handleExportPDF() {
    if (!result) return;
    const effectiveResult: ReferralPackageResponse = {
      ...result,
      relevantMedicalHistory: getEffectiveItems('history', result.relevantMedicalHistory),
      currentRelevantSymptoms: getEffectiveItems('symptoms', result.currentRelevantSymptoms),
      relevantConditions: getEffectiveItems('conditions', result.relevantConditions),
      relevantMedications: getEffectiveItems('medications', result.relevantMedications),
      relevantAllergies: getEffectiveItems('allergies', result.relevantAllergies),
      relevantFamilyHistory: getEffectiveItems('family', result.relevantFamilyHistory ?? []),
      documentsToInclude: result.documentsToInclude.filter(d => !excludedDocs.has(d.documentId)),
      missingOrUnverifiedInfo: getEffectiveItems('missing', result.missingOrUnverifiedInfo),
      notesForRecipient,
    };
    exportReferralPackagePDF(
      effectiveResult,
      { name: patientProfile.name, dateOfBirth: (patientProfile as { dateOfBirth?: string }).dateOfBirth, age: patientProfile.age, gender: patientProfile.gender, bloodType: patientProfile.bloodType },
      status,
      notesForRecipient,
    );
  }

  function handleShare() {
    if (status !== 'APPROVED') {
      setShareWarning(true);
      return;
    }
    setShareWarning(false);
    // Save latest edits to localStorage before sharing
    if (result) {
      const effectiveResult: ReferralPackageResponse = {
        ...result,
        relevantMedicalHistory: getEffectiveItems('history', result.relevantMedicalHistory),
        currentRelevantSymptoms: getEffectiveItems('symptoms', result.currentRelevantSymptoms),
        relevantConditions: getEffectiveItems('conditions', result.relevantConditions),
        relevantMedications: getEffectiveItems('medications', result.relevantMedications),
        relevantAllergies: getEffectiveItems('allergies', result.relevantAllergies),
        relevantFamilyHistory: getEffectiveItems('family', result.relevantFamilyHistory ?? []),
        documentsToInclude: result.documentsToInclude.filter(d => !excludedDocs.has(d.documentId)),
        missingOrUnverifiedInfo: getEffectiveItems('missing', result.missingOrUnverifiedInfo),
        notesForRecipient,
      };
      localStorage.setItem(`anamoria_pkg_${result.packageId}`, JSON.stringify(effectiveResult));
    }
    setShowShareModal(true);
  }

  const checkbox = (key: keyof typeof form, label: string) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={form[key] as boolean}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
        className="w-3.5 h-3.5 accent-teal-600"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Safety banner */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>AI-generated draft. Physician must review and approve before sending.</strong>{' '}
          Sources are shown for verification. Every generated claim is traceable to patient records.
        </p>
      </div>

      {/* Form */}
      {showForm ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-gray-900">Configure Referral Package</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Recipient name (optional)</label>
                <input
                  type="text"
                  value={form.recipientName}
                  onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))}
                  placeholder="e.g. Dr. Priya Mehta"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Recipient specialty *</label>
                <input
                  type="text"
                  value={form.recipientSpecialty}
                  onChange={e => setForm(f => ({ ...f, recipientSpecialty: e.target.value }))}
                  placeholder="e.g. Pulmonology"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Package type *</label>
              <select
                value={form.packageType}
                onChange={e => setForm(f => ({ ...f, packageType: e.target.value as PackageType }))}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                {(Object.entries(PACKAGE_TYPE_LABELS) as [PackageType, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason for referral / request *</label>
              <textarea
                value={form.reasonForRequest}
                onChange={e => setForm(f => ({ ...f, reasonForRequest: e.target.value }))}
                placeholder="e.g. Shortness of breath on exertion in patient with EMR-confirmed asthma. Requesting evaluation."
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From date (optional)</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To date (optional)</label>
                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Include in package</p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {checkbox('medications', 'Medications')}
                {checkbox('allergies', 'Allergies')}
                {checkbox('conditions', 'Conditions')}
                {checkbox('symptoms', 'Symptoms')}
                {checkbox('familyHistory', 'Family history')}
                {checkbox('docs', 'Documents')}
                {checkbox('physicianNotes', 'Physician notes')}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <p className="text-xs text-red-700 font-medium">Error</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !form.recipientSpecialty.trim() || !form.reasonForRequest.trim()}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
              ) : (
                <><Package className="w-4 h-4" />Generate Referral Package</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setShowForm(true); setResult(null); }}
          className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reconfigure &amp; regenerate
        </button>
      )}

      {/* Result */}
      {result && (
        <>
          {/* Meta bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                status === 'APPROVED'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}>
                {status === 'APPROVED' ? '✓ Approved' : 'Draft · Needs physician review'}
              </span>
              <span className="text-xs text-gray-400">
                {PACKAGE_TYPE_LABELS[result.recipientContext.packageType as PackageType] ?? result.recipientContext.packageType}
                {' → '}{result.recipientContext.recipientSpecialty}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {status !== 'APPROVED' && (
                <button
                  onClick={() => setStatus('APPROVED')}
                  className="flex items-center gap-1.5 text-xs text-white font-semibold bg-teal-600 hover:bg-teal-700 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve Package
                </button>
              )}
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 border border-teal-200 rounded-lg px-2.5 py-1.5 hover:bg-teal-50 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share Link
              </button>
            </div>
          </div>

          {shareWarning && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                <strong>Approve the package first</strong> before generating a share link.
              </p>
            </div>
          )}

          {result.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
              {result.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* Recipient context */}
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2">Recipient Context</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {result.recipientContext.recipientName && (
                <><span className="text-gray-500">Recipient</span><span className="text-gray-800 font-medium">{result.recipientContext.recipientName}</span></>
              )}
              <span className="text-gray-500">Specialty</span><span className="text-gray-800 font-medium">{result.recipientContext.recipientSpecialty}</span>
              <span className="text-gray-500">Type</span><span className="text-gray-800 font-medium">{PACKAGE_TYPE_LABELS[result.recipientContext.packageType as PackageType] ?? result.recipientContext.packageType}</span>
              <span className="text-gray-500">Reason</span>
              <span className="text-gray-800 leading-snug">{result.recipientContext.reasonForRequest}</span>
            </div>
          </div>

          {/* Notes for recipient — always editable */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pencil className="w-3.5 h-3.5 text-teal-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes for Recipient</p>
              <span className="text-xs text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">Editable</span>
            </div>
            <textarea
              value={notesForRecipient}
              onChange={e => setNotesForRecipient(e.target.value)}
              placeholder="Add any additional context or instructions for the receiving physician…"
              rows={3}
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>

          {/* Dynamic sections with inline editing */}
          {([
            { key: 'history',    title: 'Relevant Medical History',    items: result.relevantMedicalHistory },
            { key: 'symptoms',   title: 'Current Relevant Symptoms',   items: result.currentRelevantSymptoms },
            { key: 'conditions', title: 'Relevant Conditions',         items: result.relevantConditions },
            { key: 'medications',title: 'Relevant Medications',        items: result.relevantMedications },
            { key: 'allergies',  title: 'Allergies',                   items: result.relevantAllergies },
            { key: 'family',     title: 'Relevant Family History',     items: result.relevantFamilyHistory ?? [] },
          ] as { key: string; title: string; items: SourceLinkedText[] }[]).map(section =>
            section.items.length > 0 || (addedItems[section.key]?.length ?? 0) > 0 ? (
              <CollapsibleSection
                key={section.key}
                title={section.title}
                badge={section.items.length}
                editMode={editSections[section.key]}
                onToggleEdit={() => toggleEditSection(section.key)}
              >
                {editSections[section.key] ? (
                  <EditableSectionList
                    items={section.items}
                    sectionKey={section.key}
                    sourceMap={result.sourceMap}
                    editedItems={editedItems}
                    onEdit={handleEditItem}
                    onAdd={handleAddItem}
                    onRemove={handleRemoveItem}
                  />
                ) : (
                  <ReadOnlySectionList items={getEffectiveItems(section.key, section.items)} sourceMap={result.sourceMap} />
                )}
              </CollapsibleSection>
            ) : null
          )}

          {/* Documents with include/exclude toggles */}
          {result.documentsToInclude.length > 0 && (
            <CollapsibleSection title="Documents to Include" badge={result.documentsToInclude.length - excludedDocs.size}>
              <ul className="space-y-2.5">
                {result.documentsToInclude.map((doc) => {
                  const excluded = excludedDocs.has(doc.documentId);
                  return (
                    <li key={doc.documentId} className={`flex items-start gap-2.5 rounded-lg p-2 -m-2 ${excluded ? 'opacity-40' : ''}`}>
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={!excluded}
                          onChange={e => setExcludedDocs(prev => {
                            const next = new Set(prev);
                            if (e.target.checked) next.delete(doc.documentId);
                            else next.add(doc.documentId);
                            return next;
                          })}
                          className="w-3.5 h-3.5 accent-teal-600 flex-shrink-0"
                        />
                        <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{doc.fileName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{doc.relevanceReason}</p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
              {excludedDocs.size > 0 && (
                <p className="text-xs text-gray-400 mt-2">{excludedDocs.size} document(s) excluded from export.</p>
              )}
            </CollapsibleSection>
          )}

          {result.timelineSnapshot.length > 0 && (
            <CollapsibleSection title="Timeline Snapshot" badge={result.timelineSnapshot.length}>
              <ul className="space-y-2.5">
                {result.timelineSnapshot.map(node => (
                  <li key={node.nodeId} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{node.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{node.summary}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">{node.date}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{node.verificationStatus}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <SourceChip sourceId={node.nodeId} sourceMap={result.sourceMap} />
                    </div>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {result.missingOrUnverifiedInfo.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">
                Missing / Unverified Information
                <span className="ml-2 bg-amber-200 text-amber-800 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {result.missingOrUnverifiedInfo.length}
                </span>
              </p>
              <ReadOnlySectionList items={result.missingOrUnverifiedInfo} sourceMap={result.sourceMap} />
            </div>
          )}

          <CollapsibleSection title={`Source Map — ${result.sourceMap.length} sources`}>
            {result.sourceMap.length === 0 ? (
              <p className="text-xs text-gray-400">No sources recorded.</p>
            ) : (
              <div className="divide-y divide-gray-50 -mx-5 -mb-4">
                {result.sourceMap.map(src => (
                  <div key={src.sourceId} className="px-5 py-3 flex items-start gap-3">
                    <SourceChip sourceId={src.sourceId} sourceMap={result.sourceMap} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700">{src.label}</p>
                      {src.date && <p className="text-xs text-gray-400">{src.date}</p>}
                      {src.excerpt && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{src.excerpt}</p>}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{src.sourceType.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>
        </>
      )}

      {showShareModal && result && (
        <ShareModal packageId={result.packageId} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
}
