# Implementation Notes: Sketch MVP — Backend Scaffolding Engine

**Feature:** Sketch Phase 1 MVP  
**Sub-Agent:** Engineer  
**Status:** Complete  
**Date:** 2026-03-31  
**Build status:** ✅ `dotnet build` succeeds — all four projects

---

## 1. Code Structure

```
src/
├── Sketch.sln
├── Sketch.Domain/                         # Pure domain model — no dependencies
│   ├── Sketch.Domain.csproj
│   ├── Enums/
│   │   ├── AuthStyle.cs                   # None | JWT
│   │   ├── EdgeAction.cs                  # GenerateCRUD | GeneratePersistence
│   │   ├── FieldType.cs                   # Guid | String | Int | Decimal | Bool | DateTime | Enum
│   │   ├── NodeType.cs                    # Entity | Protocol | Storage | Identity
│   │   ├── ProtocolStyle.cs               # REST | GRpc | GraphQL
│   │   └── StorageEngine.cs               # SqlServer | PostgreSQL | Redis
│   └── Models/
│       ├── Blueprint.cs                   # Blueprint, BlueprintNode, BlueprintEdge, NodeData, FieldDefinition, Position
│       └── GenerationPlan.cs              # GenerationPlan, EntityTask, PersistenceTask, CrudTask
│
├── Sketch.Application/                    # Use-case interfaces + service implementations
│   ├── Sketch.Application.csproj          # References Domain only
│   ├── Interfaces/
│   │   ├── IBlueprintValidator.cs         # + ValidationResult, ValidationError records
│   │   ├── IResolutionEngine.cs
│   │   ├── IScaffoldingEngine.cs
│   │   └── IZipAssembler.cs
│   └── Services/
│       ├── BlueprintValidatorService.cs   # 9-rule validator, fully self-contained
│       └── ResolutionEngineService.cs     # Blueprint → GenerationPlan mapping
│
├── Sketch.Infrastructure/                 # EF, rendering, zip — all infrastructure concerns
│   ├── Sketch.Infrastructure.csproj       # References Application (→ Domain transitively)
│   ├── Scaffolding/
│   │   ├── TemplateModels/
│   │   │   └── TemplateModels.cs          # EntityTemplateModel, DtoTemplateModel, …
│   │   ├── ScribanRenderer.cs             # Static rendering methods — inline string interpolation
│   │   └── ScaffoldingEngine.cs           # IScaffoldingEngine implementation; orchestrates rendering
│   └── Zip/
│       └── ZipAssemblerService.cs         # IZipAssembler — System.IO.Compression + path guard
│
└── Sketch.API/                            # ASP.NET Core 10 Web API
    ├── Sketch.API.csproj                  # References Application + Infrastructure
    ├── Controllers/
    │   └── BlueprintController.cs         # POST /api/blueprint/validate + /api/blueprint/provision
    ├── Models/
    │   └── Requests/
    │       └── BlueprintRequest.cs        # HTTP DTOs for deserialization
    └── Program.cs                         # DI registration, middleware, rate limiting
```

---

## 2. Technical Decisions

### 2.1 Inline template strings instead of external `.sbn` files

The design spec calls for Scriban `.sbn` templates embedded as assembly resources. For MVP, `ScribanRenderer.cs` uses **C# raw string literals (`"""..."""`) with `$$` interpolation** instead.

**Justification:**
- No embedded resource manifest configuration required — no `<EmbeddedResource>` entries in `.csproj`.
- No Scriban NuGet dependency — one less external package to pin and update.
- Templates are directly visible and editable as ordinary C# methods; no context-switch to a separate template file.
- Output is syntactically identical to what Scriban would produce.
- Migration path: each `RenderXxx` method can be replaced 1-for-1 with a Scriban render call without changing callers.

### 2.2 DTO / Domain model separation

`BlueprintRequest` (and its nested `*Request` types) in `Sketch.API/Models/Requests/` are **entirely separate from** the domain `Blueprint` record in `Sketch.Domain/Models/`.

