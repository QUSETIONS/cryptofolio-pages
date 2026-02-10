# Architecture Decision Records (ADR)

## ADR-001: Keep Vanilla Modular Stack

- Status: Accepted
- Context: Existing codebase was already modularized in browser scripts.
- Decision: Keep native HTML/CSS/JS modules and avoid framework migration for this iteration.
- Consequence: Faster delivery and lower migration risk; component abstraction remains custom.

## ADR-002: Controllers via Dependency Injection

- Status: Accepted
- Context: Handlers in `app.js` were growing and tightly coupled.
- Decision: Extract asset/transaction/alert/settings controllers with injected dependencies.
- Consequence: Better testability and clearer boundaries; setup wiring is more verbose.

## ADR-003: Visual Token System

- Status: Accepted
- Context: UI needed consistency and interview-grade design rationale.
- Decision: Introduce `window.AppThemeTokens` + CSS token naming (`--color-*`, `--space-*`, `--radius-*`).
- Consequence: Theme operations are centralized; token drift must be managed.

## ADR-004: Quality Gates in CI

- Status: Accepted
- Context: Need demonstrable engineering rigor for interviews.
- Decision: Add CI with syntax checks, unit tests, e2e smoke, and Lighthouse budget checks.
- Consequence: Higher confidence and repeatability; CI runtime increases.
