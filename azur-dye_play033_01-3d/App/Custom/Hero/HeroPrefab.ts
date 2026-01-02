import { CollisionHandler } from "Custom/CollisionHandler";
import { HealthProgressComponent } from "Custom/HealthProgressComponent";
import { Shared } from "Custom/Shared";
import { PistolWeaponComponent } from "Custom/Weapons/PistolWeaponComponent";
import type { WeaponComponent } from "Custom/Weapons/WeaponComponent";
import { AssetKeeper } from "Generated/AssetKeeper";
import { OperatorComponent } from "Libs/Platform/OperatorComponent";
import { PawnComponent } from "Libs/Platform/PawnComponent";
import { Platform } from "Libs/Platform/Platform";
import { type Quaternion, type Vector3 } from "three";
import { HeroArrowComponent } from "./HeroArrowComponent";
import { HeroBehaviorComponent } from "./HeroBehaviorComponent";
import { HeroVisualizerComponent } from "./HeroVisualizerComponent";

export class HeroPrefab {
  public static instantiate(
    position: Vector3,
    quaternion: Quaternion,
  ): {
    platform: Platform;
    components: {
      pawn: PawnComponent;
      behavior: HeroBehaviorComponent;
      arrow: HeroArrowComponent;
      visualizer: HeroVisualizerComponent;
      weapon: WeaponComponent;
      progress: HealthProgressComponent;
      operator: OperatorComponent;
    };
  } {
    const platform = new Platform();
    platform.position.copy(position);
    platform.quaternion.copy(quaternion);
    App.World?.Scene.add(platform);

    const pawn = new PawnComponent(
      platform,
      32,
      32,
      8,
      CollisionHandler.player,
      250,
    );

    const behavior = new HeroBehaviorComponent(platform);

    const arrow = new HeroArrowComponent(platform);

    const visualizer = new HeroVisualizerComponent(platform, pawn);

    const weapon = new PistolWeaponComponent(
      platform,
      visualizer.weaponAnchor,
      100,
      Shared.heroTeamColor,
      Shared.heroParticleSystem,
    );

    const progress = new HealthProgressComponent(
      platform,
      AssetKeeper.T_HealthProgressForeground,
      visualizer.progressAnchor,
      behavior.healthDescriptor,
      Shared.heroTeamColor,
    );

    const operator = new OperatorComponent(platform);
    operator.camera = App.World?.Camera;
    operator.distance = 30;
    operator.azimuth = -100;
    operator.elevation = 45;
    operator.lookAtOffset.set(0, 1, 0);

    App.World?.Scene.add(platform);

    return {
      platform,
      components: {
        pawn,
        behavior,
        arrow,
        visualizer,
        weapon,
        progress,
        operator,
      },
    };
  }
}
