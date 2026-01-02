import { TimeController } from "Libs/Toolbox/TimeController";
import type { Vector3Like } from "three";
import { MathUtils, Object3D, Vector3 } from "three";
import type {
  TinyRange,
  TinyRangeSpherical,
  TinyRangeVector3,
} from "./TinyRange";

interface SpawnOptions {
  lifeTimeFactor: number;

  position: Vector3Like;
  rotation: number;

  velocity: Vector3Like;
  angularVelocity: number;

  scaleOverTime: number[];
  opacityOverTime: number[];

  localSpaceObject?: WeakRef<Object3D>;
}

interface Spawner {
  spawnBillboard(options: SpawnOptions): unknown;
}

interface EmitterOptions {
  system: Spawner;
  playTime: number;
  spawnRate: number;
  playByDefault: boolean;
  isLocalSpace: boolean;
}

interface ParticleOptions {
  lifeTimeRange: TinyRange;

  positionRange: TinyRangeVector3;
  rotationRange: TinyRange;
  scaleOverTime: TinyRange[];
  opacityOverTime: TinyRange[];

  velocityRange: TinyRangeSpherical;
  angularVelocityRange: TinyRange;
}

export class TinyParticleEmitter extends Object3D {
  private readonly emitterOptions: EmitterOptions;
  private readonly particleOptions: ParticleOptions;

  private isPlaying = false;
  private remainingParticleCount = 0;
  private lastTimeSpawned = 0;
  private readonly tempPosition = new Vector3();

  constructor(
    emitterOptions: Partial<EmitterOptions>,
    particleOptions: Partial<ParticleOptions>,
  ) {
    super();
    const system = emitterOptions.system;
    if (!system) {
      throw new Error("EmitterOptions.system is required");
    }

    this.emitterOptions = {
      system,
      playTime: emitterOptions?.playTime ?? 1,
      spawnRate: emitterOptions?.spawnRate ?? 32,
      playByDefault: emitterOptions?.playByDefault ?? false,
      isLocalSpace: emitterOptions?.isLocalSpace ?? false,
    };

    this.particleOptions = {
      lifeTimeRange: particleOptions?.lifeTimeRange ?? { min: 0.5, max: 1 },
      positionRange: particleOptions?.positionRange ?? {
        min: { x: -2, y: -2, z: -2 },
        max: { x: 2, y: 2, z: 2 },
      },
      rotationRange: particleOptions?.rotationRange ?? {
        min: 0,
        max: Math.PI * 2,
      },
      scaleOverTime:
        particleOptions?.scaleOverTime &&
        particleOptions.scaleOverTime.length > 0
          ? particleOptions.scaleOverTime
          : [{ min: 0.25, max: 1.5 }],
      opacityOverTime:
        particleOptions?.opacityOverTime &&
        particleOptions.opacityOverTime.length > 0
          ? particleOptions.opacityOverTime
          : [
              { min: 0, max: 0 },
              { min: 1, max: 1 },
              { min: 0, max: 0 },
            ],
      velocityRange: particleOptions?.velocityRange ?? {
        magnitude: { min: 0, max: 0 },
        phi: { min: 0, max: 0 },
        theta: { min: 0, max: 0 },
      },
      angularVelocityRange: particleOptions?.angularVelocityRange ?? {
        min: 0,
        max: Math.PI * 2,
      },
    };

    if (this.emitterOptions.playByDefault) {
      this.play();
    }
  }

  public destroy(): void {
    TimeController.instance.off(TimeController.Event.TICK, this.onTick, this);
    this.parent?.remove(this);
  }

  public play(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.lastTimeSpawned = TimeController.instance.time;
      this.remainingParticleCount =
        this.emitterOptions.spawnRate * this.emitterOptions.playTime;

      TimeController.instance.on(TimeController.Event.TICK, this.onTick, this);
    } else {
      console.warn("Emitter is already playing");
    }
  }

  private onTick(): void {
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
  }

  private spawnBillboard(): void {
    if (!this.emitterOptions.isLocalSpace) {
      this.getWorldPosition(this.tempPosition);
    }

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
      (range: TinyRange) => MathUtils.randFloat(range.min, range.max),
    );

    const opacityOverTime = this.particleOptions.opacityOverTime.map(
      (range: TinyRange) => MathUtils.randFloat(range.min, range.max),
    );

    this.emitterOptions.system.spawnBillboard({
      lifeTimeFactor,
      position,
      rotation,
      velocity,
      angularVelocity,
      scaleOverTime,
      opacityOverTime,
      localSpaceObject: this.emitterOptions.isLocalSpace
        ? new WeakRef(this)
        : undefined,
    });
  }
}
