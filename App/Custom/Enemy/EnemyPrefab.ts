import { CollisionHandler } from "Custom/CollisionHandler";
import { HealthProgressComponent } from "Custom/HealthProgressComponent";
import { Shared } from "Custom/Shared";
import { PistolWeaponComponent } from "Custom/Weapons/PistolWeaponComponent";
import type { WeaponComponent } from "Custom/Weapons/WeaponComponent";
import { AssetKeeper } from "Generated/AssetKeeper";
import { PawnComponent } from "Libs/Platform/PawnComponent";
import { Platform } from "Libs/Platform/Platform";
import type { Quaternion, Vector3 } from "three";
import { EnemyBehaviorComponent } from "./EnemyBehaviorComponent";
import { EnemyVisualizerComponent } from "./EnemyVisualizerComponent";

export interface EnemyPrefabOptions {
  position: Vector3;
  quaternion: Quaternion;
  acceleration: number;
  deceleration: number;
  maximumSpeed: number;
  damage: number;
  health: number;
}

export class EnemyPrefab {
  public static instantiate(options: EnemyPrefabOptions): {
    platform: Platform;
    components: {
      pawn: PawnComponent;
      visualizer: EnemyVisualizerComponent;
      weapon: WeaponComponent;
      behavior: EnemyBehaviorComponent;
      progress: HealthProgressComponent;
    };
  } {
    const platform = new Platform();
    platform.position.copy(options.position);
    platform.quaternion.copy(options.quaternion);
    App.World?.Scene.add(platform);

    const pawn = new PawnComponent(
      platform,
      options.acceleration,
      options.deceleration,
      options.maximumSpeed,
      CollisionHandler.enemy,
    );

    const visualizer = new EnemyVisualizerComponent(platform, pawn);

    const weapon = new PistolWeaponComponent(
      platform,
      visualizer.weaponAnchor,
      options.damage,
      Shared.enemyTeamColor,
      Shared.enemyParticleSystem,
    );

    const behavior = new EnemyBehaviorComponent(
      platform,
      pawn,
      weapon,
      options.health,
    );

    const progress = new HealthProgressComponent(
      platform,
      AssetKeeper.T_HealthProgressForeground,
      visualizer.progressAnchor,
      behavior.healthDescriptor,
      Shared.enemyTeamColor,
    );

    return {
      platform,
      components: { pawn, visualizer, weapon, behavior, progress },
    };
  }
}
