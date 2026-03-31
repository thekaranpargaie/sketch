# Requirements: Sketch MVP — "Sketch-to-CRUD"

**Feature Name:** Sketch Phase 1 MVP  
**Sub-Agent:** Strategist  
**Status:** Draft  
**Date:** 2026-03-31  
**Owner:** TBD  

---

## 1. Problem Statement & User Value

### Problem

Every new .NET project begins the same way: create solution, add projects, wire up DI, configure EF Core, scaffold controllers, write migrations — all before a single line of business logic is written. For experienced engineers, this is 3–6 hours of mechanical, error-prone repetition per project. For teams, it introduces inconsistency in project structure, naming conventions, and architecture layering.

Existing tooling (`dotnet new`, Visual Studio templates, Copilot) is **additive and file-centric** — the engineer still thinks in files, not architecture. There is no tool that lets you design the system first as a diagram and receive production-ready scaffolding as output.

### User Value

**Sketch** eliminates Boilerplate Fatigue by making the architectural diagram the source of truth. The MVP delivers:

- **Time recoverd:** First 4 hours of project setup automated to ~10 minutes.
- **Consistency:** Every generated solution follows Clean Architecture conventions with the same layering, DI patterns, and EF Core setup.
- **Confidence:** Engineers receive a buildable `.zip` they can open in any IDE immediately — no configuration required.
- **Clarity:** The visual canvas communicates system architecture to all stakeholders, not just the engineer who built it.

### Target Users

| Persona | Description |
|---|---|
| **Solo .NET Engineer** | Starting a greenfield project, wants to skip boilerplate and reach business logic fast |
| **Tech Lead** | Standardizing project scaffolding across a team, needs reproducible architecture decisions |
| **Architect** | Communicating system design visually to non-engineers; generating an initial scaffold to hand off |

---

## 2. User Stories

### Epic: Canvas Interaction (The Designer)

**US-01** — Entity Node  
As a .NET engineer, I want to drag an Entity Node onto the canvas and define its name and typed fields, so that Sketch knows what C# model to generate.

**US-02** — Protocol Node  
As a .NET engineer, I want to drag a Protocol Node (REST) onto the canvas and configure its authentication style, so that Sketch knows what kind of API layer to generate.

**US-03** — Storage Node  
As a .NET engineer, I want to drag a Storage Node (SQL Server) onto the canvas and link it to an Entity Node, so that Sketch knows which persistence infrastructure to generate.

**US-04** — Identity Node (first-class shortcut)  
As a .NET engineer, I want to drag a pre-configured Identity Node onto the canvas, so that a `User` entity with `Id`, `Email`, and `Role` fields is created without manual configuration.

**US-05** — Logic Edges  
As a .NET engineer, I want to draw an edge from a Protocol Node to an Entity Node, so that Sketch understands that CRUD endpoints should be generated for that entity.

**US-06** — Canvas Navigation  
As a .NET engineer, I want to pan, zoom, and rearrange nodes freely on an infinite canvas, so that I can organise complex architectures without running out of space.

**US-07** — Canvas Persistence  
As a .NET engineer, I want my canvas state to be auto-saved as a `blueprint.sketch` file, so that I can close and reopen Sketch without losing my diagram.

---

### Epic: Scaffolding Engine (The Engine)

**US-08** — Clean Architecture Scaffold  
As a .NET engineer, I want the generated solution to follow Clean Architecture (Domain, Application, Infrastructure, API layers), so that my project has an industry-standard, maintainable structure from day one.

**US-09** — EF Core Generation  
As a .NET engineer, I want EF Core `DbContext` and an initial migration to be generated when I connect an Entity Node to a Storage Node, so that I have a working database layer without writing boilerplate.

**US-10** — CRUD Controller Generation  
As a .NET engineer, I want full CRUD controllers with Swagger/OpenAPI annotations to be generated when I connect a REST Protocol Node to an Entity Node, so that I have a working API with documentation immediately.

