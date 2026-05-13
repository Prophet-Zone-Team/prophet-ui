# UI Style Guide

## Product

World Cup Prediction Terminal

A C-facing World Cup prediction market intelligence platform. The product helps users understand team probability, bid flow, market movement, news impact, odds mismatch, and watchlist signals.

It is not a traditional sports news website.
It is not a casino-style betting website.
It is a premium sports prediction terminal for normal users.

## Visual Direction

The interface should feel like:

- Polymarket
- Bloomberg Terminal
- Fantasy Sports dashboard
- Crypto trading terminal
- Premium sports analytics product

The design should be dark, sharp, premium, data-rich, and easy to understand.

## Reference Images

The images in `/design-reference/` are visual references.

Use them to understand:

- layout rhythm
- card style
- spacing
- typography hierarchy
- heatmap density
- glow and border treatment
- data visualization style
- overall product mood

Do not copy the exact content from the images.
Do not use the images as static backgrounds.
Recreate the style as real frontend components.

## Core UI Principles

1. The heatmap is the hero.
2. Data must be readable at a glance.
3. Probability numbers should be visually dominant.
4. 24h change should be obvious.
5. Cards should feel premium, not crowded.
6. Use tables only when necessary.
7. Use motion subtly, not excessively.
8. Mobile layout must remain clean.
9. Avoid generic sports news layout.
10. Avoid gambling/casino visual language.

## Color Direction

- Background: near-black, deep navy, dark slate
- Card background: translucent dark panels
- Border: subtle gray, blue-gray, low-opacity white
- Positive movement: green / cyan
- Negative movement: red / orange
- Highlight: electric blue / neon green glow
- Text primary: near-white
- Text secondary: muted gray
- Do not overuse saturated colors

## Typography

- Large bold numbers for probability
- Small uppercase labels for metadata
- Concise body text
- Strong contrast between title, number, label, and description
- Avoid long paragraphs inside cards

## Components

### Team Heatmap Card

Each card should include:

- Team name
- Country code or flag placeholder
- Current probability
- 24h change
- 7d change
- Volume
- Sentiment badge

Visual requirements:

- Dark translucent card
- Subtle border
- Hover glow
- Probability should be the largest element
- Positive / negative movement should be immediately visible
- Card should not feel cramped

### Market Signal Card

Each card should include:

- Signal type
- Related team
- Short insight
- Severity or confidence
- CTA

Signal examples:

- Top mover
- Biggest loser
- Odds mismatch
- Volume spike
- Sentiment shift
- News impact

### Embedded Trading Panel

The panel should include:

- Selected team
- Current probability
- Connected user/account state
- Outcome and side selector
- Limit price and size inputs
- Estimated cost or proceeds
- Potential outcome preview
- Balance, allowance, and eligibility status
- Final order review and confirmation button

Must show:

"Orders use your connected Polymarket account and funds. This is not financial, betting, or investment advice."

## Interaction

- Cards should be clickable when they lead to detail pages.
- Hover states should feel premium and subtle.
- Use Framer Motion for soft transitions.
- Avoid loud casino-style animations.
- Keep the product feeling analytical and trustworthy.

## Content Rules

Do not use:

- guaranteed profit
- must buy
- easy money
- risk-free
- sure win
- insider information

Prefer terms like:

- market signal
- watchlist
- probability shift
- odds mismatch
- bid flow
- sentiment shift
- not financial advice

## Implementation Rules

- Use Next.js + TypeScript + Tailwind CSS.
- Use shadcn/ui when useful.
- Use Recharts for charts.
- Use Framer Motion for subtle animation.
- Keep mock data separate from components.
- Do not hardcode business data inside UI components.
- Keep components reusable.
- Real trading must use the user's own connected wallet/account, user-specific credentials, and explicit confirmation.
- Do not use a shared server wallet or pooled funds for user orders.
- Backend trading services must enforce eligibility, user ownership, balance/allowance checks, and safe secret handling.
