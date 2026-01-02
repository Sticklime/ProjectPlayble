import { LootboxComponent } from "Custom/Lootbox/LootboxComponent";
import { AssetKeeper } from "Generated/AssetKeeper";
import { Component } from "Libs/Platform/Component";
import type { Platform } from "Libs/Platform/Platform";
import {
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from "three";

const ARROW_GEOMETRY = new PlaneGeometry(2, 2)
  .rotateX(-Math.PI / 2)
  .rotateY(-Math.PI / 2)
  .translate(0, 0.5, 2);

const ARROW_HIDE_DISTANCE = 5 ** 2;
const ARROW_SHOW_DISTANCE = 7 ** 2;
const TARGET_ARROW_QUATERNION = new Quaternion();
const DEFAULT_DIRECTION = new Vector3(0, 0, 1);
const TARGET_ARROW_DIRECTION = new Vector3();

export class HeroArrowComponent extends Component {
  private readonly arrow = new Mesh(
    ARROW_GEOMETRY,
    new MeshBasicMaterial({
      map: AssetKeeper.T_Arrow,
      opacity: 0,
      transparent: true,
      depthWrite: false,
    }),
  );

  constructor(platform: Platform) {
    super(platform);
    App.World?.Scene.add(this.arrow);
  }

  public override destroy(): void {
    this.arrow.removeFromParent();
    super.destroy();
  }

  protected override onFixedTick(fixedDeltaTime: number): void {
    this.arrow.position.copy(this.platform.position);

    const closestLootboxDescriptor = this.findClosestLootbox();
    const t = Math.min(fixedDeltaTime * 20, 1);

    if (closestLootboxDescriptor) {
      TARGET_ARROW_DIRECTION.subVectors(
        closestLootboxDescriptor.lootbox.platform.position,
        this.arrow.position,
      );
      TARGET_ARROW_DIRECTION.y = 0;
      TARGET_ARROW_DIRECTION.normalize();

      TARGET_ARROW_QUATERNION.setFromUnitVectors(
        DEFAULT_DIRECTION,
        TARGET_ARROW_DIRECTION,
      );
      this.arrow.quaternion.slerp(TARGET_ARROW_QUATERNION, t);
      this.arrow.material.opacity = MathUtils.lerp(
        this.arrow.material.opacity,
        MathUtils.mapLinear(
          Math.min(
            closestLootboxDescriptor.squaredDistance,
            ARROW_SHOW_DISTANCE,
          ),
          ARROW_HIDE_DISTANCE,
          ARROW_SHOW_DISTANCE,
          0,
          1,
        ),
        t,
      );
    } else {
      this.arrow.material.opacity = MathUtils.lerp(
        this.arrow.material.opacity,
        0,
        t,
      );
    }
  }

  private findClosestLootbox():
    | { lootbox: LootboxComponent; squaredDistance: number }
    | undefined {
    let closestLootbox: LootboxComponent | undefined;
    let minSquaredDistance = Infinity;

    for (const lootbox of LootboxComponent.lootboxes) {
      const squaredDistanceToLootbox = this.platform.position.distanceToSquared(
        lootbox.platform.position,
      );
      if (squaredDistanceToLootbox < minSquaredDistance) {
        minSquaredDistance = squaredDistanceToLootbox;
        closestLootbox = lootbox;
      }
    }

    if (!closestLootbox) {
      return undefined;
    }

    return { lootbox: closestLootbox, squaredDistance: minSquaredDistance };
  }
}