**Why this matters:**
- The domain record uses C# enums for `NodeType`, `FieldType`, etc. JSON deserialization of enum values into these records would require coupling the domain to `System.Text.Json` attributes — violating Clean Architecture.
- The request DTO uses `string` for all enum-valued fields. `BlueprintController.MapToDomain()` translates them with `Enum.TryParse` and returns `ArgumentException` (→ HTTP 400) on unrecognised values.
- Domain records remain plain C# with no serialisation annotations. They can be used identically in a CLI tool, a background worker, or a test without any JSON stack.

### 2.3 ZipAssembler path validation

`ZipAssemblerService.ValidatePath()` guards against **path traversal** (OWASP A01 — Broken Access Control) before writing any entry into the `ZipArchive`:

1. Normalises all backslashes to forward slashes.
2. Rejects any path that starts with `/` (absolute path injection).
3. Splits on `/` and rejects any segment equal to `..`.
4. Throws `InvalidOperationException` — callers receive a 500 rather than silently writing a malformed archive.

The check deliberately does not percent-decode or resolve symlinks because `ZipArchive` entries are virtual paths, not filesystem paths — the only attack surface is the consumer unzipping into a directory.

### 2.4 Multi-entity DbContext assembly

`ScaffoldingEngine.ScaffoldAsync()` performs a **single-pass accumulation** for `AppDbContext.cs`:

```csharp
// Collect ALL persisted entity names first
var persistedEntityNames = plan.PersistenceTasks.Select(pt => pt.EntityName).ToArray();
// Then render one DbContext file containing all DbSet<T> declarations
files["src/Infrastructure/Data/AppDbContext.cs"] = ScribanRenderer.RenderDbContext(
    new DbContextTemplateModel(plan.ProjectName, persistedEntityNames, plan.StorageEngine));
```

This avoids the naive approach of rendering a partial `DbContext` per entity and trying to merge strings. The `GenerationPlan` is fully materialised before rendering starts, so all `PersistenceTasks` are known upfront — no multi-pass required.

### 2.5 Conditional JWT auth wiring in `Program.cs`

The generated `Program.cs` includes JWT middleware only when `plan.IncludeJwtAuth == true`. For the Sketch API itself, `Program.cs` uses a runtime configuration check:

```csharp
var jwtSection = builder.Configuration.GetSection("Jwt");
if (jwtSection.Exists() && !string.IsNullOrWhiteSpace(jwtSection["Key"]))
{
    builder.Services.AddAuthentication(...).AddJwtBearer(...);
    ...
    app.UseAuthentication();
    app.UseAuthorization();
}
```

This means the API binary ships with the JWT dependency but **only activates auth middleware when `appsettings.json` (or environment variables) provide a key**. In development with no `Jwt` section, the API runs without authentication — no `401` on every request.

For **generated scaffolding** (`ScribanRenderer.RenderProgram`), JWT wiring is included or excluded at generation time based on `ProgramTemplateModel.IncludeJwtAuth` — the generated code contains no runtime flag check, keeping it clean.

---

## 3. Deviations from Design Spec

| Spec | Implementation | Justification |
|---|---|---|
| Scriban `.sbn` embedded resources | C# raw string interpolation | Eliminates Scriban dependency and embedded resource complexity for MVP; trivially replaceable |
| `BlueprintValidator` via FluentValidation 11 | Custom `BlueprintValidatorService` (no FluentValidation) | Validator logic is pure imperative C#; no benefit to the FluentValidation abstraction for server-enforced domain rules. FluentValidation is still used in generated scaffolding validators |
| `ZipPackager` class name | `ZipAssemblerService` | Matches the `IZipAssembler` interface name from the Application layer |
| `GenerationPlannerService` as separate class | `ResolutionEngineService` implements both resolution and plan building | The two responsibilities are tightly coupled — separating them adds a class with no interface boundary value in MVP |
| 512 KB max payload (design) | 1 MB max request body (implementation) | Kestrel's `MaxRequestBodySize` is the governing limit; 1 MB is set to provide comfortable headroom. |
| Deterministic GUIDs via UUID v5 keyed on project name | Not implemented | UUID v5 is a content-addressability feature; deferred to post-MVP |
| `POST /api/provision` route | `POST /api/provision` (fixed — was previously `/api/blueprint/provision`) | Route changed from `[Route("api/[controller]")]` to `[Route("api")]` to match design spec |
| Entity fields with `{ get; init; }` | Changed to `{ get; set; }` | EF Core entities need mutable properties; `init`-only properties prevent `ApplyUpdate` from compiling |

