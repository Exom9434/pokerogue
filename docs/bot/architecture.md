# Bot Architecture

This document describes the planned architecture for bot support in Pokerogue.

## Goal

Build one shared browser-facing interface that can support:

- An LLM bot.
- An RL bot.
- Simple scripted smoke bots.

The core loop should be:

```text
browser game -> observe() -> policy -> act(action) -> browser game
```

The game should expose structured information. The bot should not depend primarily on screenshots or OCR.

## Main Design

Add a dev/bot-only bridge inside the browser:

```ts
window.pokerogueBot = {
  observe(): BotObservation,
  act(action: BotAction): Promise<BotActionResult>,
  getSave(slot?: number): Promise<SessionSaveData | undefined>,
  getSystemSave(): SystemSaveData,
  setSpeed(speed: number): void,
};
```

The bridge reads live game state from `globalScene` and executes actions through existing UI/input paths.

## Why Use `globalScene`

`globalScene` gives direct access to live game state:

- Current UI mode.
- Current phase.
- Player party.
- Enemy party.
- Active field Pokemon.
- Arena state.
- Modifiers.
- Money, score, seed, wave.
- Current battle metadata.

Save data is useful, but it is not enough for moment-to-moment decisions. The bridge should use save data for slot management and summaries, while using `globalScene` for active play.

## Proposed Runtime Pieces

```text
src/bot/
  index.ts
  bot-bridge.ts
  observation.ts
  actions.ts
  action-mask.ts
  save-reader.ts
  types.ts
```

Responsibilities:

- `index.ts`: installs the browser bridge when bot mode is enabled.
- `bot-bridge.ts`: implements the public `window.pokerogueBot` object.
- `observation.ts`: converts game classes into plain serializable JSON.
- `actions.ts`: validates and executes actions.
- `action-mask.ts`: reports legal actions for the current mode/phase.
- `save-reader.ts`: reads decoded system/session saves using existing helpers.
- `types.ts`: owns the stable bot API types.

## Bot Mode Activation

The bridge should be enabled only in a safe development context.

Preferred guard:

```text
development mode + VITE_ENABLE_BOT=true
```

Alternative guard:

```text
development mode + ?bot=1
```

Do not expose bot controls in production builds by default.

## External Runner

The external runner can use Playwright or Chrome DevTools Protocol.

Flow:

1. Start the Vite dev server.
2. Open the game in Chromium.
3. Wait until `window.pokerogueBot` exists.
4. Call `observe()`.
5. Choose an action.
6. Call `act(action)`.
7. Repeat until run ends or test stops.

## LLM Bot

The LLM bot should receive a compact prompt built from `BotObservation`.

The model should return strict JSON:

```json
{
  "action": {
    "type": "chooseMove",
    "index": 0
  },
  "reason": "Best available damage with safe accuracy."
}
```

The runner must validate the action before sending it to the browser. Invalid LLM output should fall back to a simple heuristic or request a corrected response.

## RL Bot

The RL bot should use the same observation/action contract.

Initial version can run through the browser bridge for correctness. Later, a faster headless/local environment can be built using existing test helpers and Phaser headless patterns.

Important RL features:

- Action masking.
- Deterministic seeds.
- Episode reset/load support.
- Reward shaping.
- Compact numeric observations.
- Run logs for replay/debugging.

## First Implementation Target

The first usable bridge should support:

```ts
await window.pokerogueBot.observe();

await window.pokerogueBot.act({
  type: "button",
  button: "ACTION",
});
```

After that works, add action masks and structured actions.
