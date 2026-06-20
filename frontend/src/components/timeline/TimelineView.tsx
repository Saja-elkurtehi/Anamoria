import { useState, useMemo } from 'react';
import {
  Activity, FileText, Stethoscope, Upload, ClipboardList, User, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { TimelineNode, Role, VerificationStatus, SourceType } from '../../types';
import { getNodeColor, colorMap } from '../../utils/nodeColors';
import SourceBadge from '../shared/SourceBadge';
import VerificationBadge from '../shared/VerificationBadge';
import NodeDetailDrawer from './NodeDetailDrawer';

// ─── Filter types ─────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'needs_review' | 'verified' | 'patient_reported' | 'physician' | 'documents_emr' | 'conflicts';

const filterLabels: Record<FilterKey, string> = {
  all: 'All',
  needs_review: 'Needs review',
  verified: 'Verified',
  patient_reported: 'Patient-reported',
  physician: 'Physician',
  documents_emr: 'Records & EMR',
  conflicts: 'Conflicts',
};

function matchesFilter(node: TimelineNode, filter: FilterKey, sinceDate?: string): boolean {
  if (sinceDate && node.eventDate < sinceDate) return false;
  switch (filter) {
    case 'all': return true;
    case 'needs_review': return node.verificationStatus === 'NEEDS_REVIEW';
    case 'verified':
      return node.verificationStatus === 'VERIFIED_BY_PHYSICIAN' || node.verificationStatus === 'VERIFIED_BY_EMR';
    case 'patient_reported':
      return node.sourceType === 'PATIENT_REPORTED' || node.sourceType === 'PATIENT_REPORTED_VERIFIED';
    case 'physician': return node.sourceType === 'PHYSICIAN_CONTRIBUTION';
    case 'documents_emr':
      return node.sourceType === 'EMR_DATABASE' || node.sourceType === 'UPLOADED_RECORD';
    case 'conflicts': return node.verificationStatus === 'CONFLICTING_INFORMATION';
    default: return true;
  }
}

// ─── Node icons ───────────────────────────────────────────────────────────────

function NodeIcon({ type, size = 14 }: { type: TimelineNode['type']; size?: number }) {
  const props = { size, strokeWidth: 2 };
  switch (type) {
    case 'PATIENT_SYMPTOM':   return <Activity {...props} />;
    case 'EMR_RECORD':        return <ClipboardList {...props} />;
    case 'REQUISITION':       return <FileText {...props} />;
    case 'PHYSICIAN_ENTERED': return <Stethoscope {...props} />;
    case 'UPLOADED_DOCUMENT': return <Upload {...props} />;
    case 'PATIENT_HISTORY':   return <User {...props} />;
    default:                  return <Activity {...props} />;
  }
}

// ─── Source legend ────────────────────────────────────────────────────────────

function Legend() {
  const items = [
    { color: 'bg-amber-400', label: 'Patient-reported / Needs review' },
    { color: 'bg-blue-500', label: 'Records & EMR' },
    { color: 'bg-green-500', label: 'Patient-provided & verified' },
    { color: 'bg-violet-500', label: 'Physician contribution' },
    { color: 'bg-red-500', label: 'Conflicting information' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
      {items.map(i => (
        <div key={i.label} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${i.color}`} />
          {i.label}
        </div>
      ))}
    </div>
  );
}

// ─── Timeline node card ───────────────────────────────────────────────────────

interface CardProps {
  node: TimelineNode;
  deep: boolean;
  onClick: () => void;
  isSelected: boolean;
}

function TimelineCard({ node, deep, onClick, isSelected }: CardProps) {
  const color = getNodeColor(node);
  const c = colorMap[color];
  const date = new Date(node.eventDate);
  const day = date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  const year = date.getFullYear();

  return (
    <div className="flex gap-4 group">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0 w-10">
        <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm mt-1 transition-transform group-hover:scale-110 ${c.dot} ${isSelected ? 'ring-2 ring-offset-1 ' + c.ring : ''}`} />
        <div className="flex-1 w-0.5 bg-gray-100 mt-1" />
      </div>

      {/* Card */}
      <div
        onClick={onClick}
        className={`flex-1 mb-4 rounded-xl border cursor-pointer transition-all duration-150 ${
          isSelected
            ? `border-2 ${c.ring.replace('ring-', 'border-')} shadow-sm`
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        } bg-white`}
      >
        <div className={`h-1 rounded-t-xl ${c.dot}`} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`flex-shrink-0 ${c.badgeText}`}>
                  <NodeIcon type={node.type} />
                </span>
                <p className="text-xs text-gray-400 font-medium">
                  {day}, {year}
                  {node.datePrecision === 'APPROXIMATE' && ' ~'}
                </p>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 leading-snug">{node.title}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">{node.summary}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            <SourceBadge sourceType={node.sourceType} verificationStatus={node.verificationStatus} />
            <VerificationBadge status={node.verificationStatus} />
          </div>

          {/* Deep view extras */}
          {deep && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="font-medium">By:</span> {node.contributorName} · {node.contributorRole}
              </div>
              {node.physicianNotes.length > 0 && (
                <p className="text-xs text-violet-600">
                  {node.physicianNotes.length} physician note{node.physicianNotes.length > 1 ? 's' : ''}
                </p>
              )}
              {node.relatedDocumentIds.length > 0 && (
                <p className="text-xs text-blue-500">
                  {node.relatedDocumentIds.length} linked document{node.relatedDocumentIds.length > 1 ? 's' : ''}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-1">
                {node.tags.slice(0, 4).map(t => (
                  <span key={t} className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main TimelineView ────────────────────────────────────────────────────────

interface Props {
  nodes: TimelineNode[];
  role: Role;
  availableFilters?: FilterKey[];
  sinceDate?: string;
  compact?: boolean;
  maxNodes?: number;
}

export default function TimelineView({ nodes, role, availableFilters, sinceDate, compact = false, maxNodes }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [deep, setDeep] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = selectedNodeId ? nodes.find(n => n.nodeId === selectedNodeId) ?? null : null;

  const filters: FilterKey[] = availableFilters ?? ['all', 'needs_review', 'verified', 'patient_reported', 'physician', 'documents_emr'];

  const sorted = useMemo(() => {
    let result = nodes
      .filter(n => matchesFilter(n, activeFilter, sinceDate))
      .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
    if (maxNodes) result = result.slice(0, maxNodes);
    return result;
  }, [nodes, activeFilter, sinceDate, maxNodes]);

  // Group by year
  const grouped = useMemo(() => {
    const map = new Map<number, TimelineNode[]>();
    for (const node of sorted) {
      const yr = new Date(node.eventDate).getFullYear();
      if (!map.has(yr)) map.set(yr, []);
      map.get(yr)!.push(node);
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [sorted]);

  return (
    <div>
      {/* Legend */}
      {!compact && <div className="mb-4"><Legend /></div>}

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeFilter === f
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
        {!compact && (
          <button
            onClick={() => setDeep(d => !d)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            {deep ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {deep ? 'Brief view' : 'Deep view'}
          </button>
        )}
      </div>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No timeline events match this filter.</p>
        </div>
      ) : (
        <div>
          {grouped.map(([year, yearNodes]) => (
            <div key={year}>
              {/* Year marker */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 flex justify-center">
                  <div className="w-0.5 h-4 bg-gray-200" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                  {year}
                </span>
              </div>
              {yearNodes.map(node => (
                <TimelineCard
                  key={node.nodeId}
                  node={node}
                  deep={deep}
                  isSelected={selectedNode?.nodeId === node.nodeId}
                  onClick={() => setSelectedNodeId(selectedNodeId === node.nodeId ? null : node.nodeId)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {selectedNode && (
        <NodeDetailDrawer
          node={selectedNode}
          role={role}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}

export type { FilterKey };
