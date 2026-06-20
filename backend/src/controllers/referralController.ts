import type { Request, Response } from 'express';
import { z } from 'zod';
import { mockReferrals } from '../data/mockReferrals';

export function getReferral(req: Request, res: Response) {
  const referral = mockReferrals.find(r => r.packetId === req.params.id);
  if (!referral) return res.status(404).json({ error: 'Referral not found' });
  res.json(referral);
}

const CreateReferralSchema = z.object({
  patientId: z.string(),
  physicianId: z.string(),
  recipientName: z.string(),
  recipientSpecialty: z.string(),
  reasonForReferral: z.string().min(1),
  includedTimelineNodeIds: z.array(z.string()).optional().default([]),
  includeFamilyHistory: z.boolean().optional().default(false),
  includePhysicianNotes: z.boolean().optional().default(false),
});

export function createReferral(req: Request, res: Response) {
  const parsed = CreateReferralSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const referral = {
    packetId: `ref-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    ...parsed.data,
  };
  mockReferrals.push(referral);
  res.status(201).json(referral);
}
