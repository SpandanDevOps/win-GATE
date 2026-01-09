import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../logs');
const auditLogFile = path.join(logsDir, 'audit.log');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const auditLog = (action, email, success, ipAddress, details = '') => {
  const timestamp = new Date().toISOString();
  const status = success ? 'SUCCESS' : 'FAILED';
  const logEntry = `[${timestamp}] ${action} | Email: ${email} | Status: ${status} | IP: ${ipAddress} | ${details}\n`;
  
  fs.appendFileSync(auditLogFile, logEntry);
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(logEntry.trim());
  }
};

export const auditLogMiddleware = (req, res, next) => {
  res.auditLog = (action, email, success, details = '') => {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    auditLog(action, email, success, ipAddress, details);
  };
  next();
};

// Get audit logs (admin only in production)
export const getAuditLogs = (req, res) => {
  try {
    if (!fs.existsSync(auditLogFile)) {
      return res.json({ logs: [] });
    }
    
    const logs = fs.readFileSync(auditLogFile, 'utf-8').split('\n').filter(log => log.trim());
    const recentLogs = logs.slice(-100); // Last 100 entries
    
    res.json({ logs: recentLogs });
  } catch (err) {
    console.error('Error reading audit logs:', err);
    res.status(500).json({ message: 'Failed to retrieve audit logs' });
  }
};
