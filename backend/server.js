import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';

const app = express();
const PORT = 5000;
const JWT_SECRET = 'expense-tracker-secret-key-2024';

// Database setup
const db = new Database('expenses.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Middleware
// CORS configuration - allow requests from Vercel frontend
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://openhandspractice-*.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword);

    // Generate token
    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: result.lastInsertRowid, username, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(req.userId);
  res.json({ user });
});

// Expense routes
app.get('/api/expenses', authenticate, (req, res) => {
  try {
    const { month, year } = req.query;

    let query = 'SELECT * FROM expenses WHERE user_id = ?';
    const params = [req.userId];

    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      query += ' AND date >= ? AND date <= ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const expenses = db.prepare(query).all(...params);
    res.json({ expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/expenses', authenticate, (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    if (!title || !amount || !category || !date) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = db.prepare('INSERT INTO expenses (user_id, title, amount, category, date) VALUES (?, ?, ?, ?, ?)').run(req.userId, title, amount, category, date);

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    res.json({ expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/expenses/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Analytics routes
app.get('/api/analytics/:year/:month', authenticate, (req, res) => {
  try {
    const { year, month } = req.params;

    // Current month expenses
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const currentMonthExpenses = db.prepare('SELECT * FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?').all(req.userId, startDate, endDate);

    const total = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Category breakdown
    const categoryBreakdown = {};
    currentMonthExpenses.forEach(exp => {
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
    });

    // Convert to percentages
    const categoryPercentages = {};
    Object.keys(categoryBreakdown).forEach(cat => {
      categoryPercentages[cat] = total > 0 ? (categoryBreakdown[cat] / total) * 100 : 0;
    });

    // Previous month
    let prevMonthTotal = 0;
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);

    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = prevYear - 1;
    }

    const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-31`;

    const prevMonthExpenses = db.prepare('SELECT amount FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?').all(req.userId, prevStartDate, prevEndDate);
    prevMonthTotal = prevMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Last 6 months
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(parseInt(year), parseInt(month) - 1 - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');

      const mStartDate = `${y}-${m}-01`;
      const mEndDate = `${y}-${m}-31`;

      const mExpenses = db.prepare('SELECT amount FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?').all(req.userId, mStartDate, mEndDate);
      const mTotal = mExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      last6Months.push({
        month: m,
        year: y,
        total: mTotal
      });
    }

    res.json({
      total,
      prevMonthTotal,
      comparison: prevMonthTotal > 0 ? ((total - prevMonthTotal) / prevMonthTotal) * 100 : 0,
      categoryBreakdown,
      categoryPercentages,
      last6Months
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});