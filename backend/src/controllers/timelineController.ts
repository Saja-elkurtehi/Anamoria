import type { Request, Response } from 'express';
import { z } from 'zod';
import { mockTimelineNodes, mockPhysicianNotes } from '../data/mockTimeline';
import { SourceType, VerificationStatus } from '../../../shared/types';

export function getPatientTimeline(req: Request, res: Response) {
  const nodes = mockTimelineNodes.filter(n => n.patientId === req.params.id);
  res.json(nodes);
}

const CreateNodeSchema = z.object({
  eventDate: z.string(),
  title: z.string().min(1),
  summary: z.string(),
  sourceType: z.nativeEnum(SourceType),
  contributorId: z.string(),
  confidenceLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
  category: z.string().optional().default('NOTE'),
  tags: z.array(z.string()).optional().default([]),
});

export function addTimelineNode(req: Request, res: Response) {
  const parsed = CreateNodeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const now = new Date().toISOString();
  const node = {
    nodeId: `node-${Date.now()}`,
    patientId: req.params.id,
    verificationStatus: VerificationStatus.NEEDS_REVIEW,
    relatedDocuments: [],
    physicianNotes: [],
    createdAt: now,
    updatedAt: now,
    ...parsed.data,
  };
  mockTimelineNodes.push(node);
  res.status(201).json(node);
}

export function getTimelineNode(req: Request, res: Response) {
  const node = mockTimelineNodes.find(n => n.nodeId === req.params.nodeId);
  if (!node) return res.status(404).json({ error: 'Timeline node not found' });
  res.json(node);
}

const VerifyNodeSchema = z.object({
  verificationStatus: z.nativeEnum(VerificationStatus),
});

export function verifyTimelineNode(req: Request, res: Response) {
  const node = mockTimelineNodes.find(n => n.nodeId === req.params.nodeId);
  if (!node) return res.status(404).json({ error: 'Timeline node not found' });

  const parsed = VerifyNodeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  node.verificationStatus = parsed.data.verificationStatus;
  node.updatedAt = new Date().toISOString();
  res.json(node);
}

const AddNoteSchema = z.object({
  physicianId: z.string(),
  physicianName: z.string(),
  note: z.string().min(1),
});

export function addPhysicianNote(req: Request, res: Response) {
  const node = mockTimelineNodes.find(n => n.nodeId === req.params.nodeId);
  if (!node) return res.status(404).json({ error: 'Timeline node not found' });

  const parsed = AddNoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const newNote = {
    noteId: `note-${Date.now()}`,
    nodeId: node.nodeId,
    createdAt: new Date().toISOString(),
    ...parsed.data,
  };
  node.physicianNotes.push(newNote);
  mockPhysicianNotes.push(newNote);
  node.updatedAt = new Date().toISOString();
  res.status(201).json(newNote);
}
