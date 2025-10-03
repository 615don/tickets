import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import cors from 'cors';
import helmet from 'helmet';
import csrf from 'csurf';
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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const PgSession = pgSession(session);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

// CSRF protection middleware
const csrfProtection = csrf({ cookie: false }); // Use session instead of cookies

// Endpoint to get CSRF token (must be BEFORE CSRF middleware)
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Apply CSRF protection to all other routes
app.use((req, res, next) => {
  // Skip CSRF for GET requests to csrf-token endpoint (already handled above)
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
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/xero', xeroRoutes);
app.use('/api/invoices', invoiceRoutes);

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
