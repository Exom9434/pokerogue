import { createBotBridge } from "./bot-bridge";

export function installBotBridge(): void {
  window.pokerogueBot = createBotBridge();
  console.info("Pokerogue bot bridge installed at window.pokerogueBot");
}

export type {
  BotAction,
  BotActionResult,
  BotArena,
  BotButton,
  BotModifier,
  BotMove,
  BotObservation,
  BotPokemon,
  BotSaveSummary,
  PokerogueBotBridge,
} from "./types";
