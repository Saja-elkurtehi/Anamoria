import type { Request, Response } from 'express';
import { z } from 'zod';
import { mockPatients } from '../data/mockPatients';
import { SymptomStatus } from '../../../shared/types';

export function getPatients(_req: Request, res: Response) {
  res.json(mockPatients.map(({ patientId, name, dateOfBirth, demographics }) => ({
    patientId,
    name,
    dateOfBirth,
    demographics,
  })));
}

export function getPatientById(req: Request, res: Response) {
  const patient = mockPatients.find(p => p.patientId === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
}

const CreatePatientSchema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.string(),
  demographics: z.object({
    gender: z.string(),
    bloodType: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }),
});

export function createPatient(req: Request, res: Response) {
  const parsed = CreatePatientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const newPatient = {
    patientId: `pat-${Date.now()}`,
    ...parsed.data,
    conditions: [],
    medications: [],
    allergies: [],
    surgeries: [],
    hospitalVisits: [],
    symptoms: [],
    testsLabs: [],
    imaging: [],
    familyHistory: [],
    uploadedDocuments: [],
  };
  mockPatients.push(newPatient);
  res.status(201).json(newPatient);
}

const AddSymptomSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
  frequency: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  triggers: z.string().optional().default(''),
  status: z.nativeEnum(SymptomStatus).optional().default(SymptomStatus.ONGOING),
});

export function addSymptom(req: Request, res: Response) {
  const patient = mockPatients.find(p => p.patientId === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const parsed = AddSymptomSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const symptom = {
    symptomId: `sym-${Date.now()}`,
    patientId: patient.patientId,
    supportingDocuments: [],
    reviewedByDoctor: false,
    ...parsed.data,
  };
  patient.symptoms.push(symptom);
  res.status(201).json(symptom);
}
