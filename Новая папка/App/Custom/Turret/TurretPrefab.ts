import { HealthDescriptor } from "Custom/HealthDescriptor";
import { Platform } from "Libs/Platform/Platform";
import type { TinyParticleSystem } from "Libs/TinyParticleSystem/TinyParticleSystem";
import { type Quaternion, type Vector3 } from "three";
import { TurretBehaviorComponent } from "./TurretBehaviorComponent";
import type { TurretEnemyTeamDescriptor } from "./TurretEnemyTeamDescriptor";
import type { TurretHeroTeamDescriptor } from "./TurretHeroTeamDescriptor";
import { TurretWeaponComponent } from "./TurretWeaponComponent";

export interface TurretPrefabOptions {
  transform: {
    position: Vector3;
    quaternion: Quaternion;
  };
  color: number;
  teamDescriptor: TurretHeroTeamDescriptor | TurretEnemyTeamDescriptor;
  particleSystem: TinyParticleSystem;
}

export class TurretPrefab {
  public static instantiate(options: TurretPrefabOptions): {
    platform: Platform;
    components: {
      weapon: TurretWeaponComponent;
      behavior: TurretBehaviorComponent;
    };
  } {
    const platform = new Platform();
    platform.position.copy(options.transform.position);
    platform.quaternion.copy(options.transform.quaternion);
    App.World?.Scene.add(platform);

    const weapon = new TurretWeaponComponent(
      platform,
      32,
      options.color,
      options.particleSystem,
    );

    const behavior = new TurretBehaviorComponent(
      platform,
      options.teamDescriptor,
      new HealthDescriptor(65536, 65536),
      weapon,
    );

    App.World?.Scene.add(platform);

    return {
      platform,
      components: { weapon, behavior },
    };
  }
}
