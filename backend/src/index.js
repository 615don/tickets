import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import cors from 'cors';
import helmet from 'helmet';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pool, { testConnection } from './config/database.js';
import { validateXeroConfig } from './config/xero.js';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import contactRoutes from './routes/contacts.js';
import ticketRoutes from './routes/tickets.js';
import timeEntryRoutes from './routes/timeEntries.js';
import xeroRoutes from './routes/xero.js';
import invoiceRoutes from './routes/invoices.js';
import settingsRoutes from './routes/settings.js';
import backupRoutes from './routes/backup.js';
import aiRoutes from './routes/ai.js';
import debugRoutes from './routes/debug.js';
import assetRoutes from './routes/assets.js';
import { sessionDebugMiddleware } from './middleware/sessionDebug.js';
import { startScheduler } from './services/backupScheduler.js';
import { warmCache } from './services/assetCache.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const PgSession = pgSession(session);

// Trust Railway's proxy - CRITICAL for sessions to work correctly
app.set('trust proxy', 1);

// Middleware
app.use(helmet()); // Security headers

// CORS Configuration - Multiple allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8080',
  'https://tickets.zollc.com',
  'https://outlook-addin.zollc.com',  // Production add-in
  'http://localhost:5173',             // Development add-in
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));
app.use(cookieParser(process.env.SESSION_SECRET || 'change-this-secret-in-production')); // For signed cookies

// Session configuration
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  name: process.env.SESSION_COOKIE_NAME || 'connect.sid',
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: true, // Must be true to save session for CSRF token endpoint
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    // Use 'none' for OAuth redirects from external sites (Xero)
    // Note: This requires secure: true (HTTPS) in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined, // Share cookies across subdomains (set to .zollc.com in production)
  },
}));

// Session debugging middleware (only active when DEBUG_SESSIONS=true)
app.use(sessionDebugMiddleware);

// CSRF protection middleware
const csrfProtection = csrf({ cookie: false }); // Use session instead of cookies

// Endpoint to get CSRF token (must be BEFORE global CSRF middleware)
app.get('/api/csrf-token', (req, res, next) => {
  // Apply CSRF protection to generate token
  csrfProtection(req, res, (err) => {
    if (err) return next(err);

    // Force session creation by setting a value - this marks session as modified
    req.session.csrfInit = true;

    // Explicitly save session and wait for it to complete before responding
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('Session save error:', saveErr);
        return next(saveErr);
      }

      // Manually set the session cookie (workaround for Railway proxy issue)
      res.cookie('connect.sid', req.sessionID, {
        domain: '.zollc.com',
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        signed: true
      });

      // Send response
      res.json({ csrfToken: req.csrfToken() });
    });
  });
});

// Apply CSRF protection to all other routes (except /api/csrf-token which is handled above)
app.use((req, res, next) => {
  // Skip CSRF for csrf-token endpoint (already handled above)
  if (req.path === '/api/csrf-token' && req.method === 'GET') {
    return next();
  }

  csrfProtection(req, res, next);
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    // Log error details for debugging, but don't expose to clients in production
    console.error('Health check failed:', error);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      // Only include error details in development
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
    });
  }
});

// Routes
app.use('/api/debug', debugRoutes); // Debug routes (only active when DEBUG_SESSIONS=true)
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/xero', xeroRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/assets', assetRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server with database connection retry
async function startServer() {
  try {
    // Validate Xero configuration at startup
    console.log('⚙️  Validating Xero configuration...');
    try {
      validateXeroConfig();
      console.log('✓ Xero configuration valid');
    } catch (error) {
      console.warn('⚠️  Xero configuration invalid:', error.message);
      console.warn('   Xero integration will not be available until configuration is fixed.');
      // Don't fail startup - allow app to run without Xero
    }

    // Test database connection with retry logic
    await testConnection();

    // Warm asset cache
    console.log('⚙️  Warming asset cache...');
    try {
      await warmCache();
      console.log('✓ Asset cache warmed successfully');
    } catch (error) {
      console.warn('⚠️  Failed to warm asset cache:', error.message);
      console.warn('   Asset cache will not be available until manually refreshed.');
      // Don't fail startup - allow app to run without cache
    }

    // Start backup scheduler
    console.log('⚙️  Initializing backup scheduler...');
    try {
      await startScheduler();
      console.log('✓ Backup scheduler initialized');
    } catch (error) {
      console.warn('⚠️  Failed to initialize backup scheduler:', error.message);
      console.warn('   Automated backups will not run until configuration is fixed.');
      // Don't fail startup - allow app to run without automated backups
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.error('Please check your database configuration and ensure PostgreSQL is running.');
    process.exit(1);
  }
}

startServer();

export default app;
