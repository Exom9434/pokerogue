import { globalScene } from "#app/global-scene";
import type { SessionSaveData, SystemSaveData } from "#types/save-data";

export async function getBotSessionSave(slot = 0): Promise<SessionSaveData | undefined> {
  return globalScene?.gameData?.getSession(slot);
}

export function getBotSystemSave(): SystemSaveData | undefined {
  return globalScene?.gameData?.getSystemSaveData();
}