**US-11** — Dependency Injection Wiring  
As a .NET engineer, I want `Program.cs` to be pre-wired with all required services (DbContext, repositories, validators), so that the generated solution compiles and runs without any manual DI configuration.

**US-12** — FluentValidation Generation  
As a .NET engineer, I want FluentValidation rules to be scaffolded based on Entity field types (e.g., `Required` for `Email`, range constraints for numeric fields), so that I have input validation logic from the start.

**US-13** — JWT Authentication Scaffolding  
As a .NET engineer, I want JWT-based authentication middleware scaffolded automatically when a Protocol Node has `auth: JWT` set, so that my API is secured without writing auth boilerplate.

---

### Epic: Provision & Download

**US-14** — Provision Action  
As a .NET engineer, I want to click a single "Provision" button, so that all scaffolding is triggered and a downloadable `.zip` is generated.

**US-15** — Buildable Output  
As a .NET engineer, I want the downloaded `.zip` to contain a .NET 10 solution that builds successfully with `dotnet build`, so that I can start working immediately without debugging scaffolding errors.

**US-16** — Blueprint Export  
As a .NET engineer, I want the `.zip` to include the `blueprint.sketch` file that produced it, so that I can reopen the diagram later and continue evolving the architecture.

---

### Epic: Live Sync (The Watcher) — MVP Stretch Goal

**US-17** — File Watcher CLI  
As a .NET engineer, I want a background CLI process to watch my `blueprint.sketch` file and regenerate modified C# files when the diagram changes, so that my local codebase stays in sync with the canvas without re-downloading.

**US-18** — Non-Destructive Sync  
As a .NET engineer, I want the Live Sync watcher to only regenerate scaffolded files (not files I have manually edited), so that my custom business logic is never overwritten.

---

## 3. Acceptance Criteria

### AC-01: Identity Node creates User model

- [ ] Dragging an Identity Node onto the canvas renders a node labelled "User" with pre-populated fields: `Id` (Guid), `Email` (string), `Role` (enum).
- [ ] The fields are visible on the node card on the canvas.
- [ ] The blueprint JSON is updated immediately to include the Identity Node entry with correct field definitions.
- [ ] The Identity Node is visually distinct from generic Entity Nodes.

### AC-02: Entity Node — custom model

- [ ] Dragging an Entity Node onto the canvas creates an unnamed node with one default field (`Id: Guid`).
- [ ] The user can rename the entity by double-clicking the node label.
- [ ] The user can add fields with a name and a type (string, int, decimal, bool, Guid, DateTime, enum) via the node properties panel.
- [ ] The user can delete fields (minimum 1 field must remain).
- [ ] Blueprint JSON reflects all changes in real-time.

### AC-03: Storage Node — SQL Server connection

- [ ] Dragging a SQL Server Storage Node onto the canvas creates a labelled storage node.
- [ ] Drawing an edge from a Storage Node to an Entity Node is visually indicated (coloured connector).
- [ ] The blueprint JSON edge entry is created with `"action": "GeneratePersistence"`.
- [ ] Connecting a Storage Node to an Entity Node without a connected Protocol Node does NOT trigger CRUD generation.

### AC-04: REST Protocol Node → Entity edge triggers CRUD

- [ ] Dragging a REST Protocol Node onto the canvas creates a labelled protocol node.
- [ ] The user can set `auth: JWT` or `auth: None` on the Protocol Node properties panel.
- [ ] Drawing an edge from the REST Protocol Node to an Entity Node updates the blueprint edge with `"action": "GenerateCRUD"`.
- [ ] The canvas visually indicates the CRUD relationship with a distinct edge style.

### AC-05: Provision generates a buildable .zip

