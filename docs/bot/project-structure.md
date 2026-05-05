# Bot Project Structure

This document records the proposed file structure for bot work.

## Documentation

```text
docs/bot/
  findings.md
  architecture.md
  project-structure.md
  save-data.md
  observation-schema.md
  implementation-plan.md
```

Purpose:

- `findings.md`: initial codebase findings.
- `architecture.md`: high-level design and runtime flow.
- `project-structure.md`: planned files and responsibilities.
- `save-data.md`: save keys, save schemas, and decoding notes.
- `observation-schema.md`: shared observation/action contract.
- `implementation-plan.md`: milestone sequence.

## Source

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

### `index.ts`

Installs the bot bridge when bot mode is enabled.

Expected responsibilities:

- Check environment/query flags.
- Register `window.pokerogueBot`.
- Avoid production exposure.

### `bot-bridge.ts`

Owns the public browser API.

Expected responsibilities:

- Implement `observe()`.
- Implement `act(action)`.
- Implement save access helpers.
- Return stable result objects.

### `observation.ts`

Converts game internals into plain JSON.

Expected responsibilities:

- Read from `globalScene`.
- Normalize Pokemon, moves, modifiers, arena, battle, UI, and phase state.
- Avoid exposing raw class instances.
- Keep the observation serializable.

### `actions.ts`

Executes bot actions.

Expected responsibilities:

- Validate action shape.
- Execute button actions through existing UI/input paths.
- Later, implement structured actions such as `chooseMove`.
- Return `BotActionResult`.

### `action-mask.ts`

Computes legal actions for the current state.

Expected responsibilities:

- Inspect UI mode and current handler.
- Return legal `BotAction[]`.
- Prevent LLM/RL agents from choosing impossible actions.

### `save-reader.ts`

Reads stored save data.

Expected responsibilities:

- Use existing project helpers and key conventions.
- Read session saves by slot.
- Read system save data.
- Avoid duplicating encryption/decryption logic.

### `types.ts`

Defines the stable bot interface.

Expected responsibilities:

- `BotObservation`
- `BotAction`
- `BotActionResult`
- `BotPokemon`
- `BotMove`
- `BotModifier`
- `BotArena`
- `BotSaveSummary`

## Scripts

```text
scripts/bot/
  browser-smoke.ts
  llm-agent.ts
  rl-env.ts
```

### `browser-smoke.ts`

Small Playwright/CDP script that verifies the bridge works.

Expected flow:

1. Open the local dev server.
2. Wait for `window.pokerogueBot`.
3. Call `observe()`.
4. Send one or more simple button actions.
5. Print observation/action results.

### `llm-agent.ts`

LLM policy runner.

Expected flow:

1. Read observation from browser.
2. Build compact prompt.
3. Ask LLM for strict JSON action.
4. Validate action against `availableActions`.
5. Execute action.
6. Log decision and result.

### `rl-env.ts`

RL environment wrapper.

Expected role:

- Provide reset/step-like API.
- Convert observations into numeric/vector features.
- Use action masks.
- Compute rewards.

## Recommended First Commit

First implementation commit should add only:

```text
src/bot/types.ts
src/bot/observation.ts
src/bot/actions.ts
src/bot/bot-bridge.ts
src/bot/index.ts
```

The first behavior should be minimal:

- `observe()`
- `act({ type: "button", button })`

Structured actions and RL/LLM runners should come after the basic browser bridge is verified.
