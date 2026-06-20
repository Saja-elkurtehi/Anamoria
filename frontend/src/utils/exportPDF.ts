import jsPDF from 'jspdf';
import { PDFDocument, PDFTextField, PDFCheckBox, StandardFonts, rgb } from 'pdf-lib';
import type {
  ReferralPackageResponse, RequisitionDraftResponse,
  VisitBriefResponse, SourceReference,
} from '../../../shared/types';

type RGB = [number, number, number];

const TEAL: RGB    = [13, 148, 136];
const GRAY: RGB    = [100, 100, 100];
const DARK: RGB    = [30, 30, 30];
const GREEN: RGB   = [22, 163, 74];
const AMBER: RGB   = [180, 83, 9];
const RED: RGB     = [185, 28, 28];
const LIGHT: RGB   = [150, 150, 150];
const BLUE: RGB    = [37, 99, 235];
const VIOLET: RGB  = [109, 40, 217];

interface PDFWriter {
  doc: jsPDF;
  y: number;
  pageW: number;
  margin: number;
}

function createWriter(): PDFWriter {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  return { doc, y: 15, pageW: doc.internal.pageSize.getWidth(), margin: 15 };
}

function text(
  w: PDFWriter,
  content: string,
  size: number,
  bold = false,
  color: RGB = DARK,
  indent = 0,
): number {
  w.doc.setFontSize(size);
  w.doc.setFont('helvetica', bold ? 'bold' : 'normal');
  w.doc.setTextColor(...color);
  const maxW = w.pageW - w.margin * 2 - indent;
  const lines = w.doc.splitTextToSize(content, maxW) as string[];
  w.doc.text(lines, w.margin + indent, w.y);
  const added = lines.length * (size * 0.4);
  w.y += added;
  return added;
}

function gap(w: PDFWriter, mm = 4) {
  w.y += mm;
}

function rule(w: PDFWriter) {
  w.doc.setDrawColor(220, 220, 220);
  w.doc.line(w.margin, w.y, w.pageW - w.margin, w.y);
  w.y += 1;
}

function checkPage(w: PDFWriter) {
  if (w.y > 270) {
    w.doc.addPage();
    w.y = 15;
  }
}

function sectionHeader(w: PDFWriter, title: string, color: RGB = TEAL) {
  gap(w, 5);
  checkPage(w);
  rule(w);
  gap(w, 3);
  text(w, title, 10, true, color);
  gap(w, 1);
}

function sourceLabel(sourceId: string, sourceMap: SourceReference[]): string {
  const src = sourceMap.find(s => s.sourceId === sourceId);
  if (!src) return sourceId;
  return src.date ? `${src.label} (${src.date})` : src.label;
}

function bulletItem(w: PDFWriter, content: string, sources: string[], sourceMap: SourceReference[], verif?: string) {
  checkPage(w);
  text(w, `• ${content}`, 9, false, DARK, 2);
  if (verif) {
    text(w, verif, 8, false, LIGHT, 5);
  }
  if (sources.length > 0) {
    const labels = sources.map(id => sourceLabel(id, sourceMap)).join(', ');
    text(w, `Source: ${labels}`, 8, false, BLUE, 5);
  }
  gap(w, 1);
}

// ─── Referral Package PDF ─────────────────────────────────────────────────────

