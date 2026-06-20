import type { Request, Response } from 'express';
import { z } from 'zod';
import { mockPatients } from '../data/mockPatients';

export function getFamilyMembers(req: Request, res: Response) {
  const patient = mockPatients.find(p => p.patientId === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient.familyHistory);
}

const AddFamilyMemberSchema = z.object({
  name: z.string().optional(),
  relationship: z.string().min(1),
  conditions: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
});

export function addFamilyMember(req: Request, res: Response) {
  const patient = mockPatients.find(p => p.patientId === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const parsed = AddFamilyMemberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const member = {
    familyMemberId: `fam-${Date.now()}`,
    patientId: patient.patientId,
    ...parsed.data,
  };
  patient.familyHistory.push(member);
  res.status(201).json(member);
}
