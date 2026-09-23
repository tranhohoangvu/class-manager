import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireClassAccess } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { saveAttendanceBatchSchema } from '../validators/index.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:classId', requireClassAccess, AttendanceController.getDaily);
router.post('/:classId', requireClassAccess, validate({ body: saveAttendanceBatchSchema }), AttendanceController.saveBatch);
router.get('/:classId/history', requireClassAccess, AttendanceController.getHistory);
router.get('/:classId/records', requireClassAccess, AttendanceController.getAllRecords);

export default router;
