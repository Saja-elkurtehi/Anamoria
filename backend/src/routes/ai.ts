import { Router } from 'express';
import {
  visitBriefController,
  referencePackageController,
  requisitionDraftController,
} from '../controllers/aiController';

const router = Router();

router.get('/health', (_, res) => {
  res.json({
    ok: true,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    mockMode: process.env.USE_MOCK_AI === 'true',
    model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
  });
});

router.post('/visit-brief', visitBriefController);
router.post('/reference-package', referencePackageController);
router.post('/requisition-draft', requisitionDraftController);

export default router;
