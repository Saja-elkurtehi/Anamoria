import type { Request, Response } from 'express';
import { z } from 'zod';
import { mockPhysicians } from '../data/mockPhysicians';

export function getPhysicians(_req: Request, res: Response) {
  res.json(mockPhysicians);
}

export function getPhysicianById(req: Request, res: Response) {
  const physician = mockPhysicians.find(p => p.physicianId === req.params.id);
  if (!physician) return res.status(404).json({ error: 'Physician not found' });
  res.json(physician);
}

const CreatePhysicianSchema = z.object({
  name: z.string().min(1),
  clinicId: z.string(),
  clinicName: z.string(),
  specialty: z.string(),
  npi: z.string().optional(),
});

export function createPhysician(req: Request, res: Response) {
  const parsed = CreatePhysicianSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const newPhysician = {
    physicianId: `phys-${Date.now()}`,
    ...parsed.data,
  };
  mockPhysicians.push(newPhysician);
  res.status(201).json(newPhysician);
}
