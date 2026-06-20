import { X, FileText, CheckCircle, AlertCircle, Clock, User, Stethoscope, Plus } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import SourceBadge, { getSourceConfig, getVerificationBadge } from './SourceBadge';
import type { PhysicianNote } from '../../types';

export default function NodeDetailPanel() {
  const { mode, selectedNodeId, setSelectedNodeId, timelineNodes, addPhysicianNote, updateTimelineNode } = useApp();
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<PhysicianNote['noteType']>('NOTE');
  const [showNoteForm, setShowNoteForm] = useState(false);

  const node = timelineNodes.find((n) => n.nodeId === selectedNodeId);
  if (!node) return null;

  const activeNode = node;
  const config = getSourceConfig(activeNode.sourceType, activeNode.verificationStatus);
  const verBadge = getVerificationBadge(activeNode.verificationStatus);

  function handleAddNote() {
    if (!noteText.trim()) return;
    const newNote: PhysicianNote = {
      noteId: `pn-${Date.now()}`,
      physicianId: 'phys-001',
      physicianName: 'Dr. Aisha Khan',
      content: noteText.trim(),
      addedAt: new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
      noteType,
    };
    addPhysicianNote(activeNode.nodeId, newNote);
    setNoteText('');
    setShowNoteForm(false);
  }

  function handleVerify() {
    updateTimelineNode(activeNode.nodeId, { verificationStatus: 'PHYSICIAN_VERIFIED', confidenceLevel: 'HIGH' });
  }

  function handleFlag() {
    updateTimelineNode(activeNode.nodeId, { verificationStatus: 'CLARIFICATION_REQUESTED' });
  }

  const formattedDate = new Date(activeNode.eventDate).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 text-sm leading-snug">{activeNode.title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {activeNode.approximateDate ? '~' : ''}{formattedDate}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <SourceBadge sourceType={activeNode.sourceType} verificationStatus={activeNode.verificationStatus} />
            <span className={`text-xs font-medium flex items-center gap-1 ${verBadge.colorClass}`}>
              {activeNode.verificationStatus === 'PHYSICIAN_VERIFIED' || activeNode.verificationStatus === 'CONFIRMED_BY_EMR'
                ? <CheckCircle className="w-3 h-3" />
                : activeNode.verificationStatus === 'NEEDS_REVIEW'
                ? <Clock className="w-3 h-3" />
                : <AlertCircle className="w-3 h-3" />}
              {verBadge.label}
            </span>
          </div>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-gray-50">

        <div className="px-4 py-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Summary</p>
          <p className="text-sm text-gray-700 leading-relaxed">{activeNode.summary}</p>
        </div>

        <div className="px-4 py-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Details</p>
          <p className="text-sm text-gray-600 leading-relaxed">{activeNode.details}</p>
        </div>

        <div className="px-4 py-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Contributor</p>
          <div className="flex items-center gap-2">
            {activeNode.contributorRole === 'PHYSICIAN'
              ? <Stethoscope className="w-3.5 h-3.5 text-violet-400" />
              : activeNode.contributorRole === 'SYSTEM'
              ? <FileText className="w-3.5 h-3.5 text-blue-400" />
              : <User className="w-3.5 h-3.5 text-amber-400" />}
            <span className="text-sm text-gray-700">{activeNode.contributorName}</span>
            <span className="text-xs text-gray-400">· {activeNode.contributorRole}</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
            <span>Confidence: <span className={`font-medium ${
              activeNode.confidenceLevel === 'HIGH' ? 'text-gray-600' :
              activeNode.confidenceLevel === 'MEDIUM' ? 'text-amber-600' : 'text-red-500'
            }`}>{activeNode.confidenceLevel}</span></span>
          </div>
        </div>

        {activeNode.relatedDocuments.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Related Documents</p>
            <div className="space-y-1">
              {activeNode.relatedDocuments.map((docId) => (
                <div key={docId} className="flex items-center gap-2 text-xs text-blue-600">
                  <FileText className="w-3.5 h-3.5" />
                  {docId}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeNode.missingInfo && activeNode.missingInfo.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-amber-500 uppercase tracking-wider mb-1.5">Missing / Uncertain</p>
            <div className="space-y-1.5">
              {activeNode.missingInfo.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeNode.tags.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {activeNode.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Physician Notes {activeNode.physicianNotes.length > 0 && `(${activeNode.physicianNotes.length})`}
          </p>
          {activeNode.physicianNotes.length === 0 ? (
            <p className="text-xs text-gray-300 italic">No physician notes yet.</p>
          ) : (
            <div className="space-y-2">
              {activeNode.physicianNotes.map((note) => (
                <div key={note.noteId} className="bg-violet-50 border border-violet-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-violet-700">{note.physicianName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-violet-400 capitalize">{note.noteType.replace('_', ' ').toLowerCase()}</span>
                      <span className="text-xs text-gray-400">{note.addedAt}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Physician actions */}
      {mode === 'physician' && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-2">
          {!showNoteForm ? (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowNoteForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add note
              </button>
              {activeNode.verificationStatus !== 'PHYSICIAN_VERIFIED' && (
                <button
                  onClick={handleVerify}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Mark verified
                </button>
              )}
              <button
                onClick={handleFlag}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-100 transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Request clarification
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as PhysicianNote['noteType'])}
                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
              >
                <option value="NOTE">Clinical Note</option>
                <option value="CORRECTION">Correction</option>
                <option value="VERIFICATION">Verification</option>
                <option value="CLARIFICATION_REQUEST">Clarification Request</option>
              </select>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your clinical note…"
                rows={3}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-violet-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddNote}
                  className="flex-1 px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => { setShowNoteForm(false); setNoteText(''); }}
                  className="px-3 py-1.5 text-gray-400 text-xs rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
