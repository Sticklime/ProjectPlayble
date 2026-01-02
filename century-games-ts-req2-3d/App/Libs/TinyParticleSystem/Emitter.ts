import { TimeController } from "Libs/Toolbox/TimeController";
import type { Vector3Like } from "three";
import { MathUtils, Object3D, Vector3 } from "three";
import type { Range, RangeSpherical, RangeVector3 } from "./Range";

interface SpawnOptions {
  lifeTimeFactor: number;

  position: Vector3Like;
  rotation: number;

  velocity: Vector3Like;
  angularVelocity: number;

  scaleOverTime: number[];
  opacityOverTime: number[];
}

interface Spawner {
  spawnBillboard(options: SpawnOptions): unknown;
}

interface EmitterOptions {
  system: Spawner;
  playTime: number;
  spawnRate: number;
  playByDefault: boolean;
}

interface ParticleOptions {
  lifeTimeRange: Range;

  positionRange: RangeVector3;
  rotationRange: Range;
  scaleOverTime: Range[];
  opacityOverTime: Range[];

  velocityRange: RangeSpherical;
  angularVelocityRange: Range;
}

export class ParticleEmitter extends Object3D {
  private readonly emitterOptions: EmitterOptions;
  private readonly particleOptions: ParticleOptions;

  private isPlaying = false;
  private remainingParticleCount = 0;
  private lastTimeSpawned = 0;
  private readonly tempPosition = new Vector3();

  constructor(
    emitterOptions: EmitterOptions,
    particleOptions: ParticleOptions,
  ) {
    super();
    this.emitterOptions = emitterOptions;
    this.particleOptions = particleOptions;

    if (this.emitterOptions.playByDefault) {
      this.play();
    }

    TimeController.instance.on(TimeController.Event.TICK, this.onTick);
  }

  public destroy(): void {
    TimeController.instance.off(TimeController.Event.TICK, this.onTick);
    this.parent?.remove(this);
  }

  public play(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.lastTimeSpawned = TimeController.instance.time;
      this.remainingParticleCount =
        this.emitterOptions.spawnRate * this.emitterOptions.playTime;
    }
  }

  public stop(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
    }
  }

  public setPositionRange(min: Vector3, max: Vector3): void {
    this.particleOptions.positionRange.min = min;
    this.particleOptions.positionRange.max = max;
  }

  private readonly onTick = (): void => {
    if (!this.isPlaying) {
      return;
    }

    const elapsedTime = TimeController.instance.time - this.lastTimeSpawned;
    const spawnCount = Math.floor(this.emitterOptions.spawnRate * elapsedTime);

    if (spawnCount > 0) {
      const realSpawnCount = Math.min(spawnCount, this.remainingParticleCount);
      this.lastTimeSpawned = TimeController.instance.time;

      for (let i = 0; i < realSpawnCount; i++) {
        this.remainingParticleCount -= 1;
        this.spawnBillboard();
      }

      if (this.remainingParticleCount <= 0) {
        this.isPlaying = false;
        TimeController.instance.off(
          TimeController.Event.TICK,
          this.onTick,
          this,
        );
      }
    }
  };

  private spawnBillboard(): void {
    this.getWorldPosition(this.tempPosition);

    const lifeTimeFactor =
      1 /
      MathUtils.randFloat(
        this.particleOptions.lifeTimeRange.min,
        this.particleOptions.lifeTimeRange.max,
      );

    const position = new Vector3(
      this.tempPosition.x +
        MathUtils.randFloat(
          this.particleOptions.positionRange.min.x,
          this.particleOptions.positionRange.max.x,
        ),
      this.tempPosition.y +
        MathUtils.randFloat(
          this.particleOptions.positionRange.min.y,
          this.particleOptions.positionRange.max.y,
        ),
      this.tempPosition.z +
        MathUtils.randFloat(
          this.particleOptions.positionRange.min.z,
          this.particleOptions.positionRange.max.z,
        ),
    );

    const rotation = MathUtils.randFloat(
      this.particleOptions.rotationRange.min,
      this.particleOptions.rotationRange.max,
    );

    const velocity = new Vector3().setFromSphericalCoords(
      MathUtils.randFloat(
        this.particleOptions.velocityRange.magnitude.min,
        this.particleOptions.velocityRange.magnitude.max,
      ),
      MathUtils.randFloat(
        this.particleOptions.velocityRange.phi.min,
        this.particleOptions.velocityRange.phi.max,
      ),
      MathUtils.randFloat(
        this.particleOptions.velocityRange.theta.min,
        this.particleOptions.velocityRange.theta.max,
      ),
    );

    const angularVelocity = MathUtils.randFloat(
      this.particleOptions.angularVelocityRange.min,
      this.particleOptions.angularVelocityRange.max,
    );

    const scaleOverTime = this.particleOptions.scaleOverTime.map(
      (range: Range) => MathUtils.randFloat(range.min, range.max),
    );

    const opacityOverTime = this.particleOptions.opacityOverTime.map(
      (range: Range) => MathUtils.randFloat(range.min, range.max),
    );

    this.emitterOptions.system.spawnBillboard({
      lifeTimeFactor,
      position,
      rotation,
      velocity,
      angularVelocity,
      scaleOverTime,
      opacityOverTime,
    });
  }
}
