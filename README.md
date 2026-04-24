# SRM BFHL — Full Stack Engineering Challenge

A full-stack application built for the SRM BFHL Round 1 challenge. It exposes a REST API (`POST /bfhl`) that processes directed-edge strings into hierarchical trees, detects cycles, computes Floyd-Warshall shortest paths, and returns structured JSON. A React single-page frontend visualises the graph in an interactive 3D scene with tsParticles background, glassmorphism UI, and login/logout.

---

## Features

- **POST /bfhl** — parses node strings, builds trees, detects cycles, returns full hierarchy + summary
- **Floyd-Warshall** — computes shortest distances between every pair of nodes (all edge weights = 1)
- **3D Graph** — React Three Fiber scene with auto-rotate, orbit controls, hover tooltips showing distances
- **Distance Matrix** — Floyd-Warshall table rendered below the 3D canvas (for ≤ 12 nodes)
- **Login / Logout** — token-based session auth (in-memory, demo credentials)
- **tsParticles** — animated particle network background with repulse on hover
- **Glassmorphism UI** — backdrop-blur cards, animated gradient title, 3D flip cards
- **CORS enabled** — API accepts cross-origin requests from any origin
- **< 3s response** — processes up to 50 nodes well within the 3-second SLA
- **58 tests** — unit, property-based (fast-check, 100 iterations each), and integration tests

---

## Project Structure

```
srm-bfhl-api/
├── backend/
│   ├── server.js                  # Express entry point — routes, auth, CORS
│   ├── lib/
│   │   ├── parser.js              # Input validation & deduplication
│   │   ├── treeBuilder.js         # Tree construction, depth, root detection
│   │   ├── cycleDetector.js       # Iterative DFS cycle detection
│   │   ├── responseFormatter.js   # Assembles final JSON response
│   │   └── floydWarshall.js       # Floyd-Warshall O(n³) distance matrix
│   ├── .env                       # Identity fields (not committed)
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx                # Root — particles, login gate, layout
    │   ├── components/
    │   │   ├── LoginModal.jsx     # Login form with animated orbs
    │   │   ├── InputPanel.jsx     # Textarea + submit button
    │   │   ├── GraphCanvas.jsx    # React Three Fiber 3D graph + distance matrix
    │   │   ├── HierarchyCard.jsx  # 3D flip card — front: tree, back: raw JSON
    │   │   └── SummaryPanel.jsx   # total_trees / total_cycles / largest_root stats
    │   ├── index.css              # Glassmorphism, gradient, animations
    │   └── main.jsx
    ├── vite.config.js             # Vite + proxy for /bfhl and /auth
    └── package.json
```

---

## Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your details:

```env
USER_ID=yourname_ddmmyyyy
EMAIL_ID=your.email@college.edu
COLLEGE_ROLL_NUMBER=YOURROLLNUMBER
PORT=3000
```

Start the server:

```bash
npm start          # production
npm run dev        # development with nodemon
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:5173
```

The Vite dev server proxies `/bfhl` and `/auth/*` to `http://localhost:3000`.

---

## Authentication

The app uses a simple in-memory token-based auth (demo only — replace with a database in production).

| Username | Password  |
|----------|-----------|
| `admin`  | `admin123`|
| `demo`   | `demo123` |

### Endpoints

| Method | Path           | Auth required | Description              |
|--------|----------------|---------------|--------------------------|
| POST   | `/auth/login`  | No            | Returns a session token  |
| POST   | `/auth/logout` | Bearer token  | Invalidates the token    |
| GET    | `/auth/me`     | Bearer token  | Returns current user info|

---

## API

### `POST /bfhl`

**Request**
```json
{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello", "1->2"]
}
```

**Response (200)**
```json
{
  "user_id": "yourname_ddmmyyyy",
  "email_id": "your.email@college.edu",
  "college_roll_number": "YOURROLLNUMBER",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": {} } },
      "depth": 3
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    }
  ],
  "invalid_entries": ["hello", "1->2"],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 1,
    "largest_tree_root": "A"
  },
  "graph": {
    "nodes": ["A", "B", "C", "D", "X", "Y", "Z"],
    "edges": [
      { "source": "A", "target": "B" },
      { "source": "A", "target": "C" },
      { "source": "B", "target": "D" },
      { "source": "X", "target": "Y" },
      { "source": "Y", "target": "Z" },
      { "source": "Z", "target": "X" }
    ],
    "distances": {
      "A": { "A": 0, "B": 1, "C": 1, "D": 2, "X": null, "Y": null, "Z": null },
      "B": { "A": null, "B": 0, "C": null, "D": 1, "X": null, "Y": null, "Z": null }
    }
  }
}
```

