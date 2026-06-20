import { Router } from 'express';
import { getPhysicians, getPhysicianById, createPhysician } from '../controllers/physicianController';

const router = Router();

router.get('/', getPhysicians);
router.post('/', createPhysician);
router.get('/:id', getPhysicianById);

export default router;
