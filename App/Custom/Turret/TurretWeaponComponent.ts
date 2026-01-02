import { WeaponComponent } from "Custom/Weapons/WeaponComponent";
import { AssetKeeper } from "Generated/AssetKeeper";
import type { Platform } from "Libs/Platform/Platform";
import type { TinyParticleSystem } from "Libs/TinyParticleSystem/TinyParticleSystem";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import { SceneTraversal } from "three-zoo";

export class TurretWeaponComponent extends WeaponComponent {
  constructor(
    platform: Platform,
    damage: number,
    flowColor: number,
    flowParticleSystem: TinyParticleSystem,
  ) {
    const turretObjectName = "SM_Turret";
    const turretObject = AssetKeeper.Weapons.scene
      .getObjectByName(turretObjectName)
      ?.clone();

    if (!turretObject) {
      throw new Error(`${turretObjectName} not found!`);
    }

    const material = SceneTraversal.cloneMaterialByName(
      turretObject,
      "M_Turret_Accent",
    );

    if (material instanceof MeshStandardMaterial) {
      material.color.set(flowColor);
    }

    SceneTraversal.enumerateObjectsByType(turretObject, Mesh, (m: Mesh) => {
      m.castShadow = true;
      m.receiveShadow = true;
    });

    const flowAnchor = new Object3D();
    flowAnchor.position.set(0, 0.66, 1.01);
    turretObject.add(flowAnchor);

    super(platform, {
      range: 10,
      damage,
      damageSector: 45,
      flowAnchor,
      flowColor,
      flowGroundOffset: 2,
      flowParticleSystem,
    });
    this.platform.add(turretObject);
  }
}
