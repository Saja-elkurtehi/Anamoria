import { useState, useEffect } from 'react';
import type { SourceReference } from '../../../../shared/types';

const TYPE_META: Record<string, { color: string; icon: string }> = {
  TIMELINE_NODE:   { color: 'bg-blue-50 text-blue-700 border-blue-200',     icon: '⏱' },
  DOCUMENT:        { color: 'bg-green-50 text-green-700 border-green-200',   icon: '📄' },
  EMR_RECORD:      { color: 'bg-purple-50 text-purple-700 border-purple-200',icon: '🏥' },
  PHYSICIAN_NOTE:  { color: 'bg-violet-50 text-violet-700 border-violet-200',icon: '👨‍⚕️' },
  PATIENT_PROFILE: { color: 'bg-gray-100 text-gray-600 border-gray-200',     icon: '👤' },
};

const FALLBACK_META = { color: 'bg-gray-100 text-gray-500 border-gray-200', icon: '·' };

interface SourceChipProps {
  sourceId: string;
  sourceMap: SourceReference[];
}

function SourceDetailModal({ source, onClose }: { source: SourceReference; onClose: () => void }) {
  const meta = TYPE_META[source.sourceType] ?? FALLBACK_META;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${meta.color}`}>
            <span className="text-[10px] leading-none">{meta.icon}</span>
            {source.sourceType.replace(/_/g, ' ')}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none -mt-0.5">×</button>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900">{source.label}</h3>
          {source.date && <p className="text-xs text-gray-500 mt-0.5">{source.date}</p>}
        </div>

        {source.excerpt && (
          <div className="bg-gray-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-gray-700 leading-relaxed">{source.excerpt}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            ID: <code className="text-gray-500 bg-gray-100 px-1 rounded">{source.sourceId}</code>
          </p>
          <button
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SourceChip({ sourceId, sourceMap }: SourceChipProps) {
  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const source = sourceMap.find(s => s.sourceId === sourceId);
  const meta = source ? (TYPE_META[source.sourceType] ?? FALLBACK_META) : FALLBACK_META;

  const displayLabel = source
    ? source.date
      ? `${source.label} · ${source.date}`
      : source.label
    : sourceId;

  return (
    <>
      <span
        className="relative inline-block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={e => { e.stopPropagation(); if (source) setModalOpen(true); }}
      >
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border whitespace-nowrap select-none transition-opacity ${source ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} ${meta.color}`}>
          <span className="text-[10px] leading-none">{meta.icon}</span>
          {displayLabel}
        </span>

        {hovered && !modalOpen && source && (
          <div className="absolute bottom-full left-0 mb-1.5 z-50 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl pointer-events-none">
            <p className="font-semibold text-white leading-snug">{source.label}</p>
            {source.date && <p className="text-gray-400 mt-0.5">{source.date}</p>}
            {source.excerpt && (
              <p className="text-gray-300 mt-1.5 leading-relaxed line-clamp-3">{source.excerpt}</p>
            )}
            <p className="text-gray-500 mt-1.5 uppercase tracking-wide" style={{ fontSize: '10px' }}>
              {source.sourceType.replace(/_/g, ' ')} · Click to view details
            </p>
          </div>
        )}
      </span>

      {modalOpen && source && (
        <SourceDetailModal source={source} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
