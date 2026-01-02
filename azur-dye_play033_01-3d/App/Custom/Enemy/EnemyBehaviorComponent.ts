import { BehaviorMediator } from "Custom/BehaviorMediator";
import {
  HealthDescriptor,
  HealthDescriptorEvent,
} from "Custom/HealthDescriptor";
import { LevelNavigator } from "Custom/LevelNavigator";
import { PathVisualizer } from "Custom/PathVisualizer";
import type { WeaponComponent } from "Custom/Weapons/WeaponComponent";
import { AnchorKeeper } from "Generated/AnchorKeeper";
import type { PawnComponent } from "Libs/Platform/PawnComponent";
import type { Platform } from "Libs/Platform/Platform";
import { Vector3 } from "three";
import { BehaviorComponent } from "../BehaviorComponent";
import { EnemyTeamDescriptor } from "./EnemyTeamDescriptor";

const COVERS = [
  AnchorKeeper.Scene.ANC_Enemy_Cover.position,
  AnchorKeeper.Scene["ANC_Enemy_Cover.001"].position,
];

const TEMP_DIRECTION = new Vector3();
const TEMP_TO_TARGET = new Vector3();

export class EnemyBehaviorComponent extends BehaviorComponent {
  private movementPath?: Vector3[];
  private readonly distanceThresholdSquared = 0.5 ** 2;

  private targetCover?: Vector3;
  private isSecondBreath = false;

  private readonly pathVisualizer?: PathVisualizer;

  constructor(
    platform: Platform,
    private readonly pawn: PawnComponent,
    private readonly weapon: WeaponComponent,
    health: number,
  ) {
    super(
      platform,
      new EnemyTeamDescriptor(),
      new HealthDescriptor(health, health),
    );
    this.healthDescriptor.once(HealthDescriptorEvent.DEATH, () =>
      this.platform.destroy(),
    );

    if (process.env["NODE_ENV"] === "development") {
      this.pathVisualizer = new PathVisualizer();
    }
  }

  public override destroy(): void {
    this.pathVisualizer?.destroy();
    MraidSDK.playSound("S_Death");
    super.destroy();
  }

  protected override onFixedTick(): void {
    const behaviorComponentDescriptors =
      BehaviorMediator.instance.filterBehaviorComponents(
        this,
        (ob: BehaviorComponent) =>
          this.teamDescriptor.isAggressive(ob.teamDescriptor),
      );

    if (
      this.isSecondBreath ||
      this.healthDescriptor.value / this.healthDescriptor.maxValue > 0.5
    ) {
      this.updateMovementPathToAggressive(behaviorComponentDescriptors);
    } else {
      this.updateMovementPathToCover();
    }

    if (this.pathVisualizer && this.movementPath) {
      const pathCopy = this.movementPath.slice();
      pathCopy.unshift(this.platform.position);
      this.pathVisualizer?.setPath(pathCopy);
    }

    const clampedBehaviorComponentDescriptors = BehaviorMediator.instance
      .clampBehaviorComponentsByDistance(
        behaviorComponentDescriptors,
        this.weapon.range * this.weapon.range,
      )
      .map((cd) => cd.behaviorComponent);

    this.platform.getWorldDirection(TEMP_DIRECTION);

    this.weapon.isEnable = clampedBehaviorComponentDescriptors.some(
      (component) =>
        TEMP_TO_TARGET.subVectors(
          component.platform.position,
          this.platform.position,
        ).dot(TEMP_DIRECTION) > 0,
    );
    this.weapon.setAvailableBehaviorComponents(
      clampedBehaviorComponentDescriptors,
    );
  }

  private updateMovementPathToAggressive(
    aggerssiveBehaviorComponentDescriptors: {
      behaviorComponent: BehaviorComponent;
      squaredDistance: number;
    }[],
  ): void {
    const nearestAggressiveBehaviorComponentDescriptor =
      aggerssiveBehaviorComponentDescriptors[0];

    if (!nearestAggressiveBehaviorComponentDescriptor) {
      this.pawn.direction = undefined;
      return;
    }

    const pathToNearestAggressiveBehaviorComponent =
      BehaviorMediator.instance.findPath(
        this,
        nearestAggressiveBehaviorComponentDescriptor.behaviorComponent,
      );

    if (pathToNearestAggressiveBehaviorComponent.length > 0) {
      this.movementPath = pathToNearestAggressiveBehaviorComponent;
    }

    if (!this.movementPath || this.movementPath.length === 0) {
      this.pawn.direction = undefined;
      return;
    }

    const platformPosition = this.platform.position;
    let firstValidControlPointIndex = this.movementPath.findIndex(
      (p) =>
        (p.x - platformPosition.x) ** 2 + (p.y - platformPosition.y) ** 2 >
        this.distanceThresholdSquared,
    );

    if (firstValidControlPointIndex === -1) {
      this.pawn.direction = undefined;
      return;
    }

    this.movementPath.splice(0, firstValidControlPointIndex);

    const nextControlPoint = this.movementPath[0];
    if (!nextControlPoint) {
      this.pawn.direction = undefined;
      return;
    }

    if (!this.pawn.direction) {
      this.pawn.direction = new Vector3();
    }

    this.pawn.direction.subVectors(nextControlPoint, platformPosition);
    this.pawn.direction.y = 0;
    this.pawn.direction.normalize();
  }

  private updateMovementPathToCover(): void {
    if (!this.targetCover) {
      let largetsDistance = 0;
      for (const cover of COVERS) {
        const distanceToCover = this.platform.position.distanceToSquared(cover);
        if (distanceToCover > largetsDistance) {
          largetsDistance = distanceToCover;
          this.targetCover = cover;
        }
      }

      if (!this.targetCover) {
        throw new Error("Cover not found");
      }
    }

    const pathToRandomCover = LevelNavigator.findPath(
      this.platform.position,
      this.targetCover,
    );

    if (pathToRandomCover.length > 0) {
      this.movementPath = pathToRandomCover;
    }

    if (!this.movementPath || this.movementPath.length === 0) {
      this.isSecondBreath = true;
      this.pawn.direction = undefined;
      return;
    }

    const platformPosition = this.platform.position;
    let firstValidControlPointIndex = this.movementPath.findIndex(
      (p) =>
        (p.x - platformPosition.x) ** 2 + (p.y - platformPosition.y) ** 2 >
        this.distanceThresholdSquared,
    );

    if (firstValidControlPointIndex === -1) {
      this.isSecondBreath = true;
      this.pawn.direction = undefined;
      return;
    }

    this.movementPath.splice(0, firstValidControlPointIndex);

    const nextControlPoint = this.movementPath[0];
    if (!nextControlPoint) {
      this.isSecondBreath = true;
      this.pawn.direction = undefined;
      return;
    }

    if (!this.pawn.direction) {
      this.pawn.direction = new Vector3();
    }

    this.pawn.direction.subVectors(nextControlPoint, platformPosition);
    this.pawn.direction.y = 0;
    this.pawn.direction.normalize();
  }
}
