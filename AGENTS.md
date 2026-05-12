# AGENTS.md

## Project

World Cup Prediction Terminal is a consumer-facing World Cup prediction market data analysis and mock bid platform.

The product helps users understand market sentiment, probability movement, team-level narratives, and hypothetical bid outcomes. It must never execute real trades or present itself as investment, gambling, or betting advice.

## Product Boundaries

- Build a sports prediction market terminal, not a sports news site.
- Build a data analysis and education experience, not a sportsbook.
- All bid flows are mock bid flows only.
- Do not connect mock bid UI to real trading, wallet, exchange, broker, or on-chain execution.
- Do not imply guaranteed outcomes, safe profit, certain return, or recommended purchases.
- Do not use phrasing such as "guaranteed win", "sure profit", "must buy", "investment advice", or similar claims.
- Treat probabilities, odds, and returns as exploratory market data, not financial recommendations.

## Core User Experience

The interface should make these workflows immediately clear:

1. Users can see which teams are popular, rising, and falling at a glance.
2. Users can understand market probabilities through a heatmap.
3. Users can open a team detail page to inspect probability changes, news impact, and odds divergence.
4. Users can place a mock bid to understand probability and potential return mechanics without real execution.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Framer Motion

Prefer existing project conventions once the application is scaffolded. Do not introduce additional UI frameworks, state managers, charting libraries, or animation libraries unless there is a clear product need.

## Visual Direction

The product should feel like a dark premium sports prediction terminal:

- Polymarket-like market clarity
- Bloomberg Terminal-like density and data hierarchy
- Fantasy Sports-like team familiarity
- Premium, restrained, analytical, and data-heavy

Avoid:

- Generic sports news layouts
- Betting-site visual language
- Casino-like colors, urgency patterns, or promotional banners
- Overly playful sports graphics
- Marketing landing-page composition as the primary product surface

Mobile must be fully usable. Dense data views should degrade into readable, scannable layouts rather than horizontal clutter.

## UI Principles

- Make the first screen a usable terminal/dashboard experience, not a marketing hero.
- Prioritize comparison, scanning, sorting, filtering, and drill-down.
- Use clear data hierarchy: team, probability, movement, volume/interest, sentiment, confidence, and relevant deltas.
- Use compact components and restrained spacing suitable for repeated data inspection.
- Use color intentionally:
  - Green for positive movement or rising probability.
  - Red for negative movement or falling probability.
  - Neutral gray/slate for inactive or baseline data.
  - Accent colors should support hierarchy, not dominate the interface.
- Keep cards to functional repeated items, panels, tables, dialogs, and tool surfaces.
- Do not nest cards inside cards.
- Keep rounded corners restrained; default to 8px or less unless an existing component requires otherwise.
- Use icons for common actions where appropriate.
- Use charts and heatmaps as primary analysis surfaces, not decoration.

## Content Rules

- Use neutral analytical language.
- Label mock bid behavior clearly.
- When showing projected return, use language such as "potential outcome", "simulated return", or "mock scenario".
- Avoid calls to action that pressure the user.
- Avoid financial certainty, betting certainty, or advice language.
- News impact should be framed as correlation or market context unless a source explicitly supports causality.

## Code Organization

Keep business data, presentation, and interaction logic separated.

Recommended structure once the app is scaffolded:

```text
src/
  app/
  components/
    terminal/
    charts/
    teams/
    mock-bid/
    layout/
  data/
    mock/
  lib/
    formatters/
    market/
  types/
```

Guidelines:

- Components should be small, named, and focused.
- Separate reusable UI primitives from domain-specific components.
- Keep mock data in dedicated data files, not inside React components.
- Keep domain calculations in `lib/` functions, not inline JSX.
- Keep shared TypeScript types in `types/` or next to the feature when local.
- Prefer explicit prop types and exported domain types.
- Avoid hardcoding teams, probabilities, odds, headlines, or bid examples inside components.

## TypeScript Standards

- Use TypeScript for all application code.
- Define domain types for teams, markets, probability history, news events, odds divergence, and mock bids.
- Avoid `any` unless there is a documented boundary with an unknown external shape.
- Keep formatting and calculation functions typed.
- Prefer discriminated unions for status-like values such as trend direction, bid state, or market status.
- Treat mock bid outputs as derived simulation results.

## Data Rules

- Mock data should be realistic enough to support the UI, but clearly local and non-executable.
- Do not embed real-time claims unless backed by a real data source and timestamp.
- Mock datasets should include enough variation to test rising, falling, flat, popular, and low-liquidity states.
- Components should receive data through props or feature-level loaders.
- Do not make components import large mock datasets directly unless they are top-level route/demo containers.

## Mock Bid Rules

- Mock bid is an educational simulation only.
- Never add real wallet connection, payment, trade submission, or exchange execution without explicit product approval.
- Mock bid UI must clearly show that the action is simulated.
- Calculations should be deterministic and testable.
- Keep stake, probability, implied odds, and potential return calculations in a dedicated utility module.
- Never phrase simulated output as guaranteed profit or advice.

## Charting and Motion

- Use Recharts for line charts, area charts, bar charts, and probability movement views.
- Use custom UI or chart primitives for heatmaps when Recharts is not the right fit.
- Use Framer Motion for purposeful transitions only:
  - panel entry
  - selected-team transitions
  - value change emphasis
  - mock bid confirmation feedback
- Avoid decorative motion that distracts from data interpretation.

## Accessibility and Responsiveness

- Mobile layouts are required, not optional.
- Tables should become stacked rows, compact cards, or horizontally controlled data regions on small screens.
- Maintain readable contrast in dark mode.
- Interactive controls must have accessible labels.
- Avoid relying on color alone to communicate rising/falling states.
- Ensure charts have textual labels, legends, or summaries where needed.

## Implementation Expectations

Before adding business pages:

- Establish the project scaffold.
- Install and configure the agreed stack.
- Define base theme tokens and terminal visual language.
- Define domain types.
- Create mock data separately from UI.
- Create formatting and probability calculation utilities.

When adding pages:

- Start with the terminal/dashboard surface.
- Then add market heatmap.
- Then add team detail.
- Then add mock bid flow.
- Verify desktop and mobile states.

## Review Checklist

Before considering a feature complete:

- Business data is not hardcoded inside reusable components.
- TypeScript types are explicit and meaningful.
- Mock bid language is clearly simulated.
- No prohibited advice or certainty language appears in UI copy.
- Mobile layout is usable.
- Dark premium terminal style is preserved.
- Charts and heatmaps are readable and not decorative filler.
- Components are split by responsibility.
- Calculations are in utilities and are easy to test.
