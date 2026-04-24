# Design Document — srm-bfhl-api

## Overview

The SRM BFHL API is a full-stack application consisting of:

- **Backend**: A Node.js + Express server exposing `POST /bfhl`. It parses an array of directed-edge strings, builds hierarchical tree structures, detects cycles, and returns a structured JSON response including identity fields loaded from a `.env` file.
- **Frontend**: A single-page React (Vite) application that lets users submit node strings and view the structured response in a readable UI.

The backend is intentionally minimal — a single `server.js` file plus a small set of pure processing functions. The frontend is a single-page Vite + React app with no routing.

### Key Design Goals

1. **Correctness first** — the parsing, tree-building, cycle-detection, and summary logic are pure functions that are easy to unit-test and property-test.
2. **Minimal footprint** — no database, no auth, no framework beyond Express and React.
3. **Clear separation** — processing logic lives in pure functions; Express only handles HTTP concerns.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│   React SPA (Vite)  ─── POST /bfhl ──►  Express API    │
│   localhost:5173                        localhost:3000   │
└─────────────────────────────────────────────────────────┘

Backend (server.js + lib/)
  ┌──────────┐   ┌─────────────┐   ┌────────────────┐   ┌──────────────────┐
  │  Parser  │──►│ Tree_Builder│──►│ Cycle_Detector │──►│Response_Formatter│
  └──────────┘   └─────────────┘   └────────────────┘   └──────────────────┘
       │                                                          │
  invalid_entries                                          JSON response
  duplicate_edges                                          (200 OK)
```

### Request / Response Flow

1. Express receives `POST /bfhl` with `{ data: string[] }`.
2. **Parser** trims, validates, and deduplicates entries → produces `validEdges`, `invalidEntries`, `duplicateEdges`.
3. **Tree_Builder** groups edges into connected components, assigns roots, builds nested tree objects, calculates depth.
4. **Cycle_Detector** walks each component's edges with DFS to detect directed cycles; marks affected components.
5. **Response_Formatter** assembles the final JSON, applies field-omission rules (no `depth` on cycles, no `has_cycle` on trees), computes summary.
6. Identity fields (`user_id`, `email_id`, `college_roll_number`) are injected from `process.env`.

---

## Components and Interfaces

### Parser

```ts
interface ParseResult {
  validEdges: Array<{ parent: string; child: string }>;
  invalidEntries: string[];       // original (untrimmed) strings
  duplicateEdges: string[];       // "X->Y" strings, first-encounter order
}

function parse(data: string[]): ParseResult
```

Rules:
- Trim each entry before matching against `/^[A-Z]->[A-Z]$/`.
- Self-loops (`A->A`) are invalid.
- Empty strings are invalid.
- Invalid entries are stored in their **original** (untrimmed) form.
- Duplicate detection uses a `Set<string>` of `"parent->child"` keys; the second and subsequent occurrences are added to `duplicateEdges` (once per pair).

### Tree_Builder

```ts
interface TreeNode {
  [child: string]: TreeNode;   // recursive; leaf = {}
}

interface Component {
  root: string;
  tree: TreeNode;
  depth: number;               // omitted for cyclic components
  hasCycle: boolean;           // omitted from response for acyclic components
}

function buildComponents(
  validEdges: Array<{ parent: string; child: string }>
): Component[]
```

Rules:
- Build an adjacency map and a parent map from `validEdges`.
- Single-parent constraint: if a child already has a parent, discard subsequent edges for that child.
- Find roots: nodes that never appear as a child in the (post-constraint) edge set.
- If a connected component has no natural root, use the lexicographically smallest node.
- Build the nested tree object recursively from the root.
- Depth = length of the longest root-to-leaf path (root counts as 1).

### Cycle_Detector

```ts
function detectCycle(
  root: string,
  adjacency: Map<string, string[]>
): boolean
```

Uses iterative DFS with a `visited` set and a `recursionStack` set to detect back-edges (directed cycles). Returns `true` if any cycle is reachable from the root.

### Response_Formatter

```ts
interface HierarchyObject {
  root: string;
  tree: TreeNode;
  depth?: number;       // present only when has_cycle is absent
  has_cycle?: true;     // present only when cycle detected
}

interface Summary {
  total_trees: number;
  total_cycles: number;
  largest_tree_root: string;
}

interface ApiResponse {
  user_id: string;
  email_id: string;
  college_roll_number: string;
  invalid_entries: string[];
  duplicate_edges: string[];
  hierarchies: HierarchyObject[];
  summary: Summary;
}

