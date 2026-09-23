import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Quick ping to database
    await query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      error: err.message,
    });
  }
});

export default router;
