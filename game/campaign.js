import { newGame, stepGame, nextLevel } from "./sim.js";
import { LEVELS } from "./levels.js";
import { TICK, unpackInput, validateInputs } from "./daily.js";
import { upgradeChoices } from "./arcade.js";

export const CAMPAIGN_RULESET = "campaign-2";
// Replay versions change; the all-time board keeps its existing records.
export const CAMPAIGN_BOARD = "campaign-1:all";

async function replayCampaign(
  config,
  stages,
  yieldTurn = async () => {},
  checkpoint = false,
) {
  if (
    config.ruleset !== CAMPAIGN_RULESET ||
    !Number.isInteger(config.seed) ||
    config.seed < 0 ||
    config.seed > 0xffffffff ||
    !Array.isArray(stages) ||
    !stages.length ||
    stages.length > LEVELS.length
  )
    throw new Error("Invalid campaign replay");

  for (const [index, stage] of stages.entries()) {
    if (!stage || typeof stage !== "object")
      throw new Error("Invalid campaign stage");
    if (!(
      checkpoint &&
      index === stages.length - 1 &&
      Array.isArray(stage.inputs) &&
      !stage.inputs.length
    ))
      validateInputs(stage.inputs, Math.ceil(LEVELS[index].time / TICK) + 1);
  }
  let game = newGame(0, { seed: config.seed });
  let ticks = 0,
    kills = 0,
    crumbs = 0,
    shots = 0;
  for (const [index, stage] of stages.entries()) {
    if (index === 0) {
      if (stage.upgrade != null) throw new Error("Invalid starting equipment");
    } else {
      if (
        game.state !== "cleared" ||
        !upgradeChoices(game).includes(stage.upgrade)
      )
        throw new Error("Invalid campaign upgrade or skipped aisle");
      game = nextLevel(game, stage.upgrade);
    }
    for (const row of stage.inputs) {
      const input = unpackInput(row);
      for (let i = 0; i < row[0]; i++) {
        if (game.state !== "playing")
          throw new Error("Input after the aisle ended");
        stepGame(game, input, TICK);
        ticks++;
        // Long campaigns yield so live multiplayer rooms can keep advancing.
        if (ticks % 600 === 0) await yieldTurn();
      }
    }
    kills += game.kills;
    crumbs += game.collected;
    shots += game.shots;
  }
  if (checkpoint) {
    if (
      game.state !== "cleared" &&
      !(game.state === "playing" && game.elapsed === 0)
    )
      throw new Error("Invalid campaign checkpoint");
    return {
      game,
      ticks,
      kills: kills - game.kills,
      crumbs: crumbs - game.collected,
      shots: shots - game.shots,
      time: ticks * TICK - game.elapsed,
    };
  }
  if (!["lost", "won"].includes(game.state))
    throw new Error("Finish the campaign run before submitting");
  return {
    score: game.score,
    kills,
    crumbs,
    ticks,
    floor: game.levelIndex + 1,
    survived: game.state === "won",
  };
}

export const verifyCampaign = (config, stages, yieldTurn) =>
  replayCampaign(config, stages, yieldTurn);

export const restoreCampaign = (config, stages, yieldTurn) =>
  replayCampaign(config, stages, yieldTurn, true);
