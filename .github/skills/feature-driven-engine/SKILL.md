---
name: feature-driven-engine
description: "Feature-Driven Agentic Workflow Skill — Use when: coordinating Strategist/Architect/Engineer/Auditor sub-agents to design and implement features. Executes `runSubagent` commands to produce requirements.md, design-spec.md, implementation-notes.md, and verification-results.md documents in docs/features/[feature-name]/."
---

# Feature-Driven Engine

Agentic workflow skill for Scrum teams adopting feature-driven development. The **Lead Orchestrator** coordinates a specialized sub-agent team (Strategist, Architect, Engineer, Auditor) to ship features incrementally with quality and strict documentation discipline.

**Key Capability**: Executes sub-agents in real-time using `runSubagent` commands. Each sub-agent produces a document artifact at a specific file path for Orchestrator review and approval.

## Core Sub-Agent Team

| Sub-Agent | Role | File Target | Content Output |
|-----------|------|-------------|----------------|
| **Strategist** (Thinking) | Define feature scope, user value, acceptance criteria | `docs/features/[feature-name]/requirements.md` | User stories, acceptance criteria, Definition of Done, edge cases |
| **Architect** (Designing) | Create technical specifications and system design | `docs/features/[feature-name]/design-spec.md` | Mermaid diagrams, API contracts, schema changes, sequence flows |
| **Engineer** (Developing) | Implement the solution in code | `src/` + `docs/features/[feature-name]/implementation-notes.md` | Working code, technical hurdles, logic flow explanation |
| **Auditor** (Verifying) | Validate requirements, code quality, test coverage, and documentation completeness | `docs/features/[feature-name]/verification-results.md` | Test coverage, performance benchmarks, documentation audit, Pass/Fail sign-off |

**Lead Orchestrator** (You) | Coordinate sub-agent handoffs, track dependencies, ensure documentation protocol compliance | `docs/features/[feature-name]/` (all files) | Sprint planning, risk mitigation, progress tracking

## Feature-Driven Workflow (Lead Orchestrator Coordination)

### Phase 1: **Strategist** → Requirements Definition
Sub-agent: Strategist (Thinking)
- **Input**: Feature request or user story
- **Output File**: `docs/features/[feature-name]/requirements.md`
- **Content delivered**:
  - Problem statement & user value
  - User stories (As a... I want to...)
  - Acceptance criteria (testable conditions)
  - Edge cases & constraints
  - Priority & dependencies
  - Definition of Done

**Orchestrator Action**: Review requirements for completeness. Approve or request clarifications before moving to Architect.

### Phase 2: **Architect** → Design Specification
Sub-agent: Architect (Designing)
- **Input**: Locked requirements from Strategist
- **Output File**: `docs/features/[feature-name]/design-spec.md`
- **Content delivered**:
  - Mermaid sequence/flow diagrams
  - API contracts & data schemas
  - System interaction flows
  - Performance & scalability notes
  - Technology stack decisions

**Orchestrator Action**: Validate design against requirements. Check for hidden dependencies with other features. Approve or iterate.

### Phase 3: **Engineer** → Implementation
Sub-agent: Engineer (Developing)
- **Input**: Approved design specification
- **Output Files**: 
  - `src/` (working code)
  - `docs/features/[feature-name]/implementation-notes.md`
- **Content delivered**:
  - Production-ready code in src/
  - Technical hurdles overcome
  - Logic flow explanation
  - Refactoring notes
  - Performance optimizations applied

**Orchestrator Action**: Confirm code follows design. Track blockers and dependencies. Flag integration points for other teams.

### Phase 4: **Auditor** → Verification & Sign-Off
Sub-agent: Auditor (Verifying)
- **Input**: Implementation code + all prior docs (requirements.md, design-spec.md, implementation-notes.md)
- **Output File**: `docs/features/[feature-name]/verification-results.md`
- **Content delivered**:
  - **Code Quality** — TypeScript errors, linting issues, code review against design
  - **Test Coverage Report** — Unit/integration/e2e test results, coverage %, pass rates
  - **Performance Benchmarks** — Measured against targets from requirements
  - **Requirements Traceability Matrix** — Each user story mapped to implementation evidence + test case
  - **Documentation Verification** — Audit that all four output files exist, are complete, and follow protocol:
    - `requirements.md` has all user stories, acceptance criteria, edge cases, Definition of Done
    - `design-spec.md` has Mermaid diagrams, API contracts, system design decisions
    - `implementation-notes.md` documents code structure, technical hurdles, logic flows, refactoring decisions
    - `verification-results.md` (this file) has test coverage + traceability + sign-off
  - **Known Issues & Workarounds** — Any deviations from design, future work items
  - **Pass/Fail Sign-Off** — Auditor recommendation: APPROVED or CONDITIONAL (with exceptions)

