import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcement.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireClassAccess } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createAnnouncementSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/:classId', requireClassAccess, AnnouncementController.getByClass);
router.post('/:classId', requireClassAccess, validate({ body: createAnnouncementSchema }), AnnouncementController.create);
router.patch('/:classId/:id/pin', requireClassAccess, AnnouncementController.togglePin);
router.delete('/:classId/:id', requireClassAccess, AnnouncementController.delete);

export default router;
