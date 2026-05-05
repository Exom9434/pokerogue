# Bot Implementation Plan

This document records the recommended implementation sequence.

## Phase 1: Documentation And Branch Setup

Status: in progress.

Tasks:

- Create bot documentation folder.
- Record findings.
- Record architecture.
- Record save data notes.
- Record observation/action schema.
- Record project structure.

Output:

```text
docs/bot/
```

## Phase 2: Minimal Browser Bridge

Goal:

Expose a dev-only browser object:

```ts
window.pokerogueBot
```

Minimum API:

```ts
observe(): BotObservation
act(action: BotAction): Promise<BotActionResult>
```

Minimum supported action:

```ts
{ type: "button", button: "ACTION" }
```

Files:

```text
src/bot/index.ts
src/bot/bot-bridge.ts
src/bot/observation.ts
src/bot/actions.ts
src/bot/types.ts
```

Verification:

- Run dev server.
- Open browser.
- Confirm `window.pokerogueBot` exists.
- Call `window.pokerogueBot.observe()`.
- Call `window.pokerogueBot.act({ type: "button", button: "ACTION" })`.

## Phase 3: Basic Observation

Goal:

Return enough information for a bot to understand the current state.

Include:

- UI mode.
- Current phase.
- Seed.
- Wave.
- Money.
- Score.
- Battle type.
- Player party.
- Enemy party.
- Player field.
- Enemy field.
- Arena summary.
- Modifier summary.
- Pokeball counts.

Verification:

- Observation can be JSON-stringified.
- Observation does not expose raw class instances.
- Observation works during title screen, battle, item select, and menus.

## Phase 4: Action Mask

Goal:

Expose valid actions for the current state.

Add:

```ts
availableActions: BotAction[]
```

Start with button actions. Later include structured actions.

Verification:

- LLM/RL policy can choose only from `availableActions`.
- Invalid actions return `ok: false`.

## Phase 5: Structured Actions

Goal:

Move beyond directional button navigation.

Add:

```ts
{ type: "chooseCommand", command: "fight" | "ball" | "pokemon" | "run" }
{ type: "chooseMove", index: number }
{ type: "chooseTarget", index: number }
{ type: "chooseModifier", index: number }
```

Verification:

- Bot can choose battle commands.
- Bot can choose moves.
- Bot can choose rewards.
- Bot can handle target selection.

## Phase 6: Browser Smoke Runner

Goal:

Create a small external script that proves the browser bridge works.

File:

```text
scripts/bot/browser-smoke.ts
```

Flow:

1. Open local dev server.
2. Wait for `window.pokerogueBot`.
3. Print observation.
4. Execute one or more valid actions.
5. Print action results.

## Phase 7: LLM Bot

Goal:

Build an LLM policy loop around the shared bridge.

Files:

```text
scripts/bot/llm-agent.ts
```

Flow:

1. Read observation.
2. Build compact prompt.
3. Ask model for strict JSON.
4. Validate action against `availableActions`.
5. Execute action.
6. Log decision and result.

Fallback:

- If JSON is invalid, ask once for correction.
- If still invalid, use a simple heuristic.

## Phase 8: RL Bot

Goal:

Build an RL environment wrapper around the shared bridge.

File:

```text
scripts/bot/rl-env.ts
```

Initial environment API:

```ts
reset(): Promise<BotObservation>
step(action: BotAction): Promise<{
  observation: BotObservation;
  reward: number;
  terminated: boolean;
  truncated: boolean;
  info: Record<string, unknown>;
}>
```

Initial reward ideas:

- Positive reward for enemy damage.
- Positive reward for enemy faint.
- Positive reward for wave clear.
- Negative reward for player damage.
- Negative reward for player faint.
- Large positive reward for victory.
- Large negative reward for loss.

## Phase 9: Faster Headless Environment

Goal:

Reduce training overhead after the browser bridge is proven.

Possible route:

- Reuse existing test helpers.
- Reuse Phaser headless test setup.
- Build a deterministic episode runner.

The browser bridge remains useful for validation and visual debugging.

## Suggested Next Concrete Step

Implement Phase 2:

- Add `src/bot/types.ts`.
- Add `src/bot/observation.ts`.
- Add `src/bot/actions.ts`.
- Add `src/bot/bot-bridge.ts`.
- Add `src/bot/index.ts`.
- Hook it into the app only in dev/bot mode.