**Orchestrator Action**: Review verification results including documentation audit. Gate feature for release. Document any sign-off exceptions. Ensure all four files are in `docs/features/[feature-name]/` before deployment.

## Repository Structure Protocol

All documentation must follow this strict directory hierarchy:

```text
repo-root/
├── docs/
│   ├── features/                    # Feature-specific documentation (MAIN ENTRY POINT)
│   │   └── [feature-name]/          # Each feature gets its own folder
│   │       ├── requirements.md      # Strategist output: user stories, acceptance criteria
│   │       ├── design-spec.md       # Architect output: technical design, diagrams
│   │       ├── implementation-notes.md  # Engineer output: code decisions, hurdles
│   │       └── verification-results.md  # Auditor output: test coverage, sign-off
│   ├── architecture/                # Global system architecture (cross-feature concerns)
│   ├── guides/                      # Developer onboarding, setup, local dev
│   └── testing/                     # Global test strategies, CI/CD logs
├── src/                             # Application source code
└── README.md                        # Project overview
```

**Key Protocol Rules**:
- Every feature gets its own folder under `docs/features/[feature-name]/`
- All four role outputs live in that folder
- No documentation in `src/` — only code
- Use consistent naming: kebab-case for feature-name folder (e.g., `chat-filter`, `user-auth`)

## Usage Patterns

### Pattern 1: Linear Feature Flow (Recommended for High-Quality Features)
1. **Orchestrator**: Create feature folder: `docs/features/[feature-name]/`
2. **Strategist**: Generate `requirements.md`
3. **Orchestrator**: Review & approve requirements
4. **Architect**: Generate `design-spec.md`
5. **Orchestrator**: Review & approve design
6. **Engineer**: Implement code + `implementation-notes.md`
7. **Orchestrator**: Verify code quality
8. **Auditor**: Generate `verification-results.md`
9. **Orchestrator**: Final sign-off → Feature ready for release

### Pattern 2: Parallel Coordination (For Urgent Features)
1. **Strategist** → `requirements.md`
2. **Orchestrator** approves requirements
3. **Architect** + **Engineer** work in parallel (Architect: `design-spec.md`, Engineer: `implementation-notes.md`)
4. **Orchestrator** tracks blockers, coordinates handoffs
5. **Auditor** validates → `verification-results.md`
6. **Orchestrator** gathers all docs in feature folder → Feature ready

### Pattern 3: Sprint-Level Orchestration (For Multi-Feature Releases)
1. **Orchestrator**: Backlog refinement → list features and priorities
2. For each feature:
   - Strategist → requirements
   - Architect → design
   - Engineer → implementation
   - Auditor → verification
3. **Orchestrator**: Consolidate all feature docs under `docs/features/`, track cross-feature dependencies
4. **Orchestrator**: Release decision → Feature set ready for deployment

## Invocation Protocol

**IMPORTANT**: This skill is a **generic workflow**, not tied to specific tasks. When you invoke this skill, provide:

1. **Feature Name** (kebab-case, e.g., `user-auth`, `payment-integration`, `dark-mode`)
2. **Your Specific Task/Requirement** (replace all references to "chat-message-filter" with YOUR feature)

**LLM Instruction**: Do NOT assume any feature. Only use the "chat-message-filter" example as a *template pattern*. Adapt all phases to the actual feature provided by the user.

**Expected Sub-Agent Outputs for YOUR Feature**:
- Strategist: `docs/features/[YOUR-FEATURE]/requirements.md`
- Architect: `docs/features/[YOUR-FEATURE]/design-spec.md`
- Engineer: `docs/features/[YOUR-FEATURE]/implementation-notes.md`
- Auditor: `docs/features/[YOUR-FEATURE]/verification-results.md`

## Running Sub-Agents with runSubagent

Execute each phase using the `runSubagent` tool. Each sub-agent returns a single consolidated output document ready for Orchestrator review.

