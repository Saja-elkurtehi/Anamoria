import { useRef, useState } from 'react';
import {
  ClipboardList, AlertCircle, Loader2, Upload, CheckCircle,
  Edit3, AlertTriangle, Download, FileText, X,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { exportRequisitionPDF, fillAndExportRequisitionPDF, exportRequisitionOverlayPDF } from '../../utils/exportPDF';
import type { Patient, TimelineNode, UploadedDoc } from '../../types';
import type {
  RequisitionDraftResponse, RequisitionType,
  AITimelineNode, AIDocument, RequisitionField,
} from '../../../../shared/types';
import { aiService } from '../../services/aiService';
import SourceChip from '../shared/SourceChip';

type FillMode = 'ACROFORM' | 'NOT_FILLABLE' | 'UNKNOWN';

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

const REQ_TYPE_LABELS: Record<RequisitionType, string> = {
  LAB: 'Laboratory Requisition',
  IMAGING: 'Imaging Requisition',
  SPECIALIST_REFERRAL: 'Specialist Referral',
  OTHER: 'Other Medical Requisition',
};

const CONFIDENCE_BADGE: Record<string, string> = {
  HIGH:   'bg-green-100 text-green-700 border-green-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW:    'bg-red-100 text-red-700 border-red-200',
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

export default function RequisitionDraftTab({ patientProfile, timelineNodes, documents }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF template state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [fillMode, setFillMode] = useState<FillMode | null>(null);
  const [detectedFields, setDetectedFields] = useState<{ fieldName: string; fieldType: string }[]>([]);

  // Requisition form state
  const [form, setForm] = useState({
    requisitionType: 'LAB' as RequisitionType,
    reasonForRequest: '',
    requestedService: '',
  });

  // Generation state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RequisitionDraftResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'DRAFT' | 'NEEDS_REVIEW' | 'APPROVED'>('DRAFT');
  const [exporting, setExporting] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset derived state when a new file is chosen
    setPdfFile(file);
    setPdfBytes(null);
    setFillMode(null);
    setDetectedFields([]);
    setResult(null);
    setDetecting(true);

    try {
      const ab = await file.arrayBuffer();
      const bytes = new Uint8Array(ab);
      setPdfBytes(bytes);

      let fields: { fieldName: string; fieldType: string }[] = [];
      let detected: FillMode = 'NOT_FILLABLE';

      try {
        const pdfDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
        try {
          const pdfForm = pdfDoc.getForm();
          const rawFields = pdfForm.getFields();
          fields = rawFields.map(f => ({ fieldName: f.getName(), fieldType: 'Text' }));
          detected = fields.length > 0 ? 'ACROFORM' : 'NOT_FILLABLE';
        } catch {
          detected = 'NOT_FILLABLE';
        }
      } catch {
        detected = 'UNKNOWN';
      }

      setDetectedFields(fields);
      setFillMode(detected);
    } catch {
      setFillMode('UNKNOWN');
    } finally {
      setDetecting(false);
    }
  }

  function clearTemplate() {
    setPdfFile(null);
    setPdfBytes(null);
    setFillMode(null);
    setDetectedFields([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleGenerate() {
    if (!form.reasonForRequest.trim()) return;
    setLoading(true);
    setError(null);
    setStatus('DRAFT');
    setEditedValues({});
    try {
      const data = await aiService.generateRequisitionDraft({
        patientId: patientProfile.patientId,
        requisitionType: form.requisitionType,
        reasonForRequest: form.reasonForRequest.trim(),
        requestedService: form.requestedService.trim() || undefined,
        uploadedTemplate: pdfFile ? { fileName: pdfFile.name, templateType: form.requisitionType } : undefined,
        detectedPdfFields: detectedFields.length > 0 ? detectedFields : undefined,
        patientProfile: {
          patientId: patientProfile.patientId,
          name: patientProfile.name,
          age: patientProfile.age,
          dateOfBirth: patientProfile.dateOfBirth,
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
        physicianNotes: [],
      });
      setResult(data);
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  }

  function getValue(field: RequisitionField): string {
    return editedValues[field.fieldId] ?? field.value;
  }

  async function handleExportPDF() {
    if (!result) return;
    setExporting(true);
    try {
      const activeFillMode = fillMode ?? result.fillMode;
      if (pdfBytes && activeFillMode === 'ACROFORM') {
        await fillAndExportRequisitionPDF(pdfBytes, result, editedValues, patientProfile.name);
      } else if (pdfBytes && activeFillMode === 'NOT_FILLABLE') {
        await exportRequisitionOverlayPDF(pdfBytes, result, editedValues, patientProfile.name);
      } else {
        exportRequisitionPDF(
          result,
          { name: patientProfile.name, dateOfBirth: patientProfile.dateOfBirth, age: patientProfile.age, gender: patientProfile.gender },
          status,
          editedValues,
        );
      }
    } finally {
      setExporting(false);
    }
  }

  const needsReviewCount = result?.filledFields.filter(f => f.needsPhysicianReview).length ?? 0;
  const lowConfidenceCount = result?.filledFields.filter(f => f.confidence === 'LOW').length ?? 0;

  const activeFillMode = fillMode ?? result?.fillMode;
  const exportLabel = pdfBytes && activeFillMode === 'ACROFORM'
    ? 'Export Filled PDF'
    : pdfBytes && activeFillMode === 'NOT_FILLABLE'
      ? 'Export with Cover Page'
      : 'Export Draft PDF';

  // Require approval before exporting when there is an actual form to fill
  const exportDisabled = !result || exporting || (pdfBytes && activeFillMode === 'ACROFORM' && status !== 'APPROVED');

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Safety banner */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>AI-generated draft. Physician must review each field before approving.</strong>{' '}
          The AI populates the form using existing patient records. It does not make clinical decisions.
          Every field includes its source reference.
        </p>
      </div>

      {/* Configuration form */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-violet-600" />
          <h3 className="text-sm font-semibold text-gray-900">Requisition Details</h3>
        </div>
        <div className="p-5 space-y-4">

          {/* Template upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Upload empty requisition PDF form
            </label>
            {!pdfFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl px-4 py-4 flex items-center gap-3 cursor-pointer transition-colors border-gray-200 hover:border-violet-300 hover:bg-violet-50"
              >
                <Upload className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Click to upload a requisition PDF template</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    If the PDF has fillable AcroForm fields, Anamoria will fill them directly.
                    Otherwise, a cover page with field values will be prepended to the original PDF.
                  </p>
                </div>
              </div>
            ) : (
              <div className={`rounded-xl border p-3.5 ${
                fillMode === 'ACROFORM'     ? 'bg-green-50 border-green-200' :
                fillMode === 'NOT_FILLABLE' ? 'bg-amber-50 border-amber-200' :
                                             'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-700 truncate">{pdfFile.name}</span>
                  </div>
                  <button
                    onClick={clearTemplate}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    title="Remove template"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {detecting ? (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Detecting fillable fields…
                  </p>
                ) : fillMode === 'ACROFORM' ? (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-green-700">
                      ✓ Fillable fields detected: {detectedFields.length}
                    </p>
                    <p className="text-xs text-green-600">
                      Status: Ready to fill — AI will map patient data to detected PDF fields.
                      Export will fill this exact form.
                    </p>
                    {detectedFields.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {detectedFields.slice(0, 10).map(f => (
                          <span key={f.fieldName} className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-mono">
                            {f.fieldName}
                          </span>
                        ))}
                        {detectedFields.length > 10 && (
                          <span className="text-[10px] text-green-600">+{detectedFields.length - 10} more</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : fillMode === 'NOT_FILLABLE' ? (
                  <div>
                    <p className="text-xs font-semibold text-amber-700">
                      ⚠ No fillable AcroForm fields detected in this PDF
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Export will prepend a cover page with all field values to the original PDF.
                      For direct field filling, upload a PDF with fillable form fields.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Could not analyse PDF — it may be encrypted or corrupted.
                    Will export a generic draft summary.
                  </p>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileSelect}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Requisition type *</label>
            <select
              value={form.requisitionType}
              onChange={e => setForm(f => ({ ...f, requisitionType: e.target.value as RequisitionType }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              {(Object.entries(REQ_TYPE_LABELS) as [RequisitionType, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Requested service (optional)</label>
            <input
              type="text"
              value={form.requestedService}
              onChange={e => setForm(f => ({ ...f, requestedService: e.target.value }))}
              placeholder="e.g. CBC with differential, Chest X-ray PA, Pulmonology consult"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Clinical indication / reason *</label>
            <textarea
              value={form.reasonForRequest}
              onChange={e => setForm(f => ({ ...f, reasonForRequest: e.target.value }))}
              placeholder="e.g. Elevated WBC and IgE, exertional dyspnea in patient with confirmed asthma. Rule out ABPA."
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !form.reasonForRequest.trim()}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generating draft…</>
            ) : fillMode === 'ACROFORM' ? (
              <><ClipboardList className="w-4 h-4" />Fill Uploaded Requisition Form</>
            ) : (
              <><ClipboardList className="w-4 h-4" />Generate Filled Draft</>
            )}
          </button>
        </div>
      </div>

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
                {status === 'APPROVED' ? '✓ Approved by physician' : 'Draft · Needs physician review'}
              </span>
              {needsReviewCount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                  {needsReviewCount} field{needsReviewCount > 1 ? 's' : ''} need review
                </span>
              )}
              {lowConfidenceCount > 0 && (
                <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                  {lowConfidenceCount} low confidence
                </span>
              )}
              {activeFillMode === 'ACROFORM' && (
                <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                  ✓ Will fill uploaded PDF form
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                disabled={!!exportDisabled}
                title={pdfBytes && activeFillMode === 'ACROFORM' && status !== 'APPROVED' ? 'Approve requisition before exporting the filled PDF' : undefined}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {exportLabel}
              </button>
              {status !== 'APPROVED' && (
                <button
                  onClick={() => setStatus('APPROVED')}
                  className="flex items-center gap-1.5 text-xs text-white font-semibold bg-violet-600 hover:bg-violet-700 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve Requisition
                </button>
              )}
            </div>
          </div>

          {/* Form title / template info */}
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-3">
            <p className="text-sm font-semibold text-violet-800">{result.formTitle}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <p className="text-xs text-violet-600">
                Generated {new Date(result.generatedAt).toLocaleString()} · Status: {status}
              </p>
              {result.templateFileName && (
                <p className="text-xs text-violet-500 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Template: {result.templateFileName}
                </p>
              )}
              {activeFillMode === 'ACROFORM' && (
                <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-200 px-1.5 py-0.5 rounded">
                  AcroForm fill
                </span>
              )}
              {activeFillMode === 'NOT_FILLABLE' && pdfBytes && (
                <span className="text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                  Overlay cover page
                </span>
              )}
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

          {/* Fields */}
          <div className="space-y-3">
            {result.filledFields.map(field => {
              const val = getValue(field);
              const isEdited = editedValues[field.fieldId] !== undefined;
              return (
                <div
                  key={field.fieldId}
                  className={`bg-white border rounded-xl p-4 ${
                    field.needsPhysicianReview
                      ? 'border-amber-200'
                      : field.confidence === 'LOW'
                        ? 'border-red-200'
                        : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{field.label}</p>
                      {field.fieldName && (
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                          {field.fieldName}
                        </span>
                      )}
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${CONFIDENCE_BADGE[field.confidence]}`}>
                        {field.confidence}
                      </span>
                      {field.needsPhysicianReview && (
                        <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Review required
                        </span>
                      )}
                      {isEdited && (
                        <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <Edit3 className="w-3 h-3" />
                          Edited
                        </span>
                      )}
                    </div>
                    {field.sourceIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 flex-shrink-0">
                        {field.sourceIds.map(sid => (
                          <SourceChip key={sid} sourceId={sid} sourceMap={result.sourceMap} />
                        ))}
                      </div>
                    )}
                  </div>

                  {field.editable ? (
                    <input
                      type="text"
                      value={val}
                      onChange={e => setEditedValues(ev => ({ ...ev, [field.fieldId]: e.target.value }))}
                      className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 px-1">{val}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Source map */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Source Map — {result.sourceMap.length} sources
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {result.sourceMap.map(src => (
                <div key={src.sourceId} className="px-5 py-3 flex items-start gap-3">
                  <SourceChip sourceId={src.sourceId} sourceMap={result.sourceMap} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700">{src.label}</p>
                    {src.date && <p className="text-xs text-gray-400">{src.date}</p>}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{src.sourceType.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
