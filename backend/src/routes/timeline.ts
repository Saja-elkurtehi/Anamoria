import { Router } from 'express';
import {
  getTimelineNode,
  verifyTimelineNode,
  addPhysicianNote,
} from '../controllers/timelineController';

const router = Router();

router.get('/:nodeId', getTimelineNode);
router.patch('/:nodeId/verify', verifyTimelineNode);
router.post('/:nodeId/notes', addPhysicianNote);

export default router;