### Phase 1: Invoke Strategist
```
runSubagent(
  agentName: "Strategist",
  description: "Define requirements for [YOUR-FEATURE]",
  prompt: "You are the Strategist. Analyze the following feature request and produce a comprehensive requirements.md file with: user stories, acceptance criteria, edge cases, constraints, and Definition of Done. Create the file at: docs/features/[feature-name]/requirements.md

Feature Request: [USER-PROVIDED TASK DESCRIPTION]

Output format: Markdown file ready for Orchestrator approval."
)
```

### Phase 2: Invoke Architect (After Requirements Approved)
```
runSubagent(
  agentName: "Architect",
  description: "Design technical specification for [YOUR-FEATURE]",
  prompt: "You are the Architect. Based on the approved requirements in docs/features/[feature-name]/requirements.md, produce a comprehensive design-spec.md with: Mermaid sequence/flow diagrams, API contracts, database schemas, performance considerations, and technology stack decisions. Create the file at: docs/features/[feature-name]/design-spec.md

Requirements reference: [SUMMARIZE REQUIREMENTS.MD]

Output format: Markdown file with embedded Mermaid diagrams, ready for Orchestrator approval."
)
```

### Phase 3: Invoke Engineer (After Design Approved)
```
runSubagent(
  agentName: "Engineer",
  description: "Implement [YOUR-FEATURE]",
  prompt: "You are the Engineer. Based on the approved design in docs/features/[feature-name]/design-spec.md, implement the feature in src/ and produce implementation-notes.md documenting: code structure, technical hurdles overcome, logic flow, refactoring decisions, and test coverage.

Design reference: [SUMMARIZE DESIGN-SPEC.MD]

Output locations:
- Production code: src/
- Documentation: docs/features/[feature-name]/implementation-notes.md

Output format: Working code + markdown documentation, ready for Orchestrator review."
)
```

### Phase 4: Invoke Auditor (After Implementation Complete)
```
runSubagent(
  agentName: "Auditor",
  description: "Verify [YOUR-FEATURE]",
  prompt: "You are the Auditor. Review the implementation against all prior documentation and produce verification-results.md documenting: test coverage reports (unit/integration/e2e), performance benchmarks, requirements traceability matrix, known issues, and Pass/Fail sign-off.

Requirements: [SUMMARIZE REQUIREMENTS.MD]
Design: [SUMMARIZE DESIGN-SPEC.MD]
Implementation: [SUMMARIZE IMPLEMENTATION-NOTES.MD]

Output file: docs/features/[feature-name]/verification-results.md

Output format: Comprehensive verification report with traceability matrix and sign-off recommendation."
)
```

## Orchestrator Workflow with Sub-Agents

1. **Create feature folder**: `mkdir docs/features/[feature-name]/`
2. **Run Strategist**: `runSubagent(...)` → Review requirements output
3. **Orchestrator Gate 1**: ✅ Approve or request revisions
4. **Run Architect**: `runSubagent(...)` → Review design output
5. **Orchestrator Gate 2**: ✅ Approve or request revisions
6. **Run Engineer**: `runSubagent(...)` → Review implementation + code
7. **Orchestrator Gate 3**: ✅ Code follows design or request fixes
8. **Run Auditor**: `runSubagent(...)` → Review verification output
9. **Orchestrator Gate 4**: ✅ Auditor sign-off → Feature ready for release

## Lead Orchestrator Best Practices

- **Lock requirements before design**: Cycling Strategist → Architect → Strategist creates rework. Approve requirements once before handoff to Architect.
- **Parallel Architect + Engineer**: Once design is approved, Engineer can start immediately. Catch integration issues early with Architect shadows.
- **Documentation-First**: Auditor should refer to design docs, not just code. If code diverges from design, Engineer updates implementation-notes.md to explain why.
- **Feature folder discipline**: All four outputs live in `docs/features/[feature-name]/`. No orphaned docs. Consolidate before release.
- **Cross-feature dependency tracking**: Orchestrator maintains a dependency matrix. If Feature A blocks Feature B, document it in both feature folders.
- **Sign-off gate**: Auditor sign-off in verification-results.md is the release gate. No feature ships without Auditor approval.
- **Traceability**: Each test case in verification-results.md should trace back to an acceptance criterion in requirements.md.

## Tool Restrictions

This skill assumes access to:
- File system tools (read/create code files)
- Semantic search (find related code)
- Writing tools (update docs, create test files)

## Example: Filter Chat Messages Feature (End-to-End)

**⚠️ TEMPLATE ONLY**: This example shows the pattern using a hypothetical feature. Adapt all placeholders (`[feature-name]`, filenames, acceptance criteria) to YOUR actual feature.

