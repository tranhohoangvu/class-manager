import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/school-summary', ReportController.getSchoolSummary);
router.get('/grade-attendance', ReportController.getGradeBreakdown);

export default router;
