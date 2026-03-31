# Sketch Web UI — Implementation Notes

## 1. Code Structure

### Project Root (`src/Sketch.Web/`)

| File | Description |
|------|-------------|
| `index.html` | Vite HTML entry point; mounts `#root` and loads `src/main.tsx` |
| `package.json` | NPM manifest; declares React 19, @xyflow/react 12, zustand 5, immer 10, Vite 6 |
| `tsconfig.json` | TypeScript config targeting ES2020, `bundler` module resolution, strict mode |
| `vite.config.ts` | Vite config with React plugin and `/api` proxy to `http://localhost:5000` |

### Source (`src/Sketch.Web/src/`)

| File | Description |
|------|-------------|
| `main.tsx` | React 19 `createRoot` entry; wraps `<App>` in `<StrictMode>` |
| `App.tsx` | Root component; wraps `<CanvasPage>` in `<ReactFlowProvider>` |
| `App.css` | Minimal global reset (box-sizing, margin); all component styles are inline |

### Types (`src/types/`)

| File | Description |
|------|-------------|
| `blueprint.ts` | All domain TypeScript types: `Blueprint`, `BlueprintNode`, `BlueprintEdge`, `NodeData`, `FieldDefinition`, and all enums as string union types |

### Store (`src/store/`)

| File | Description |
|------|-------------|
| `blueprintStore.ts` | Zustand + immer store; holds nodes, edges, projectName, selectedNodeId, provisionStatus; exposes CRUD actions and a `toBlueprint()` selector; subscribes to self for auto-save |

### Persistence (`src/persistence/`)

| File | Description |
|------|-------------|
| `canvasPersistence.ts` | `scheduleSave` (debounced 2 s localStorage write), `loadSaved` (hydration on boot), `clearSaved` |

### Utils (`src/utils/`)

| File | Description |
|------|-------------|
| `edgeValidation.ts` | Pure `validateConnection()` function; enforces all EC-00 through EC-99 edge rules; returns `{ valid, code, reason }` |

### API (`src/api/`)

| File | Description |
|------|-------------|
| `sketchApi.ts` | `validateBlueprint()` — POST `/api/validate`; `provisionBlueprint()` — POST `/api/provision`, handles blob download via anchor click |

### Components (`src/components/`)

| File | Description |
|------|-------------|
| `Nodes/EntityNode.tsx` | Blue card; renders name + field list; target+source handles |
| `Nodes/ProtocolNode.tsx` | Purple card; renders name, style badge, auth badge; source handle only |
| `Nodes/StorageNode.tsx` | Amber card; renders name, engine; source handle only |
| `Nodes/IdentityNode.tsx` | Green card; fixed User/Id/Email/Role fields; target+source handles |
| `NodeToolbar/NodeToolbar.tsx` | Left-side drag palette; HTML5 drag API sets `application/sketch-node-type` payload |
| `PropertiesPanel/PropertiesPanel.tsx` | Right slide-in panel; renders node-type-specific form controls; add/remove fields for entity nodes |
| `ProvisionButton/ProvisionButton.tsx` | Sky-blue CTA button; guards on empty canvas; calls `provisionBlueprint`; shows spinner during flight |
| `Toast/ToastNotifications.tsx` | Module-level singleton `addToast()` function; auto-dismisses after 4 s |
| `Canvas/ReactFlowCanvas.tsx` | Main React Flow instance; registers custom nodeTypes; handles onDrop, onConnect (with validation), onEdgesDelete |

### Pages (`src/pages/`)

| File | Description |
|------|-------------|
| `CanvasPage.tsx` | Top-level layout; header bar with project name (editable inline) + Clear + Provision; three-column body (toolbar / canvas / properties panel); hydrates from localStorage on mount |

---

## 2. Technical Decisions

### Vite over CRA / Next.js
Vite 6 provides near-instant HMR and sub-second cold starts. No SSR is needed for a local desktop-class IDE tool, so Next.js overhead is unwarranted. CRA is deprecated.

### Inline styles (no Tailwind / CSS Modules)
The spec explicitly requests inline styles for _portability_ — zero build-time CSS toolchain dependency means the project works immediately after `npm install` with no PostCSS configuration. The tradeoff (no hover states, no dark-mode media queries) is acceptable for an MVP.

### `ReactFlowProvider` wraps everything at App level
React Flow's internal context (viewport, node registry, edge state) must be available to every child. Wrapping at `App` rather than inside `ReactFlowCanvas` allows future panels or modals to call `useReactFlow()` without nesting another provider.

### localStorage persistence uses debounce (2 s)
Zustand's `subscribe` fires on every state mutation. Writing to `localStorage` synchronously on every keystroke (e.g. editing a field name) would hammer serialisation unnecessarily. A 2-second debounce batches rapid changes into a single write while still providing durable recovery after unexpected tab/browser close.

### `immer` middleware for Zustand
Immer enables the familiar mutable-style draft mutations inside Zustand actions. This eliminates manual spread-cloning of nested objects (`node.data.fields`) and makes the reducer logic significantly more readable.

