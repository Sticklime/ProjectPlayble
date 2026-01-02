import { AssetKeeper } from "Generated/AssetKeeper";
import { TinyParticleSystem } from "Libs/TinyParticleSystem/TinyParticleSystem";
import { Color } from "three";
import { LevelPaintingCanvas } from "./LevelPaintingCanvas";

export class Shared {
  public static readonly enemyTeamColor = 0xf80406;
  public static readonly heroTeamColor = 0x2477ff;

  private static enemyParticleSystemInternal?: TinyParticleSystem;
  private static heroParticleSystemInternal?: TinyParticleSystem;
  private static lootboxParticleSystemInternal?: TinyParticleSystem;
  private static levelPaintingCanvasInternal?: LevelPaintingCanvas;

  public static get enemyParticleSystem(): TinyParticleSystem {
    if (!Shared.enemyParticleSystemInternal) {
      Shared.enemyParticleSystemInternal = new TinyParticleSystem(
        {
          capacity: 1024,
          gravity: { x: 0, y: -9.81, z: 0 },
        },
        {
          texture: AssetKeeper.T_Splash,
          color: new Color(Shared.enemyTeamColor).convertLinearToSRGB(),
        },
      );
    }

    return Shared.enemyParticleSystemInternal;
  }

  public static get heroParticleSystem(): TinyParticleSystem {
    if (!Shared.heroParticleSystemInternal) {
      Shared.heroParticleSystemInternal = new TinyParticleSystem(
        {
          capacity: 1024,
          gravity: { x: 0, y: -9.81, z: 0 },
        },
        {
          texture: AssetKeeper.T_Splash,
          color: new Color(Shared.heroTeamColor).convertLinearToSRGB(),
        },
      );
    }

    return Shared.heroParticleSystemInternal;
  }

  public static get lootboxParticleSystem(): TinyParticleSystem {
    if (!Shared.lootboxParticleSystemInternal) {
      Shared.lootboxParticleSystemInternal = new TinyParticleSystem(
        {
          capacity: 1024,
          gravity: { x: 0, y: 0, z: 0 },
          useRawDeltaTime: true,
        },
        {
          texture: AssetKeeper.T_Star,
          depthTest: false,
          depthWrite: false,
        },
      );
    }

    return Shared.lootboxParticleSystemInternal;
  }

  public static get levelPaintingCanvas(): LevelPaintingCanvas {
    if (!Shared.levelPaintingCanvasInternal) {
      Shared.levelPaintingCanvasInternal = new LevelPaintingCanvas({
        min: { x: -38, y: -46 },
        max: { x: 57, y: 46 },
        resolution: 512,
        brushCount: 10,
      });
    }

    return Shared.levelPaintingCanvasInternal;
  }
}
