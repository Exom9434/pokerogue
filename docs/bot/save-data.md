# Bot Save Data Notes

This document records where game information is saved and how bot code should use it.

## Relevant Files

Save-related files:

- `src/system/game-data.ts`
- `src/@types/save-data.ts`
- `src/account.ts`
- `src/utils/data.ts`
- `src/api/savedata-api.ts`
- `src/api/session-savedata-api.ts`
- `src/api/system-savedata-api.ts`

## Local Storage Keys

`src/account.ts` defines:

```ts
getSessionDataLocalStorageKey(slotId: number): string
```

Session keys follow this pattern:

```text
sessionData_<username>
sessionData1_<username>
sessionData2_<username>
sessionData3_<username>
sessionData4_<username>
```

System save key:

```text
data_<username>
```

For local guest mode, likely keys are:

```text
data_Guest
sessionData_Guest
sessionData1_Guest
sessionData2_Guest
sessionData3_Guest
sessionData4_Guest
```

## Encoding And Encryption

`src/utils/data.ts` contains:

```ts
encrypt(data: string, bypassLogin: boolean): string
decrypt(data: string, bypassLogin: boolean): string
```

Behavior:

- If `bypassLogin` is true, the data is encoded with browser base64 helpers.
- If `bypassLogin` is false, the data is encrypted with AES and `saveKey`.

Bot code should call existing helpers instead of duplicating this logic.

## Session Save Data

`SessionSaveData` is defined in `src/@types/save-data.ts`.

Fields:

```ts
type SessionSaveData = {
  seed: string;
  playTime: number;
  gameMode: GameModes;
  dailyConfig?: SerializedDailyRunConfig;
  party: PokemonData[];
  enemyParty: PokemonData[];
  modifiers: ModifierData[];
  enemyModifiers: ModifierData[];
  arena: ArenaData;
  pokeballCounts: PokeballCounts;
  money: number;
  score: number;
  waveIndex: number;
  battleType: BattleType;
  trainer: TrainerData;
  gameVersion: string;
  name: string;
  timestamp: number;
  challenges: ChallengeData[];
  mysteryEncounterType: MysteryEncounterType | -1;
  mysteryEncounterSaveData: MysteryEncounterSaveData;
  playerFaints: number;
};
```

Use session data for:

- Slot loading/reloading.
- Run summaries.
- Replay metadata.
- LLM memory.
- RL episode metadata.

Do not rely only on session data for current decisions. It may lag behind live state.

## System Save Data

`SystemSaveData` is defined in `src/@types/save-data.ts`.

Fields:

```ts
type SystemSaveData = {
  trainerId: number;
  secretId: number;
  gender: PlayerGender;
  dexData: DexData;
  starterData: StarterData;
  gameStats: GameStats;
  unlocks: Unlocks;
  achvUnlocks: AchvUnlocks;
  voucherUnlocks: VoucherUnlocks;
  voucherCounts: VoucherCounts;
  eggs: EggData[];
  gameVersion: string;
  timestamp: number;
  eggPity: number[];
  unlockPity: number[];
};
```

Use system data for:

- Starter planning.
- Unlock-aware decisions.
- Long-term progression summaries.
- Account statistics.
- Available feature/mode checks.

## Live Save Builders

`src/system/game-data.ts#getSessionSaveData()` builds session data from live state.

Important live sources used there:

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

This method is a useful reference for the observation builder.

## Bot Save Reader Recommendation

Add:

```text
src/bot/save-reader.ts
```

Recommended API:

```ts
export async function getBotSessionSave(slot = 0): Promise<SessionSaveData | undefined>;
export function getBotSystemSave(): SystemSaveData;
export function getBotSaveSummary(slot = 0): Promise<BotSaveSummary | undefined>;
```

The first implementation can delegate to:

- `globalScene.gameData.getSession(slot)`
- `globalScene.gameData.getSystemSaveData()`

This avoids duplicating localStorage and decryption details.