---

## 3. State Architecture

### Zustand + immer store (`blueprintStore.ts`)

The store is the **single source of truth** for all canvas state:

```
BlueprintState
├── nodes: BlueprintNode[]        ← domain nodes (not RF nodes)
├── edges: BlueprintEdge[]        ← domain edges (not RF edges)
├── projectName: string
├── selectedNodeId: string | null
├── provisionStatus: ProvisionStatus
└── provisionError: string | null
```

Actions are kept at the store level; components call them via selectors. The store never holds React Flow internal state (viewport, handles, etc.) — only domain data that maps to the API `Blueprint` schema.

### Auto-save `subscribe` pattern

```ts
useBlueprintStore.subscribe((state) => {
  scheduleSave(state.toBlueprint());
});
```

`subscribe` receives the full new state on every mutation. `toBlueprint()` is a plain function (not a selector) that reads `get()` at call time, so this pattern is safe even with immer proxies. The debounce in `scheduleSave` prevents redundant writes.

### `toBlueprint()` as a derived value
Rather than storing a serialised `Blueprint` in state, `toBlueprint()` computes it on demand. This keeps the store lean and avoids double-write consistency bugs.

---

## 4. React Flow Integration

### Custom `nodeTypes` registration
```ts
const nodeTypes = {
  entity: EntityNode,
  protocol: ProtocolNode,
  storage: StorageNode,
  identity: IdentityNode,
};
```
Registered outside the component to prevent React Flow from re-registering on every render (which would unmount/remount all node DOM elements).

### Store → RF Node conversion
React Flow requires its own `Node<TData>` shape with `id`, `type`, `position`, and `data`. The canvas reads `storeNodes` and maps them to `rfNodes` on every render. This is intentional: the store owns positions and data; RF owns visual selection/drag state.

### Drag-and-drop from NodeToolbar
1. `NodeToolbar` sets `event.dataTransfer.setData('application/sketch-node-type', nodeType)` on `dragstart`.
2. `ReactFlowCanvas.onDrop` reads that MIME key, computes canvas coordinates relative to the wrapper's `getBoundingClientRect()`, and calls `addNode` on the store.
3. Position is calculated as `clientX - wrapperLeft - 80` to center the dropped node roughly under the cursor.

### Edge validation
`onConnect` calls `validateConnection(connection, storeNodes)` before creating an edge. If invalid, `addToast` fires the error message and the function returns early — React Flow never sees the edge. Valid edges are pushed directly to the store (not via RF's `addEdge` helper) so the store remains the sole owner.

### `onNodesChange` / `onEdgesChange`
These handlers are wired to keep React Flow's internal visual state in sync (e.g. selection highlight, edge hover). They do **not** write back to the Zustand store — see Known Limitations.

---

## 5. Known Limitations / Post-MVP

### Node position sync
When a user drags a node on the canvas, React Flow updates its internal position state via `onNodesChange`. However, the Zustand store is **not** updated with the new position. This means:
- After a page reload, nodes snap back to their initial drop positions.
- `toBlueprint()` serialises the original drop positions, not the current visual positions.

**Fix:** In `onNodesChange`, filter for `type === 'position'` change events and call `useBlueprintStore.getState().updateNodePosition(id, position)` (a new action to add).

### Inline style approach
No hover/active pseudo-class styles are achievable with inline styles. Interactive elements (buttons, drag items) lack visual feedback on hover. Post-MVP, migrate to CSS Modules or a utility-class library.

### No unit tests for UI
The `src/Sketch.Web` project has no test setup. Post-MVP additions:
- Vitest + React Testing Library for component unit tests
- Edge validation unit tests (pure function, easily testable)
- MSW (Mock Service Worker) for API integration tests

### `useEffect` exhaustive-deps warning
`CanvasPage` uses `useEffect(() => { ... }, [])` with `loadBlueprint` and `setProjectNameInput` omitted from the deps array. These are stable store references, so the behaviour is correct, but ESLint's `react-hooks/exhaustive-deps` rule will flag it. Post-MVP: wrap with `useCallback` or use `eslint-disable` comment with justification.

### No keyboard accessibility
Drag-and-drop palette items are `<div draggable>` elements, not buttons with keyboard handlers. Post-MVP: add `role="button"`, `tabIndex={0}`, and `onKeyDown` to support keyboard-driven node creation.

---

## 6. How to Run

### Prerequisites
- Node.js 20+
- The backend API running at `http://localhost:5000` (see `src/Sketch.API`)

### Start the frontend dev server
```bash
cd src/Sketch.Web
npm install
npm run dev
```

The app will be available at `http://localhost:5173`. All `/api/*` requests are proxied to `http://localhost:5000`.

### Build for production
```bash
npm run build
```

Output is written to `src/Sketch.Web/dist/`. Serve with `npm run preview` or any static file server.

### Start the backend (separate terminal)
```bash
cd src/Sketch.API
dotnet run
```
