import { HealthDescriptorEvent } from "Custom/HealthDescriptor";
import { WaveSpawner, type WaveSpawnerDescriptor } from "Custom/WaveSpawner";
import type { Quaternion, Vector3 } from "three";
import { MathUtils } from "three";
import { EnemyPrefab } from "./EnemyPrefab";

export interface EnemySpawnerWaveDescriptor extends WaveSpawnerDescriptor {
  strengthMultiplier: number;
}

export class EnemySpawner extends WaveSpawner<EnemySpawnerWaveDescriptor> {
  constructor(descriptors: EnemySpawnerWaveDescriptor[]) {
    super(descriptors);
  }

  protected selectSpawn() {
    const camera = App.World?.Camera;
    if (!camera) {
      throw new Error("Camera not found!");
    }

    const invisibleSpawns = WaveSpawner.spawns.filter(
      (spawn) => !WaveSpawner.isInView(spawn.position, camera),
    );

    if (invisibleSpawns.length === 0) {
      throw new Error("No invisible spawns available!");
    }

    const spawnsWithDistance = invisibleSpawns.map((spawn) => ({
      spawn,
      distanceSquared: camera.position.distanceToSquared(spawn.position),
    }));

    spawnsWithDistance.sort((a, b) => a.distanceSquared - b.distanceSquared);

    return spawnsWithDistance[0]!.spawn;
  }

  protected spawn(
    descriptor: EnemySpawnerWaveDescriptor,
    spawn: { position: Vector3; quaternion: Quaternion },
  ): void {
    const factor = Math.random();

    const enemy = EnemyPrefab.instantiate({
      position: spawn.position,
      quaternion: spawn.quaternion,
      acceleration: 32,
      deceleration: 32,
      maximumSpeed: MathUtils.lerp(3, 6, factor),
      damage: MathUtils.lerp(2, 10, 1 - factor) * descriptor.strengthMultiplier,
      health: 1000 * descriptor.strengthMultiplier,
    });

    enemy.components.behavior.healthDescriptor.once(
      HealthDescriptorEvent.DEATH,
      () => {
        this.decrementCount();
      },
    );
  }
}
