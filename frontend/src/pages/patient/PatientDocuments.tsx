import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEMO_PATIENT_ID, demoPatient } from '../../data/mockData';
import type { UploadedDoc, TimelineNode } from '../../types';

const DOC_TYPES = [
  'Lab Results',
  'Specialist Consultation',
  'Discharge Summary',
  'Imaging Report',
  'Medication List',
  'Referral Letter',
  'Other',
];

const statusConfig = {
  EXTRACTED: { label: 'Extracted', classes: 'bg-green-100 text-green-700', icon: CheckCircle },
  PENDING: { label: 'Processing', classes: 'bg-amber-100 text-amber-700', icon: Clock },
  NEEDS_REVIEW: { label: 'Needs review', classes: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  FAILED: { label: 'Failed', classes: 'bg-red-100 text-red-600', icon: X },
};

export default function PatientDocuments() {
  const { state, addDocument, addTimelineNode } = useApp();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState('');
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function simulateUpload(fileName: string, type: string) {
    setUploading(true);
    const docId = `doc-${Date.now()}`;
    const now = new Date().toISOString();

    setTimeout(() => {
      const doc: UploadedDoc = {
        documentId: docId,
        patientId: DEMO_PATIENT_ID,
        fileName,
        documentType: type,
        uploadedBy: demoPatient.name,
        uploadedAt: now,
        extractionStatus: 'EXTRACTED',
        extractedItems: {
          findings: ['Item extracted from document (demo)'],
          doctors: ['Physician name extracted (demo)'],
        },
        linkedNodeIds: [`node-doc-${Date.now()}`],
      };
      addDocument(doc);

      const node: TimelineNode = {
        nodeId: `node-doc-${Date.now()}`,
        patientId: DEMO_PATIENT_ID,
        type: 'UPLOADED_DOCUMENT',
        title: `Uploaded: ${fileName}`,
        summary: `Patient uploaded ${type}. Extraction complete.`,
        eventDate: now.split('T')[0],
        datePrecision: 'EXACT',
        sourceType: 'UPLOADED_RECORD',
        verificationStatus: 'NEEDS_REVIEW',
        confidenceLevel: 'MEDIUM',
        contributorName: demoPatient.name,
        contributorRole: 'PATIENT',
        relatedDocumentIds: [docId],
        relatedNodeIds: [],
        tags: ['upload', type.toLowerCase().replace(' ', '-')],
        details: {
          documentId: docId,
          fileName,
          documentType: 'OTHER',
          uploadedBy: demoPatient.name,
          uploadedAt: now,
          documentDate: now.split('T')[0],
          issuingOrganization: 'Unknown',
          extractionStatus: 'EXTRACTED',
          extractedItems: {
            findings: ['Demo extraction: Item 1', 'Demo extraction: Item 2'],
          },
          supportedNodeIds: [],
        },
        physicianNotes: [],
        createdAt: now,
        updatedAt: now,
      };
      addTimelineNode(node);
      setUploading(false);
      setShowForm(false);
      setUploadedName('');
    }, 1200);
  }

  function handleFilePick(file: File) {
    setUploadedName(file.name);
    setShowForm(true);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFilePick(file);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Documents</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Upload lab results, referral letters, and other records. Anamoria links them to your timeline.
        </p>
      </div>

      {/* Upload zone */}
      {!showForm ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-colors mb-6 ${
            dragOver
              ? 'border-teal-400 bg-teal-50'
              : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFilePick(f); }}
          />
          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">Drop a file here, or click to browse</p>
          <p className="text-xs text-gray-400">PDF, image, or Word document</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">{uploadedName || 'Selected file'}</p>
              <p className="text-xs text-gray-400">Ready to upload</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Document type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => simulateUpload(uploadedName || 'document.pdf', docType)}
              disabled={uploading}
              className="flex-1 bg-teal-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload & extract</>
              )}
            </button>
            <button
              onClick={() => { setShowForm(false); setUploadedName(''); }}
              className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Document list */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{state.documents.length} documents</h2>
      <div className="space-y-3">
        {state.documents.map(doc => {
          const sc = statusConfig[doc.extractionStatus];
          const Icon = sc.icon;
          return (
            <div key={doc.documentId} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{doc.fileName}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.classes}`}>
                      <Icon className="w-3 h-3" /> {sc.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {doc.documentType} · Uploaded by {doc.uploadedBy}
                  </p>
                  {doc.documentDate && (
                    <p className="text-xs text-gray-400">Document date: {doc.documentDate}</p>
                  )}

                  {/* Extracted items preview */}
                  {doc.extractedItems && doc.extractionStatus === 'EXTRACTED' && (
                    <div className="mt-3 space-y-1.5">
                      {Object.entries(doc.extractedItems).map(([k, vals]) =>
                        vals && vals.length > 0 ? (
                          <div key={k}>
                            <p className="text-xs text-gray-400 capitalize font-medium">{k}</p>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {vals.map((v, i) => (
                                <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{v}</span>
                              ))}
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}

                  {doc.linkedNodeIds.length > 0 && (
                    <p className="text-xs text-teal-600 mt-2">
                      Linked to {doc.linkedNodeIds.length} timeline event{doc.linkedNodeIds.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
