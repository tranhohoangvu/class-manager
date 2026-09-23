import { Router } from 'express';
import { ClassController } from '../controllers/class.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole, requireClassAccess } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createClassSchema, updateClassSettingsSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', ClassController.getClasses);
router.get('/:id', requireClassAccess, ClassController.getClassById);
router.post('/', requireRole('ADMIN'), validate({ body: createClassSchema }), ClassController.createClass);
router.patch('/:id', validate({ body: updateClassSettingsSchema }), ClassController.updateClassSettings);
router.post('/:id/archive', requireRole('ADMIN'), ClassController.archiveClass);

export default router;
