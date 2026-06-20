import { useState } from 'react';
import {
  Sparkles, AlertCircle, ChevronDown, ChevronRight,
  Loader2, RefreshCw, CheckCircle, FileText, SlidersHorizontal,
  Download,
} from 'lucide-react';
import type { Patient, TimelineNode, UploadedDoc } from '../../types';
import type {
  VisitBriefResponse, AITimelineNode, AIDocument, AIPhysicianNote, BriefOptions,
} from '../../../../shared/types';
import { aiService } from '../../services/aiService';
import { exportVisitBriefPDF } from '../../utils/exportPDF';
import SourceChip from '../shared/SourceChip';

interface Props {
  patientProfile: Patient;
  timelineNodes: TimelineNode[];
  documents: UploadedDoc[];
  lastVisitDate: string;
}

const DEFAULT_OPTIONS: BriefOptions = {
  timeRange: 'SINCE_LAST_VISIT',
  includeSymptoms: true,
  includeDocuments: true,
  includeEMR: true,
  includePhysicianNotes: true,
  includeMedications: true,
  includeAllergies: true,
  includeFamilyHistory: false,
  outputStyle: 'STANDARD',
  focusArea: 'GENERAL',
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

function extractError(e: unknown): string {
  if (e && typeof e === 'object' && 'response' in e) {
    const ax = e as { response?: { data?: { error?: string } } };
    if (ax.response?.data?.error) return ax.response.data.error;
  }
  if (e instanceof Error) return e.message;
  return 'Generation failed. Check that the backend is running (cd backend && npm run dev) and your OPENAI_API_KEY is set in backend/.env.';
}

function filterNodes(nodes: TimelineNode[], opts: BriefOptions, lastVisitDate: string): TimelineNode[] {
  const today = new Date().toISOString().split('T')[0];
  let cutoff = '';
  switch (opts.timeRange) {
    case 'SINCE_LAST_VISIT': cutoff = lastVisitDate; break;
    case 'LAST_30_DAYS': {
      const d = new Date(); d.setDate(d.getDate() - 30);
      cutoff = d.toISOString().split('T')[0];
      break;
    }
    case 'LAST_6_MONTHS': {
      const d = new Date(); d.setMonth(d.getMonth() - 6);
      cutoff = d.toISOString().split('T')[0];
      break;
    }
    case 'FULL_TIMELINE': cutoff = ''; break;
    case 'CUSTOM': cutoff = opts.customStartDate ?? ''; break;
  }

  let filtered = cutoff ? nodes.filter(n => n.eventDate >= cutoff) : nodes;

  const typeMap: Record<string, boolean> = {
    PATIENT_SYMPTOM: opts.includeSymptoms,
    UPLOADED_DOCUMENT: opts.includeDocuments,
    EMR_RECORD: opts.includeEMR,
    PHYSICIAN_ENTERED: opts.includePhysicianNotes,
  };

  filtered = filtered.filter(n => typeMap[n.type] !== false);

  if (opts.timeRange === 'CUSTOM' && opts.customEndDate) {
    filtered = filtered.filter(n => n.eventDate <= opts.customEndDate!);
  }

  return filtered;
}

const CONFIDENCE_COLOR: Record<string, string> = {
  HIGH: 'text-green-600',
  MEDIUM: 'text-amber-600',
  LOW: 'text-red-500',
};

// ─── Filter panel ─────────────────────────────────────────────────────────────

function FilterPanel({ opts, onChange }: { opts: BriefOptions; onChange: (next: BriefOptions) => void }) {
  const set = (partial: Partial<BriefOptions>) => onChange({ ...opts, ...partial });

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-violet-500" />
        <p className="text-sm font-semibold text-gray-800">Brief options</p>
      </div>
      <div className="p-5 space-y-5">
        {/* Time range */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Time range</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['SINCE_LAST_VISIT', 'Since last visit'],
                ['LAST_30_DAYS', 'Last 30 days'],
                ['LAST_6_MONTHS', 'Last 6 months'],
                ['FULL_TIMELINE', 'Full timeline'],
                ['CUSTOM', 'Custom'],
              ] as [BriefOptions['timeRange'], string][]
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => set({ timeRange: val })}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  opts.timeRange === val
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {opts.timeRange === 'CUSTOM' && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input type="date" value={opts.customStartDate ?? ''} onChange={e => set({ customStartDate: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input type="date" value={opts.customEndDate ?? ''} onChange={e => set({ customEndDate: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
            </div>
          )}
        </div>

        {/* Include */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Include</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
            {(
              [
                ['includeSymptoms',       'Symptoms'],
                ['includeDocuments',      'Documents'],
                ['includeEMR',            'EMR records'],
                ['includePhysicianNotes', 'Physician notes'],
                ['includeMedications',    'Medications'],
                ['includeAllergies',      'Allergies'],
                ['includeFamilyHistory',  'Family history'],
              ] as [keyof BriefOptions, string][]
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opts[key] as boolean}
                  onChange={e => set({ [key]: e.target.checked } as Partial<BriefOptions>)}
                  className="w-3.5 h-3.5 accent-violet-600"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Output style */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Output style</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['ULTRA_BRIEF', 'Ultra brief'],
                ['STANDARD',   'Standard'],
                ['DETAILED',   'Detailed'],
              ] as [BriefOptions['outputStyle'], string][]
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => set({ outputStyle: val })}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  opts.outputStyle === val
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Focus area */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Focus area</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['GENERAL',     'General'],
                ['RESPIRATORY', 'Respiratory'],
                ['DERMATOLOGY', 'Dermatology'],
                ['ALLERGIES',   'Allergies'],
                ['MEDICATIONS', 'Medications'],
                ['CUSTOM',      'Custom'],
              ] as [BriefOptions['focusArea'], string][]
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => set({ focusArea: val })}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  opts.focusArea === val
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {opts.focusArea === 'CUSTOM' && (
            <input
              type="text"
              value={opts.customFocusArea ?? ''}
              onChange={e => set({ customFocusArea: e.target.value })}
              placeholder="e.g. Pediatric asthma, Chronic eczema"
              className="mt-2 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIBriefTab({ patientProfile, timelineNodes, documents, lastVisitDate }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisitBriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visitNote, setVisitNote] = useState('');
  const [showSourceMap, setShowSourceMap] = useState(false);
  const [noteApproved, setNoteApproved] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [briefOpts, setBriefOpts] = useState<BriefOptions>(DEFAULT_OPTIONS);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setNoteApproved(false);
    try {
      const filteredNodes = filterNodes(timelineNodes, briefOpts, lastVisitDate);
      const filteredDocs = briefOpts.includeDocuments ? documents : [];
      const data = await aiService.generateVisitBrief({
        patientId: patientProfile.patientId,
        lastVisitDate,
        currentVisitDate: new Date().toISOString().split('T')[0],
        patientProfile: {
          patientId: patientProfile.patientId,
          name: patientProfile.name,
          dateOfBirth: (patientProfile as { dateOfBirth?: string }).dateOfBirth,
          age: patientProfile.age,
          gender: patientProfile.gender,
          bloodType: patientProfile.bloodType,
          conditions: patientProfile.conditions,
          allergies: briefOpts.includeAllergies ? patientProfile.allergies : [],
          medications: briefOpts.includeMedications ? patientProfile.medications : [],
          familyHistory: briefOpts.includeFamilyHistory ? patientProfile.familyHistory : [],
          careTeam: patientProfile.careTeam,
          lastAppointment: patientProfile.lastAppointment,
        },
        timelineNodes: mapNodes(filteredNodes),
        documents: mapDocs(filteredDocs),
        physicianNotes: briefOpts.includePhysicianNotes ? mapPhysicianNotes(timelineNodes) : [],
        briefOptions: briefOpts,
      });
      setResult(data);
      setVisitNote(data.suggestedVisitNoteStarter);
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  }

  function handleExportPDF() {
    if (!result) return;
    exportVisitBriefPDF(
      result,
      {
        name: patientProfile.name,
        dateOfBirth: (patientProfile as { dateOfBirth?: string }).dateOfBirth,
        age: patientProfile.age,
        gender: patientProfile.gender,
      },
      visitNote,
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Safety banner */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>AI-generated summary. Physician review required before clinical use.</strong>{' '}
          Sources are shown for verification. This system does not diagnose or recommend treatment.
          Patient-reported information may require confirmation.
        </p>
      </div>

      {/* Empty state / filter panel */}
      {!result && !loading && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">AI Visit Brief</h3>
            <p className="text-xs text-gray-500 mb-5 max-w-sm mx-auto">
              Summarizes changes since {new Date(lastVisitDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}, flags items needing review, and prefills a visit note starter.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border font-medium transition-colors ${
                  showFilters
                    ? 'border-violet-300 bg-violet-50 text-violet-700'
                    : 'border-gray-200 text-gray-600 hover:border-violet-200 hover:bg-violet-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Options
              </button>
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Generate Visit Brief
              </button>
            </div>
          </div>
          {showFilters && <FilterPanel opts={briefOpts} onChange={setBriefOpts} />}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Generating visit brief…</p>
          <p className="text-xs text-gray-400 mt-1">Organizing patient timeline and clinical notes</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 font-medium">Generation failed</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
            <button onClick={handleGenerate} className="mt-2 text-xs text-red-600 underline font-medium">Try again</button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <>
          {/* Meta row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                Draft · Needs physician review
              </span>
              <span className="text-xs text-gray-400">
                Generated {new Date(result.generatedAt).toLocaleString()}
              </span>
              {result.briefOptions && (
                <span className="text-xs text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
                  {result.briefOptions.timeRange.replace(/_/g, ' ')} · {result.briefOptions.outputStyle.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
              <button
                onClick={() => { setResult(null); setShowFilters(true); }}
                className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 border border-violet-200 rounded-lg px-2.5 py-1.5 hover:bg-violet-50 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Change filters
              </button>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 border border-violet-200 rounded-lg px-2.5 py-1.5 hover:bg-violet-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>
          </div>

          {/* Warnings */}
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

          {/* Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Summary</p>
            <p className="text-sm text-gray-800 leading-relaxed">{result.summary}</p>
          </div>

          {/* Since last visit */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Since Last Visit
              <span className="ml-2 normal-case font-normal text-gray-400">
                ({new Date(lastVisitDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })})
              </span>
            </p>
            {result.sinceLastVisit.length === 0 ? (
              <p className="text-sm text-gray-400">No documented changes since last visit.</p>
            ) : (
              <ul className="space-y-3">
                {result.sinceLastVisit.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0 mt-2" />
                    <div className="flex-1">
                      <span className="text-sm text-gray-800">{item.text}</span>
                      {item.verificationStatus && (
                        <span className="ml-2 text-xs text-gray-400 italic">({item.verificationStatus})</span>
                      )}
                      {item.confidence && (
                        <span className={`ml-2 text-xs font-medium ${CONFIDENCE_COLOR[item.confidence] ?? ''}`}>
                          {item.confidence}
                        </span>
                      )}
                      {item.sourceIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.sourceIds.map(sid => (
                            <SourceChip key={sid} sourceId={sid} sourceMap={result.sourceMap} />
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Needs review */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">
              Needs Review
              {result.needsReview.length > 0 && (
                <span className="ml-2 bg-amber-200 text-amber-800 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {result.needsReview.length}
                </span>
              )}
            </p>
            {result.needsReview.length === 0 ? (
              <p className="text-sm text-gray-500">No items flagged for review.</p>
            ) : (
              <ul className="space-y-3">
                {result.needsReview.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm text-amber-900">{item.text}</span>
                      {item.confidence && (
                        <span className={`ml-2 text-xs font-medium ${CONFIDENCE_COLOR[item.confidence] ?? ''}`}>
                          {item.confidence} confidence
                        </span>
                      )}
                      {item.sourceIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.sourceIds.map(sid => (
                            <SourceChip key={sid} sourceId={sid} sourceMap={result.sourceMap} />
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Visit note starter */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Suggested Visit Note Starter</p>
              <span className="text-xs text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">Editable</span>
            </div>
            <textarea
              value={visitNote}
              onChange={e => { setVisitNote(e.target.value); setNoteApproved(false); }}
              rows={7}
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2.5">
              <p className="text-xs text-gray-400">
                AI-suggested only — edit as needed. Physician must verify all content before use.
              </p>
              <button
                onClick={() => setNoteApproved(true)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  noteApproved
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-violet-600 text-white hover:bg-violet-700'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {noteApproved ? 'Approved' : 'Approve Note'}
              </button>
            </div>
          </div>

          {/* Source map */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowSourceMap(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Source Map — {result.sourceMap.length} sources
              </p>
              {showSourceMap
                ? <ChevronDown className="w-4 h-4 text-gray-400" />
                : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>
            {showSourceMap && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {result.sourceMap.length === 0 && (
                  <p className="px-5 py-3 text-xs text-gray-400">No sources recorded.</p>
                )}
                {result.sourceMap.map(src => (
                  <div key={src.sourceId} className="px-5 py-3 flex items-start gap-3">
                    <SourceChip sourceId={src.sourceId} sourceMap={result.sourceMap} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700">{src.label}</p>
                      {src.date && <p className="text-xs text-gray-400">{src.date}</p>}
                      {src.excerpt && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{src.excerpt}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                      {src.sourceType.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