- [ ] The "Provision" button is always visible in the canvas toolbar.
- [ ] Clicking "Provision" when the canvas is empty returns an error toast: "Add at least one Entity Node before provisioning."
- [ ] Clicking "Provision" with a valid diagram triggers a call to the backend Engine API.
- [ ] A loading indicator is shown during generation (target: < 10 seconds for a single Entity).
- [ ] On success, the browser downloads a `.zip` file named `{ProjectName}.zip`.
- [ ] The `.zip` contains valid directory structure: `src/Domain/`, `src/Application/`, `src/Infrastructure/`, `src/API/`, `blueprint.sketch`.
- [ ] Running `dotnet build` on the extracted solution exits with code `0`.
- [ ] The `.zip` contains at least: one entity class, a `DbContext`, one CRUD controller, `Program.cs` with DI wiring, and a Swagger configuration.

### AC-06: Generated solution structure — Clean Architecture

- [ ] `Domain/` layer contains entity classes only — no EF Core or ASP.NET references.
- [ ] `Application/` layer contains service interfaces, DTOs, and FluentValidation validators.
- [ ] `Infrastructure/` layer contains `DbContext`, repository implementations, and EF Core migrations.
- [ ] `API/` layer contains controllers, `Program.cs`, `appsettings.json`, and Swagger configuration.
- [ ] No circular project references exist between layers.

### AC-07: JWT scaffolding (when `auth: JWT`)

- [ ] `Program.cs` includes `AddAuthentication().AddJwtBearer(...)` configuration.
- [ ] A placeholder `JwtSettings` section exists in `appsettings.json`.
- [ ] Generated controllers carry `[Authorize]` attribute.
- [ ] When `auth: None`, no authentication middleware is scaffolded.

### AC-08: Canvas persistence

- [ ] Canvas state is auto-saved to `blueprint.sketch` after every node/edge change (debounced, max 2 second delay).
- [ ] Refreshing the page restores the canvas to its last-saved state.
- [ ] `blueprint.sketch` conforms to the schema defined in Section 6.

### AC-09: Blueprint JSON schema validation

- [ ] The Engine API rejects blueprints missing required fields (`version`, `project`, `nodes`) with HTTP `400` and a descriptive error message.
- [ ] The Engine API rejects blueprints with unsupported node types with HTTP `422` and identifies the offending node `id`.
- [ ] The Engine API accepts the reference blueprint from the feature request and produces a valid output without errors.

### AC-10: Live Sync watcher (stretch)

- [ ] Running `sketch-watch --blueprint ./blueprint.sketch --output ./src` starts the watcher process.
- [ ] Modifying a field name on an Entity Node updates the corresponding C# class file within 3 seconds.
- [ ] Files containing a `// [user-edited]` comment at the top are skipped by the watcher.
- [ ] Stopping the watcher (Ctrl+C) exits cleanly with no orphan processes.

---

## 4. Edge Cases & Constraints

### Canvas Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| EC-01 | User draws an edge from Entity → Entity | Edge is rejected; a tooltip explains: "Direct entity-to-entity edges are not supported. Use a relationship edge instead." |
| EC-02 | User draws an edge from Protocol → Storage (no Entity) | Edge is rejected; a tooltip explains: "Protocol Nodes must connect to Entity Nodes." |
| EC-03 | User adds duplicate entity names | Second entity with same name shows an inline validation warning. Provision is blocked until resolved. |
| EC-04 | User adds a field with a reserved C# keyword as name (e.g., `class`, `void`) | Inline validation error shown immediately. Field cannot be saved. |
| EC-05 | User adds more than 30 fields to a single Entity Node | Warning shown: "Large entity detected. Consider splitting into related entities." Provision is still allowed. |
| EC-06 | User connects multiple Protocol Nodes to the same Entity Node | Each Protocol Node generates its own endpoint layer — both are included in the `.zip`. |
| EC-07 | User deletes a node that has existing edges | All edges connected to the deleted node are removed from the canvas and from the blueprint JSON. |

