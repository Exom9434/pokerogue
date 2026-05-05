# Pokerogue Bot Findings

This document records the initial findings for building a bot interface for this project.

The goal is to support two bot implementations:

- An LLM bot that receives structured game information and returns decisions.
- An RL bot that uses the same observation/action interface for training and evaluation.

## Project Shape

Pokerogue is a Phaser/Vite TypeScript browser game.

Useful entry points:

- `src/main.ts` creates the Phaser game.
- `src/battle-scene.ts` is the primary gameplay scene.
- `src/global-scene.ts` exports `globalScene`, the active `BattleScene`.
- `src/ui-inputs.ts` converts input events into UI actions.
- `src/inputs-controller.ts` listens to keyboard/gamepad/touch input.
- `src/enums/buttons.ts` defines semantic buttons used by the game.

The bot should avoid screen scraping as the primary interface. The better approach is to expose a small dev/bot bridge from inside the browser that reads `globalScene` and executes semantic actions.

## Save Data Sources

Save-related files:

- `src/system/game-data.ts`
- `src/@types/save-data.ts`
- `src/account.ts`
- `src/utils/data.ts`
- `src/api/savedata-api.ts`
- `src/api/session-savedata-api.ts`
- `src/api/system-savedata-api.ts`

### Local Storage Keys

`src/account.ts` builds session save keys with `getSessionDataLocalStorageKey(slotId)`.

Expected local storage keys:

- `data_<username>`
- `sessionData_<username>`
- `sessionData1_<username>`
- `sessionData2_<username>`
- `sessionData3_<username>`
- `sessionData4_<username>`

For local guest play, the username is usually `Guest`, so likely keys are:

- `data_Guest`
- `sessionData_Guest`
- `sessionData1_Guest`
- `sessionData2_Guest`
- `sessionData3_Guest`
- `sessionData4_Guest`

### Encoding And Encryption

`src/utils/data.ts` contains:

- `encrypt(data, bypassLogin)`
- `decrypt(data, bypassLogin)`

When `bypassLogin` is true, save data is encoded with browser base64 helpers.
When `bypassLogin` is false, save data is encrypted with AES and `saveKey`.

The bot bridge should call existing project helpers instead of reimplementing this logic.

## Session Save Data

Defined in `src/@types/save-data.ts` as `SessionSaveData`.

Useful fields:

- `seed`
- `playTime`
- `gameMode`
- `dailyConfig`
- `party`
- `enemyParty`
- `modifiers`
- `enemyModifiers`
- `arena`
- `pokeballCounts`
- `money`
- `score`
- `waveIndex`
- `battleType`
- `trainer`
- `gameVersion`
- `name`
- `timestamp`
- `challenges`
- `mysteryEncounterType`
- `mysteryEncounterSaveData`
- `playerFaints`

Session save data is useful for:

- Reconstructing run state.
- Loading/reloading slots.
- Recording run history.
- LLM context summaries.
- RL episode metadata.

However, save data is not enough for moment-to-moment play. Live state from `globalScene` is more useful during decisions.

## System Save Data

Defined in `src/@types/save-data.ts` as `SystemSaveData`.

Useful fields:

- `trainerId`
- `secretId`
- `gender`
- `dexData`
- `starterData`
- `gameStats`
- `unlocks`
- `achvUnlocks`
- `voucherUnlocks`
- `voucherCounts`
- `eggs`
- `gameVersion`
- `timestamp`
- `eggPity`
- `unlockPity`

System save data is useful for:

- Starter selection.
- Long-term progression.
- Unlock-aware planning.
- Account-level statistics.
- Understanding available modes/items/features.

## Live Game State Sources

`src/system/game-data.ts#getSessionSaveData()` shows the most important live data sources:

- `globalScene.seed`
- `globalScene.sessionPlayTime`
- `globalScene.gameMode`
- `globalScene.getPlayerParty()`
- `globalScene.getEnemyParty()`
- `globalScene.findModifiers(...)`
- `globalScene.arena`
- `globalScene.pokeballCounts`
- `globalScene.money`
- `globalScene.score`
- `globalScene.currentBattle.waveIndex`
- `globalScene.currentBattle.battleType`
- `globalScene.currentBattle.trainer`
- `globalScene.currentBattle.mysteryEncounter`
- `globalScene.mysteryEncounterSaveData`
- `globalScene.arena.playerFaints`

