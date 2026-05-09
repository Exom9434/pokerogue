import { globalScene } from "#app/global-scene";
import { TerrainType } from "#data/terrain";
import { BattleType } from "#enums/battle-type";
import { BiomeId } from "#enums/biome-id";
import { Button } from "#enums/buttons";
import { UiMode } from "#enums/ui-mode";
import { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";
import type { PersistentModifier } from "#modifiers/modifier";
import type { BotAction, BotArena, BotModifier, BotMove, BotObservation, BotPokemon } from "./types";

const availableButtonNames = [
  "UP",
  "DOWN",
  "LEFT",
  "RIGHT",
  "SUBMIT",
  "ACTION",
  "CANCEL",
  "MENU",
  "STATS",
  "CYCLE_SHINY",
  "CYCLE_FORM",
  "CYCLE_GENDER",
  "CYCLE_ABILITY",
  "CYCLE_NATURE",
  "CYCLE_TERA",
  "SPEED_UP",
  "SLOW_DOWN",
] as const;

export function getAvailableBotActions(): BotAction[] {
  return availableButtonNames.map(button => ({ type: "button", button }));
}

export function getBotObservation(): BotObservation {
  if (!globalScene) {
    return {
      ready: false,
      playerParty: [],
      enemyParty: [],
      playerField: [],
      enemyField: [],
      modifiers: [],
      enemyModifiers: [],
      availableActions: [],
      message: "Battle scene is not ready yet.",
    };
  }

  const currentBattle = globalScene.currentBattle;
  const uiMode = getUiModeName();

  return {
    ready: true,
    uiMode,
    phase: getCurrentPhaseName(),
    waveIndex: currentBattle?.waveIndex,
    battleType: getBattleTypeName(currentBattle?.battleType),
    money: globalScene.money,
    score: globalScene.score,
    seed: globalScene.seed,
    playerParty: safeList(() => globalScene.getPlayerParty()).map(p => toBotPokemon(p, true)),
    enemyParty: safeList(() => globalScene.getEnemyParty()).map(p => toBotPokemon(p, false)),
    playerField: safeList(() => globalScene.getPlayerField()).map(p => toBotPokemon(p, true)),
    enemyField: safeList(() => globalScene.getEnemyField()).map(p => toBotPokemon(p, false)),
    modifiers: safeList(() => globalScene.findModifiers(() => true)).map(m => toBotModifier(m, "player")),
    enemyModifiers: safeList(() => globalScene.findModifiers(() => true, false)).map(m => toBotModifier(m, "enemy")),
    arena: toBotArena(),
    pokeballs: { ...globalScene.pokeballCounts },
    availableActions: getAvailableBotActions(),
  };
}

function getUiModeName(): string | undefined {
  const mode = globalScene.ui?.getMode();
  return mode == null ? undefined : UiMode[mode];
}

function getCurrentPhaseName(): string | undefined {
  try {
    return globalScene.phaseManager?.getCurrentPhase()?.phaseName;
  } catch {
    return;
  }
}

function getBattleTypeName(battleType: BattleType | undefined): string | undefined {
  return battleType == null ? undefined : BattleType[battleType];
}

function toBotPokemon(pokemon: Pokemon | null | undefined, isPlayer: boolean): BotPokemon {
  if (!pokemon) {
    return {
      name: "Empty",
      moves: [],
      isPlayer,
      isActive: false,
      fainted: true,
    };
  }

  return {
    id: pokemon.id,
    name: getPokemonName(pokemon),
    speciesId: pokemon.species?.speciesId,
    level: pokemon.level,
    hp: pokemon.hp,
    maxHp: safeValue(() => pokemon.getMaxHp()),
    status: pokemon.status?.effect == null ? null : String(pokemon.status.effect),
    moves: safeList(() => pokemon.getMoveset()).map(toBotMove),
    isPlayer,
    isActive: safeValue(() => pokemon.isActive(true)) ?? false,
    fainted: safeValue(() => pokemon.isFainted()) ?? false,
  };
}

function getPokemonName(pokemon: Pokemon): string {
  return safeValue(() => pokemon.getName()) ?? pokemon.name ?? pokemon.species?.getName() ?? "Unknown";
}

function toBotMove(move: any): BotMove {
  return {
    id: move.moveId,
    name: safeValue(() => move.getName()) ?? String(move.moveId),
    pp: move.ppUsed == null || move.getMovePp == null ? undefined : Math.max(move.getMovePp() - move.ppUsed, 0),
    maxPp: safeValue(() => move.getMovePp()),
  };
}

function toBotModifier(modifier: PersistentModifier, owner: "player" | "enemy"): BotModifier {
  return {
    name: modifier.constructor.name,
    stackCount: "stackCount" in modifier ? (modifier.stackCount as number) : undefined,
    owner,
  };
}

function toBotArena(): BotArena | undefined {
  const arena = globalScene.arena;
  if (!arena) {
    return;
  }

  return {
    biome: arena.biomeId == null ? undefined : BiomeId[arena.biomeId],
    weather: arena.weatherType == null ? undefined : WeatherType[arena.weatherType],
    terrain: arena.terrainType == null ? undefined : TerrainType[arena.terrainType],
    playerFaints: arena.playerFaints,
  };
}

function safeList<T>(read: () => T[] | readonly T[] | null | undefined): T[] {
  try {
    return [...(read() ?? [])];
  } catch {
    return [];
  }
}

function safeValue<T>(read: () => T): T | undefined {
  try {
    return read();
  } catch {
    return;
  }
}

void Button;
