import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { sequelize } from './models/index.js';
import authRoutes from './routes/authRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import procurementRoutes from './routes/procurementRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import disposalRoutes from './routes/disposalRoutes.js';
import masterRoutes from './routes/masterRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';
import logger from './config/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'STPI Asset Tracker API'
}));

app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'STPI Asset Tracker API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/procurements', procurementRoutes);
app.use('/api/maintenances', maintenanceRoutes);
app.use('/api/disposals', disposalRoutes);
app.use('/api/master', masterRoutes);
app.use('/uploads', express.static('uploads'));

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    if (process.env.SEQUELIZE_SYNC === 'true') {
      await sequelize.sync({ force: false, alter: false });
      logger.info('Database tables created/verified');
    }

    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        await sequelize.close();
        logger.info('Database connection closed');
      });
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    console.error('Full error:', error);
    process.exit(1);
  }
};

startServer();

export default app;
