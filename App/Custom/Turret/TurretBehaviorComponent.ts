import { BehaviorComponent } from "Custom/BehaviorComponent";
import { BehaviorMediator } from "Custom/BehaviorMediator";
import type { HealthDescriptor } from "Custom/HealthDescriptor";
import type { TeamDescriptor } from "Custom/TeamDescriptor";
import type { WeaponComponent } from "Custom/Weapons/WeaponComponent";
import type { Platform } from "Libs/Platform/Platform";
import { Quaternion, Vector3 } from "three";

const DEFAULT_DIRECTION = new Vector3(0, 0, 1);
const TEMP_DIRECTION = new Vector3();

export class TurretBehaviorComponent extends BehaviorComponent {
  private targetTurretQuaternion = new Quaternion();

  constructor(
    platform: Platform,
    teamDescriptor: TeamDescriptor,
    healthDescriptor: HealthDescriptor,
    private readonly weapon: WeaponComponent,
  ) {
    super(platform, teamDescriptor, healthDescriptor);
  }

  protected override onFixedTick(fixedDeltaTime: number): void {
    const behaviorComponentDescriptors =
      BehaviorMediator.instance.filterBehaviorComponents(
        this,
        (otherBehaviorComponent: BehaviorComponent): boolean =>
          this.teamDescriptor.isAggressive(
            otherBehaviorComponent.teamDescriptor,
          ),
      );

    const clampedBehaviorComponents = BehaviorMediator.instance
      .clampBehaviorComponentsByDistance(
        behaviorComponentDescriptors,
        this.weapon.range * this.weapon.range,
      )
      .map((componentDescriptor) => componentDescriptor.behaviorComponent);

    this.weapon.isEnable = clampedBehaviorComponents.length > 0;
    this.weapon.setAvailableBehaviorComponents(clampedBehaviorComponents);

    const nearestBehaviorComponent = clampedBehaviorComponents[0];
    if (nearestBehaviorComponent) {
      TEMP_DIRECTION.subVectors(
        nearestBehaviorComponent.platform.position,
        this.platform.position,
      );
      TEMP_DIRECTION.y = 0;
      TEMP_DIRECTION.normalize();
      this.targetTurretQuaternion.setFromUnitVectors(
        DEFAULT_DIRECTION,
        TEMP_DIRECTION,
      );

      this.platform.quaternion.slerp(
        this.targetTurretQuaternion,
        fixedDeltaTime,
      );
    }
  }
}