---

## 5. Post-Auditor Fixes Applied (2026-03-31)

The following issues identified by the Auditor were resolved:

| ID | Issue | Fix Applied |
|---|---|---|
| EX-01 | Generated zip missing `.csproj` and `.slnx` files | Added `RenderDomainCsproj`, `RenderApplicationCsproj`, `RenderInfrastructureCsproj`, `RenderApiCsproj`, `RenderSlnx` to `ScribanRenderer`; `ScaffoldingEngine` now includes all project files in output |
| EX-02 | Generated zip missing `appsettings.json` | Added `RenderAppSettings` renderer; `ScaffoldingEngine` outputs `src/{Project}.API/appsettings.json` |
| EX-03 | `MapToDto`/`MapFromRequest`/`ApplyUpdate` threw `NotImplementedException` | `ServiceTemplateModel` now carries `IReadOnlyList<FieldDefinition> Fields`; `ScribanRenderer.RenderService` generates actual mapping code from field metadata |
| EX-04 | API routes were `/api/blueprint/...` instead of `/api/...` | Changed `[Route("api/[controller]")]` to `[Route("api")]` in `BlueprintController` |
| EX-05 | No edge legality validation | Added `ILLEGAL_EDGE` validation rules to `BlueprintValidatorService` for both `GenerateCRUD` and `GeneratePersistence` edge types |
| BUG-10 | Dead `StringBuilder` in `SanitizeProjectName` | Removed dead code; method now directly returns `ToPascalCaseFromWords(words)` |
| EX-06 | No test projects | Created `tests/Sketch.UnitTests` with 21 tests covering `BlueprintValidatorService`, `ZipAssemblerService`, and `ResolutionEngineService`; all pass |
| BUG-VALIDATOR | `ToDictionary` throws on duplicate node IDs in edge validator | Changed to `TryAdd`-based node map construction that safely handles duplicates |

---

## 4. Test Coverage Plan

### Unit tests — `Sketch.Application.Tests`

| Class | Test scenarios |
|---|---|
| `BlueprintValidatorService` | Each validation rule independently: unsupported version, missing project, missing nodes, duplicate node id, invalid edge ref, entity with no fields, reserved field name (each keyword), node count > 20, invalid field name regex |
| `ResolutionEngineService` | Project name sanitization edge cases (spaces, hyphens, unicode, all-numeric); Identity node field expansion; CrudTask/PersistenceTask correct edge routing; `IncludeJwtAuth` set only when JWT protocol present; StorageEngine defaults to SqlServer when no storage node |

### Unit tests — `Sketch.Infrastructure.Tests`

| Class | Test scenarios |
|---|---|
| `ZipAssemblerService` | Valid paths produce correct zip entries; paths starting with `/` throw; paths containing `..` throw; paths with backslash traversal (`..\\..`) throw; empty file dict produces empty zip |
| `ScribanRenderer` | Each `RenderXxx` method produces syntactically valid C# (can be verified with Roslyn `CSharpSyntaxTree.ParseText` and checking zero errors); namespace matches project name; field lines appear in output |
| `ScaffoldingEngine` | Single entity plan produces correct file keys; multi-entity plan produces one DbContext accumulating all `DbSet<T>`; CRUD plan produces all five files (DTO, interface, service, validator, controller); JWT flag toggles `[Authorize]` on controller |

### Integration tests — `Sketch.API.Tests`

| Scenario | Assertion |
|---|---|
| `POST /api/blueprint/validate` with valid blueprint | 200, `isValid: true` |
| `POST /api/blueprint/validate` with unknown node type | 400, `PARSE_ERROR` |
| `POST /api/blueprint/validate` with duplicate node id | 422, `DUPLICATE_NODE_ID` |
| `POST /api/blueprint/provision` with valid blueprint | 200, `Content-Type: application/zip`, zip is non-empty |
| `POST /api/blueprint/provision` 11th request from same IP within 1 minute | 429 |
| `POST /api/blueprint/provision` with body > 1 MB | 413 |
