# Architecture

## Overview

Sketch follows a request-driven pipeline. The React canvas serialises the diagram into a **Blueprint JSON** document and posts it to the API. The API runs the Blueprint through four sequential stages and returns a ZIP stream.

```
Browser canvas
    │  Blueprint JSON (POST /api/provision)
    ▼
BlueprintController
    │
    ├─ 1. Validate      (IBlueprintValidator)
    ├─ 2. Resolve       (IResolutionEngine)   → GenerationPlan
    ├─ 3. Scaffold      (IScaffoldingEngine)  → in-memory file tree
    └─ 4. Assemble ZIP  (IZipAssembler)       → byte[]
    │
    ▼
application/zip response
```

---

## Blueprint schema

A Blueprint is the JSON contract between the frontend and the API.

```jsonc
{
  "version": "1.0",
  "project": "MyApp",
  "nodes": [
    {
      "id": "node-1",
      "type": "entity",          // entity | protocol | storage | identity
      "data": {
        "name": "Product",
        "fields": [
          { "name": "Name",  "type": "string" },
          { "name": "Price", "type": "decimal" }
        ]
      },
      "position": { "x": 100, "y": 200 }
    },
    {
      "id": "node-2",
      "type": "protocol",
      "data": {
        "name": "ProductApi",
        "style": "rest",         // rest
        "auth": "none"           // none | jwt | apiKey
      },
      "position": { "x": 400, "y": 200 }
    },
    {
      "id": "node-3",
      "type": "storage",
      "data": {
        "name": "AppDb",
        "engine": "sqlserver"    // sqlserver | postgres | sqlite
      },
      "position": { "x": 100, "y": 400 }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-2",
      "target": "node-1",
      "action": "crud"           // crud
    },
    {
      "id": "edge-2",
      "source": "node-1",
      "target": "node-3",
      "action": "persists"       // persists
    }
  ]
}
```

### Node types

| Type | Purpose | Required fields |
|------|---------|-----------------|
| `entity` | C# domain model + EF Core entity | `name`, `fields[]` |
| `protocol` | API layer (controllers) | `name`, `style`, `auth` |
| `storage` | Database context | `name`, `engine` |
| `identity` | Pre-built User entity shortcut | `name` |

### Edge actions

| Action | Meaning |
|--------|---------|
| `crud` | Protocol → Entity: generate CRUD endpoints |
| `persists` | Entity → Storage: include entity in DbContext |

---

## Pipeline stages

### 1. Validation (`IBlueprintValidator`)

Runs structural and semantic checks on the Blueprint before any generation occurs. Returns a list of `ValidationError` records with a node ID, error code, and human-readable message.

Common rules:
- Project name must be a valid C# identifier
- Each node ID must be unique
- Entity nodes must have at least one field
- A `crud` edge must connect a protocol node to an entity node
- A `persists` edge must connect an entity node to a storage node

### 2. Resolution (`IResolutionEngine`)

Walks the validated Blueprint and produces a **GenerationPlan** — a flat, ordered list of artefacts to generate (files, their target paths, and their template context). This stage is pure and has no I/O.

### 3. Scaffolding (`IScaffoldingEngine`)

Executes the GenerationPlan. For each artefact it renders a source template, producing an in-memory dictionary of `path → content` strings. Templates follow Clean Architecture conventions.

### 4. ZIP assembly (`IZipAssembler`)

Takes the in-memory file dictionary and writes it into a `MemoryStream` using `System.IO.Compression.ZipArchive`. The stream is streamed directly back to the client as `application/zip`.

---

## Project layers

| Project | Responsibility |
|---------|---------------|
| `Sketch.Domain` | `Blueprint`, `GenerationPlan`, enumerations — no dependencies |
| `Sketch.Application` | Interfaces + orchestration services — depends on Domain only |
| `Sketch.Infrastructure` | Implements scaffolding engine & ZIP assembler — depends on Application |
| `Sketch.API` | ASP.NET Core host, controllers, request/response DTOs — depends on Application |
| `Sketch.Web` | React SPA — communicates with API only via HTTP |

---

## Rate limiting

The API applies a fixed-window rate limiter (configured in `Program.cs`) to the `/api` route group to prevent abuse of the generation endpoint.

## Output size guard

`BlueprintController` enforces a **50 MB** cap on the in-memory file tree before ZIP assembly. Requests that would exceed this limit receive `413 Request Entity Too Large`.
