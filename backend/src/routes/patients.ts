import { Router } from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  addSymptom,
} from '../controllers/patientController';
import { getPatientTimeline, addTimelineNode } from '../controllers/timelineController';
import { getPatientRecords, addRecord } from '../controllers/recordController';
import { getFamilyMembers, addFamilyMember } from '../controllers/familyController';

const router = Router();

router.get('/', getPatients);
router.post('/', createPatient);
router.get('/:id', getPatientById);
router.post('/:id/symptoms', addSymptom);
router.get('/:id/timeline', getPatientTimeline);
router.post('/:id/timeline', addTimelineNode);
router.get('/:id/records', getPatientRecords);
router.post('/:id/records', addRecord);
router.get('/:id/family', getFamilyMembers);
router.post('/:id/family', addFamilyMember);

export default router;
