import { Router } from 'express';
import authRoutes from './auth.routes.js';
import classRoutes from './class.routes.js';
import studentRoutes from './student.routes.js';
import seatingRoutes from './seating.routes.js';
import attendanceRoutes from './attendance.routes.js';
import timetableRoutes from './timetable.routes.js';
import announcementRoutes from './announcement.routes.js';
import noteRoutes from './note.routes.js';
import teacherRoutes from './teacher.routes.js';
import reportRoutes from './report.routes.js';
import healthRoutes from './health.routes.js';
import { StudentController } from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireClassAccess } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createStudentSchema, importStudentsSchema } from '../validators/index.js';

const router = Router();

// Health check endpoint (GET /health)
router.use('/', healthRoutes);

// Auth endpoints (POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me)
router.use('/api/auth', authRoutes);

// Classes endpoints (CRUD /api/classes)
router.use('/api/classes', classRoutes);

// Class-nested routes:
// Students in class
router.get(
  '/api/classes/:classId/students',
  authenticate,
  requireClassAccess,
  StudentController.getStudentsByClass
);
router.post(
  '/api/classes/:classId/students',
  authenticate,
  requireClassAccess,
  validate({ body: createStudentSchema }),
  StudentController.createStudent
);
router.post(
  '/api/classes/:classId/students/import',
  authenticate,
  requireClassAccess,
  validate({ body: importStudentsSchema }),
  StudentController.importStudents
);

// Seating in class (/api/classes/:classId/seating)
router.use('/api/classes', seatingRoutes);

// Attendance in class (/api/classes/:classId/attendance)
router.use('/api/classes', attendanceRoutes);

// Timetable in class (/api/classes/:classId/timetable)
router.use('/api/classes', timetableRoutes);

// Announcements in class (/api/classes/:classId/announcements)
router.use('/api/classes', announcementRoutes);

// Direct resources:
// Students direct (/api/students/:id)
router.use('/api/students', studentRoutes);

// Notes (/api/notes)
router.use('/api/notes', noteRoutes);

// Teachers (/api/teachers)
router.use('/api/teachers', teacherRoutes);

// Reports (/api/reports)
router.use('/api/reports', reportRoutes);

export default router;
