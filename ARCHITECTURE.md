# CryptoFolio Frontend Architecture

## Layering

- `index.html` + `style.css`: shell, layout, design tokens
- `js/config.js`: constants and static coin metadata
- `js/dom-elements.js`: DOM registry (single source)
- `js/storage.js`: persistence and payload normalization
- `js/domain-portfolio.js`: portfolio and risk computation engine
- `js/ui-renderers.js`: HTML rendering functions
- `js/controllers.js`: event handlers and UI orchestration
- `app.js`: composition root and app lifecycle

## Data Flow

1. Source data enters through local storage and external pricing API.
2. Domain layer computes portfolio and risk metrics from normalized state.
3. Renderers project state into view HTML snippets.
4. Controllers mutate state through explicit injected dependencies.
5. `app.js` coordinates refresh loop, routing, and global feedback channels.

## Reliability Strategy

- API failure: toast + persistent banner + keep last known values.
- Dangerous actions: explicit confirmation required.
- Validation: invalid form input blocked with inline and toast feedback.

## Performance Strategy

- Skeleton loading for asset list refreshes.
- Number animation and sparkline updates without layout-thrashing.
- Tokenized spacing/typography/colors for deterministic rendering.
