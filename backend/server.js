import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import visitorRoutes from './routes/visitor.js';
import studyHoursRoutes from './routes/studyHours.js';
import curriculumRoutes from './routes/curriculum.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { auditLogMiddleware } from './middleware/auditLog.js';
import { validateInput } from './middleware/validation.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet()); // Set security HTTP headers

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
app.use(generalLimiter);

// Input validation middleware
app.use(validateInput);

// Audit logging middleware
app.use(auditLogMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/visitor', visitorRoutes); // New visitor-based routes (no auth needed)
app.use('/api/study-hours', studyHoursRoutes);
app.use('/api/curriculum', curriculumRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📚 GATE Tracker Backend Started`);
  console.log(`🔒 Security features enabled (Helmet, Rate Limiting, Input Validation, Audit Logging)`);
});
