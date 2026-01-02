import { Component } from "Libs/Platform/Component";
import type { Platform } from "Libs/Platform/Platform";
import { BehaviorMediator } from "./BehaviorMediator";
import type { HealthDescriptor } from "./HealthDescriptor";
import type { TeamDescriptor } from "./TeamDescriptor";

export class BehaviorComponent extends Component {
  constructor(
    platform: Platform,
    public readonly teamDescriptor: TeamDescriptor,
    public readonly healthDescriptor: HealthDescriptor,
  ) {
    super(platform);
    BehaviorMediator.instance.subscribe(this);
  }

  public override destroy(): void {
    BehaviorMediator.instance.unsubscribe(this);
    super.destroy();
  }
}