### Engine Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| EC-08 | Blueprint contains a node with an unknown `type` field | Scaffold fails with `422`; error message identifies the offending node ID. |
| EC-09 | Blueprint `project` name contains spaces or special characters | Engine sanitises the name (e.g., `My Project!` → `MyProject`) and includes the original name as a comment in `Program.cs`. |
| EC-10 | Two entities share the same field name with conflicting types | Engine scaffolds the field as-declared per entity; no merge is attempted. |
| EC-11 | Engine is unavailable during Provision | Frontend shows error: "Provisioning service is unavailable. Please try again." No partial `.zip` is downloaded. |
| EC-12 | Generated `.zip` exceeds 50 MB | Engine returns HTTP `413` with message: "Output too large. Reduce the number of entities or contact support." |

### Constraints

- **Target Runtime:** .NET 10 only for MVP. No multi-framework support.
- **Supported DB:** SQL Server only for MVP. PostgreSQL and Redis are post-MVP.
- **Supported Protocol:** REST only for MVP. gRPC and GraphQL are post-MVP.
- **Auth Options:** JWT or None. OAuth2/OIDC is post-MVP.
- **Max Entities per Blueprint:** 20 (MVP throttle to control generation time).
- **Blueprint Version:** Only `"version": "1.0"` is supported in MVP.
- **Browser Support:** Latest stable Chrome, Firefox, Edge. Safari is best-effort.
- **Output Language:** C# 13 (default with .NET 10). No VB.NET or F# support.
- **Template Engine:** RazorLight or T4 Templates (decision locked at design phase). Templates must be deterministic — same input always produces byte-identical output.
- **Live Sync:** Marked as MVP Stretch Goal. Must not block core Provision delivery.

---

## 5. Priority & Dependencies

### Feature Priority

| Story ID | Priority | Rationale |
|---|---|---|
| US-01 – US-07 | **P0 — Must Have** | Canvas interaction is the entire UX surface; MVP is non-functional without it |
| US-08 – US-11 | **P0 — Must Have** | Core scaffolding output; the product has no value without it |
| US-12 | **P1 — Should Have** | FluentValidation adds significant quality to output; low generation cost |
| US-13 | **P1 — Should Have** | JWT is the dominant auth pattern; engineers expect it |
| US-14 – US-16 | **P0 — Must Have** | Provision + Download is the core delivery mechanism |
| US-17 – US-18 | **P2 — Nice to Have** | Live Sync is a differentiator but not blocking MVP value |

### External Dependencies

| Dependency | Type | Risk |
|---|---|---|
| React Flow v12+ | Frontend library | Low — stable, actively maintained |
| Zustand v5+ | State management | Low — stable API |
| .NET 10 SDK (released) | Runtime | Medium — confirm GA date; MVP targets .NET 10 GA |
| RazorLight / T4 | Template engine | Medium — RazorLight .NET 10 compatibility must be validated before design phase |
| EF Core 10 Migrations | Scaffolding target | Low — stable API, well-documented |

### Internal Dependencies

| Dependency | Blocks |
|---|---|
| Blueprint JSON schema finalised | Engine API implementation (US-08 to US-16) |
| Engine API contract defined | Frontend Provision button integration (US-14) |
| Canvas node types defined | All canvas stories (US-01 to US-07) |
| Clean Architecture template tested | All scaffold acceptance criteria |

---

## 6. Blueprint JSON Schema Reference

The canonical `blueprint.sketch` format for MVP `v1.0`:

```json
{
  "version": "1.0",
  "project": "string (PascalCase, no spaces, max 50 chars)",
  "nodes": [
    {
      "id": "string (unique, URL-safe)",
      "type": "entity | protocol | storage | identity",
      "data": {
        "name": "string",
        "fields": [
          { "name": "string", "type": "Guid | string | int | decimal | bool | DateTime | enum" }
        ],
        "style": "REST | gRPC | GraphQL (protocol nodes only)",
        "auth": "JWT | None (protocol nodes only)",
        "engine": "SqlServer | PostgreSQL | Redis (storage nodes only)"
      },
      "position": { "x": "number", "y": "number" }
    }
  ],
  "edges": [
    {
      "id": "string (unique)",
      "source": "string (node id)",
      "target": "string (node id)",
      "action": "GenerateCRUD | GeneratePersistence"
    }
  ]
}
```

