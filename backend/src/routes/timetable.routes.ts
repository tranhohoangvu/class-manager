import { Router } from 'express';
import { TimetableController } from '../controllers/timetable.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireClassAccess, requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  saveTimetableEntrySchema,
  updateTimetableEntrySchema,
  copyTimetableSchema,
} from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Admin dedicated audit & school-wide query endpoints
router.get('/audit', requireRole('ADMIN'), TimetableController.auditTimetable);
router.get('/all', requireRole('ADMIN'), TimetableController.getAllEntries);

// Entry specific mutations
router.put(
  '/entries/:id',
  requireRole('ADMIN'),
  validate({ body: updateTimetableEntrySchema }),
  TimetableController.updateEntry
);
router.delete('/entries/:id', requireRole('ADMIN'), TimetableController.deleteEntry);

// Class scoped endpoints
router.get('/:classId', requireClassAccess, TimetableController.getTimetableByClass);
router.post(
  '/:classId/entries',
  requireRole('ADMIN'),
  validate({ body: saveTimetableEntrySchema }),
  TimetableController.saveEntry
);
router.post(
  '/:classId/copy',
  requireRole('ADMIN'),
  validate({ body: copyTimetableSchema }),
  TimetableController.copyFromClass
);
router.post('/:classId/clear', requireRole('ADMIN'), TimetableController.clearTimetable);

export default router;