Additional live data useful for a bot:

- `globalScene.ui.getMode()`
- `globalScene.ui.getHandler()`
- `globalScene.phaseManager.getCurrentPhase()`
- `globalScene.getPlayerField()`
- `globalScene.getEnemyField()`
- `globalScene.getField()`
- `globalScene.currentBattle.turnCommands`
- `globalScene.currentBattle.preTurnCommands`
- `globalScene.currentBattle.double`
- `globalScene.currentBattle.battleSeed`

The bot should convert these class-heavy objects into plain JSON before exposing them.

## Action Sources

`src/enums/buttons.ts` defines game-level buttons:

- `UP`
- `DOWN`
- `LEFT`
- `RIGHT`
- `SUBMIT`
- `ACTION`
- `CANCEL`
- `MENU`
- `STATS`
- `CYCLE_SHINY`
- `CYCLE_FORM`
- `CYCLE_GENDER`
- `CYCLE_ABILITY`
- `CYCLE_NATURE`
- `CYCLE_TERA`
- `SPEED_UP`
- `SLOW_DOWN`
- `DEV_CUSTOM`

`src/ui-inputs.ts` maps these buttons to actual UI behavior through `globalScene.ui.processInput(...)`.

Initial bot actions can be simple button presses. Later bot actions should be higher-level and validated against the current UI mode.

## Recommended Bot Folder Structure

Proposed source structure:

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

Proposed scripts:

```text
scripts/bot/
  browser-smoke.ts
  llm-agent.ts
  rl-env.ts
```

Proposed docs:

```text
docs/bot/
  findings.md
  architecture.md
  save-data.md
  observation-schema.md
```

## Recommended Browser Bridge

Expose a dev/bot-only object in the browser:

```ts
window.pokerogueBot = {
  observe(): BotObservation,
  act(action: BotAction): Promise<BotActionResult>,
  getSave(slot?: number): Promise<SessionSaveData | undefined>,
  getSystemSave(): SystemSaveData,
  setSpeed(speed: number): void,
};
```

The external bot runner can use Playwright or Chrome DevTools Protocol:

1. Start the Vite dev server.
2. Open Pokerogue in Chromium.
3. Wait for `window.pokerogueBot`.
4. Loop over `observe -> policy -> act`.

## Recommended Observation Shape

Initial normalized observation:

```ts
type BotObservation = {
  uiMode: string;
  phase: string;
  waveIndex: number;
  battleType: string;
  money: number;
  score: number;
  seed: string;
  playerParty: BotPokemon[];
  enemyParty: BotPokemon[];
  playerField: BotPokemon[];
  enemyField: BotPokemon[];
  modifiers: BotModifier[];
  enemyModifiers: BotModifier[];
  arena: BotArena;
  pokeballs: Record<string, number>;
  availableActions: BotAction[];
  save?: BotSaveSummary;
};
```

Important rule: do not expose raw Phaser/game class instances directly. Always normalize into serializable JSON.

## Recommended Action Shape

Start with:

```ts
type BotAction =
  | { type: "button"; button: BotButton };
```

Then add structured actions:

```ts
type BotAction =
  | { type: "button"; button: BotButton }
  | { type: "chooseCommand"; command: "fight" | "ball" | "pokemon" | "run" }
  | { type: "chooseMove"; index: number }
  | { type: "chooseTarget"; index: number }
  | { type: "chooseModifier"; index: number };
```

Structured actions are better for both LLM and RL bots because they reduce invalid input and allow action masking.

## Recommended Milestones

1. Document save and live-state sources.
2. Add dev-only `window.pokerogueBot.observe()`.
3. Add dev-only `window.pokerogueBot.act({ type: "button" })`.
4. Create a browser smoke bot that can press valid buttons.
5. Add `availableActions` and structured actions.
6. Build an LLM agent around the shared observation/action contract.
7. Build an RL environment wrapper around the same contract.
8. Add evaluation metrics: waves reached, win rate, average score, decision latency, faints, and invalid action rate.

## Current Recommendation

Build the browser bridge first. It should use `globalScene` for live information and existing save helpers for stored information.

Save data is useful for memory, slot management, and episode setup. Live state is the primary source for making decisions during gameplay.
