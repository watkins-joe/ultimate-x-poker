# Video Poker Template

A runnable React and TypeScript video-poker starter with reusable cards, controls,
game flow, denomination and balance handling, and responsive casino-style UI.

## Project layout

- `src/components/ui/` contains reusable interface pieces and the shared game
  shell. `Main` wires a game definition into the common controls, hand, meters,
  and paytable.
- `src/config/games.ts` registers available games and connects each game's
  display name, paytable, evaluator, and card artwork.
- `src/config/gameConfig.ts` contains shared bet, denomination, and game-state
  types.
- `src/config/doubleDoubleBonusConfig.ts` contains the Double Double Bonus
  example hand names and payout table.
- `src/config/deucesWildConfig.ts` contains the Deuces Wild example paytable.
- `src/utils/` contains deck/shuffle, persistence, gesture, and hand-evaluation
  utilities.
- `public/assets/cards/` contains standard card artwork and wild-deuce variants.
- `public/assets/ui/` and `public/fonts/` contain reusable casino controls,
  denomination art, game-menu examples, and fonts.

## Adding a game

1. Add that game's hand names, payout table, and evaluator in its own module.
   Evaluators are game-specific: wild cards and variant rules change hand
   rankings, so do not replace them with one hard-coded evaluator.
2. Register a `GameDefinition` in `src/config/games.ts`. The common shell reads
   the game name, paytable, evaluator, and card-art mapping from that definition.
3. Add any game-specific menu art under `public/assets/ui/games/`.

The standard 52-card ID model and shuffle utility are shared. Variant-specific
artwork is selected through `GameDefinition.getCardAsset`, leaving card-state
and interaction components reusable.

## Development

```sh
npm install
npm run dev
npm run build
npm run lint
```

Production builds include an installable PWA manifest and app icons. The service
worker caches the app shell and production bundles for offline startup; install
support requires HTTPS or localhost.
