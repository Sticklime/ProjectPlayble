import { AssetKeeper } from "Generated/AssetKeeper";
import type { Platform } from "Libs/Platform/Platform";
import type { TinyParticleSystem } from "Libs/TinyParticleSystem/TinyParticleSystem";
import { MathUtils, Mesh, MeshStandardMaterial, Object3D } from "three";
import { SceneTraversal } from "three-zoo";
import { WeaponComponent } from "./WeaponComponent";

export class PistolWeaponComponent extends WeaponComponent {
  constructor(
    platform: Platform,
    anchor: Object3D,
    damage: number,
    flowColor: number,
    flowParticleSystem: TinyParticleSystem,
  ) {
    const pistolObjectName = "SM_Pistol";
    const pistolObject = SceneTraversal.getObjectByName(
      AssetKeeper.Weapons.scene,
      pistolObjectName,
    )?.clone();

    if (!pistolObject) {
      throw new Error(`${pistolObjectName} not found!`);
    }

    const material = SceneTraversal.cloneMaterialByName(
      pistolObject,
      "M_Pistol_Accent",
    );

    if (material instanceof MeshStandardMaterial) {
      material.color.set(flowColor);
    }

    SceneTraversal.enumerateObjectsByType(pistolObject, Mesh, (m: Mesh) => {
      m.castShadow = true;
      m.receiveShadow = true;
    });

    anchor.add(pistolObject);

    pistolObject.position.set(0.175, 0.095, 0.198);
    pistolObject.rotation.set(
      MathUtils.degToRad(-52.27),
      MathUtils.degToRad(22.71),
      MathUtils.degToRad(-117.33),
    );
    pistolObject.scale.set(1.25, 1.25, 1.25);

    const flowAnchor = new Object3D();
    flowAnchor.position.set(0, 0, 0.32);
    pistolObject.add(flowAnchor);

    super(platform, {
      range: 5,
      damage,
      damageSector: 45,
      flowAnchor,
      flowColor,
      flowGroundOffset: 1,
      flowParticleSystem,
    });
  }
}
