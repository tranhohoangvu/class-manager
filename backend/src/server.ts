import { app } from './app.js';
import { ENV } from './config/env.js';
import { pool } from './config/database.js';

const server = app.listen(ENV.PORT, '0.0.0.0', () => {
  console.log(`🚀 SchoolOps REST API backend running on http://0.0.0.0:${ENV.PORT}`);
  console.log(`📋 Environment: ${ENV.NODE_ENV}`);
  console.log(`🏥 Health check available at: http://localhost:${ENV.PORT}/health`);
});

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('🔒 Closed HTTP server.');
    try {
      await pool.end();
      console.log('🔌 Closed PostgreSQL connection pool.');
      process.exit(0);
    } catch (err) {
      console.error('Error closing PostgreSQL pool:', err);
      process.exit(1);
    }
  });

  // Force close after 10 seconds if lingering
  setTimeout(() => {
    console.error('⚠️ Forcefully terminating process after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
