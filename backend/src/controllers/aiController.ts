import type { Request, Response } from 'express';
import {
  generateVisitBrief,
  generateReferencePackage,
  generateRequisitionDraft,
} from '../services/openaiService';
import type {
  VisitBriefRequest,
  ReferencePackageRequest,
  RequisitionDraftRequest,
} from '../../../shared/types';

export async function visitBriefController(req: Request, res: Response) {
  console.log('[AI] POST /api/ai/visit-brief — request received');
  try {
    const input = req.body as VisitBriefRequest;
    if (!input.patientId || !input.lastVisitDate || !input.patientProfile) {
      return res.status(400).json({ error: 'Missing required fields: patientId, lastVisitDate, patientProfile' });
    }
    console.log(`[AI] visit-brief: patientId=${input.patientId}, nodes=${input.timelineNodes?.length ?? 0}, docs=${input.documents?.length ?? 0}`);
    const result = await generateVisitBrief(input);
    console.log('[AI] visit-brief: success');
    res.json(result);
  } catch (err) {
    console.error('[AI] visit-brief error:', err);
    const message = err instanceof Error ? err.message : 'AI generation failed';
    res.status(500).json({ error: message });
  }
}

export async function referencePackageController(req: Request, res: Response) {
  console.log('[AI] POST /api/ai/reference-package — request received');
  try {
    const input = req.body as ReferencePackageRequest;
    if (!input.patientId || !input.recipientSpecialty || !input.reasonForRequest) {
      return res.status(400).json({ error: 'Missing required fields: patientId, recipientSpecialty, reasonForRequest' });
    }
    console.log(`[AI] reference-package: patientId=${input.patientId}, specialty=${input.recipientSpecialty}`);
    const result = await generateReferencePackage(input);
    console.log('[AI] reference-package: success');
    res.json(result);
  } catch (err) {
    console.error('[AI] reference-package error:', err);
    const message = err instanceof Error ? err.message : 'AI generation failed';
    res.status(500).json({ error: message });
  }
}

export async function requisitionDraftController(req: Request, res: Response) {
  console.log('[AI] POST /api/ai/requisition-draft — request received');
  try {
    const input = req.body as RequisitionDraftRequest;
    if (!input.patientId || !input.requisitionType || !input.reasonForRequest) {
      return res.status(400).json({ error: 'Missing required fields: patientId, requisitionType, reasonForRequest' });
    }
    console.log(`[AI] requisition-draft: patientId=${input.patientId}, type=${input.requisitionType}`);
    const result = await generateRequisitionDraft(input);
    console.log('[AI] requisition-draft: success');
    res.json(result);
  } catch (err) {
    console.error('[AI] requisition-draft error:', err);
    const message = err instanceof Error ? err.message : 'AI generation failed';
    res.status(500).json({ error: message });
  }
}
