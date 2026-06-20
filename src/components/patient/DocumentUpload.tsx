import { Upload, FileText, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { newDocumentTemplates } from '../../data/mockData';
import type { UploadedDocument } from '../../types';

export default function DocumentUpload() {
  const { patient, setPatient } = useApp();
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [justUploaded, setJustUploaded] = useState<string | null>(null);
  const [templateIdx, setTemplateIdx] = useState(0);

  function simulateUpload() {
    const template = newDocumentTemplates[templateIdx % newDocumentTemplates.length];
    const newDoc: UploadedDocument = {
      ...template,
      docId: `doc-${Date.now()}`,
      uploadDate: new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
      extractionStatus: 'PROCESSING',
    };
    const updated = { ...patient, uploadedDocuments: [...patient.uploadedDocuments, newDoc] };
    setPatient(updated);
    setJustUploaded(newDoc.docId);
    setTemplateIdx((i) => i + 1);

    // simulate extraction completing
    const docId = newDoc.docId;
    setTimeout(() => {
      const updatedDocs = [...patient.uploadedDocuments];
      const idx = updatedDocs.findIndex((d) => d.docId === docId);
      if (idx !== -1) {
        updatedDocs[idx] = { ...updatedDocs[idx], extractionStatus: 'COMPLETE' };
        setPatient({ ...patient, uploadedDocuments: updatedDocs });
      }
    }, 2000);
  }

  const extractionStatusConfig = {
    COMPLETE: { label: 'Extracted', icon: <CheckCircle className="w-3.5 h-3.5 text-green-500" />, color: 'text-green-600' },
    PROCESSING: { label: 'Extracting…', icon: <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse" />, color: 'text-blue-600' },
    PARTIAL: { label: 'Partial', icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />, color: 'text-amber-600' },
    FAILED: { label: 'Failed', icon: <AlertCircle className="w-3.5 h-3.5 text-red-500" />, color: 'text-red-600' },
  };

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full scrollbar-thin">
      {/* Safety notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
        <strong>Document Extraction:</strong> Anamoria extracts dates, conditions, medications, findings, and follow-up instructions from your documents. Extracted information is labelled as "Uploaded Document" on your timeline.
      </div>

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          isDragging ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); simulateUpload(); }}
        onClick={simulateUpload}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center">
            <Upload className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Drop files here or click to upload</p>
            <p className="text-sm text-gray-400 mt-1">PDF, JPG, PNG — Lab reports, discharge summaries, specialist letters, medication lists</p>
          </div>
          <button className="mt-2 px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors">
            Add Mock Document
          </button>
        </div>
      </div>

      {/* Accepted types */}
      <div className="flex flex-wrap gap-2">
        {['Lab Reports', 'Discharge Summaries', 'Specialist Letters', 'Medication Lists', 'Imaging Reports', 'Referral Letters', 'Symptom Diaries'].map((t) => (
          <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{t}</span>
        ))}
      </div>

      {/* Document list */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Uploaded Documents ({patient.uploadedDocuments.length})
        </h3>
        <div className="space-y-3">
          {patient.uploadedDocuments.map((doc) => {
            const statusCfg = extractionStatusConfig[doc.extractionStatus];
            const isNew = doc.docId === justUploaded;
            const isExpanded = expandedDoc === doc.docId;

            return (
              <div
                key={doc.docId}
                className={`bg-white border rounded-xl overflow-hidden transition-all ${
                  isNew ? 'border-teal-300 shadow-md' : 'border-gray-100'
                }`}
              >
                {/* Document header */}
                <button
                  className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedDoc(isExpanded ? null : doc.docId)}
                >
                  <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</span>
                      {isNew && (
                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">New</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{doc.documentType}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{doc.uploadDate}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{doc.fileSize}</span>
                      {doc.pages && (
                        <>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{doc.pages}p</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {statusCfg.icon}
                    <span className={`text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded extraction preview */}
                {isExpanded && doc.extractionStatus === 'COMPLETE' && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-3">Extracted Information</p>
                    {Object.entries(doc.extractedItems).map(([key, values]) => (
                      values && values.length > 0 && (
                        <div key={key}>
                          <p className="text-xs font-semibold text-gray-500 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {values.map((v, i) => (
                              <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">{v}</span>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {isExpanded && doc.extractionStatus === 'PROCESSING' && (
                  <div className="px-4 pb-4 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Clock className="w-4 h-4 animate-pulse" />
                      Extracting data from document…
                    </div>
                    <div className="mt-2 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
