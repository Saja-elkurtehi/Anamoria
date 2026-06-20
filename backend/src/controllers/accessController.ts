import type { Request, Response } from 'express';
import { z } from 'zod';
import { mockAccessRequests } from '../data/mockAccessRequests';
import { AccessRequestStatus } from '../../../shared/types';

export function getAccessRequests(req: Request, res: Response) {
  const { patientId, physicianId } = req.query;
  let results = mockAccessRequests;
  if (patientId) results = results.filter(r => r.patientId === patientId);
  if (physicianId) results = results.filter(r => r.physicianId === physicianId);
  res.json(results);
}

const CreateRequestSchema = z.object({
  patientId: z.string(),
  physicianId: z.string(),
  physicianName: z.string(),
  specialty: z.string(),
  clinicName: z.string(),
  permissions: z.array(z.string()).min(1),
});

export function createAccessRequest(req: Request, res: Response) {
  const parsed = CreateRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const request = {
    requestId: `req-${Date.now()}`,
    status: AccessRequestStatus.PENDING,
    requestedAt: new Date().toISOString(),
    ...parsed.data,
  };
  mockAccessRequests.push(request);
  res.status(201).json(request);
}

export function approveAccessRequest(req: Request, res: Response) {
  const request = mockAccessRequests.find(r => r.requestId === req.params.id);
  if (!request) return res.status(404).json({ error: 'Access request not found' });
  if (request.status !== AccessRequestStatus.PENDING) {
    return res.status(409).json({ error: 'Request is no longer pending' });
  }
  request.status = AccessRequestStatus.APPROVED;
  request.respondedAt = new Date().toISOString();
  res.json(request);
}

export function denyAccessRequest(req: Request, res: Response) {
  const request = mockAccessRequests.find(r => r.requestId === req.params.id);
  if (!request) return res.status(404).json({ error: 'Access request not found' });
  if (request.status !== AccessRequestStatus.PENDING) {
    return res.status(409).json({ error: 'Request is no longer pending' });
  }
  request.status = AccessRequestStatus.DENIED;
  request.respondedAt = new Date().toISOString();
  res.json(request);
}
