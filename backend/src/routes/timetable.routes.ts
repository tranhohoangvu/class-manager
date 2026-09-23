import { Router } from 'express';
import { TimetableController } from '../controllers/timetable.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireClassAccess, requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { saveTimetableEntrySchema, copyTimetableSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/:classId', requireClassAccess, TimetableController.getTimetableByClass);
router.post('/:classId/entries', requireRole('ADMIN'), validate({ body: saveTimetableEntrySchema }), TimetableController.saveEntry);
router.delete('/entries/:id', requireRole('ADMIN'), TimetableController.deleteEntry);
router.post('/:classId/copy', requireRole('ADMIN'), validate({ body: copyTimetableSchema }), TimetableController.copyFromClass);
router.post('/:classId/clear', requireRole('ADMIN'), TimetableController.clearTimetable);

export default router;
