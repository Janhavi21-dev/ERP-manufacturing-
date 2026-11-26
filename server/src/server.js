import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { ensureDefaultAdminExists } from './config/initDefaultAdmin.js';

const startServer = async () => {
  try {
    await connectDB();

    // Ensure system roles & super admin account exist (whether persistent or in-memory)
    await ensureDefaultAdminExists();

    const port = parseInt(process.env.PORT || '5000', 10);
    const nodeEnv = process.env.NODE_ENV || 'development';

    const server = app.listen(port, () => {
      console.log(`🚀 Manufacturing ERP Server running in ${nodeEnv} mode on port ${port}`);
      console.log(`📡 Health Check URL: http://localhost:${port}/api/v1/health`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('🛑 Server shutting down gracefully...');
      server.close(() => {
        console.log('✅ HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
