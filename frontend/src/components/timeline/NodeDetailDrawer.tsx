import { useState, useEffect } from 'react';
import {
  X, ShieldCheck, AlertTriangle, Eye, FileText,
  MessageSquare, CheckCircle, XCircle, ChevronRight,
} from 'lucide-react';
import type {
  TimelineNode, Role, PhysicianNote,
  SymptomDetails, EMRDetails, RequisitionDetails,
  PhysicianEnteredDetails, UploadedDocumentDetails, PatientHistoryDetails,
} from '../../types';
import { getNodeColor, colorMap, verificationLabels } from '../../utils/nodeColors';
import SourceBadge from '../shared/SourceBadge';
import VerificationBadge from '../shared/VerificationBadge';
import { useApp } from '../../context/AppContext';
import { DEMO_PHYSICIAN_ID } from '../../data/mockData';

interface Props {
  node: TimelineNode;
  role: Role;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2 mt-4">{children}</p>;
}

function SymptomDetailView({ d }: { d: SymptomDetails }) {
  const severityColor = d.severity === 'SEVERE' ? 'text-red-600' : d.severity === 'MODERATE' ? 'text-amber-600' : 'text-green-600';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <DetailRow label="Onset date" value={d.onsetDate} />
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Severity</p>
          <p className={`text-sm font-semibold ${severityColor}`}>{d.severity}</p>
        </div>
        <DetailRow label="Status" value={d.status.replace('_', ' ')} />
        <DetailRow label="Frequency" value={d.frequency} />
        <DetailRow label="Duration" value={d.duration} />
      </div>
      <DetailRow label="Description" value={d.description} />
      <DetailRow label="Triggers" value={d.triggers} />
      <DetailRow label="Relieving factors" value={d.relievingFactors} />
      {d.associatedSymptoms.length > 0 && (
        <DetailRow label="Associated symptoms" value={d.associatedSymptoms.join(', ')} />
      )}
      {d.patientNotes && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
          <p className="text-xs text-amber-600 font-medium mb-1">Patient note</p>
          <p className="text-sm text-gray-700 italic">"{d.patientNotes}"</p>
        </div>
      )}
      {d.doctorReviewed && d.doctorReviewNote && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-3">
          <p className="text-xs text-green-600 font-medium mb-1">Physician review note</p>
          <p className="text-sm text-gray-700">{d.doctorReviewNote}</p>
        </div>
      )}
    </div>
  );
}

function EMRDetailView({ d }: { d: EMRDetails }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <DetailRow label="EMR source" value={d.emrSource} />
        <DetailRow label="Record type" value={d.recordType} />
        <DetailRow label="Original date" value={d.originalRecordDate} />
        <DetailRow label="Import date" value={d.importDate} />
        {d.clinicianName && <DetailRow label="Clinician" value={d.clinicianName} />}
        {d.clinicName && <DetailRow label="Clinic" value={d.clinicName} />}
      </div>
      {Object.keys(d.extractedFields).length > 0 && (
        <div>
          <SectionLabel>Extracted fields</SectionLabel>
          <div className="space-y-2">
            {Object.entries(d.extractedFields).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-xs text-gray-400 min-w-[120px] pt-0.5">{k}</span>
                <span className="text-sm text-gray-800">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {d.reliabilityNotes && (
        <DetailRow label="Reliability notes" value={d.reliabilityNotes} />
      )}
    </div>
  );
}

function RequisitionDetailView({ d }: { d: RequisitionDetails }) {
  const statusColor = d.requisitionStatus === 'COMPLETED' ? 'text-green-600' :
    d.requisitionStatus === 'CANCELLED' ? 'text-red-600' : 'text-amber-600';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <DetailRow label="Type" value={d.requisitionType.replace('_', ' ')} />
        <DetailRow label="Priority" value={d.priority} />
        <DetailRow label="Ordering physician" value={d.orderingPhysician} />
        <DetailRow label="Clinic" value={d.orderingClinic} />
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Status</p>
          <p className={`text-sm font-semibold ${statusColor}`}>{d.requisitionStatus}</p>
        </div>
      </div>
      <DetailRow label="Reason for order" value={d.reasonForOrder} />
      {d.testsOrdered.length > 0 && (
        <div>
          <SectionLabel>Tests ordered</SectionLabel>
          <ul className="space-y-1">
            {d.testsOrdered.map((t, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-gray-300">›</span> {t}
              </li>
            ))}
          </ul>
        </div>
      )}
      {d.followUpInstructions && <DetailRow label="Follow-up" value={d.followUpInstructions} />}
    </div>
  );
}

function PhysicianEnteredDetailView({ d }: { d: PhysicianEnteredDetails }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <DetailRow label="Entry type" value={d.entryType.replace(/_/g, ' ')} />
        <DetailRow label="Physician" value={d.physicianName} />
        <DetailRow label="Specialty" value={d.specialty} />
        <DetailRow label="Clinic" value={d.clinic} />
      </div>
      <div>
        <SectionLabel>Clinical note</SectionLabel>
        <p className="text-sm text-gray-800 leading-relaxed">{d.note}</p>
      </div>
      {d.assessment && (
        <div className="bg-violet-50 border border-violet-100 rounded-lg p-3">
          <p className="text-xs text-violet-600 font-medium mb-1">Assessment / impression</p>
          <p className="text-sm text-gray-700">{d.assessment}</p>
        </div>
      )}
      {d.changesMade && <DetailRow label="Changes made" value={d.changesMade} />}
      {d.followUpPlan && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium mb-1">Follow-up plan</p>
          <p className="text-sm text-gray-700">{d.followUpPlan}</p>
        </div>
      )}
    </div>
  );
}

