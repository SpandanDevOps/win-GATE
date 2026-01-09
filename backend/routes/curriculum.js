import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Save curriculum progress
router.post('/save', authenticateToken, (req, res) => {
  const { subject, topic, watched, revised, tested } = req.body;
  const userId = req.user.id;

  if (!subject || !topic) {
    return res.status(400).json({ message: 'Subject and topic required' });
  }

  const db = getDatabase();

  db.run(
    `INSERT INTO curriculum_progress (user_id, subject, topic, watched, revised, tested)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, subject, topic) DO UPDATE SET 
       watched=excluded.watched, revised=excluded.revised, tested=excluded.tested, updated_at=CURRENT_TIMESTAMP`,
    [userId, subject, topic, watched ? 1 : 0, revised ? 1 : 0, tested ? 1 : 0],
    function(err) {
      db.close();
      if (err) {
        return res.status(400).json({ message: 'Error saving progress' });
      }
      res.json({ message: 'Progress saved successfully' });
    }
  );
});

// Get all curriculum progress
router.get('/all', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const db = getDatabase();

  db.all(
    'SELECT subject, topic, watched, revised, tested FROM curriculum_progress WHERE user_id = ?',
    [userId],
    (err, rows) => {
      db.close();
      if (err) {
        return res.status(400).json({ message: 'Error fetching progress' });
      }
      res.json(rows || []);
    }
  );
});

export default router;
