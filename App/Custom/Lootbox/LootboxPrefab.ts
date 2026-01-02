import { AssetKeeper } from "Generated/AssetKeeper";
import { Platform } from "Libs/Platform/Platform";
import type { Quaternion, Vector3 } from "three";
import { Mesh, Object3D } from "three";
import { SceneTraversal } from "three-zoo";
import { LootboxComponent } from "./LootboxComponent";

export class LootboxPrefab extends Object3D {
  public static instantiate(
    position: Vector3,
    quaternion: Quaternion,
  ): { platform: Platform; components: { lootbox: LootboxComponent } } {
    const platform = new Platform();
    platform.position.copy(position);
    platform.quaternion.copy(quaternion);
    platform.add(...AssetKeeper.SM_Box.scene.clone().children);
    App.World?.Scene.add(platform);

    SceneTraversal.enumerateObjectsByType(platform, Mesh, (m: Mesh) => {
      m.castShadow = true;
      m.receiveShadow = true;
    });

    const lootbox = new LootboxComponent(platform);

    return { platform, components: { lootbox } };
  }
}