function CombinedPhysicianDetailView({ node }: { node: TimelineNode }) {
  const top = (node as any);
  const d = node.details as any;
  const entryType = top.entryType ?? d?.entryType;
  const physicianName = top.physicianName ?? d?.physicianName;
  const specialty = d?.specialty;
  const clinic = top.physicianClinic ?? d?.clinic ?? d?.clinicName;
  const note = top.notes ?? d?.note ?? top.summary;
  const assessment = top.assessment ?? d?.assessment;
  const checklist = top.checklist ?? d;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <DetailRow label="Entry type" value={entryType ? String(entryType).replace(/_/g, ' ') : undefined} />
        <DetailRow label="Physician" value={physicianName} />
        {specialty && <DetailRow label="Specialty" value={specialty} />}
        {clinic && <DetailRow label="Clinic" value={clinic} />}
      </div>

      {note && (
        <div>
          <SectionLabel>Clinical note</SectionLabel>
          <p className="text-sm text-gray-800 leading-relaxed">{note}</p>
        </div>
      )}

      {/* Visit flags */}
      {(checklist?.visitInformation) && (
        <div className="flex gap-2 flex-wrap">
          {checklist.visitInformation.newPatient && <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">New Patient</span>}
          {checklist.visitInformation.followUp && <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">Follow-up</span>}
          {checklist.visitInformation.annualPhysical && <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">Annual Physical</span>}
          {checklist.visitInformation.urgentVisit && <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">Urgent Visit</span>}
          {checklist.visitInformation.telehealth && <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">Telehealth</span>}
        </div>
      )}

      {(checklist?.reasonForVisit || d?.changesMade || d?.reasonForVisit) && (
        <div>
          <p className="text-xs text-gray-500">Reason for visit</p>
          <p className="text-sm text-gray-700">{checklist?.reasonForVisit ?? d?.changesMade ?? d?.reasonForVisit}</p>
        </div>
      )}

      {(checklist?.chiefComplaint || d?.chiefComplaint) && (
        <div>
          <p className="text-xs text-gray-500">Chief complaint</p>
          <p className="text-sm text-gray-700">{checklist?.chiefComplaint ?? d?.chiefComplaint}</p>
        </div>
      )}

      {(checklist?.duration || d?.duration) && (
        <div className="text-sm text-gray-700">
          <p className="text-xs text-gray-500">Duration</p>
          <p>
            {checklist?.duration?.value ? `${checklist.duration.value} ` : ''}
            {checklist?.duration?.unit ?? d?.duration}
          </p>
        </div>
      )}

      {(checklist?.severity || d?.severity) && (
        <div>
          <p className="text-xs text-gray-500">Severity</p>
          <p className="text-sm text-gray-700">{checklist?.severity ?? d?.severity}{checklist?.severityNotes ? ` — ${checklist.severityNotes}` : ''}</p>
        </div>
      )}

      {((checklist?.symptoms && checklist.symptoms.length > 0) || (d?.symptoms && d.symptoms.length > 0)) && (
        <div>
          <p className="text-xs text-gray-500">Symptoms</p>
          <div className="mt-1 space-y-1">
            {(checklist?.symptoms ?? d?.symptoms).map((s: any, i: number) => (
              <div key={i} className="text-sm text-gray-700">
                <strong>{s.symptom || s.name}</strong>{s.severity ? ` — ${s.severity}/10` : ''}{s.timing ? ` · ${s.timing}` : ''}
                {s.notes && <div className="text-xs text-gray-500">{s.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(checklist?.vitals || d?.vitals) && (
        <div>
          <p className="text-xs text-gray-500">Vitals</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mt-1">
            {((checklist?.vitals) ?? d?.vitals)?.bloodPressure && <div>BP: {((checklist?.vitals) ?? d?.vitals).bloodPressure}</div>}
            {((checklist?.vitals) ?? d?.vitals)?.heartRate !== undefined && <div>HR: {((checklist?.vitals) ?? d?.vitals).heartRate} bpm</div>}
            {((checklist?.vitals) ?? d?.vitals)?.temperature !== undefined && <div>Temp: {((checklist?.vitals) ?? d?.vitals).temperature} °C</div>}
            {((checklist?.vitals) ?? d?.vitals)?.respiratoryRate !== undefined && <div>RR: {((checklist?.vitals) ?? d?.vitals).respiratoryRate}</div>}
            {((checklist?.vitals) ?? d?.vitals)?.spO2 !== undefined && <div>SpO₂: {((checklist?.vitals) ?? d?.vitals).spO2}%</div>}
            {((checklist?.vitals) ?? d?.vitals)?.weight !== undefined && <div>Weight: {((checklist?.vitals) ?? d?.vitals).weight} kg</div>}
            {((checklist?.vitals) ?? d?.vitals)?.height !== undefined && <div>Height: {((checklist?.vitals) ?? d?.vitals).height} cm</div>}
            {((checklist?.vitals) ?? d?.vitals)?.bmi !== undefined && <div>BMI: {((checklist?.vitals) ?? d?.vitals).bmi}</div>}
          </div>
          {((checklist?.vitals) ?? d?.vitals)?.notes && <p className="text-xs text-gray-500 mt-1">{((checklist?.vitals) ?? d?.vitals).notes}</p>}
        </div>
      )}

      {(assessment) && (
        <div>
          <p className="text-xs text-gray-500">Assessment</p>
          <p className="text-sm text-gray-700">{assessment}</p>
        </div>
      )}

      {(top.notes || d?.note || d?.followUpPlan) && (
        <div>
          <p className="text-xs text-gray-500">Notes</p>
          <p className="text-sm text-gray-700">{top.notes ?? d?.note ?? d?.followUpPlan}</p>
        </div>
      )}
    </div>
  );
}

function UploadedDocDetailView({ d }: { d: UploadedDocumentDetails }) {
  const statusColor = d.extractionStatus === 'EXTRACTED' ? 'text-green-600' :
    d.extractionStatus === 'FAILED' ? 'text-red-600' : 'text-amber-600';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <DetailRow label="File" value={d.fileName} />
        <DetailRow label="Type" value={d.documentType.replace('_', ' ')} />
        <DetailRow label="Issued by" value={d.issuingOrganization} />
        <DetailRow label="Document date" value={d.documentDate} />
        {d.authorClinician && <DetailRow label="Author" value={d.authorClinician} />}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Extraction</p>
          <p className={`text-sm font-semibold ${statusColor}`}>{d.extractionStatus}</p>
        </div>
      </div>
      {d.extractedItems && Object.keys(d.extractedItems).length > 0 && (
        <div>
          <SectionLabel>Extracted information</SectionLabel>
          {Object.entries(d.extractedItems).map(([k, vals]) =>
            vals && vals.length > 0 ? (
              <div key={k} className="mb-2">
                <p className="text-xs text-gray-400 capitalize mb-1">{k}</p>
                <ul className="space-y-0.5">
                  {vals.map((v, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-gray-300">›</span> {v}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

function PatientHistoryDetailView({ d }: { d: PatientHistoryDetails }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <DetailRow label="Category" value={d.category.replace('_', ' ')} />
        <DetailRow label="Approximate date" value={d.approximateDate} />
      </div>
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
        <p className="text-xs text-gray-400 font-medium mb-1">Patient statement</p>
        <p className="text-sm text-gray-700 italic">"{d.patientStatement}"</p>
      </div>
      <div className="flex gap-4">
        <span className={`text-xs flex items-center gap-1 ${d.confirmedByPatient ? 'text-green-600' : 'text-gray-400'}`}>
          <CheckCircle className="w-3.5 h-3.5" /> Patient confirmed
        </span>
        <span className={`text-xs flex items-center gap-1 ${d.confirmedByPhysician ? 'text-green-600' : 'text-gray-400'}`}>
          <CheckCircle className="w-3.5 h-3.5" /> Physician confirmed
        </span>
        <span className={`text-xs flex items-center gap-1 ${d.confirmedByEMR ? 'text-green-600' : 'text-gray-400'}`}>
          <CheckCircle className="w-3.5 h-3.5" /> EMR confirmed
        </span>
      </div>
      {d.clarificationNeeded && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700">Clarification needed — record is unverified</p>
        </div>
      )}
    </div>
  );
}

function renderDetails(node: TimelineNode) {
  switch (node.type) {
    case 'PATIENT_SYMPTOM':   return <SymptomDetailView d={node.details as SymptomDetails} />;
    case 'EMR_RECORD':        return <EMRDetailView d={node.details as EMRDetails} />;
    case 'REQUISITION':       return <RequisitionDetailView d={node.details as RequisitionDetails} />;
    case 'PHYSICIAN_ENTERED': return <CombinedPhysicianDetailView node={node} />;
    case 'UPLOADED_DOCUMENT': return <UploadedDocDetailView d={node.details as UploadedDocumentDetails} />;
    case 'PATIENT_HISTORY':   return <PatientHistoryDetailView d={node.details as PatientHistoryDetails} />;
    default:                  return null;
  }
}

export default function NodeDetailDrawer({ node, role, onClose }: Props) {
  const { addPhysicianNote, updateTimelineNode } = useApp();
  const [noteText, setNoteText] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [justActed, setJustActed] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const color = getNodeColor(node);
  const c = colorMap[color];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

  function handleAddNote() {
    if (!noteText.trim()) return;
    const note: PhysicianNote = {
      noteId: `pnote-${Date.now()}`,
      physicianId: DEMO_PHYSICIAN_ID,
      physicianName: 'Dr. Amir Khan',
      specialty: 'Dermatology',
      content: noteText.trim(),
      noteType: 'NOTE',
      createdAt: new Date().toISOString(),
    };
    const newNode: TimelineNode = {
      nodeId: `node-phys-${Date.now()}`,
      patientId: node.patientId,
      type: 'PHYSICIAN_ENTERED',
      title: `Physician note — ${node.title}`,
      summary: noteText.trim().substring(0, 120),
      eventDate: new Date().toISOString().split('T')[0],
      datePrecision: 'EXACT',
      sourceType: 'PHYSICIAN_CONTRIBUTION',
      verificationStatus: 'VERIFIED_BY_PHYSICIAN',
      confidenceLevel: 'HIGH',
      contributorName: 'Dr. Amir Khan',
      contributorRole: 'PHYSICIAN',
      relatedDocumentIds: [],
      relatedNodeIds: [node.nodeId],
      tags: ['physician-note'],
      details: {
        entryType: 'CLINICAL_NOTE',
        physicianName: 'Dr. Amir Khan',
        specialty: 'Dermatology',
        clinic: 'Riverside Family Health Clinic',
        note: noteText.trim(),
        linkedSymptomIds: [node.nodeId],
        linkedRecordIds: [],
        linkedRequisitionIds: [],
        changesMade: 'Physician note added',
      },
      physicianNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addPhysicianNote(node.nodeId, note, newNode);
    setNoteText('');
    setShowNoteForm(false);
    setJustActed('Note added and physician contribution node created.');
    setTimeout(() => setJustActed(null), 3000);
  }

  function handleMarkReviewed() {
    updateTimelineNode(node.nodeId, { verificationStatus: 'REVIEWED_NOT_VERIFIED' });
    setJustActed('Marked as reviewed.');
    setTimeout(() => setJustActed(null), 3000);
  }

  function handleVerify() {
    updateTimelineNode(node.nodeId, {
      verificationStatus: 'VERIFIED_BY_PHYSICIAN',
      sourceType: 'PATIENT_REPORTED_VERIFIED',
    });
    setJustActed('Verified by physician.');
    setTimeout(() => setJustActed(null), 3000);
  }

  function handleFlagConflict() {
    updateTimelineNode(node.nodeId, { verificationStatus: 'CONFLICTING_INFORMATION' });
    setJustActed('Flagged as conflicting information.');
    setTimeout(() => setJustActed(null), 3000);
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[440px] bg-white shadow-2xl z-40 flex flex-col">
        {/* Header */}
        <div className={`border-l-4 ${c.border} flex-shrink-0`}>
          <div className="flex items-start justify-between p-5 pb-4">
            <div className="flex-1 min-w-0 pr-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                {node.type.replace(/_/g, ' ')}
              </p>
              <h2 className="text-base font-semibold text-gray-900 leading-snug">{node.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {formatDate(node.eventDate)}
                {node.datePrecision === 'APPROXIMATE' && ' (approximate)'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2 px-5 pb-4">
            <SourceBadge sourceType={node.sourceType} verificationStatus={node.verificationStatus} />
            <VerificationBadge status={node.verificationStatus} />
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600`}>
              {node.confidenceLevel} confidence
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Summary */}
          <div>
            <p className="text-sm text-gray-600 leading-relaxed">{node.summary}</p>
          </div>

          {/* Contributor */}
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <span className="font-medium">Contributed by:</span>
            <span>{node.contributorName}</span>
            <span className="text-gray-300">·</span>
            <span className="capitalize">{node.contributorRole.toLowerCase()}</span>
          </div>

          {/* Type-specific details */}
          <div>
            <SectionLabel>Details</SectionLabel>
            {renderDetails(node)}
          </div>

          {/* Tags */}
          {node.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {node.tags.map(t => (
                <span key={t} className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Physician notes */}
          {node.physicianNotes.length > 0 && (
            <div>
              <SectionLabel>Physician notes</SectionLabel>
              <div className="space-y-3">
                {node.physicianNotes.map(n => (
                  <div key={n.noteId} className="bg-violet-50 border border-violet-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-violet-700">{n.physicianName}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{n.specialty} · {n.noteType}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note form */}
          {role === 'physician' && showNoteForm && (
            <div className="border border-violet-200 rounded-lg p-3 bg-violet-50/50">
              <p className="text-xs font-semibold text-violet-700 mb-2">Add clinical note</p>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Your clinical observation or note…"
                rows={4}
                className="w-full text-sm border border-violet-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  className="flex-1 bg-violet-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors"
                >
                  Add note
                </button>
                <button
                  onClick={() => { setShowNoteForm(false); setNoteText(''); }}
                  className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Success banner */}
          {justActed && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700">{justActed}</p>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-3 space-y-0.5">
            <p>Node ID: {node.nodeId}</p>
            <p>Created: {new Date(node.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(node.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Footer actions */}
        {role === 'physician' && !showNoteForm && (
          <div className="border-t border-gray-100 p-4 flex-shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowNoteForm(true)}
                className="flex items-center justify-center gap-1.5 bg-violet-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-violet-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> Add note
              </button>
              <button
                onClick={handleMarkReviewed}
                className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Eye className="w-4 h-4" /> Mark reviewed
              </button>
              <button
                onClick={handleVerify}
                className="flex items-center justify-center gap-1.5 bg-green-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-green-700 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" /> Verify
              </button>
              <button
                onClick={handleFlagConflict}
                className="flex items-center justify-center gap-1.5 bg-red-50 text-red-600 text-sm font-medium py-2.5 rounded-lg hover:bg-red-100 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Flag conflict
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
