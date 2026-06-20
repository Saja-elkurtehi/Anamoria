import { Router } from 'express';
import {
  getAccessRequests,
  createAccessRequest,
  approveAccessRequest,
  denyAccessRequest,
} from '../controllers/accessController';

const router = Router();

router.get('/', getAccessRequests);
router.post('/', createAccessRequest);
router.patch('/:id/approve', approveAccessRequest);
router.patch('/:id/deny', denyAccessRequest);

export default router;