function formatResponse(
  components: Component[],
  invalidEntries: string[],
  duplicateEdges: string[],
  identity: { userId: string; emailId: string; rollNumber: string }
): ApiResponse
```

Rules:
- Cyclic components: include `has_cycle: true`, set `tree: {}`, omit `depth`.
- Acyclic components: include `depth`, omit `has_cycle`.
- `largest_tree_root`: root of deepest acyclic tree; lexicographically smallest on tie; `""` if no acyclic trees.

### Express Server (`server.js`)

```
POST /bfhl
  Body: { data: string[] }
  Success: 200 + ApiResponse
  Error:   400 + { error: string }  (missing/invalid data field)

GET /bfhl  (optional health check — returns 405 Method Not Allowed)
```

CORS is enabled via the `cors` npm package (allow all origins for development).

---

## Data Models

### Request Body

```json
{
  "data": ["A->B", "B->C", "X->Y", "invalid", "A->B"]
}
```

### Response Body

```json
{
  "user_id": "johndoe_17091999",
  "email_id": "john@srmist.edu.in",
  "college_roll_number": "RA2111003010001",
  "invalid_entries": ["invalid"],
  "duplicate_edges": ["A->B"],
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "C": {} } } },
      "depth": 3
    },
    {
      "root": "X",
      "tree": { "X": { "Y": {} } },
      "depth": 2
    }
  ],
  "summary": {
    "total_trees": 2,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

### Cyclic Component Example

```json
{
  "root": "A",
  "tree": {},
  "has_cycle": true
}
```

### Environment Variables (`.env`)

```
USER_ID=johndoe_17091999
EMAIL_ID=john@srmist.edu.in
COLLEGE_ROLL_NUMBER=RA2111003010001
PORT=3000
```

### Project Structure

```
srm-bfhl-api/
├── backend/
│   ├── server.js          # Express entry point
│   ├── lib/
│   │   ├── parser.js
│   │   ├── treeBuilder.js
│   │   ├── cycleDetector.js
│   │   └── responseFormatter.js
│   ├── .env               # identity fields (not committed)
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── InputPanel.jsx
    │   │   ├── HierarchyCard.jsx
    │   │   └── SummaryPanel.jsx
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Whitespace-trimmed entries are validated correctly

*For any* valid edge string (matching `^[A-Z]->[A-Z]$`) with arbitrary leading and/or trailing whitespace prepended or appended, the parser SHALL accept it as valid and NOT add it to `invalid_entries`.

**Validates: Requirements 1.1**

---

### Property 2: Non-matching entries always appear in invalid_entries

*For any* string that does not match `^[A-Z]->[A-Z]$` after trimming (including self-loops and empty strings), the parser SHALL add it to `invalid_entries` and SHALL NOT use it in tree construction.

**Validates: Requirements 1.2, 1.3, 1.4**

---

### Property 3: Invalid entry order is preserved

*For any* input array containing a mix of valid and invalid entries, the relative order of invalid entries in `invalid_entries` SHALL match their relative order in the original input array.

**Validates: Requirements 1.6**

---

### Property 4: Duplicate edges appear exactly once in duplicate_edges

*For any* valid edge `"X->Y"` that appears N times (N ≥ 2) in the input, the string `"X->Y"` SHALL appear exactly once in `duplicate_edges`, regardless of N.

**Validates: Requirements 2.2, 2.3**

---

### Property 5: Root node is never a child in its component

*For any* set of valid, non-duplicate edges forming an acyclic connected component, the identified root node SHALL NOT appear as a child in any edge within that component.

**Validates: Requirements 3.2**

---

### Property 6: Single-parent constraint is enforced

*For any* input where a child node `C` appears in multiple edges with different parents, only the first edge's parent SHALL be used; all subsequent conflicting edges SHALL be silently discarded.

**Validates: Requirements 3.4**

---

### Property 7: Cyclic components are correctly flagged and formatted

*For any* connected component that contains a directed cycle, the corresponding hierarchy object SHALL have `has_cycle: true`, `tree: {}`, and SHALL NOT contain a `depth` field.

**Validates: Requirements 4.1, 4.2, 4.3**

---

### Property 8: Acyclic components omit has_cycle

*For any* connected component that is a valid acyclic tree, the corresponding hierarchy object SHALL contain a `depth` field and SHALL NOT contain a `has_cycle` field.

**Validates: Requirements 4.4, 5.1, 5.3**

---

### Property 9: Summary counts are consistent with hierarchies

*For any* response, `summary.total_trees` SHALL equal the number of hierarchy objects without `has_cycle`, and `summary.total_cycles` SHALL equal the number of hierarchy objects with `has_cycle: true`. Their sum SHALL equal the total number of entries in `hierarchies`.

**Validates: Requirements 6.1, 6.2**

---

### Property 10: largest_tree_root identifies the deepest acyclic tree root

*For any* response containing at least one acyclic tree, `summary.largest_tree_root` SHALL be the root label of the acyclic tree with the greatest `depth`; on a tie, it SHALL be the lexicographically smallest root label among the tied trees.

**Validates: Requirements 6.3, 6.4, 6.5**

---

### Property 11: JSON round-trip preserves response equivalence

*For any* valid input array (including empty arrays, all-invalid entries, all-duplicate entries, or mixed inputs), `JSON.parse(JSON.stringify(response))` SHALL produce an object deeply equal to the original response object.

**Validates: Requirements 9.1, 9.2**

---

### Property 12: Invalid request body returns 400

*For any* request body that is missing the `data` field or where `data` is not an array, the API SHALL respond with HTTP status `400`.

**Validates: Requirements 8.3**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| `data` field missing from body | HTTP 400, `{ "error": "Missing required field: data (must be an array)" }` |
| `data` is not an array | HTTP 400, `{ "error": "Field 'data' must be an array of strings" }` |
| Individual invalid entries | Collected in `invalid_entries`; processing continues |
| Duplicate edges | Collected in `duplicate_edges`; first occurrence used |
| All entries invalid | Returns 200 with empty `hierarchies`, `summary` with zeros |
| All entries duplicate | Returns 200 with hierarchies built from first occurrences only |
| Cyclic component | `has_cycle: true`, `tree: {}`, no `depth` |
| Missing `.env` identity fields | Server logs a warning at startup; fields default to `""` |
| Unhandled server error | HTTP 500, `{ "error": "Internal server error" }` |

---

## Testing Strategy

### Unit Tests (Jest)

Focus on pure functions in `lib/`:

- **Parser**: valid/invalid classification, whitespace trimming, self-loop rejection, duplicate detection, order preservation.
- **Tree_Builder**: root identification, single-parent constraint, nested tree structure, depth calculation (including single-node, linear chain, branching).
- **Cycle_Detector**: acyclic trees return `false`, simple cycles return `true`, cycles reachable from root return `true`.
- **Response_Formatter**: field omission rules (no `depth` on cycles, no `has_cycle` on trees), summary computation, tiebreaker logic, empty-tree edge case.

### Property-Based Tests (fast-check)

Using [fast-check](https://github.com/dubzzz/fast-check) (JavaScript PBT library). Each property test runs a minimum of **100 iterations**.

Tag format: `// Feature: srm-bfhl-api, Property N: <property_text>`

| Property | Test Description |
|---|---|
| P1 | Generate valid edges with random whitespace padding; verify not in `invalid_entries` |
| P2 | Generate strings not matching `^[A-Z]->[A-Z]$`; verify all in `invalid_entries` |
| P3 | Generate mixed arrays; verify `invalid_entries` order matches input order |
| P4 | Generate edges repeated N≥2 times; verify exactly one entry in `duplicate_edges` |
| P5 | Generate acyclic edge sets; verify root never appears as child |
| P6 | Generate edges with conflicting parents for same child; verify first-parent wins |
| P7 | Generate cyclic edge sets; verify `has_cycle: true`, `tree: {}`, no `depth` |
| P8 | Generate acyclic edge sets; verify `depth` present, `has_cycle` absent |
| P9 | Generate any input; verify `total_trees + total_cycles === hierarchies.length` |
| P10 | Generate multiple acyclic trees with known depths; verify `largest_tree_root` |
| P11 | Generate any valid input; verify `JSON.parse(JSON.stringify(response))` deep-equals response |
| P12 | Generate invalid request bodies; verify HTTP 400 |

### Integration Tests

- `POST /bfhl` with a well-formed payload returns 200 and correct structure.
- `POST /bfhl` with missing `data` returns 400.
- Identity fields (`user_id`, `email_id`, `college_roll_number`) are present and non-empty in every response.
- CORS headers are present in the response.
- Response time for 50-item payload is under 3 seconds.

### Frontend Tests

Manual verification (or Playwright smoke tests):
- Textarea accepts input; submit button triggers POST request.
- Loading indicator appears during request.
- Hierarchies, invalid entries, duplicate edges, and summary are rendered after success.
- Error message is shown on API failure.
