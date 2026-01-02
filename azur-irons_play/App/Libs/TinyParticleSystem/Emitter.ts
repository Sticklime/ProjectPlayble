import { TimeHandler } from "Libs/Toolbox/TimeHandler";
import { MathUtils, Object3D, Quaternion, Vector3, Vector3Like } from "three";
import { IRange, IRangeSpherical, IRangeVector3 } from "./IRange";

interface ISpawnOptions {
  lifeTimeFactor: number;

  position: Vector3Like;
  rotation: number;

  velocity: Vector3Like;
  angularVelocity: number;

  scaleOverTime: number[];
  opacityOverTime: number[];
  colorOverTime: number[];
}

interface ISpawner {
  spawnBillboard(options: ISpawnOptions): unknown;
}

interface IEmitterOptions {
  system: ISpawner;
  playTime: number;
  spawnRate: number;
  playByDefault: boolean;
}

interface IParticleOptions {
  lifeTimeRange: IRange;

  positionRange: IRangeVector3;
  rotationRange: IRange;
  scaleOverTime: IRange[];
  opacityOverTime: IRange[];
  colorOverTime: number[];

  velocityRange: IRangeSpherical;
  angularVelocityRange: IRange;
}

export class Emitter extends Object3D {
  private readonly emitterOptions: IEmitterOptions;
  private readonly particleOptions: IParticleOptions;

  private isPlaying: boolean = false;
  private remainingParticleCount: number = 0;
  private lastTimeSpawned: number = 0;
  private tempPosition = new Vector3();

  public constructor(
    emitterOptions: IEmitterOptions,
    particleOptions: IParticleOptions,
  ) {
    super();
    this.emitterOptions = emitterOptions;
    this.particleOptions = particleOptions;

    if (this.emitterOptions.playByDefault) this.play();
  }

  public destroy() {
    TimeHandler.instance.off(TimeHandler.Event.tick, this.onTick, this);
    this.parent?.remove(this);
  }

  public play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.lastTimeSpawned = TimeHandler.instance.time;
      this.remainingParticleCount =
        this.emitterOptions.spawnRate * this.emitterOptions.playTime;

      TimeHandler.instance.on(TimeHandler.Event.tick, this.onTick, this);
    } else {
      console.warn("Emitter is already playing");
    }
  }

  private onTick(deltaTime: number) {
    const elapsedTime = TimeHandler.instance.time - this.lastTimeSpawned;
    const spawnCount = Math.floor(this.emitterOptions.spawnRate * elapsedTime);

    if (spawnCount > 0) {
      const realSpawnCount = Math.min(spawnCount, this.remainingParticleCount);
      this.lastTimeSpawned = TimeHandler.instance.time;

      for (let i = 0; i < realSpawnCount; i++) {
        this.remainingParticleCount -= 1;
        this.spawnBillboard();
      }

      if (this.remainingParticleCount <= 0) {
        this.isPlaying = false;
        TimeHandler.instance.off(TimeHandler.Event.tick, this.onTick, this);
      }
    }
  }

  public stop() {
    if (this.isPlaying) {
      this.isPlaying = false;
      TimeHandler.instance.off(TimeHandler.Event.tick, this.onTick, this);
    }
  }

  private spawnBillboard() {
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

    const velocity = new Vector3()
      .setFromSphericalCoords(
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
      )
      .applyQuaternion(this.getWorldQuaternion(new Quaternion()));

    const angularVelocity = MathUtils.randFloat(
      this.particleOptions.angularVelocityRange.min,
      this.particleOptions.angularVelocityRange.max,
    );

    const scaleOverTime = this.particleOptions.scaleOverTime.map(
      (range: IRange) => MathUtils.randFloat(range.min, range.max),
    );

    const opacityOverTime = this.particleOptions.opacityOverTime.map(
      (range: IRange) => MathUtils.randFloat(range.min, range.max),
    );

    this.emitterOptions.system.spawnBillboard({
      lifeTimeFactor,
      position,
      rotation,
      velocity,
      angularVelocity,
      scaleOverTime,
      opacityOverTime,
      colorOverTime: this.particleOptions.colorOverTime,
    });
  }
}
