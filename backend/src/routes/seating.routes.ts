import { Router } from 'express';
import { SeatingController } from '../controllers/seating.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireClassAccess } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { assignSeatSchema, swapSeatsSchema } from '../validators/index.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:classId', requireClassAccess, SeatingController.getDesksWithSeats);
router.post('/:classId/assign', requireClassAccess, validate({ body: assignSeatSchema }), SeatingController.assignSeat);
router.post('/:classId/swap', requireClassAccess, validate({ body: swapSeatsSchema }), SeatingController.swapSeats);
router.post('/:classId/clear', requireClassAccess, SeatingController.clearAllSeats);
router.post('/:classId/randomize', requireClassAccess, SeatingController.randomizeSeating);

export default router;
