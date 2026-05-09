import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { getBotObservation } from "./observation";
import type { BotAction, BotActionResult, BotButton } from "./types";

const botButtonMap = {
  UP: Button.UP,
  DOWN: Button.DOWN,
  LEFT: Button.LEFT,
  RIGHT: Button.RIGHT,
  SUBMIT: Button.SUBMIT,
  ACTION: Button.ACTION,
  CANCEL: Button.CANCEL,
  MENU: Button.MENU,
  STATS: Button.STATS,
  CYCLE_SHINY: Button.CYCLE_SHINY,
  CYCLE_FORM: Button.CYCLE_FORM,
  CYCLE_GENDER: Button.CYCLE_GENDER,
  CYCLE_ABILITY: Button.CYCLE_ABILITY,
  CYCLE_NATURE: Button.CYCLE_NATURE,
  CYCLE_TERA: Button.CYCLE_TERA,
  SPEED_UP: Button.SPEED_UP,
  SLOW_DOWN: Button.SLOW_DOWN,
} satisfies Record<BotButton, Button>;

export async function act(action: BotAction): Promise<BotActionResult> {
  if (!globalScene) {
    return {
      ok: false,
      action,
      message: "Battle scene is not ready yet.",
    };
  }

  if (action.type !== "button") {
    return {
      ok: false,
      action,
      message: `Unsupported bot action type: ${(action as any).type}`,
    };
  }

  const button = botButtonMap[action.button];
  if (button == null) {
    return {
      ok: false,
      action,
      message: `Unsupported bot button: ${action.button}`,
    };
  }

  globalScene.game.events.emit("input_down", {
    controller_type: "keyboard",
    button,
  });

  globalScene.game.events.emit("input_up", {
    controller_type: "keyboard",
    button,
  });

  await new Promise(resolve => globalScene.time.delayedCall(0, resolve));

  return {
    ok: true,
    action,
    observation: getBotObservation(),
  };
}
