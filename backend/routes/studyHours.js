import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Save study hours for a day
router.post('/save-day', authenticateToken, (req, res) => {
  const { month, year, day, hours } = req.body;
  const userId = req.user.id;

  if (month === undefined || year === undefined || day === undefined || hours === undefined) {
    return res.status(400).json({ message: 'Month, year, day, and hours required' });
  }

  const db = getDatabase();

  db.run(
    `INSERT INTO study_hours (user_id, month, year, day, hours)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, month, year, day) DO UPDATE SET hours=excluded.hours, updated_at=CURRENT_TIMESTAMP`,
    [userId, month, year, day, hours],
    function(err) {
      db.close();
      if (err) {
        return res.status(400).json({ message: 'Error saving study hours' });
      }
      res.json({ message: 'Study hours saved successfully' });
    }
  );
});

// Get study hours for a month
router.get('/month/:month/:year', authenticateToken, (req, res) => {
  const { month, year } = req.params;
  const userId = req.user.id;

  const db = getDatabase();

  db.all(
    'SELECT day, hours FROM study_hours WHERE user_id = ? AND month = ? AND year = ?',
    [userId, month, year],
    (err, rows) => {
      db.close();
      if (err) {
        return res.status(400).json({ message: 'Error fetching study hours' });
      }
      res.json(rows || []);
    }
  );
});

// Get all study hours (for analytics)
router.get('/all', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const db = getDatabase();

  db.all(
    'SELECT month, year, day, hours FROM study_hours WHERE user_id = ? ORDER BY year DESC, month DESC, day ASC',
    [userId],
    (err, rows) => {
      db.close();
      if (err) {
        return res.status(400).json({ message: 'Error fetching study hours' });
      }
      res.json(rows || []);
    }
  );
});

export default router;
