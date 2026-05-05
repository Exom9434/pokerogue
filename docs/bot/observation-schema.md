# Bot Observation And Action Schema

This document defines the planned shared contract between the browser game and bot policies.

The same contract should support:

- LLM bot.
- RL bot.
- Scripted smoke bot.

## Principles

- Observations must be plain JSON.
- Do not expose raw Phaser objects or game class instances.
- Include enough state for a decision, but avoid huge dumps.
- Include `availableActions` so policies can avoid invalid actions.
- Keep action names stable.

## Initial Observation

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

## Pokemon Shape

Initial shape:

```ts
type BotPokemon = {
  id: number;
  name: string;
  speciesId: number;
  level: number;
  hp: number;
  maxHp: number;
  status?: string;
  types: string[];
  ability?: string;
  moves: BotMove[];
  statStages?: Record<string, number>;
  isPlayer: boolean;
  isActive: boolean;
  fainted: boolean;
};
```

Later additions:

- Nature.
- Held items.
- Tera type.
- Friendship.
- IVs.
- Boss segment data.
- Volatile battle tags.

## Move Shape

Initial shape:

```ts
type BotMove = {
  id: number;
  name: string;
  type: string;
  category?: string;
  power?: number;
  accuracy?: number;
  pp?: number;
  maxPp?: number;
};
```

Later additions:

- Priority.
- Targeting mode.
- Effect summary.
- Estimated damage.
- Whether move is currently selectable.

## Arena Shape

Initial shape:

```ts
type BotArena = {
  biome?: string;
  weather?: string;
  terrain?: string;
  tags?: string[];
  playerFaints?: number;
};
```

## Modifier Shape

Initial shape:

```ts
type BotModifier = {
  name: string;
  type?: string;
  stackCount?: number;
  owner: "player" | "enemy";
};
```

## Save Summary Shape

Initial shape:

```ts
type BotSaveSummary = {
  slot: number;
  name?: string;
  waveIndex?: number;
  gameMode?: string;
  score?: number;
  money?: number;
  timestamp?: number;
};
```

## Button Actions

First implementation:

```ts
type BotAction = {
  type: "button";
  button: BotButton;
};
```

Buttons should map to `src/enums/buttons.ts`.

```ts
type BotButton =
  | "UP"
  | "DOWN"
  | "LEFT"
  | "RIGHT"
  | "SUBMIT"
  | "ACTION"
  | "CANCEL"
  | "MENU"
  | "STATS"
  | "CYCLE_SHINY"
  | "CYCLE_FORM"
  | "CYCLE_GENDER"
  | "CYCLE_ABILITY"
  | "CYCLE_NATURE"
  | "CYCLE_TERA"
  | "SPEED_UP"
  | "SLOW_DOWN";
```

Do not expose `DEV_CUSTOM` to regular bot policies unless explicitly needed.

## Structured Actions

After button actions work, add:

```ts
type BotAction =
  | { type: "button"; button: BotButton }
  | { type: "chooseCommand"; command: "fight" | "ball" | "pokemon" | "run" }
  | { type: "chooseMove"; index: number }
  | { type: "chooseTarget"; index: number }
  | { type: "chooseModifier"; index: number };
```

Structured actions should internally translate to existing game behavior.

## Action Result

```ts
type BotActionResult = {
  ok: boolean;
  action: BotAction;
  message?: string;
  observation?: BotObservation;
};
```

On invalid input:

```ts
{
  ok: false,
  action,
  message: "Action is not available in current UI mode"
}
```

## Available Actions

`availableActions` should start simple:

- Always include legal button actions for current UI mode.
- Later include structured actions.

For RL, this becomes the action mask.

For LLM, this becomes the list of valid JSON choices.

## Implementation Order

1. Implement `BotButton`.
2. Implement `BotAction` with button actions only.
3. Implement minimal `BotObservation`.
4. Add `availableActions`.
5. Add structured command/move/target/modifier actions.
6. Add richer Pokemon/move/arena data.