---

## 7. Definition of Done

A user story is considered **Done** when ALL of the following conditions are met:

### Code Quality
- [ ] All acceptance criteria for the story are implemented and verified by a passing automated test.
- [ ] No compiler errors (`dotnet build` exits `0`; `tsc --noEmit` exits `0`).
- [ ] No ESLint errors or warnings (`eslint --max-warnings 0`).
- [ ] All new public C# methods have XML doc comments. All new TypeScript exports have JSDoc comments.
- [ ] No secrets, API keys, or hardcoded connection strings present in committed code.

### Testing
- [ ] Unit tests cover all scaffolding template render paths (one test per node type × action combination).
- [ ] Unit tests cover all blueprint schema validation rules (valid and invalid inputs).
- [ ] Integration test: a blueprint containing one Identity Node + SQL Server Storage Node + REST Protocol Node produces a `.zip` that passes `dotnet build`.
- [ ] Frontend: React component tests cover node drag-and-drop, edge creation, and validation error states.
- [ ] Test coverage for new code is ≥ 80% (lines).

### Generated Output Quality
- [ ] `dotnet build` on the generated solution exits `0` with zero warnings.
- [ ] `dotnet test` on the generated solution exits `0` (generated test stubs pass).
- [ ] Generated code passes `dotnet format --verify-no-changes`.
- [ ] Swagger UI renders at `/swagger` without errors when the generated API starts.
- [ ] EF Core initial migration applies cleanly against a local SQL Server instance (via `dotnet ef database update`).

### Documentation
- [ ] `docs/features/sketch-mvp/design-spec.md` is complete and references this requirements doc.
- [ ] `docs/features/sketch-mvp/implementation-notes.md` documents all non-obvious technical decisions.
- [ ] Any deviations from these requirements are recorded in `implementation-notes.md` with justification.
- [ ] Public-facing API endpoints are documented in OpenAPI/Swagger (auto-generated is acceptable).

### Review & Sign-Off
- [ ] Code reviewed and approved by at least one other engineer.
- [ ] Auditor sub-agent `verification-results.md` shows APPROVED or CONDITIONAL with all exceptions documented.
- [ ] No open P0 bugs against this story.
- [ ] Product Owner has verified the story against the acceptance criteria in a walkthrough.

### Deployment Readiness
- [ ] Feature flag or environment variable controls any breaking changes.
- [ ] `README.md` updated with any new prerequisites or setup steps.
- [ ] Tested in a clean environment (fresh clone + `npm install` + `dotnet restore` + run).

---

## 8. Out of Scope (Post-MVP)

The following are explicitly deferred to future phases to protect MVP focus:

| Feature | Reason Deferred |
|---|---|
| PostgreSQL + Redis Storage Nodes | Increases template surface area significantly; SQL Server covers majority of enterprise scenarios |
| gRPC + GraphQL Protocol Nodes | High complexity, low MVP usage frequency |
| OAuth2 / OIDC authentication | JWT covers most greenfield cases; OAuth2 adds external provider dependencies |
| Entity relationships (one-to-many, many-to-many) | Relationship modelling is Phase 2 scope ("Sketch-to-Domain") |
| Real-time collaborative canvas | Requires WebSocket infrastructure; not a solo-engineer use-case for MVP |
| Blueprint versioning / diff | Valuable but non-blocking for initial value delivery |
| Multi-framework output (Minimal API vs Controllers) | Controllers are the established convention; Minimal API is Phase 2 |
| Plugin/extension system | Premature; architecture must stabilise first |
| Cloud provisioning (Azure, AWS deploy) | Phase 3 scope |

---

*Document produced by: Strategist sub-agent*  
*Next step: Architect sub-agent → `docs/features/sketch-mvp/design-spec.md`*
