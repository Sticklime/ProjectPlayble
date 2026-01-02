import { BehaviorMediator } from "Custom/BehaviorMediator";
import {
  HealthDescriptor,
  HealthDescriptorEvent,
} from "Custom/HealthDescriptor";
import { WeaponComponent } from "Custom/Weapons/WeaponComponent";
import type { Platform } from "Libs/Platform/Platform";
import { BehaviorComponent } from "../BehaviorComponent";
import { HeroTeamDescriptor } from "./HeroTeamDescriptor";

export class HeroBehaviorComponent extends BehaviorComponent {
  constructor(platform: Platform) {
    super(
      platform,
      new HeroTeamDescriptor(),
      new HealthDescriptor(65536, 65536),
    );
    this.healthDescriptor.once(HealthDescriptorEvent.DEATH, () =>
      this.platform.destroy(),
    );
  }

  protected override onFixedTick(): void {
    const weapon = this.platform.getComponent(WeaponComponent);
    if (weapon) {
      const behaviorComponentDescriptors =
        BehaviorMediator.instance.filterBehaviorComponents(
          this,
          (ob: BehaviorComponent) =>
            this.teamDescriptor.isAggressive(ob.teamDescriptor),
        );

      const clampedBehaviorComponentDescriptors = BehaviorMediator.instance
        .clampBehaviorComponentsByDistance(
          behaviorComponentDescriptors,
          weapon.range * weapon.range,
        )
        .map((cd) => cd.behaviorComponent);

      weapon.setAvailableBehaviorComponents(
        clampedBehaviorComponentDescriptors,
      );
    }
  }
}
