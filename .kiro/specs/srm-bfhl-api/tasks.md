# Tasks — srm-bfhl-api

## 1. Project Setup

- [-] 1.1 Initialize backend project structure
  - [ ] 1.1.1 Create `backend/` directory
  - [ ] 1.1.2 Run `npm init -y` in `backend/`
  - [ ] 1.1.3 Install dependencies: `express`, `cors`, `dotenv`
  - [ ] 1.1.4 Install dev dependencies: `jest`, `fast-check`, `nodemon`
  - [ ] 1.1.5 Create `backend/lib/` directory for processing modules
  - [ ] 1.1.6 Create `.env.example` with placeholder identity fields
  - [ ] 1.1.7 Create `.gitignore` (ignore `node_modules`, `.env`)

- [x] 1.2 Initialize frontend project structure
  - [ ] 1.2.1 Run `npm create vite@latest frontend -- --template react`
  - [ ] 1.2.2 Install frontend dependencies (`cd frontend && npm install`)
  - [ ] 1.2.3 Create `frontend/src/components/` directory

- [ ] 1.3 Configure package.json scripts
  - [ ] 1.3.1 Add `"start": "node server.js"` to backend
  - [ ] 1.3.2 Add `"dev": "nodemon server.js"` to backend
  - [ ] 1.3.3 Add `"test": "jest"` to backend
  - [ ] 1.3.4 Add `"test:watch": "jest --watch"` to backend

## 2. Backend — Core Processing Logic

- [-] 2.1 Implement Parser (`backend/lib/parser.js`)
  - [ ] 2.1.1 Write `parse(data)` function signature
  - [ ] 2.1.2 Implement whitespace trimming for each entry
  - [ ] 2.1.3 Implement regex validation (`^[A-Z]->[A-Z]$`)
  - [ ] 2.1.4 Implement self-loop rejection (`A->A` is invalid)
  - [ ] 2.1.5 Implement empty string rejection
  - [ ] 2.1.6 Store invalid entries in original (untrimmed) form
  - [ ] 2.1.7 Implement duplicate edge detection using Set
  - [ ] 2.1.8 Preserve order of invalid entries and duplicate edges
  - [ ] 2.1.9 Return `{ validEdges, invalidEntries, duplicateEdges }`

- [ ] 2.2 Implement Tree_Builder (`backend/lib/treeBuilder.js`)
  - [ ] 2.2.1 Write `buildComponents(validEdges)` function signature
  - [ ] 2.2.2 Build adjacency map and parent map from edges
  - [ ] 2.2.3 Enforce single-parent constraint (discard conflicting edges)
  - [ ] 2.2.4 Identify connected components using DFS/BFS
  - [ ] 2.2.5 Identify root for each component (node never appearing as child)
  - [ ] 2.2.6 Handle no-natural-root case (use lexicographically smallest node)
  - [ ] 2.2.7 Build nested tree object recursively from root
  - [ ] 2.2.8 Calculate depth (longest root-to-leaf path, root counts as 1)
  - [ ] 2.2.9 Return array of `{ root, tree, depth }` objects

- [ ] 2.3 Implement Cycle_Detector (`backend/lib/cycleDetector.js`)
  - [ ] 2.3.1 Write `detectCycle(root, adjacency)` function signature
  - [ ] 2.3.2 Implement iterative DFS with visited and recursion stack
  - [ ] 2.3.3 Detect back-edges (directed cycles)
  - [ ] 2.3.4 Return `true` if cycle found, `false` otherwise

- [ ] 2.4 Implement Response_Formatter (`backend/lib/responseFormatter.js`)
  - [ ] 2.4.1 Write `formatResponse(components, invalidEntries, duplicateEdges, identity)` signature
  - [ ] 2.4.2 Integrate cycle detection for each component
  - [ ] 2.4.3 Apply field-omission rules (no `depth` on cycles, no `has_cycle` on trees)
  - [ ] 2.4.4 Compute `total_trees` (count of non-cyclic components)
  - [ ] 2.4.5 Compute `total_cycles` (count of cyclic components)
  - [ ] 2.4.6 Compute `largest_tree_root` (deepest tree, lexicographic tiebreaker, `""` if none)
  - [ ] 2.4.7 Assemble final response object with identity fields
  - [ ] 2.4.8 Return complete `ApiResponse` object

## 3. Backend — Express Server

- [ ] 3.1 Implement Express server (`backend/server.js`)
  - [ ] 3.1.1 Import dependencies (`express`, `cors`, `dotenv`)
  - [ ] 3.1.2 Load environment variables with `dotenv.config()`
  - [ ] 3.1.3 Initialize Express app and enable CORS
  - [ ] 3.1.4 Add JSON body parser middleware
  - [ ] 3.1.5 Implement `POST /bfhl` route handler
  - [ ] 3.1.6 Validate request body (check `data` field exists and is array)
  - [ ] 3.1.7 Return 400 with error message if validation fails
  - [ ] 3.1.8 Call parser, tree builder, and response formatter
  - [ ] 3.1.9 Inject identity fields from `process.env`
  - [ ] 3.1.10 Return 200 with formatted response
  - [ ] 3.1.11 Add global error handler (return 500 on unhandled errors)
  - [ ] 3.1.12 Start server on port from `.env` (default 3000)
  - [ ] 3.1.13 Log startup message with port number

