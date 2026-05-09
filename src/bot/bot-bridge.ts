import { act } from "./actions";
import { getBotObservation } from "./observation";
import { getBotSessionSave, getBotSystemSave } from "./save-reader";
import type { PokerogueBotBridge } from "./types";

export function createBotBridge(): PokerogueBotBridge {
  return {
    observe: getBotObservation,
    act,
    getSave: getBotSessionSave,
    getSystemSave: getBotSystemSave,
  };
}