### Folder Structure Created
```
docs/features/chat-message-filter/
├── requirements.md           # Strategist output
├── design-spec.md            # Architect output
├── implementation-notes.md    # Engineer output
└── verification-results.md    # Auditor output
```

### 1. Strategist Phase → `requirements.md`
```markdown
# Feature: Chat Message Filter
## User Stories
- As a user, I want to filter messages by date range so I can find past conversations.
- As a user, I want to see the count of filtered messages to understand my search scope.

## Acceptance Criteria
- [ ] Date picker UI allows start and end date selection
- [ ] Only messages within the selected range display
- [ ] UI shows "X messages filtered out of Y total"
- [ ] Filter selection persists for the current session
- [ ] Performance: filtering 1000+ messages completes in < 200ms
- [ ] Error handling: invalid dates (end < start) show validation error

## Edge Cases
- Leap year dates (Feb 29)
- Timezone differences (UTC vs local)
- Deleted messages within range
- Empty result sets
- DST (daylight saving time) boundaries

## Definition of Done
- Requirements approved by product
- Design spec reviewed by architects
- Implementation complete and peer-reviewed
- All test cases pass
- Performance benchmarks met
- Auditor sign-off obtained
```

### 2. Architect Phase → `design-spec.md`
```markdown
# Design Specification: Chat Message Filter

## System Architecture

### Sequence Diagram
```
User → UI → ChatService.filterByDateRange() → Database
      ← Cache (memoized results) ← Computed state
```

### API Contract
```typescript
interface DateRangeFilter {
  startDate: ISO8601string;
  endDate: ISO8601string;
  timezone?: string;
}

ChatService.filterByDateRange(filter: DateRangeFilter): Promise<Message[]>
```

### Database Schema Changes
- Add index on `messages.createdAt` for query performance

## Technology Decisions
- Use `date-fns` for date manipulation (handles DST)
- Memoize results with React.useMemo to prevent recomputes
- Store filter state in sessionStorage for persistence
```

### 3. Engineer Phase → `implementation-notes.md`
```markdown
# Implementation Notes: Chat Message Filter

## Code Structure
- `src/components/DateRangePicker.tsx` — UI component (45 lines)
- `src/services/chatService.ts:L120` — filterByDateRange() logic (28 lines)
- `src/utils/dateHelpers.ts` — Utility functions (extracted)

## Technical Hurdles Overcome
1. **Timezone complexity**: Used `date-fns-tz` to handle DST boundaries safely
2. **Performance**: Initial query was O(n). Optimized with database index on createdAt
3. **Empty results**: Added graceful UI fallback showing "No messages in this range"

## Testing Coverage
- Unit tests: dateHelpers functions (5 tests)
- Integration tests: filterByDateRange end-to-end (8 tests)
- E2E tests: Date picker interaction (3 tests)
```

### 4. Auditor Phase → `verification-results.md`
```markdown
# Verification Results: Chat Message Filter

## Test Coverage
- Unit: 13/13 tests passing ✓
- Integration: 8/8 tests passing ✓
- E2E: 3/3 tests passing ✓
- Coverage: 94% (6 missed branches in error handling)

## Performance Benchmarks
- 1000 messages: 145ms ✓ (target: < 200ms)
- 10,000 messages: 1,240ms ⚠️ (acceptable for edge case)

## Traceability Matrix
| Acceptance Criterion | Test Case | Status |
|---|---|---|
| Date picker UI works | E2E test: "User selects date range" | PASS |
| Filter < 200ms | Perf test: "1000 messages" | PASS |
| Timezone handling | Unit test: "DST boundary" | PASS |

## Sign-Off
- [ ] **Auditor approval**: APPROVED (Minor: Doc 10K message scenario)
- Release candidate: YES
```

### 5. Orchestrator Coordination
- **Approval chain**: Requirements locked (Week 1) → Design approved (Week 2) → Code reviewed (Week 3) → Auditor sign-off (Week 4)
- **Blocker tracking**: No dependencies on other features
- **Risk mitigation**: Timezone edge case owned by Architect + QA pair
- **Release gate**: Auditor sign-off required before deployment

---

## Learning Resources

- Feature-driven development: [FDD Manifesto](https://en.wikipedia.org/wiki/Feature-driven_development)
- Agentic workflows: Consider breaking each phase into a separate agent invocation for context isolation
- Scrum best practices: [Scrum.org — Product Backlog](https://www.scrum.org/resources/what-is-a-product-backlog)
