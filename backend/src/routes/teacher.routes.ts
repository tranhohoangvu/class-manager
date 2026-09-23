import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTeacherSchema,
  updateTeacherSchema,
  assignHomeroomSchema,
  assignSubjectSchema,
} from '../validators/index.js';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/', TeacherController.getTeachers);
router.get('/:id', TeacherController.getTeacherById);
router.post('/', validate({ body: createTeacherSchema }), TeacherController.createTeacher);
router.patch('/:id', validate({ body: updateTeacherSchema }), TeacherController.updateTeacher);
router.post('/:id/toggle-status', TeacherController.toggleStatus);
router.post('/assign-homeroom', validate({ body: assignHomeroomSchema }), TeacherController.assignHomeroom);
router.post('/assign-subject', validate({ body: assignSubjectSchema }), TeacherController.assignSubject);
router.delete('/subject-assignments/:id', TeacherController.removeSubjectAssignment);

export default router;
