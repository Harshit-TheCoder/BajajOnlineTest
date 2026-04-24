# Requirements Document

## Introduction

This feature is a full-stack application for the SRM BFHL Engineering Challenge. It consists of a REST API (`POST /bfhl`) that accepts an array of node strings representing directed edges, processes hierarchical relationships (trees and cycles), and returns structured insights. A single-page frontend allows users to interact with the API by submitting node lists and viewing the structured response.

## Glossary

- **API**: The backend REST service exposing the `POST /bfhl` endpoint.
- **Frontend**: The single-page web application that interacts with the API.
- **Node String**: A string representing a directed edge in the format `X->Y`, where X and Y are each a single uppercase letter (A–Z).
- **Valid Edge**: A node string that passes all format validation rules and is not a duplicate.
- **Invalid Entry**: A node string that does not conform to the valid node format.
- **Duplicate Edge**: A node string whose Parent→Child pair has already appeared in the input; only the first occurrence is used for tree construction.
- **Tree**: A directed acyclic graph rooted at a node that never appears as a child in any valid edge within its connected component.
- **Cycle**: A connected component of valid edges in which every node appears as a child (no natural root exists), or in which a directed cycle is reachable from the root.
- **Root**: A node that never appears as a child in any valid edge within its connected component.
- **Depth**: The number of nodes on the longest root-to-leaf path in a tree.
- **Hierarchy Object**: A JSON object describing one connected component, containing its root, nested tree structure, depth (for non-cyclic trees), and cycle flag (for cyclic groups).
- **Summary**: A JSON object containing aggregate statistics: `total_trees`, `total_cycles`, and `largest_tree_root`.
- **Parser**: The component that reads and validates each entry in the input `data` array.
- **Tree_Builder**: The component that constructs tree structures from valid, non-duplicate edges.
- **Cycle_Detector**: The component that identifies cyclic connected components.
- **Response_Formatter**: The component that assembles the final JSON response.

---

## Requirements

### Requirement 1: Input Parsing and Validation

**User Story:** As a consumer of the API, I want invalid entries to be identified and separated, so that only well-formed edges are used for tree construction.

#### Acceptance Criteria

1. WHEN the API receives a request, THE Parser SHALL trim leading and trailing whitespace from each entry in the `data` array before validation.
2. WHEN a trimmed entry does not match the pattern `^[A-Z]->[A-Z]$`, THE Parser SHALL add that entry (in its original, untrimmed form) to the `invalid_entries` array.
3. THE Parser SHALL treat a self-loop entry (where parent and child are the same letter, e.g., `"A->A"`) as invalid and add it to `invalid_entries`.
4. THE Parser SHALL treat an empty string entry as invalid and add it to `invalid_entries`.
5. WHEN an entry is valid, THE Parser SHALL extract the parent node and child node as single uppercase letters.
6. THE Parser SHALL preserve the original order of invalid entries as they appear in the input `data` array.

---

### Requirement 2: Duplicate Edge Detection

**User Story:** As a consumer of the API, I want duplicate edges to be reported, so that I can understand which repeated entries were ignored during tree construction.

#### Acceptance Criteria

1. WHEN the same Parent→Child pair appears more than once among valid entries, THE Parser SHALL use only the first occurrence for tree construction.
2. WHEN a valid Parent→Child pair appears more than once, THE Parser SHALL add the string `"X->Y"` (representing that pair) to `duplicate_edges` exactly once, regardless of how many times it is repeated beyond the first.
3. THE Parser SHALL preserve the order of first-encountered duplicate pairs in the `duplicate_edges` array.

---

### Requirement 3: Tree Construction

**User Story:** As a consumer of the API, I want the API to build hierarchical tree structures from valid edges, so that I can understand the parent-child relationships in the data.

#### Acceptance Criteria

1. WHEN valid, non-duplicate edges are available, THE Tree_Builder SHALL construct one or more directed trees from those edges.
2. THE Tree_Builder SHALL identify a root as any node that does not appear as a child in any valid, non-duplicate edge within its connected component.
3. WHEN a connected component contains no natural root (i.e., every node appears as a child), THE Tree_Builder SHALL use the lexicographically smallest node in that component as the root.
4. WHEN a node already has a parent assigned from a previously processed edge, THE Tree_Builder SHALL silently discard any subsequent edge that would assign a different parent to that same child node.
5. THE Tree_Builder SHALL represent each tree as a nested JSON object where each key is a node label and its value is an object containing its children (recursively), with leaf nodes mapping to an empty object `{}`.
6. THE Tree_Builder SHALL return each independent connected component as a separate entry in the `hierarchies` array.

---

### Requirement 4: Cycle Detection

**User Story:** As a consumer of the API, I want cyclic groups to be identified and flagged, so that I can distinguish trees from cycles in the response.

#### Acceptance Criteria

