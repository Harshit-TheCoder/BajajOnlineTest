'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { parse } = require('./lib/parser');
const { buildComponents } = require('./lib/treeBuilder');
const { formatResponse } = require('./lib/responseFormatter');
const { floydWarshall } = require('./lib/floydWarshall');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ─── Identity ────────────────────────────────────────────────────────────────
const identity = {
  userId:     process.env.USER_ID              || '',
  emailId:    process.env.EMAIL_ID             || '',
  rollNumber: process.env.COLLEGE_ROLL_NUMBER  || '',
};

if (!identity.userId || !identity.emailId || !identity.rollNumber) {
  console.warn('[WARN] One or more identity fields are missing from .env');
}

// ─── In-memory user store (demo auth — replace with DB in production) ────────
const USERS = {
  admin: { password: 'admin123', name: 'Admin User' },
  demo:  { password: 'demo123',  name: 'Demo User'  },
};
// Active sessions: token → { username, name, createdAt }
const sessions = new Map();

function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Auth middleware (optional — only for protected routes) ──────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorised — please log in' });
  }
  req.user = sessions.get(token);
  next();
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  const user = USERS[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken();
  sessions.set(token, { username, name: user.name, createdAt: Date.now() });
  return res.status(200).json({ token, name: user.name, username });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
app.post('/auth/logout', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) sessions.delete(token);
  return res.status(200).json({ message: 'Logged out' });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
app.get('/auth/me', requireAuth, (req, res) => {
  return res.status(200).json({ username: req.user.username, name: req.user.name });
});

// ─── POST /bfhl ───────────────────────────────────────────────────────────────
app.post('/bfhl', (req, res) => {
  const { data } = req.body || {};

  if (data === undefined || data === null) {
    return res.status(400).json({ error: "Missing required field: 'data' (must be an array)" });
  }
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "Field 'data' must be an array of strings" });
  }

  const { validEdges, invalidEntries, duplicateEdges } = parse(data);
  const components = buildComponents(validEdges);
  const response = formatResponse(components, invalidEntries, duplicateEdges, identity);

  // Floyd-Warshall distance matrix (all edge weights = 1)
  const fw = floydWarshall(validEdges);
  response.graph = {
    nodes: fw.nodes,
    edges: validEdges.map(({ parent, child }) => ({ source: parent, target: child })),
    distances: fw.dist,
  };

  return res.status(200).json(response);
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  return res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[INFO] SRM BFHL API → http://localhost:${PORT}`);
  });
}

module.exports = app;
