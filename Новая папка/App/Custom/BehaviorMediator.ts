import { Eventail } from "eventail";
import type { Vector3 } from "three";
import type { BehaviorComponent } from "./BehaviorComponent";
import { LevelNavigator } from "./LevelNavigator";

export interface BehaviorMediatorRequestResult {
  behavior: BehaviorComponent;
  path: Vector3[];
  pathDistance: number;
}

export enum BehaviorMediatorEvent {
  SUBSCRIBE,
  UNSUBSCRIBE,
}

export namespace BehaviorMediator {
  export const instance = new (class extends Eventail {
    private behaviorComponentsInternal: BehaviorComponent[] = [];

    public subscribe(behavior: BehaviorComponent): void {
      const index = this.behaviorComponentsInternal.indexOf(behavior);
      if (index === -1) {
        this.behaviorComponentsInternal.push(behavior);
        this.emit(BehaviorMediatorEvent.SUBSCRIBE, behavior);
      }
    }

    public unsubscribe(behavior: BehaviorComponent): void {
      const index = this.behaviorComponentsInternal.indexOf(behavior);
      if (index !== -1) {
        this.behaviorComponentsInternal.splice(index, 1);
        this.emit(BehaviorMediatorEvent.UNSUBSCRIBE, behavior);
      }
    }

    public get behaviorComponents(): BehaviorComponent[] {
      return this.behaviorComponentsInternal.slice();
    }

    public filterBehaviorComponents(
      behaviorComponent: BehaviorComponent,
      predicate: (behaviorComponent: BehaviorComponent) => boolean,
    ): { behaviorComponent: BehaviorComponent; squaredDistance: number }[] {
      return this.behaviorComponentsInternal
        .filter(predicate)
        .map((ob: BehaviorComponent) => ({
          behaviorComponent: ob,
          squaredDistance:
            behaviorComponent.platform.position.distanceToSquared(
              ob.platform.position,
            ),
        }))
        .sort((a, b) => a.squaredDistance - b.squaredDistance);
    }

    public clampBehaviorComponentsByDistance(
      behaviorComponents: {
        behaviorComponent: BehaviorComponent;
        squaredDistance: number;
      }[],
      maxSquaredDistance: number,
    ): { behaviorComponent: BehaviorComponent; squaredDistance: number }[] {
      return behaviorComponents.filter(
        (item) => item.squaredDistance <= maxSquaredDistance,
      );
    }

    public findPath(
      fromBehaviorComponent: BehaviorComponent,
      toBehaviorComponent: BehaviorComponent,
    ): Vector3[] {
      return LevelNavigator.findPath(
        fromBehaviorComponent.platform.position,
        toBehaviorComponent.platform.position,
      );
    }
  })();
}