1. WHEN a connected component contains a directed cycle, THE Cycle_Detector SHALL set `has_cycle: true` on that component's hierarchy object.
2. WHEN `has_cycle` is `true`, THE Cycle_Detector SHALL set the `tree` field to an empty object `{}` for that hierarchy object.
3. WHEN `has_cycle` is `true`, THE Response_Formatter SHALL omit the `depth` field from that hierarchy object entirely.
4. WHEN a connected component is a valid non-cyclic tree, THE Response_Formatter SHALL omit the `has_cycle` field from that hierarchy object entirely (it SHALL NOT be returned as `false`).

---

### Requirement 5: Depth Calculation

**User Story:** As a consumer of the API, I want the depth of each non-cyclic tree to be calculated, so that I can understand the longest path in each hierarchy.

#### Acceptance Criteria

1. WHEN a hierarchy object represents a non-cyclic tree, THE Tree_Builder SHALL calculate the depth as the number of nodes on the longest root-to-leaf path.
2. THE Tree_Builder SHALL include the root node itself in the depth count (e.g., a single-node tree has depth 1; a path A→B→C has depth 3).
3. THE Tree_Builder SHALL set the `depth` field on each non-cyclic hierarchy object.

---

### Requirement 6: Summary Generation

**User Story:** As a consumer of the API, I want a summary of the processed data, so that I can quickly understand the overall structure of the input.

#### Acceptance Criteria

1. THE Response_Formatter SHALL set `total_trees` in the summary to the count of hierarchy objects that are non-cyclic (i.e., do not have `has_cycle: true`).
2. THE Response_Formatter SHALL set `total_cycles` in the summary to the count of hierarchy objects that have `has_cycle: true`.
3. THE Response_Formatter SHALL set `largest_tree_root` to the root label of the non-cyclic tree with the greatest depth.
4. WHEN two or more non-cyclic trees share the greatest depth, THE Response_Formatter SHALL set `largest_tree_root` to the lexicographically smallest root label among those tied trees.
5. WHEN there are no non-cyclic trees, THE Response_Formatter SHALL set `largest_tree_root` to an empty string `""`.

---

### Requirement 7: Identity Fields in Response

**User Story:** As an evaluator of the API, I want the response to include identity fields, so that I can attribute the submission to the correct candidate.

#### Acceptance Criteria

1. THE API SHALL include a `user_id` field in every response, formatted as `fullname_ddmmyyyy` (e.g., `"johndoe_17091999"`).
2. THE API SHALL include an `email_id` field in every response containing the candidate's college email address.
3. THE API SHALL include a `college_roll_number` field in every response containing the candidate's college roll number.
4. THE API SHALL NOT hardcode the API response logic; identity fields may be set via configuration or environment variables.

---

### Requirement 8: API Endpoint and Protocol

**User Story:** As a consumer of the API, I want a well-defined REST endpoint, so that I can reliably call the API from any HTTP client.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /bfhl` endpoint that accepts `Content-Type: application/json`.
2. WHEN a valid request is received, THE API SHALL respond with HTTP status `200` and a JSON body conforming to the response schema.
3. WHEN the request body is missing the `data` field or `data` is not an array, THE API SHALL respond with HTTP status `400` and a descriptive error message.
4. THE API SHALL enable CORS so that cross-origin requests from the frontend are permitted.
5. THE API SHALL process requests with up to 50 node strings and return a response within 3 seconds.

---

### Requirement 9: Round-Trip Serialization

**User Story:** As a developer, I want the API response to be consistently serializable and deserializable, so that clients can reliably parse the JSON output.

#### Acceptance Criteria

1. THE Response_Formatter SHALL produce a JSON response that, when serialized and then deserialized, yields an object equivalent to the original response (round-trip property).
2. THE Response_Formatter SHALL produce valid JSON for all valid inputs, including inputs with no valid edges, all-duplicate edges, or all-invalid entries.

---

### Requirement 10: Frontend — Input and Submission

**User Story:** As a user, I want a web interface to submit node strings to the API, so that I can interact with the API without writing code.

#### Acceptance Criteria

1. THE Frontend SHALL provide a textarea or input field where the user can enter a comma-separated or newline-separated list of node strings.
2. THE Frontend SHALL provide a submit button that, when clicked, sends a `POST` request to `/bfhl` with the entered node strings as the `data` array in the request body.
3. WHEN the submit button is clicked and the input field is empty, THE Frontend SHALL display a validation message prompting the user to enter at least one node string.
4. WHILE a request is in progress, THE Frontend SHALL display a loading indicator and disable the submit button to prevent duplicate submissions.

---

### Requirement 11: Frontend — Response Display

**User Story:** As a user, I want the API response displayed in a readable format, so that I can understand the hierarchical structure and summary of my input.

#### Acceptance Criteria

1. WHEN the API returns a successful response, THE Frontend SHALL display the `hierarchies` array in a structured, readable format (e.g., tree view, cards, or nested list).
2. WHEN the API returns a successful response, THE Frontend SHALL display the `invalid_entries` and `duplicate_edges` arrays.
3. WHEN the API returns a successful response, THE Frontend SHALL display the `summary` object including `total_trees`, `total_cycles`, and `largest_tree_root`.
4. WHEN the API call fails or returns a non-200 status, THE Frontend SHALL display a clear, human-readable error message.
5. THE Frontend SHALL be a single-page application requiring no page navigation to use all features.