**Error (400)**
```json
{ "error": "Missing required field: 'data' (must be an array)" }
```

### Valid Node Format

Each entry must match `X->Y` where X and Y are single uppercase letters (A–Z).

| Input     | Result   | Reason                  |
|-----------|----------|-------------------------|
| `"A->B"`  | Valid    | —                       |
| `" A->B "`| Valid    | Whitespace trimmed first |
| `"hello"` | Invalid  | Not a node format       |
| `"1->2"`  | Invalid  | Not uppercase letters   |
| `"AB->C"` | Invalid  | Multi-character parent  |
| `"A-B"`   | Invalid  | Wrong separator         |
| `"A->"`   | Invalid  | Missing child           |
| `"A->A"`  | Invalid  | Self-loop               |
| `""`      | Invalid  | Empty string            |

---

## 50-Node Example Input

Paste this into the textarea (comma or newline separated):

```
A->B, A->C, A->D, B->E, B->F, C->G, C->H, D->I, D->J, E->K, E->L, F->M, F->N, G->O, G->P, H->Q, H->R, I->S, J->T, K->U, L->V, M->W, N->X, O->Y, P->Z, X->Y, Y->Z, Z->X, Q->R, R->Q, S->T, T->U, U->V, V->W, W->S, hello, 1->2, AB->C, A->, A->A, A->B, B->E, C->G, D->I, E->K, F->M, G->O, H->Q, I->S, J->T
```

Expected result:
- **1 tree** rooted at `A` (depth 6)
- **3 cycles**: X→Y→Z→X, Q→R→Q, S→T→U→V→W→S
- **5 invalid entries**: `hello`, `1->2`, `AB->C`, `A->`, `A->A`
- **10 duplicate edges**
- `largest_tree_root`: `A`

---

## Testing

```bash
cd backend
npm test
```

**58 tests** across 6 suites:

| Suite | Tests | Description |
|-------|-------|-------------|
| `parser.test.js` | 14 | Validation, trimming, self-loops, duplicates |
| `treeBuilder.test.js` | 9 | Root detection, depth, single-parent constraint |
| `cycleDetector.test.js` | 6 | DFS back-edge detection |
| `responseFormatter.test.js` | 10 | Field omission, summary, tiebreaker |
| `properties.test.js` | 11 | Property-based tests (fast-check, 100 runs each) |
| `server.test.js` | 8 | HTTP integration — 200/400/CORS/timing |

---

## Floyd-Warshall

All edge weights are treated as **1**. The algorithm runs in O(n³) where n = number of unique nodes. For 26 nodes (full alphabet) that's 17,576 operations — well within the 3-second SLA.

The `distances` object in the response uses `null` to represent unreachable pairs (∞).

The frontend renders a distance matrix table for graphs with ≤ 12 nodes, and shows per-node distances as floating labels in the 3D scene when you hover a node.

---

## Deployment

### Backend (Render / Railway / Fly.io)

1. Push the `backend/` folder (or the whole repo)
2. Set environment variables: `USER_ID`, `EMAIL_ID`, `COLLEGE_ROLL_NUMBER`, `PORT`
3. Start command: `node server.js`

### Frontend (Vercel / Netlify)

1. Build: `npm run build` inside `frontend/`
2. Publish directory: `frontend/dist`
3. If the API is on a different domain, update the fetch URLs in `InputPanel.jsx` and `LoginModal.jsx` to use the full API base URL (e.g. `https://your-api.onrender.com`)

---

## Submission Checklist

- [ ] Hosted API URL (evaluator calls `<your-url>/bfhl`)
- [ ] Hosted frontend URL
- [ ] Public GitHub repository URL
- [ ] `.env` values set correctly in hosting dashboard
- [ ] CORS enabled ✓
- [ ] Response under 3 seconds for 50 nodes ✓
- [ ] No hardcoded responses ✓
