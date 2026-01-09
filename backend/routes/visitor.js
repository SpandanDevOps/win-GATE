import express from 'express';
import { getDatabase } from '../config/database.js';

const router = express.Router();

// Register or get visitor
router.post('/register', (req, res) => {
  const { visitorId } = req.body;

  if (!visitorId || typeof visitorId !== 'string') {
    return res.status(400).json({ message: 'Valid visitorId required' });
  }

  const db = getDatabase();

  // Check if visitor exists
  db.get('SELECT * FROM visitors WHERE visitor_id = ?', [visitorId], (err, visitor) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Database error' });
    }

    if (visitor) {
      // Update last accessed time
      db.run(
        'UPDATE visitors SET last_accessed = CURRENT_TIMESTAMP WHERE visitor_id = ?',
        [visitorId],
        () => {
          db.close();
          res.json({ message: 'Welcome back', visitorId, isNew: false });
        }
      );
    } else {
      // Create new visitor
      db.run(
        'INSERT INTO visitors (visitor_id) VALUES (?)',
        [visitorId],
        () => {
          db.close();
          res.json({ message: 'New visitor registered', visitorId, isNew: true });
        }
      );
    }
  });
});

// Save study hours
router.post('/study-hours/save', (req, res) => {
  const { visitorId, month, year, day, hours } = req.body;

  if (!visitorId || month === undefined || !year || !day || hours === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const db = getDatabase();

  db.run(
    `INSERT INTO study_hours (visitor_id, month, year, day, hours)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(visitor_id, month, year, day) 
     DO UPDATE SET hours = ?, updated_at = CURRENT_TIMESTAMP`,
    [visitorId, month, year, day, hours, hours],
    function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Error saving hours' });
      }

      db.close();
      res.json({ message: 'Hours saved successfully', data: { month, year, day, hours } });
    }
  );
});

// Get monthly study data
router.get('/study-hours/:visitorId/:month/:year', (req, res) => {
  const { visitorId, month, year } = req.params;

  const db = getDatabase();

  db.all(
    'SELECT day, hours FROM study_hours WHERE visitor_id = ? AND month = ? AND year = ?',
    [visitorId, parseInt(month), parseInt(year)],
    (err, rows) => {
      db.close();
      if (err) {
        return res.status(500).json({ message: 'Error fetching data' });
      }

      res.json(rows || []);
    }
  );
});

// Save curriculum progress
router.post('/curriculum/save', (req, res) => {
  const { visitorId, subject, topic, watched, revised, tested } = req.body;

  if (!visitorId || !subject || !topic) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const db = getDatabase();

  db.run(
    `INSERT INTO curriculum_progress (visitor_id, subject, topic, watched, revised, tested)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(visitor_id, subject, topic) 
     DO UPDATE SET watched = ?, revised = ?, tested = ?, updated_at = CURRENT_TIMESTAMP`,
    [visitorId, subject, topic, watched ? 1 : 0, revised ? 1 : 0, tested ? 1 : 0, watched ? 1 : 0, revised ? 1 : 0, tested ? 1 : 0],
    function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Error saving progress' });
      }

      db.close();
      res.json({ message: 'Progress saved successfully' });
    }
  );
});

// Get curriculum progress
router.get('/curriculum/:visitorId', (req, res) => {
  const { visitorId } = req.params;

  const db = getDatabase();

  db.all(
    'SELECT subject, topic, watched, revised, tested FROM curriculum_progress WHERE visitor_id = ?',
    [visitorId],
    (err, rows) => {
      db.close();
      if (err) {
        return res.status(500).json({ message: 'Error fetching data' });
      }

      // Format response
      const formatted = {};
      (rows || []).forEach(row => {
        if (!formatted[row.subject]) formatted[row.subject] = {};
        formatted[row.subject][row.topic] = {
          watched: row.watched === 1,
          revised: row.revised === 1,
          tested: row.tested === 1
        };
      });

      res.json(formatted);
    }
  );
});

// Get all data for visitor (for export/backup)
router.get('/data/:visitorId', (req, res) => {
  const { visitorId } = req.params;
  const db = getDatabase();

  Promise.all([
    new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM study_hours WHERE visitor_id = ?',
        [visitorId],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    }),
    new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM curriculum_progress WHERE visitor_id = ?',
        [visitorId],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    })
  ])
    .then(([studyHours, curriculum]) => {
      db.close();
      res.json({ visitorId, studyHours, curriculum });
    })
    .catch(err => {
      db.close();
      res.status(500).json({ message: 'Error fetching data' });
    });
});

// Delete all data for visitor (hard reset)
router.delete('/data/:visitorId', (req, res) => {
  const { visitorId } = req.params;
  const db = getDatabase();

  db.serialize(() => {
    db.run('DELETE FROM study_hours WHERE visitor_id = ?', [visitorId]);
    db.run('DELETE FROM curriculum_progress WHERE visitor_id = ?', [visitorId], function(err) {
      db.close();
      if (err) {
        return res.status(500).json({ message: 'Error deleting data' });
      }
      res.json({ message: 'All data deleted successfully' });
    });
  });
});

export default router;
