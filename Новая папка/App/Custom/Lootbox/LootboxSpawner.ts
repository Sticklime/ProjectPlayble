import { WaveSpawner, type WaveSpawnerDescriptor } from "Custom/WaveSpawner";
import type { Quaternion } from "three";
import { Vector3 } from "three";
import { LootboxComponentEvent } from "./LootboxComponent";
import { LootboxPrefab } from "./LootboxPrefab";

const TEMP_CAMERA_DIRECTION = new Vector3();
const TEMP_TO_SPAWN = new Vector3();
const TEMP_PROJECTION_POINT = new Vector3();

export interface LootboxSpawnerDescriptor extends WaveSpawnerDescriptor {
  collectCallback?: () => void;
  radius?: number;
}

export class LootboxSpawner extends WaveSpawner<LootboxSpawnerDescriptor> {
  constructor(descriptors: LootboxSpawnerDescriptor[]) {
    super(descriptors);
  }

  protected selectSpawn(descriptor: LootboxSpawnerDescriptor) {
    const camera = App.World?.Camera;
    if (!camera) {
      throw new Error("Camera not found!");
    }

    if (descriptor.radius !== undefined) {
      camera.getWorldDirection(TEMP_CAMERA_DIRECTION);

      const radiusSquared = descriptor.radius * descriptor.radius;

      const spawnsWithAxisDistance = WaveSpawner.spawns.map((spawn) => {
        TEMP_TO_SPAWN.subVectors(spawn.position, camera.position);
        const projectionLength = TEMP_TO_SPAWN.dot(TEMP_CAMERA_DIRECTION);
        TEMP_PROJECTION_POINT.copy(TEMP_CAMERA_DIRECTION)
          .multiplyScalar(projectionLength)
          .add(camera.position);
        const axisDistanceSquared = spawn.position.distanceToSquared(
          TEMP_PROJECTION_POINT,
        );

        return {
          spawn,
          axisDistanceSquared,
        };
      });

      spawnsWithAxisDistance.sort(
        (a, b) => a.axisDistanceSquared - b.axisDistanceSquared,
      );

      const spawnsOutsideRadius = spawnsWithAxisDistance.filter(
        (item) => item.axisDistanceSquared > radiusSquared,
      );

      if (spawnsOutsideRadius.length === 0) {
        throw new Error("No spawns outside the specified radius!");
      }

      return spawnsOutsideRadius[0]!.spawn;
    } else {
      const invisibleSpawns = WaveSpawner.spawns.filter(
        (spawn) => !WaveSpawner.isInView(spawn.position, camera),
      );

      if (invisibleSpawns.length === 0) {
        throw new Error("No invisible spawns available!");
      }

      const randomIndex = Math.floor(Math.random() * invisibleSpawns.length);
      return invisibleSpawns[randomIndex]!;
    }
  }

  protected override spawn(
    descriptor: LootboxSpawnerDescriptor,
    spawn: { position: Vector3; quaternion: Quaternion },
  ): void {
    MraidSDK.playSound("S_Spawn");

    const lootbox = LootboxPrefab.instantiate(spawn.position, spawn.quaternion);

    lootbox.components.lootbox.once(LootboxComponentEvent.COLLECT, () => {
      this.decrementCount();
      descriptor.collectCallback?.();
    });
  }
}