- [ ] 3.2 Create `.env` file
  - [ ] 3.2.1 Add `USER_ID=<fullname_ddmmyyyy>`
  - [ ] 3.2.2 Add `EMAIL_ID=<college_email>`
  - [ ] 3.2.3 Add `COLLEGE_ROLL_NUMBER=<roll_number>`
  - [ ] 3.2.4 Add `PORT=3000`

## 4. Backend — Unit Tests

- [ ] 4.1 Write unit tests for Parser (`backend/lib/parser.test.js`)
  - [ ] 4.1.1 Test valid edge parsing (`"A->B"` → valid)
  - [ ] 4.1.2 Test whitespace trimming (`"  A->B  "` → valid)
  - [ ] 4.1.3 Test invalid format (`"ABC"` → invalid)
  - [ ] 4.1.4 Test self-loop rejection (`"A->A"` → invalid)
  - [ ] 4.1.5 Test empty string rejection (`""` → invalid)
  - [ ] 4.1.6 Test duplicate detection (two `"A->B"` → one in duplicates)
  - [ ] 4.1.7 Test invalid entry order preservation
  - [ ] 4.1.8 Test duplicate edge order preservation

- [ ] 4.2 Write unit tests for Tree_Builder (`backend/lib/treeBuilder.test.js`)
  - [ ] 4.2.1 Test single-node tree (depth = 1)
  - [ ] 4.2.2 Test linear chain (`A->B->C` → depth = 3)
  - [ ] 4.2.3 Test branching tree (depth = max branch length)
  - [ ] 4.2.4 Test root identification (node never appearing as child)
  - [ ] 4.2.5 Test single-parent constraint (conflicting edges discarded)
  - [ ] 4.2.6 Test multiple disconnected components
  - [ ] 4.2.7 Test lexicographic root selection for no-natural-root case

- [ ] 4.3 Write unit tests for Cycle_Detector (`backend/lib/cycleDetector.test.js`)
  - [ ] 4.3.1 Test acyclic tree returns `false`
  - [ ] 4.3.2 Test simple cycle (`A->B->A`) returns `true`
  - [ ] 4.3.3 Test cycle reachable from root returns `true`
  - [ ] 4.3.4 Test self-loop detection (should be caught by parser, but test detector)

- [ ] 4.4 Write unit tests for Response_Formatter (`backend/lib/responseFormatter.test.js`)
  - [ ] 4.4.1 Test acyclic component has `depth`, no `has_cycle`
  - [ ] 4.4.2 Test cyclic component has `has_cycle: true`, `tree: {}`, no `depth`
  - [ ] 4.4.3 Test `total_trees` count
  - [ ] 4.4.4 Test `total_cycles` count
  - [ ] 4.4.5 Test `largest_tree_root` with single tree
  - [ ] 4.4.6 Test `largest_tree_root` with multiple trees (deepest wins)
  - [ ] 4.4.7 Test `largest_tree_root` tiebreaker (lexicographic)
  - [ ] 4.4.8 Test `largest_tree_root` with no acyclic trees (`""`)
  - [ ] 4.4.9 Test identity fields are included in response

## 5. Backend — Property-Based Tests

- [ ] 5.1 Write property tests (`backend/lib/properties.test.js`)
  - [ ] 5.1.1 Property 1: Whitespace-trimmed valid edges not in invalid_entries (100 iterations)
  - [ ] 5.1.2 Property 2: Non-matching strings always in invalid_entries (100 iterations)
  - [ ] 5.1.3 Property 3: Invalid entry order preserved (100 iterations)
  - [ ] 5.1.4 Property 4: Duplicate edges appear exactly once (100 iterations)
  - [ ] 5.1.5 Property 5: Root never appears as child in acyclic component (100 iterations)
  - [ ] 5.1.6 Property 6: Single-parent constraint enforced (100 iterations)
  - [ ] 5.1.7 Property 7: Cyclic components correctly flagged (100 iterations)
  - [ ] 5.1.8 Property 8: Acyclic components omit has_cycle (100 iterations)
  - [ ] 5.1.9 Property 9: Summary counts consistent (100 iterations)
  - [ ] 5.1.10 Property 10: largest_tree_root identifies deepest tree (100 iterations)
  - [ ] 5.1.11 Property 11: JSON round-trip preserves equivalence (100 iterations)

## 6. Backend — Integration Tests

