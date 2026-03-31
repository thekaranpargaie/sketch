# Sketch

**Design your architecture. Generate your scaffold. Skip the boilerplate.**

Sketch is a visual, canvas-based scaffolding tool for .NET projects. You draw a system diagram — entities, protocols, and storage nodes — and Sketch generates a complete, buildable Clean Architecture solution as a `.zip` file ready to open in any IDE.

---

## What it does

Instead of spending 3–6 hours wiring up a new .NET project from scratch, you:

1. Open the canvas in your browser
2. Drag on nodes (Entity, Protocol, Storage) and connect them with edges
3. Click **Provision** — and download a ready-to-run `.zip`

The generated solution includes Clean Architecture layering (API / Application / Domain / Infrastructure), EF Core setup, repository pattern, DI registration, and full CRUD controllers — all consistent and buildable out of the box.

---

## Architecture

```
Sketch.Web        →  React SPA (canvas UI, @xyflow/react)
Sketch.API        →  ASP.NET Core REST API  (/validate, /provision)
Sketch.Application →  Orchestration services (validation, resolution)
Sketch.Domain      →  Blueprint model & enumerations
Sketch.Infrastructure → Scaffolding engine + ZIP assembler
```

The frontend sends a **Blueprint JSON** payload describing the canvas to the API. The API validates it, resolves a generation plan, scaffolds all source files, and streams back a ZIP.

---

## Running locally

### With Docker (recommended)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web UI  | http://localhost:5173 |
| API     | http://localhost:5000 |

### Without Docker

**API**
```bash
cd src
dotnet run --project Sketch.API
```

**Web**
```bash
cd src/Sketch.Web
npm install
npm run dev
```

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/validate` | Validates a Blueprint JSON — returns errors without generating files |
| `POST` | `/api/provision` | Validates + generates — returns a `.zip` binary stream |

See [docs/architecture.md](docs/architecture.md) for the full Blueprint schema.

---

## Running tests

```bash
dotnet test tests/Sketch.UnitTests/Sketch.UnitTests.csproj
```

---

## Project structure

```
src/
  Sketch.API/            ASP.NET Core host & controllers
  Sketch.Application/    Business logic interfaces & services
  Sketch.Domain/         Models & enumerations
  Sketch.Infrastructure/ Scaffolding engine & ZIP assembler
  Sketch.Web/            React + Vite frontend
tests/
  Sketch.UnitTests/      xUnit unit tests
docs/                    Architecture & feature documentation
docker-compose.yml       Single-command local stack
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, @xyflow/react, Zustand |
| Backend | .NET 10, ASP.NET Core, Clean Architecture |
| Persistence | EF Core (generated in scaffold output) |
| Packaging | ZIP via `System.IO.Compression` |
| Container | Docker Compose |
