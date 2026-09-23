import { Router } from 'express';
import { StudentController } from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireClassAccess } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createStudentSchema, updateStudentSchema, importStudentsSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Student direct endpoints
router.get('/:id', StudentController.getStudentById);
router.patch('/:id', validate({ body: updateStudentSchema }), StudentController.updateStudent);
router.delete('/:id', StudentController.deleteStudent);

export default router;
