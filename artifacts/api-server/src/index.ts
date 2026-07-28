import app from './app';
import { logger } from './lib/logger';

const port = Number(process.env.PORT) || 5000;

if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
  app.listen(port, (err: any) => {
    if (err) {
      logger.error({ err }, 'Error listening on port');
      process.exit(1);
    }
    logger.info({ port }, 'Server listening');
  });
}

// Export for Vercel Serverless Functions
export default app;
