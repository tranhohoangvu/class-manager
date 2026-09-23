import { Router } from 'express';
import { NoteController } from '../controllers/note.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createNoteSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/student/:studentId', NoteController.getByStudent);
router.post('/student/:studentId', validate({ body: createNoteSchema }), NoteController.create);
router.delete('/:id/student/:studentId', NoteController.delete);

export default router;
