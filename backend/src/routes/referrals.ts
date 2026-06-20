import { Router } from 'express';
import { getReferral, createReferral } from '../controllers/referralController';

const router = Router();

router.post('/', createReferral);
router.get('/:id', getReferral);

export default router;