export function exportReferralPackagePDF(
  result: ReferralPackageResponse,
  patient: { name: string; dateOfBirth?: string; age: number; gender: string; bloodType: string },
  approvalStatus: string,
  notesForRecipient?: string,
) {
  const w = createWriter();

  // ── Header ──
  text(w, 'ANAMORIA', 22, true, TEAL);
  gap(w, 1);
  text(w, 'Medical Referral Package', 11, false, GRAY);
  gap(w, 2);

  const isApproved = approvalStatus === 'APPROVED';
  text(w, isApproved ? '✓ APPROVED BY PHYSICIAN' : '⚠ DRAFT — PHYSICIAN REVIEW REQUIRED BEFORE USE', 9, true, isApproved ? GREEN : AMBER);
  text(w, `Generated: ${new Date(result.generatedAt).toLocaleString()}`, 8, false, LIGHT);
  gap(w, 3);
  rule(w);

  // ── Patient ──
  gap(w, 3);
  text(w, 'PATIENT INFORMATION', 10, true, TEAL);
  gap(w, 1);
  text(w, `Name: ${patient.name}`, 9);
  if (patient.dateOfBirth) text(w, `Date of Birth: ${patient.dateOfBirth}`, 9);
  text(w, `Age: ${patient.age}  |  Gender: ${patient.gender}  |  Blood Type: ${patient.bloodType}`, 9);

  // ── Referral details ──
  sectionHeader(w, 'REFERRAL DETAILS');
  if (result.recipientContext.recipientName) text(w, `Recipient: ${result.recipientContext.recipientName}`, 9);
  text(w, `Specialty: ${result.recipientContext.recipientSpecialty}`, 9);
  text(w, `Package Type: ${result.recipientContext.packageType.replace(/_/g, ' ')}`, 9);
  text(w, `Reason for Request:`, 9, true);
  text(w, result.recipientContext.reasonForRequest, 9, false, DARK, 3);

  // ── Physician notes for recipient ──
  const notes = notesForRecipient ?? result.notesForRecipient;
  if (notes && notes.trim()) {
    sectionHeader(w, 'NOTES FOR RECIPIENT');
    text(w, notes.trim(), 9, false, DARK, 2);
  }

  // ── Dynamic sections ──
  const sections: { title: string; items: typeof result.relevantMedicalHistory }[] = [
    { title: 'RELEVANT MEDICAL HISTORY',    items: result.relevantMedicalHistory },
    { title: 'CURRENT RELEVANT SYMPTOMS',   items: result.currentRelevantSymptoms },
    { title: 'RELEVANT CONDITIONS',         items: result.relevantConditions },
    { title: 'RELEVANT MEDICATIONS',        items: result.relevantMedications },
    { title: 'RELEVANT ALLERGIES',          items: result.relevantAllergies },
    { title: 'RELEVANT FAMILY HISTORY',     items: result.relevantFamilyHistory ?? [] },
    { title: 'MISSING / UNVERIFIED INFO',   items: result.missingOrUnverifiedInfo },
  ];

  for (const section of sections) {
    if (section.items.length === 0) continue;
    sectionHeader(w, section.title);
    for (const item of section.items) {
      bulletItem(w, item.text, item.sourceIds, result.sourceMap, item.verificationStatus);
    }
  }

  // ── Timeline snapshot ──
  if (result.timelineSnapshot.length > 0) {
    sectionHeader(w, 'TIMELINE SNAPSHOT');
    for (const node of result.timelineSnapshot) {
      checkPage(w);
      text(w, `• ${node.title}  (${node.date})`, 9, true, DARK, 2);
      text(w, node.summary, 9, false, DARK, 5);
      text(w, node.verificationStatus, 8, false, LIGHT, 5);
      gap(w, 1.5);
    }
  }

  // ── Documents ──
  if (result.documentsToInclude.length > 0) {
    sectionHeader(w, 'REFERENCED DOCUMENTS');
    for (const d of result.documentsToInclude) {
      checkPage(w);
      text(w, `• ${d.fileName}`, 9, true, DARK, 2);
      text(w, d.relevanceReason, 9, false, DARK, 5);
      gap(w, 1);
    }
  }

  // ── Warnings ──
  if (result.warnings.length > 0) {
    sectionHeader(w, 'DATA QUALITY NOTES');
    for (const warning of result.warnings) {
      checkPage(w);
      text(w, `⚠  ${warning}`, 8, false, AMBER, 2);
      gap(w, 1);
    }
  }

  // ── Source references ──
  sectionHeader(w, 'SOURCE REFERENCES');
  for (const src of result.sourceMap) {
    checkPage(w);
    const typeLabel = src.sourceType.replace(/_/g, ' ');
    text(w, `• ${src.label}${src.date ? `  (${src.date})` : ''}  —  ${typeLabel}`, 8, false, GRAY, 2);
    if (src.excerpt) text(w, `  "${src.excerpt}"`, 8, false, LIGHT, 5);
    gap(w, 0.5);
  }

  // ── Footer ──
  gap(w, 6);
  checkPage(w);
  rule(w);
  gap(w, 2);
  text(w, 'This document was generated by Anamoria (hackathon demo). It is an AI-assisted draft and requires physician review before clinical use. This system does not diagnose conditions or recommend treatment.', 7, false, LIGHT);

  const safeName = patient.name.replace(/\s+/g, '-').toLowerCase();
  w.doc.save(`referral-package-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Keep backward-compat alias so old import still works during transition
export const exportReferencePackagePDF = exportReferralPackagePDF;

// ─── Visit Brief PDF ──────────────────────────────────────────────────────────

export function exportVisitBriefPDF(
  result: VisitBriefResponse,
  patient: { name: string; dateOfBirth?: string; age: number; gender: string },
  visitNoteContent: string,
) {
  const w = createWriter();

  // ── Header ──
  text(w, 'ANAMORIA', 22, true, VIOLET);
  gap(w, 1);
  text(w, 'AI Visit Brief', 11, false, GRAY);
  gap(w, 2);
  text(w, '⚠ AI-GENERATED — PHYSICIAN REVIEW REQUIRED BEFORE CLINICAL USE', 9, true, AMBER);
  text(w, `Generated: ${new Date(result.generatedAt).toLocaleString()}`, 8, false, LIGHT);
  if (result.briefOptions) {
    const opts = result.briefOptions;
    const optSummary = [
      `Range: ${opts.timeRange.replace(/_/g, ' ')}`,
      `Style: ${opts.outputStyle.replace(/_/g, ' ')}`,
      `Focus: ${opts.customFocusArea ?? opts.focusArea.replace(/_/g, ' ')}`,
    ].join('  ·  ');
    text(w, optSummary, 8, false, LIGHT);
  }
  gap(w, 3);
  rule(w);

  // ── Patient ──
  gap(w, 3);
  text(w, 'PATIENT INFORMATION', 10, true, VIOLET);
  gap(w, 1);
  text(w, `Name: ${patient.name}`, 9);
  if (patient.dateOfBirth) text(w, `Date of Birth: ${patient.dateOfBirth}`, 9);
  text(w, `Age: ${patient.age}  |  Gender: ${patient.gender}`, 9);

  // ── Summary ──
  sectionHeader(w, 'SUMMARY', VIOLET);
  text(w, result.summary, 9, false, DARK, 2);

  // ── Since last visit ──
  if (result.sinceLastVisit.length > 0) {
    sectionHeader(w, 'SINCE LAST VISIT', VIOLET);
    for (const item of result.sinceLastVisit) {
      bulletItem(w, item.text, item.sourceIds, result.sourceMap, item.verificationStatus);
    }
  }

  // ── Needs review ──
  if (result.needsReview.length > 0) {
    sectionHeader(w, 'NEEDS PHYSICIAN REVIEW', AMBER);
    for (const item of result.needsReview) {
      bulletItem(w, item.text, item.sourceIds, result.sourceMap, item.verificationStatus);
    }
  }

  // ── Visit note starter ──
  if (visitNoteContent.trim()) {
    sectionHeader(w, 'SUGGESTED VISIT NOTE STARTER', VIOLET);
    text(w, visitNoteContent.trim(), 9, false, DARK, 2);
  }

  // ── Warnings ──
  if (result.warnings.length > 0) {
    sectionHeader(w, 'DATA QUALITY NOTES', AMBER);
    for (const warning of result.warnings) {
      checkPage(w);
      text(w, `⚠  ${warning}`, 8, false, AMBER, 2);
      gap(w, 1);
    }
  }

  // ── Source references ──
  sectionHeader(w, 'SOURCE REFERENCES', GRAY);
  for (const src of result.sourceMap) {
    checkPage(w);
    text(w, `• ${src.label}${src.date ? `  (${src.date})` : ''}  —  ${src.sourceType.replace(/_/g, ' ')}`, 8, false, GRAY, 2);
    if (src.excerpt) text(w, `  "${src.excerpt}"`, 8, false, LIGHT, 5);
    gap(w, 0.5);
  }

  // ── Footer ──
  gap(w, 6);
  checkPage(w);
  rule(w);
  gap(w, 2);
  text(w, 'AI-generated visit brief. Physician review required before clinical use. This system does not diagnose conditions or recommend treatment.', 7, false, LIGHT);

  const safeName = patient.name.replace(/\s+/g, '-').toLowerCase();
  w.doc.save(`visit-brief-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Requisition Draft PDF ────────────────────────────────────────────────────

export function exportRequisitionPDF(
  result: RequisitionDraftResponse,
  patient: { name: string; dateOfBirth?: string; age: number; gender: string },
  approvalStatus: string,
  editedValues: Record<string, string>,
) {
  const w = createWriter();

  // ── Header ──
  text(w, 'ANAMORIA', 22, true, TEAL);
  gap(w, 1);
  text(w, result.formTitle, 11, false, GRAY);
  if (result.templateFileName) text(w, `Template: ${result.templateFileName}`, 9, false, LIGHT);
  gap(w, 2);
  const isApproved = approvalStatus === 'APPROVED';
  text(w, isApproved ? '✓ APPROVED BY PHYSICIAN' : '⚠ DRAFT — PHYSICIAN REVIEW REQUIRED BEFORE USE', 9, true, isApproved ? GREEN : AMBER);
  text(w, `Generated: ${new Date(result.generatedAt).toLocaleString()}`, 8, false, LIGHT);
  gap(w, 3);
  rule(w);

  // ── Patient header ──
  gap(w, 3);
  text(w, 'PATIENT INFORMATION', 10, true, TEAL);
  gap(w, 1);
  text(w, `Name: ${patient.name}`, 9);
  if (patient.dateOfBirth) text(w, `Date of Birth: ${patient.dateOfBirth}`, 9);
  text(w, `Age: ${patient.age}  |  Gender: ${patient.gender}`, 9);

  // ── Fields ──
  sectionHeader(w, 'REQUISITION FIELDS');

  for (const field of result.filledFields) {
    checkPage(w);
    const value = editedValues[field.fieldId] ?? field.value;
    const confColor: RGB = field.confidence === 'HIGH' ? GREEN : field.confidence === 'LOW' ? RED : AMBER;
    text(w, field.label, 9, true, DARK);
    text(w, value, 9, false, value.includes('Not available') ? LIGHT : DARK, 3);

    const flags: string[] = [];
    flags.push(`Confidence: ${field.confidence}`);
    if (field.needsPhysicianReview) flags.push('⚠ Review required');
    text(w, flags.join('  ·  '), 7, false, confColor, 3);

    if (field.sourceIds.length > 0) {
      const labels = field.sourceIds.map(id => sourceLabel(id, result.sourceMap)).join(', ');
      text(w, `Source: ${labels}`, 7, false, BLUE, 3);
    }
    gap(w, 2.5);
  }

  // ── Warnings ──
  if (result.warnings.length > 0) {
    sectionHeader(w, 'NOTES');
    for (const warning of result.warnings) {
      checkPage(w);
      text(w, `⚠  ${warning}`, 8, false, AMBER, 2);
      gap(w, 1);
    }
  }

  // ── Source references ──
  sectionHeader(w, 'SOURCE REFERENCES');
  for (const src of result.sourceMap) {
    checkPage(w);
    text(w, `• ${src.label}${src.date ? `  (${src.date})` : ''}  —  ${src.sourceType.replace(/_/g, ' ')}`, 8, false, GRAY, 2);
    gap(w, 0.5);
  }

  // ── Footer ──
  gap(w, 6);
  checkPage(w);
  rule(w);
  gap(w, 2);
  text(w, 'AI-generated draft. Physician review required before submission. This system does not make clinical decisions.', 7, false, LIGHT);

  const safeName = patient.name.replace(/\s+/g, '-').toLowerCase();
  w.doc.save(`requisition-draft-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Shared download helper ───────────────────────────────────────────────────

function downloadBlob(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Fill uploaded AcroForm PDF ───────────────────────────────────────────────

export async function fillAndExportRequisitionPDF(
  originalPdfBytes: Uint8Array,
  result: RequisitionDraftResponse,
  editedValues: Record<string, string>,
  patientName: string,
): Promise<void> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });

  // Build fieldName → value map using edited values when available
  const valueMap: Record<string, string> = {};
  for (const field of result.filledFields) {
    const key = field.fieldName ?? field.fieldId;
    const val = editedValues[field.fieldId] ?? field.value;
    if (val && !val.includes('Not available') && !val.includes('physician to complete')) {
      valueMap[key] = val;
    }
  }

  let filledCount = 0;
  try {
    const form = pdfDoc.getForm();
    for (const field of form.getFields()) {
      const name = field.getName();
      const value = valueMap[name];
      if (value === undefined) continue;
      try {
        if (field instanceof PDFTextField) {
          field.setText(value);
          filledCount++;
        } else if (field instanceof PDFCheckBox) {
          const lower = value.toLowerCase();
          if (lower === 'yes' || lower === 'true' || lower === 'checked' || lower === '1') {
            field.check();
            filledCount++;
          }
        }
      } catch {
        // skip fields that can't be filled
      }
    }
  } catch {
    // no AcroForm — should not happen if fillMode was ACROFORM, but handle gracefully
  }

  console.log(`[PDF fill] Filled ${filledCount} of ${result.filledFields.length} fields in ${result.templateFileName ?? 'uploaded form'}`);

  const bytes = await pdfDoc.save();
  const safeName = patientName.replace(/\s+/g, '-').toLowerCase();
  downloadBlob(bytes, `filled-requisition-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Overlay cover page for non-fillable PDFs ─────────────────────────────────

export async function exportRequisitionOverlayPDF(
  originalPdfBytes: Uint8Array,
  result: RequisitionDraftResponse,
  editedValues: Record<string, string>,
  patientName: string,
): Promise<void> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Insert A4 cover page at the beginning
  const cover = pdfDoc.insertPage(0, [595.28, 841.89]);
  const M = 42; // margin
  let y = 841.89 - M;

  const teal  = rgb(0.05, 0.58, 0.53);
  const dark  = rgb(0.12, 0.12, 0.12);
  const gray  = rgb(0.45, 0.45, 0.45);
  const amber = rgb(0.70, 0.33, 0.04);
  const line  = rgb(0.82, 0.82, 0.82);

  function row(label: string, value: string) {
    if (y < M + 16) return;
    const truncVal = value.slice(0, 68);
    cover.drawText(`${label}:`, { x: M,       y, size: 8, font: bold,     color: rgb(0.3, 0.3, 0.3) });
    cover.drawText(truncVal,    { x: M + 120, y, size: 8, font: helvetica, color: dark });
    y -= 14;
  }

  function line_(txt: string, size: number, f = helvetica, color = dark, indent = 0) {
    if (y < M) return;
    cover.drawText(txt.slice(0, 90), { x: M + indent, y, size, font: f, color });
    y -= size * 1.6;
  }

  function divider() {
    cover.drawLine({ start: { x: M, y: y + 4 }, end: { x: 595.28 - M, y: y + 4 }, thickness: 0.5, color: line });
    y -= 8;
  }

  // Header
  line_('ANAMORIA', 16, bold, teal);
  line_('Requisition Summary — Cover Page', 10, helvetica, gray);
  y -= 2;
  line_('⚠ This PDF has no fillable AcroForm fields. Enter values below into the original form (pages 2+).', 8, helvetica, amber);
  y -= 4;
  divider();

  line_(result.formTitle, 13, bold, dark);
  line_(`Status: ${result.status}  |  Generated: ${new Date(result.generatedAt).toLocaleString()}`, 8, helvetica, gray);
  if (result.templateFileName) {
    line_(`Template: ${result.templateFileName}`, 8, helvetica, gray);
  }
  y -= 6;
  divider();

  line_('FIELD VALUES FOR MANUAL ENTRY', 10, bold, teal);
  y -= 4;

  for (const field of result.filledFields) {
    const value = editedValues[field.fieldId] ?? field.value;
    row(field.label, value);
  }

  y -= 6;
  divider();
  line_('AI-generated draft. Physician review required before use. Anamoria does not make clinical decisions.', 7, helvetica, rgb(0.6, 0.6, 0.6));

  const bytes = await pdfDoc.save();
  const safeName = patientName.replace(/\s+/g, '-').toLowerCase();
  downloadBlob(bytes, `overlay-requisition-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
