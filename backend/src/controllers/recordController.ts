import type { Request, Response } from 'express';
import { z } from 'zod';
import { mockPatients } from '../data/mockPatients';
import { ExtractionStatus } from '../../../shared/types';

export function getPatientRecords(req: Request, res: Response) {
  const patient = mockPatients.find(p => p.patientId === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient.uploadedDocuments);
}

const CreateRecordSchema = z.object({
  fileName: z.string().min(1),
  documentType: z.string(),
  source: z.string().optional().default('Patient upload'),
});

export function addRecord(req: Request, res: Response) {
  const patient = mockPatients.find(p => p.patientId === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const parsed = CreateRecordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const record = {
    recordId: `doc-${Date.now()}`,
    patientId: patient.patientId,
    uploadedAt: new Date().toISOString(),
    extractionStatus: ExtractionStatus.PENDING,
    extractedItems: {},
    ...parsed.data,
  };
  patient.uploadedDocuments.push(record);
  res.status(201).json(record);
}
