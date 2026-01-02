import { AssetKeeper } from "Generated/AssetKeeper";
import type { Platform } from "Libs/Platform/Platform";
import type { TinyParticleSystem } from "Libs/TinyParticleSystem/TinyParticleSystem";
import { MathUtils, Mesh, MeshStandardMaterial, Object3D } from "three";
import { SceneTraversal } from "three-zoo";
import { WeaponComponent } from "./WeaponComponent";

export class RifleWeaponComponent extends WeaponComponent {
  constructor(
    platform: Platform,
    anchor: Object3D,
    damage: number,
    flowColor: number,
    flowParticleSystem: TinyParticleSystem,
  ) {
    const rifleObjectName = "SM_Rifle";
    const rifleObject = SceneTraversal.getObjectByName(
      AssetKeeper.Weapons.scene,
      rifleObjectName,
    )?.clone();

    if (!rifleObject) {
      throw new Error(`${rifleObjectName} not found!`);
    }

    const material = SceneTraversal.cloneMaterialByName(
      rifleObject,
      "M_Rifle_Accent",
    );

    if (material instanceof MeshStandardMaterial) {
      material.color.set(flowColor);
    }

    SceneTraversal.enumerateObjectsByType(rifleObject, Mesh, (m: Mesh) => {
      m.castShadow = true;
      m.receiveShadow = true;
    });

    anchor.add(rifleObject);

    rifleObject.position.set(0.175, 0.095, 0.198);
    rifleObject.rotation.set(
      MathUtils.degToRad(-52.27),
      MathUtils.degToRad(22.71),
      MathUtils.degToRad(-117.33),
    );
    rifleObject.scale.set(1.25, 1.25, 1.25);

    const flowAnchor = new Object3D();
    flowAnchor.position.set(0, 0, 0.79);
    rifleObject.add(flowAnchor);

    super(platform, {
      range: 8,
      damage,
      damageSector: 20,
      flowAnchor,
      flowColor,
      flowGroundOffset: 1,
      flowParticleSystem,
    });
  }
}
