import type { SessionSaveData, SystemSaveData } from "#types/save-data";

export type BotButton =
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

export interface BotMove {
  id: number;
  name: string;
  pp?: number | undefined;
  maxPp?: number | undefined;
}

export interface BotPokemon {
  id?: number | undefined;
  name: string;
  speciesId?: number | undefined;
  level?: number | undefined;
  hp?: number | undefined;
  maxHp?: number | undefined;
  status?: string | null;
  moves: BotMove[];
  isPlayer: boolean;
  isActive: boolean;
  fainted: boolean;
}

export interface BotModifier {
  name: string;
  stackCount?: number | undefined;
  owner: "player" | "enemy";
}

export interface BotArena {
  biome?: string | undefined;
  weather?: string | undefined;
  terrain?: string | undefined;
  playerFaints?: number | undefined;
}

export interface BotSaveSummary {
  slot: number;
  name?: string | undefined;
  waveIndex?: number | undefined;
  gameMode?: string | undefined;
  score?: number | undefined;
  money?: number | undefined;
  timestamp?: number | undefined;
}

export type BotAction = { type: "button"; button: BotButton };

export interface BotObservation {
  ready: boolean;
  uiMode?: string | undefined;
  phase?: string | undefined;
  waveIndex?: number | undefined;
  battleType?: string | undefined;
  money?: number | undefined;
  score?: number | undefined;
  seed?: string | undefined;
  playerParty: BotPokemon[];
  enemyParty: BotPokemon[];
  playerField: BotPokemon[];
  enemyField: BotPokemon[];
  modifiers: BotModifier[];
  enemyModifiers: BotModifier[];
  arena?: BotArena | undefined;
  pokeballs?: Record<string, number> | undefined;
  availableActions: BotAction[];
  message?: string | undefined;
}

export interface BotActionResult {
  ok: boolean;
  action: BotAction;
  message?: string | undefined;
  observation?: BotObservation | undefined;
}

export interface PokerogueBotBridge {
  observe(): BotObservation;
  act(action: BotAction): Promise<BotActionResult>;
  getSave(slot?: number): Promise<SessionSaveData | undefined>;
  getSystemSave(): SystemSaveData | undefined;
}

declare global {
  interface Window {
    pokerogueBot?: PokerogueBotBridge;
  }
}
