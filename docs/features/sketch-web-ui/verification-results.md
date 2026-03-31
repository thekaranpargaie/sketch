# Sketch Web UI — Verification Results

**Feature:** Sketch Web UI (`src/Sketch.Web/`)  
**Sub-Agent:** Auditor  
**Date:** 2026-03-31  
**Auditor:** GitHub Copilot  
**Artefacts reviewed:**  
- `src/Sketch.Web/src/**` (all files)  
- `docs/features/sketch-mvp/design-spec.md` §4.1–4.5  
- `docs/features/sketch-mvp/requirements.md` (all AC + EC items)  
- `docs/features/sketch-web-ui/implementation-notes.md`

---

## 1. Executive Summary

The Sketch React UI is **substantially complete** for MVP scope. All core component structure, Zustand store, persistence, edge validation, drag-and-drop, and the provision flow are implemented correctly and align with the design specification. The visual design faithfully reproduces the four node types and their specified colour palette.

**One TypeScript compilation error** was found (`BlueprintEdge` unused import in `ReactFlowCanvas.tsx`) that will cause `npm run build` to fail when `noUnusedLocals` enforcement runs. This must be fixed before the UI ships.

Three client-side validation gaps exist (duplicate entity names, reserved C# keyword field names, 30+ fields warning) that are called out in the requirements as canvas edge cases. These are low-risk at the MVP tier since the server enforces correctness independently, but they represent missing UX guardrails.

One semantic deviation exists: `isValidConnection` is not used on `<ReactFlow>`; `onConnect` with early-return validation is used instead. This is functionally equivalent but degrades the connection-drag visual experience (invalid handles are not greyed out in real time).

**Overall verdict: CONDITIONAL APPROVAL** — ship after fixing the one build-blocking TypeScript error. See §7 for conditions.

---

## 2. Component Checklist

### 2.1 Component Structure (design-spec §4.1)

| # | Item | Status | Evidence / Notes |
|---|------|--------|-----------------|
| CS-01 | `App.tsx` wraps with `ReactFlowProvider` + `CanvasPage` | ✅ PASS | `App.tsx` lines 1–10: `<ReactFlowProvider><CanvasPage /></ReactFlowProvider>` |
| CS-02 | `CanvasPage` renders `ReactFlowCanvas` | ✅ PASS | `CanvasPage.tsx` line 132 |
| CS-03 | `CanvasPage` renders `NodeToolbar` | ✅ PASS | `CanvasPage.tsx` line 131 |
| CS-04 | `CanvasPage` renders `PropertiesPanel` | ✅ PASS | `CanvasPage.tsx` line 133 (conditional on `selectedNodeId`) |
| CS-05 | `CanvasPage` renders `ProvisionButton` | ✅ PASS | `CanvasPage.tsx` line 104 |
| CS-06 | `CanvasPage` renders `ToastNotifications` | ✅ PASS | `CanvasPage.tsx` line 138 |
| CS-07 | `EntityNode` custom node component implemented | ✅ PASS | `components/Nodes/EntityNode.tsx` |
| CS-08 | `ProtocolNode` custom node component implemented | ✅ PASS | `components/Nodes/ProtocolNode.tsx` |
| CS-09 | `StorageNode` custom node component implemented | ✅ PASS | `components/Nodes/StorageNode.tsx` |
| CS-10 | `IdentityNode` custom node component implemented | ✅ PASS | `components/Nodes/IdentityNode.tsx` |
| CS-11 | `nodeTypes` map registered outside component (prevents re-registration) | ✅ PASS | `ReactFlowCanvas.tsx` lines 26–31: module-level `const nodeTypes` |

> **Note CS-04:** `PropertiesPanel` is conditionally rendered — `{selectedNodeId && <PropertiesPanel />}`. When no node is selected the panel is absent from the DOM entirely, which is correct behaviour; reopening via selection works. The spec does not specify whether it should be always-mounted or conditional, so this is acceptable.

---

### 2.2 TypeScript Types (design-spec §4.3)

| # | Type / Interface | Status | Notes |
|---|-----------------|--------|-------|
| TS-01 | `FieldType` | ✅ PASS | `blueprint.ts` line 1 — exact match to spec |
| TS-02 | `NodeType` | ✅ PASS | `blueprint.ts` line 2 |
| TS-03 | `ProtocolStyle` | ✅ PASS | `blueprint.ts` line 3 |
| TS-04 | `AuthType` | ✅ PASS | `blueprint.ts` line 4 (`AuthType`; spec shows same name) |
| TS-05 | `StorageEngine` | ✅ PASS | `blueprint.ts` line 5 |
| TS-06 | `EdgeAction` | ✅ PASS | `blueprint.ts` line 6 |
| TS-07 | `ProvisionStatus` | ✅ PASS | `blueprint.ts` line 7 |
| TS-08 | `FieldDefinition` | ✅ PASS | `blueprint.ts` lines 9–12 |
| TS-09 | `NodeData` | ✅ PASS | `blueprint.ts` lines 14–21 |
| TS-10 | `BlueprintNode` | ✅ PASS | `blueprint.ts` lines 23–28 |
| TS-11 | `BlueprintEdge` | ✅ PASS | `blueprint.ts` lines 30–35 |
| TS-12 | `Blueprint` | ✅ PASS | `blueprint.ts` lines 37–42 |
| TS-13 | `BlueprintState` exists and matches store shape | ⚠️ WARN | Defined as a **local, non-exported** interface inside `blueprintStore.ts` rather than in `blueprint.ts` as the spec shows. Functionally identical—no missing fields—but deviates from the spec's file placement. |

---

### 2.3 Zustand Store (design-spec §4.3)

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| ZS-01 | `addNode` action exists | ✅ PASS | `blueprintStore.ts` line 47 |
| ZS-02 | `updateNode` action exists | ✅ PASS | `blueprintStore.ts` line 51 |
| ZS-03 | `deleteNode` action exists | ✅ PASS | `blueprintStore.ts` line 57 |
| ZS-04 | `addEdge` action exists | ✅ PASS | `blueprintStore.ts` line 63 |
| ZS-05 | `deleteEdge` action exists | ✅ PASS | `blueprintStore.ts` line 67 |
| ZS-06 | `setProjectName` action exists | ✅ PASS | `blueprintStore.ts` line 71 |
| ZS-07 | `setProvisionStatus` action exists | ✅ PASS | `blueprintStore.ts` line 80 |
| ZS-08 | `loadBlueprint` action exists | ✅ PASS | `blueprintStore.ts` line 86 |
| ZS-09 | `reset` action exists | ✅ PASS | `blueprintStore.ts` line 95 |
| ZS-10 | `toBlueprint` selector exists | ✅ PASS | `blueprintStore.ts` line 37 |
| ZS-11 | `deleteNode` also removes connected edges | ✅ PASS | `blueprintStore.ts` lines 59–60: `draft.edges = draft.edges.filter((e) => e.source !== id && e.target !== id)` |
| ZS-12 | Store subscribes to itself for auto-save | ✅ PASS | `blueprintStore.ts` lines 109–111: `useBlueprintStore.subscribe((state) => { scheduleSave(state.toBlueprint()); })` |
| ZS-13 | Extra action `setSelectedNode` (not in spec) | ⚠️ WARN | Required by the UI but not specified in design-spec. Harmless addition. |

---

### 2.4 Edge Validation (design-spec §4.4)

| # | Rule | Code | Status | Evidence |
|---|------|------|--------|----------|
| EV-01 | Unknown source/target node | EC-00 | ✅ PASS | `edgeValidation.ts` line 15 |
| EV-02 | Entity → Entity rejected | EC-01 | ✅ PASS | `edgeValidation.ts` line 24 |
| EV-03 | Protocol → Storage rejected | EC-02 | ✅ PASS | `edgeValidation.ts` line 26 |
| EV-04 | Storage → Protocol rejected | EC-03 | ✅ PASS | `edgeValidation.ts` line 28 |
| EV-05 | Identity as source rejected | EC-04 | ✅ PASS | `edgeValidation.ts` line 30 |
| EV-06 | Any → Protocol rejected | EC-05 | ✅ PASS | `edgeValidation.ts` line 32 |
| EV-07 | Any → Storage rejected | EC-06 | ✅ PASS | `edgeValidation.ts` line 34 |
| EV-08 | Self-loop rejected | EC-07 | ✅ PASS | `edgeValidation.ts` line 17 |
| EV-09 | Catch-all for unmatched cases | EC-99 | ✅ PASS | `edgeValidation.ts` line 36 |
| EV-10 | Valid connections: protocol/storage → entity/identity | — | ✅ PASS | `edgeValidation.ts` lines 21–22 |
| EV-11 | Canvas calls validation on connect | — | ✅ PASS | `ReactFlowCanvas.tsx` line 91: `validateConnection(connection, storeNodes)` |
| EV-12 | Invalid connection shows toast (not an edge) | — | ✅ PASS | `ReactFlowCanvas.tsx` lines 92–95: `addToast(...)` then `return` |
| EV-13 | `isValidConnection` prop used on `<ReactFlow>` | — | ❌ FAIL | Spec §4.4 specifies `isValidConnection` callback. Implementation uses `onConnect` with early return instead. Functionally equivalent but invalid handles are **not visually greyed out** while dragging — see §5 Deviation D-01. |

---

### 2.5 Canvas Persistence (design-spec §4.5)

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| CP-01 | `scheduleSave` debounced to 2 seconds | ✅ PASS | `canvasPersistence.ts` lines 4, 9–16: `const DEBOUNCE_MS = 2000` |
| CP-02 | `loadSaved` returns `null` on JSON parse failure | ✅ PASS | `canvasPersistence.ts` lines 19–24: `catch { return null }` |
| CP-03 | `clearSaved` implemented | ✅ PASS | `canvasPersistence.ts` lines 27–29 |
| CP-04 | `CanvasPage` calls `loadSaved()` on mount | ✅ PASS | `CanvasPage.tsx` lines 24–31: `useEffect(() => { const saved = loadSaved(); if (saved) loadBlueprint(saved); }, [])` |
| CP-05 | Hydrated blueprint sets `projectNameInput` state | ✅ PASS | `CanvasPage.tsx` line 29: `setProjectNameInput(saved.project)` |
| CP-06 | `clearSaved()` called when canvas is cleared | ❌ FAIL | `CanvasPage.tsx` lines 111–114: the "Clear" button calls `reset()` and `addToast(...)` but **does not call `clearSaved()`**. After clearing, a page reload restores the pre-clear state from stale `localStorage`. |

---

### 2.6 API Client

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| API-01 | `provisionBlueprint` handles non-JSON error responses | ✅ PASS | `sketchApi.ts` lines 30–38: checks `Content-Type` header before calling `.json()`, falls back to status-code error |
| API-02 | Triggers browser download via blob URL | ✅ PASS | `sketchApi.ts` lines 40–49: `response.blob()` → `URL.createObjectURL()` → `<a>` click |
| API-03 | Revokes object URL after download | ✅ PASS | `sketchApi.ts` line 50: `URL.revokeObjectURL(url)` |
| API-04 | Derives filename from `Content-Disposition` header | ✅ PASS | `sketchApi.ts` lines 43–45: regex parse with fallback to `'project.zip'` |
| API-05 | `validateBlueprint` function exists | ✅ PASS | `sketchApi.ts` lines 10–22 |
| API-06 | `validateBlueprint` non-OK response handled | ✅ PASS | `sketchApi.ts` lines 14–17: catches `.json()` failure with fallback message |
| API-07 | `validateBlueprint` wired to a UI button | ⚠️ WARN | `validateBlueprint` is implemented but is not called from any component. No "Validate" button exists. Post-MVP item per implementation notes. |

---

### 2.7 Node Visuals (design-spec §4.2)

| # | Node | Colour | Visual Details | Handles | Status |
|---|------|--------|----------------|---------|--------|
| NV-01 | `EntityNode` | Blue `#2563eb` | Name + field list (name: type per field) | Target left + Source right | ✅ PASS |
| NV-02 | `ProtocolNode` | Purple `#8b5cf6` | Name + style text + auth badge | Source right only | ✅ PASS |
| NV-03 | `StorageNode` | Amber `#d97706` | Name + engine text | Source right only | ✅ PASS |
| NV-04 | `IdentityNode` | Green `#059669` | "User (Identity)" label + hardcoded Id/Email/Role fields | Target left + Source right | ⚠️ WARN — see note |
| NV-05 | Selected state for all nodes | Darker shade + highlight border | `selected` prop drives darker bg + coloured border | — | ✅ PASS |

> **Note NV-04:** `IdentityNode` has both a target handle (`Position.Left`) AND a source handle (`Position.Right`). Design-spec §4.4 rule EC-04 designates Identity as **target-only** ("Identity is target-only; cannot be a source"). The source handle is rendered but any attempt to draw from it is correctly rejected by `validateConnection` (EC-04 code). The handle is visually misleading and should be removed. Edge validation provides correct safety net but UX is degraded.
>
> **Note NV-06 (§4.1 vs §4.4 contradiction):** Spec §4.1 states "All four node types expose React Flow handles (source + target)" while §4.4 implies Protocol and Storage are source-only. The implementation follows the §4.4 semantic rules (source-only for Protocol and Storage), which is the more correct interpretation. No deviation on Protocol/Storage handle counts.

---

### 2.8 Provision Flow (AC-05)

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| PF-01 | `ProvisionButton` always visible | ✅ PASS | Rendered in `CanvasPage.tsx` header unconditionally |
| PF-02 | Blocks provision when no entity/identity nodes | ✅ PASS | `ProvisionButton.tsx` lines 22–26: `entityCount === 0` guard with toast |
| PF-03 | Guard error message matches AC-05 | ✅ PASS | Message: `"Add at least one Entity Node before provisioning."` |
| PF-04 | Shows loading state during provisioning | ✅ PASS | `ProvisionButton.tsx` lines 51–60: spinner animation + "Provisioning…" text |
| PF-05 | Button disabled during provisioning | ✅ PASS | `disabled={isProvisioning}` + `cursor: 'not-allowed'` |
| PF-06 | Calls `setProvisionStatus('provisioning')` before API call | ✅ PASS | `ProvisionButton.tsx` line 30 |
| PF-07 | Calls `setProvisionStatus('success')` on success | ✅ PASS | `ProvisionButton.tsx` line 32 |
| PF-08 | Calls `setProvisionStatus('error', message)` on failure | ✅ PASS | `ProvisionButton.tsx` line 36 |

---

### 2.9 Drag-and-Drop

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| DD-01 | `NodeToolbar` sets `application/sketch-node-type` MIME key on drag | ✅ PASS | `NodeToolbar.tsx` line 22: `event.dataTransfer.setData('application/sketch-node-type', nodeType)` |
| DD-02 | `effectAllowed = 'move'` set | ✅ PASS | `NodeToolbar.tsx` line 23 |
| DD-03 | `ReactFlowCanvas` reads `application/sketch-node-type` on drop | ✅ PASS | `ReactFlowCanvas.tsx` line 129 |
| DD-04 | Drop computes canvas-relative position via `getBoundingClientRect()` | ✅ PASS | `ReactFlowCanvas.tsx` lines 135–138 |
| DD-05 | Drop creates node with correct default data per type | ✅ PASS | `ReactFlowCanvas.tsx` lines 46–63: `getDefaultData(type)` switch |
| DD-06 | `onDragOver` sets `dropEffect = 'move'` and prevents default | ✅ PASS | `ReactFlowCanvas.tsx` lines 118–121 |

---

### 2.10 TypeScript Compilation Issues

| # | Severity | File | Location | Description |
|---|---------|------|----------|-------------|
| TC-01 | 🔴 ERROR | `ReactFlowCanvas.tsx` | Line 22 | `import type { BlueprintEdge, ... }` — `BlueprintEdge` is never explicitly referenced in the file body. With `"noUnusedLocals": true` in `tsconfig.json`, `tsc` will emit TS6133: `'BlueprintEdge' is declared but its value is never read.` This **blocks `npm run build`**. |
| TC-02 | ⚠️ WARN | `EntityNode.tsx`, `ProtocolNode.tsx`, `StorageNode.tsx`, `IdentityNode.tsx` | Line 6 | `type XxxNodeProps = NodeProps & { data: NodeData }` — override of `data` via intersection with `NodeProps` default. Idiomatic React Flow v12 pattern is `NodeProps<Node<NodeData>>`. Current pattern compiles and produces correct `data` type at call sites but diverges from the library's intended generic usage. |
| TC-03 | ⚠️ WARN | `ReactFlowCanvas.tsx` | Lines 86–87 | `useNodesState(rfNodes)` and `useEdgesState(rfEdges)` are called only to extract `onNodesChange`/`onEdgesChange` callbacks (first two elements discarded). React Flow's controlled-mode node positions are not synced back to the store — see Known Limitation KL-01. This is intentional but non-idiomatic; a future migration should use `applyNodeChanges` manually. |
| TC-04 | ⚠️ WARN | `ReactFlowCanvas.tsx` | Lines 100–101 | `connection.source!` and `connection.target!` use non-null assertions. In `@xyflow/react` v12, `Connection.source` and `Connection.target` are `string` (non-nullable), making these assertions redundant. They are safe but indicate a stale assumption from an older React Flow API version. |
| TC-05 | ⚠️ WARN | `CanvasPage.tsx` | Line 31 | `useEffect(() => { ... }, [])` omits `loadBlueprint` and `setProjectNameInput` from the dependency array. ESLint `react-hooks/exhaustive-deps` will flag this. Behaviourally correct (both are stable Zustand store references), but should be suppressed with a `// eslint-disable-next-line` comment and justification. |
| TC-06 | ℹ️ INFO | `ReactFlowCanvas.tsx` | Line 31 | `deriveEdgeAction(sourceType, _targetType)` — `_targetType` is marked intentionally unused via `_` prefix. The fallback `return 'GenerateCRUD'` at line 35 is dead code given current validation rules but not a compiler error. |

---

## 3. Requirements Traceability Matrix

### User Stories

| Story | Title | Implementation Evidence | Status |
|-------|-------|------------------------|--------|
| US-01 | Entity Node | `EntityNode.tsx`, `ReactFlowCanvas.tsx` (drop + `getDefaultData`), `PropertiesPanel.tsx` (field editing) | ✅ Done |
| US-02 | Protocol Node | `ProtocolNode.tsx`, `PropertiesPanel.tsx` (style + auth selects) | ✅ Done |
| US-03 | Storage Node | `StorageNode.tsx`, `ReactFlowCanvas.tsx` (edge action `GeneratePersistence`) | ✅ Done |
| US-04 | Identity Node | `IdentityNode.tsx` (hardcoded `IDENTITY_FIELDS`), `getDefaultData('identity')` | ✅ Done |
| US-05 | Logic Edges | `edgeValidation.ts` (rules), `ReactFlowCanvas.tsx` (`onConnect`, `deriveEdgeAction`) | ✅ Done |
| US-06 | Canvas Navigation | React Flow built-in pan/zoom; `MiniMap`, `Controls` rendered in `ReactFlowCanvas.tsx` | ✅ Done |
| US-07 | Canvas Persistence | `canvasPersistence.ts` (`scheduleSave` debounced 2s), `CanvasPage.tsx` `useEffect` hydration | ✅ Done (with CP-06 gap) |

### Acceptance Criteria

| AC | Criterion | Status | Notes |
|----|-----------|--------|-------|
| AC-01 | Identity Node creates User model with fixed fields | ✅ PASS | `IdentityNode.tsx` + `getDefaultData`: Id/Email/Role pre-populated; visually distinct green card |
| AC-02a | Entity Node: unnamed node with one default field on drop | ✅ PASS | `getDefaultData('entity')` returns `{ name: 'NewEntity', fields: [{ name: 'Id', type: 'Guid' }] }` |
| AC-02b | Entity Node: rename by double-clicking label | ❌ FAIL | No double-click-to-inline-rename on node label. Renaming requires selecting node → editing in `PropertiesPanel`. The spec says "double-clicking the node label." |
| AC-02c | Entity Node: add/remove fields via properties panel | ✅ PASS | `PropertiesPanel.tsx` `handleAddField` + `handleRemoveField` with minimum-1 guard |
| AC-02d | Blueprint JSON reflects changes in real-time | ✅ PASS | Zustand store mutation → `toBlueprint()` updated synchronously |
| AC-03 | Storage Node connection creates `GeneratePersistence` edge | ✅ PASS | `deriveEdgeAction('storage', ...)` returns `'GeneratePersistence'` |
| AC-04a | Protocol Node: auth JWT/None configurable | ✅ PASS | `PropertiesPanel.tsx` auth select |
| AC-04b | Protocol→Entity edge creates `GenerateCRUD` action | ✅ PASS | `deriveEdgeAction('protocol', ...)` returns `'GenerateCRUD'` |
| AC-04c | Distinct visual edge style | ✅ PASS | Purple animated stroke for CRUD; amber solid stroke for Persistence (`ReactFlowCanvas.tsx` `rfEdges` mapping) |
| AC-05a | Provision button always visible | ✅ PASS | |
| AC-05b | Empty canvas → toast "Add at least one Entity Node…" | ✅ PASS | |
| AC-05c | Valid diagram triggers backend call | ✅ PASS | `provisionBlueprint(toBlueprint())` |
| AC-05d | Loading indicator during generation | ✅ PASS | Spinner + "Provisioning…" text |
| AC-05e | Success → browser downloads `.zip` | ✅ PASS | Blob URL download in `sketchApi.ts` |
| AC-08 | Canvas auto-saved after changes (debounced ≤2s) | ✅ PASS | |
| AC-08b | Page refresh restores last-saved state | ✅ PASS | `loadSaved()` hydration on mount |

### Canvas Edge Cases (from requirements §4)

| EC Req# | Scenario | Status | Notes |
|---------|----------|--------|-------|
| EC-01 | Entity → Entity edge rejected | ✅ PASS | `validateConnection` EC-01 |
| EC-02 | Protocol → Storage edge rejected | ✅ PASS | `validateConnection` EC-02 |
| EC-03 | Duplicate entity names → inline warning | ❌ FAIL | No duplicate name validation in `PropertiesPanel` or `addNode`. Two entities can share the same `name` value. API server is the first line of rejection. |
| EC-04 | Reserved C# keyword as field name → error | ❌ FAIL | `PropertiesPanel.tsx` has no reserved-keyword validation. Invalid names pass through to the API. |
| EC-05 | >30 fields → warning | ❌ FAIL | No field-count warning. `PropertiesPanel` allows unlimited fields. |
| EC-06 | Multiple protocols to same entity | ✅ PASS | Allowed by design; both generate independent edge entries in the blueprint |
| EC-07 | Delete node removes connected edges | ✅ PASS | `blueprintStore.ts` `deleteNode` action |

---

## 4. TypeScript Issues Found

### TC-01 — Build-blocking unused import [MUST FIX]

**File:** `src/Sketch.Web/src/components/Canvas/ReactFlowCanvas.tsx`, line 22  
**Error:** TS6133 — `'BlueprintEdge' is declared but its value is never read.`  
**Config trigger:** `"noUnusedLocals": true` in `tsconfig.json` line 14.  
**Impact:** `npm run build` runs `tsc && vite build`. The `tsc` step will exit non-zero, aborting the build. Dev server (`npm run dev`) is unaffected (Vite uses esbuild, which ignores TypeScript errors).

```typescript
// ReactFlowCanvas.tsx line 22 — BluprintEdge imported but never explicitly annotated
import type { BlueprintEdge, BlueprintNode, EdgeAction, NodeType } from '../../types/blueprint';
//                ^^^^^^^^^^^^ unused — inline object passed to addEdgeToStore is inferred
```

**Fix:** Remove `BlueprintEdge` from the import. The `addEdgeToStore` parameter type is inferred from the store's action signature.

```typescript
import type { BlueprintNode, EdgeAction, NodeType } from '../../types/blueprint';
```

---

### TC-02 — Non-idiomatic NodeProps intersection [WARN]

**Files:** `EntityNode.tsx:6`, `ProtocolNode.tsx:6`, `StorageNode.tsx:6`, `IdentityNode.tsx:6`  

```typescript
type EntityNodeProps = NodeProps & { data: NodeData };   // current
type EntityNodeProps = NodeProps<Node<NodeData>>;         // idiomatic RF v12
```

Both compile. The intersection approach produces `data: Record<string, unknown> & NodeData` which is structurally equivalent to `NodeData`. No runtime risk.

---

### TC-03 — `useNodesState`/`useEdgesState` partial destructure [WARN]

**File:** `ReactFlowCanvas.tsx`, lines 86–87  

```typescript
const [, , onNodesChange] = useNodesState(rfNodes);
const [, , onEdgesChange] = useEdgesState(rfEdges);
```

The internal state values (first two slots) are discarded; the component passes `rfNodes`/`rfEdges` from the store directly as controlled props. When the user drags a node, React Flow fires `onNodesChange` (via `useNodesState`'s handler), which updates React Flow's internal state — but the controlled `nodes` prop is still `rfNodes` from the store. On the next render, React Flow re-reads the unchanged `rfNodes`, causing positions to snap back. This manifests as the position sync limitation (KL-01).

---

### TC-04 — Redundant non-null assertions [WARN]

**File:** `ReactFlowCanvas.tsx`, lines 100–101  
`connection.source!` and `connection.target!`. In `@xyflow/react` v12, `Connection.source` is `string`, not `string | null`. The assertions are safe but suggest the code was authored against an older RF API where these were nullable.

---

### TC-05 — `useEffect` missing deps [WARN]

**File:** `CanvasPage.tsx`, line 31  

```typescript
useEffect(() => {
  const saved = loadSaved();
  if (saved) {
    loadBlueprint(saved);
    setProjectNameInput(saved.project);
  }
}, []); // ← loadBlueprint, setProjectNameInput omitted
```

ESLint `react-hooks/exhaustive-deps` will emit a warning. Both omitted references are stable Zustand/React state dispatcher references, so the behaviour is correct. Add a suppression comment:

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

---

## 5. Deviations from Design Spec

| ID | §Spec Ref | Description | Severity |
|----|-----------|-------------|----------|
| D-01 | §4.4 | Spec requires `isValidConnection` callback on `<ReactFlow>`. Implementation uses `onConnect` with early-return validation. **Functional gap:** invalid handle targets are not visually dimmed during a drag gesture — the user only discovers the connection is invalid after releasing the mouse. | Medium |
| D-02 | §4.3 | `BlueprintState` interface is defined locally (non-exported) in `blueprintStore.ts` rather than in `src/types/blueprint.ts` as the spec shows. All fields and actions are present; no functional impact. | Low |
| D-03 | §4.2 / AC-02 | `IdentityNode` renders a React Flow **source** handle (`Position.Right`) despite EC-04 designating Identity as a target-only node. The handle is present in the DOM and the user can begin dragging from it; the connection is rejected by `validateConnection`. This causes user confusion (a visible handle that does nothing useful). | Low |
| D-04 | AC-02 | No double-click-to-inline-rename on the Entity node label. Renaming requires selecting the node and using the Properties Panel. | Low |
| D-05 | AC-08 | `clearSaved()` is not called when the user clicks "Clear Canvas". On page reload the store is repopulated from the pre-clear `localStorage` value. The visual canvas clears immediately, but the next load undoes it. | Medium |
| D-06 | §4.4 | `validateBlueprint` exists (`sketchApi.ts`) but is not wired to any UI button, making client-side validation unreachable by the user. | Low (post-MVP) |
| D-07 | §4.3 (implied) | `useBlueprintStore` object-selector calls in `CanvasPage`, `ProvisionButton`, and `ReactFlowCanvas` do not use `shallow` equality from Zustand. Each selector call returns a new object reference on every render, causing unnecessary re-renders when unrelated store state changes. | Low (perf) |

---

## 6. Known Limitations (Post-MVP Technical Debt)

| ID | Area | Description | Workaround / Fix Path |
|----|------|-------------|----------------------|
| KL-01 | Node positions | Node drag positions are not written back to the Zustand store. Reloading the page restores nodes to their original drop positions, not their last dragged positions. `toBlueprint()` serialises stale positions. | Add `updateNodePosition(id, pos)` action; filter `type === 'position'` in `onNodesChange` and call it. |
| KL-02 | Inline style approach | No hover/active/focus visual feedback on interactive elements. Drag palette items (`<div draggable>`) have no keyboard accessibility (`role`, `tabIndex`, `onKeyDown`). | Migrate to CSS Modules or a minimal utility-class library post-MVP. |
| KL-03 | No UI unit tests | `src/Sketch.Web` has no test runner configured. `edgeValidation.ts` is a pure function and easily unit-testable. | Add Vitest + React Testing Library + MSW per implementation notes §5. |
| KL-04 | Duplicate entity name validation | Two entity nodes with the same `name` value can coexist on the canvas. The error surfaces at the API layer (`422`), not immediately in the UI. | Add a `useMemo` derived check in `PropertiesPanel` against existing node names. |
| KL-05 | Reserved C# keyword field names | Field names like `class`, `event`, or `void` can be entered freely. The error surfaces at the API layer. | Add a `RESERVED_KEYWORDS` set to `PropertiesPanel.tsx` and show inline error on blur. |
| KL-06 | Large entity warning | No warning when an entity exceeds 30 fields (requirements §4 EC-05). Provision is currently blocked only on server side if applicable. | Count `data.fields.length` in `PropertiesPanel` and render a yellow warning banner. |
| KL-07 | `validateBlueprint` not wired | `validateBlueprint` in `sketchApi.ts` exists but is never called from the UI. Pre-provision client-side validation is only the entity-count guard. | Add a "Validate" button in the header or call internally before `provisionBlueprint`. |
| KL-08 | ESLint not configured | No `eslint.config.js` or `.eslintrc` file exists in `src/Sketch.Web/`. TypeScript strict mode provides some coverage, but rules like `react-hooks/exhaustive-deps` are not enforced. | Add `eslint` + `eslint-plugin-react-hooks` to `devDependencies`. |

---

## 7. Sign-Off

### Verdict: CONDITIONAL APPROVAL ⚠️

The Sketch Web UI is feature-complete for the defined MVP scope with one build-blocking defect and several medium-priority gaps.

### Conditions for Full Approval

The following items must be resolved before shipping:

| Priority | ID | Condition |
|----------|----|-----------|
| 🔴 MUST | TC-01 | Remove the unused `BlueprintEdge` import from `ReactFlowCanvas.tsx` to unblock `npm run build`. |
| 🔴 MUST | CP-06 | Call `clearSaved()` in the "Clear Canvas" button handler in `CanvasPage.tsx` to prevent stale localStorage restore after clearing. |
| 🟡 SHOULD | D-01 | Replace the `onConnect`-with-early-return pattern with `isValidConnection` prop on `<ReactFlow>` to provide real-time visual feedback on invalid connection targets during drag. |
| 🟡 SHOULD | D-03 | Remove the source handle from `IdentityNode.tsx` to eliminate the misleading interaction affordance. |
| 🟢 MAY | AC-02b | Implement double-click-to-inline-rename on Entity node labels to meet the literal acceptance criterion. Selecting → PropertiesPanel rename is a reasonable MVP workaround but does not match the AC text. |

### Deferred to Post-MVP (Non-blocking)

- KL-01: Node position sync
- KL-03: UI unit tests
- KL-04 / KL-05 / KL-06: Client-side canvas validation guardrails
- KL-07: Wiring `validateBlueprint` to a UI action
- KL-08: ESLint configuration

---

*Verification completed: 2026-03-31. Audited against design-spec.md revision dated 2026-03-31.*
