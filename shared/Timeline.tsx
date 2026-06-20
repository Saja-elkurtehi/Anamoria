import { Rows2, AlignLeft, SlidersHorizontal, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import SourceBadge, { getSourceConfig, getVerificationBadge } from './SourceBadge';
import type { TimelineNode, DataSource, VerificationStatus } from '../../types';

interface TimelineProps {
  showFilters?: boolean;
}

export default function Timeline({ showFilters = false }: TimelineProps) {
  const { timelineNodes, selectedNodeId, setSelectedNodeId, viewMode, setViewMode, filters, setFilters } = useApp();

  const filtered = [...timelineNodes]
    .filter((n) => {
      if (filters.source && n.sourceType !== filters.source) return false;
      if (filters.verificationStatus && n.verificationStatus !== filters.verificationStatus) return false;
      return true;
    })
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  // Group by year
  const grouped: { year: number; nodes: TimelineNode[] }[] = [];
  for (const node of filtered) {
    const year = new Date(node.eventDate).getFullYear();
    const existing = grouped.find((g) => g.year === year);
    if (existing) existing.nodes.push(node);
    else grouped.push({ year, nodes: [node] });
  }

  const sources: DataSource[] = ['UPLOAD', 'INTAKE_FORM', 'CHAT_ASSISTANT', 'PROFILE', 'EMR_INGEST', 'PHYSICIAN_EDIT'];
  const statuses: VerificationStatus[] = ['PHYSICIAN_VERIFIED', 'CONFIRMED_BY_EMR', 'PATIENT_REPORTED', 'NEEDS_REVIEW', 'FLAGGED', 'CLARIFICATION_REQUESTED'];

  const sourceLabels: Record<DataSource, string> = {
    UPLOAD: 'Uploaded Document', INTAKE_FORM: 'Intake Form', CHAT_ASSISTANT: 'Chat Assistant',
    PROFILE: 'Patient Profile', EMR_INGEST: 'External EMR', PHYSICIAN_EDIT: 'Physician',
  };
  const statusLabels: Record<VerificationStatus, string> = {
    PHYSICIAN_VERIFIED: 'Physician Verified', CONFIRMED_BY_EMR: 'EMR Confirmed',
    PATIENT_REPORTED: 'Patient-Reported', NEEDS_REVIEW: 'Needs Review',
    FLAGGED: 'Flagged', CLARIFICATION_REQUESTED: 'Clarification Requested',
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Controls bar */}
      <div className="px-4 py-2.5 border-b border-gray-200 flex items-center gap-3 flex-wrap bg-white shadow-sm z-10">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('BRIEF')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'BRIEF' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Rows2 className="w-3.5 h-3.5" /> Brief
          </button>
          <button
            onClick={() => setViewMode('DEEP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'DEEP' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" /> Deep
          </button>
        </div>
        <span className="text-xs text-gray-400">{filtered.length} events</span>

        {showFilters && (
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-300" />
            <select
              value={filters.source ?? ''}
              onChange={(e) => setFilters({ ...filters, source: (e.target.value as DataSource) || undefined })}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-400"
            >
              <option value="">All sources</option>
              {sources.map((s) => <option key={s} value={s}>{sourceLabels[s]}</option>)}
            </select>
            <select
              value={filters.verificationStatus ?? ''}
              onChange={(e) => setFilters({ ...filters, verificationStatus: (e.target.value as VerificationStatus) || undefined })}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-400"
            >
              <option value="">All statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
            </select>
            {(filters.source || filters.verificationStatus) && (
              <button onClick={() => setFilters({})} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {grouped.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">No events match the current filters.</div>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ year, nodes }) => (
              <div key={year}>
                {/* Year header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">{year}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Nodes */}
                <div className="space-y-2 pl-0">
                  {nodes.map((node) => (
                    <TimelineNodeCard
                      key={node.nodeId}
                      node={node}
                      isSelected={selectedNodeId === node.nodeId}
                      viewMode={viewMode}
                      onClick={() => setSelectedNodeId(selectedNodeId === node.nodeId ? null : node.nodeId)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineNodeCard({
  node, isSelected, viewMode, onClick,
}: {
  node: TimelineNode;
  isSelected: boolean;
  viewMode: 'BRIEF' | 'DEEP';
  onClick: () => void;
}) {
  const config = getSourceConfig(node.sourceType, node.verificationStatus);
  const verBadge = getVerificationBadge(node.verificationStatus);

  const formattedDate = new Date(node.eventDate).toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric',
  });

  const VerIcon = node.verificationStatus === 'PHYSICIAN_VERIFIED' || node.verificationStatus === 'CONFIRMED_BY_EMR'
    ? CheckCircle
    : node.verificationStatus === 'NEEDS_REVIEW' ? Clock : AlertCircle;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-all duration-150 rounded-xl border-l-4 ${config.borderClass} ${
        isSelected
          ? 'bg-white shadow-md border-r border-t border-b border-r-gray-100 border-t-gray-100 border-b-gray-100'
          : 'bg-white shadow-sm border-r border-t border-b border-r-gray-100 border-t-gray-100 border-b-gray-100 hover:shadow-md hover:-translate-y-px'
      }`}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-sm font-semibold leading-snug ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
                {node.title}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{node.summary}</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <SourceBadge sourceType={node.sourceType} verificationStatus={node.verificationStatus} />
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-xs text-gray-400 tabular-nums">{formattedDate}</span>
          </div>
        </div>

        {viewMode === 'DEEP' && (
          <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className={`flex items-center gap-1 font-medium ${
                node.verificationStatus === 'PHYSICIAN_VERIFIED' || node.verificationStatus === 'CONFIRMED_BY_EMR' ? 'text-green-600' :
                node.verificationStatus === 'NEEDS_REVIEW' ? 'text-amber-500' : 'text-gray-400'
              }`}>
                <VerIcon className="w-3 h-3" />
                {verBadge.label}
              </span>
              <span className="text-gray-400">Confidence: {node.confidenceLevel}</span>
              <span className="text-gray-400">{node.contributorName}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {node.relatedDocuments.length > 0 && (
                <span className="text-xs text-blue-500">{node.relatedDocuments.length} doc{node.relatedDocuments.length > 1 ? 's' : ''}</span>
              )}
              {node.physicianNotes.length > 0 && (
                <span className="text-xs text-violet-600 font-medium">{node.physicianNotes.length} physician note{node.physicianNotes.length > 1 ? 's' : ''}</span>
              )}
              {node.missingInfo && node.missingInfo.length > 0 && (
                <span className="text-xs text-amber-500">{node.missingInfo.length} item{node.missingInfo.length > 1 ? 's' : ''} need clarification</span>
              )}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