- [ ] 6.1 Write integration tests (`backend/server.test.js`)
  - [ ] 6.1.1 Test `POST /bfhl` with valid payload returns 200
  - [ ] 6.1.2 Test `POST /bfhl` with missing `data` returns 400
  - [ ] 6.1.3 Test `POST /bfhl` with non-array `data` returns 400
  - [ ] 6.1.4 Test identity fields present in response
  - [ ] 6.1.5 Test CORS headers present
  - [ ] 6.1.6 Test response time for 50-item payload (< 3 seconds)

## 7. Frontend — React Components

- [ ] 7.1 Implement InputPanel component (`frontend/src/components/InputPanel.jsx`)
  - [ ] 7.1.1 Create textarea for node string input
  - [ ] 7.1.2 Add submit button
  - [ ] 7.1.3 Implement validation (non-empty input)
  - [ ] 7.1.4 Show validation message if input is empty
  - [ ] 7.1.5 Disable submit button and show loading indicator during request
  - [ ] 7.1.6 Parse input (split by comma or newline) into array
  - [ ] 7.1.7 Send `POST /bfhl` request with `{ data: [...] }`
  - [ ] 7.1.8 Emit response or error to parent component

- [ ] 7.2 Implement HierarchyCard component (`frontend/src/components/HierarchyCard.jsx`)
  - [ ] 7.2.1 Accept hierarchy object as prop
  - [ ] 7.2.2 Display root label
  - [ ] 7.2.3 Display tree structure (nested list or JSON view)
  - [ ] 7.2.4 Display depth (if present)
  - [ ] 7.2.5 Display "Cycle Detected" badge (if `has_cycle: true`)
  - [ ] 7.2.6 Style card with border, padding, and readable typography

- [ ] 7.3 Implement SummaryPanel component (`frontend/src/components/SummaryPanel.jsx`)
  - [ ] 7.3.1 Accept summary object as prop
  - [ ] 7.3.2 Display `total_trees`
  - [ ] 7.3.3 Display `total_cycles`
  - [ ] 7.3.4 Display `largest_tree_root`
  - [ ] 7.3.5 Style panel with clear labels and values

- [ ] 7.4 Implement main App component (`frontend/src/App.jsx`)
  - [ ] 7.4.1 Import InputPanel, HierarchyCard, SummaryPanel
  - [ ] 7.4.2 Manage state for API response and error
  - [ ] 7.4.3 Render InputPanel and pass callback for response
  - [ ] 7.4.4 Render error message if API call fails
  - [ ] 7.4.5 Render list of HierarchyCard components for each hierarchy
  - [ ] 7.4.6 Render invalid_entries list (if any)
  - [ ] 7.4.7 Render duplicate_edges list (if any)
  - [ ] 7.4.8 Render SummaryPanel with summary data
  - [ ] 7.4.9 Add basic CSS for layout (flexbox or grid)

## 8. Frontend — Styling and Polish

- [ ] 8.1 Add global styles (`frontend/src/index.css`)
  - [ ] 8.1.1 Set font family, base font size, and line height
  - [ ] 8.1.2 Add color palette (primary, secondary, error, background)
  - [ ] 8.1.3 Style buttons (hover, active, disabled states)
  - [ ] 8.1.4 Style textarea (border, focus state)
  - [ ] 8.1.5 Add responsive layout (mobile-friendly)

- [ ] 8.2 Add component-specific styles
  - [ ] 8.2.1 Style HierarchyCard (border, shadow, spacing)
  - [ ] 8.2.2 Style SummaryPanel (grid or flex layout)
  - [ ] 8.2.3 Style error message (red background, white text)
  - [ ] 8.2.4 Style loading indicator (spinner or text)

## 9. Documentation and Deployment Prep

- [ ] 9.1 Write README.md
  - [ ] 9.1.1 Add project overview
  - [ ] 9.1.2 Add setup instructions (backend and frontend)
  - [ ] 9.1.3 Add `.env` configuration instructions
  - [ ] 9.1.4 Add API endpoint documentation
  - [ ] 9.1.5 Add example request/response
  - [ ] 9.1.6 Add testing instructions (`npm test`)
  - [ ] 9.1.7 Add development instructions (`npm run dev`)

- [ ] 9.2 Verify all tests pass
  - [ ] 9.2.1 Run `npm test` in backend (all unit and property tests pass)
  - [ ] 9.2.2 Run integration tests (all pass)
  - [ ] 9.2.3 Manually test frontend (submit valid/invalid inputs, verify UI)

- [ ] 9.3 Final checks
  - [ ] 9.3.1 Verify `.env.example` is committed (not `.env`)
  - [ ] 9.3.2 Verify `.gitignore` includes `node_modules`, `.env`
  - [ ] 9.3.3 Verify backend starts without errors
  - [ ] 9.3.4 Verify frontend starts and connects to backend
  - [ ] 9.3.5 Verify CORS is working (frontend can call backend)
