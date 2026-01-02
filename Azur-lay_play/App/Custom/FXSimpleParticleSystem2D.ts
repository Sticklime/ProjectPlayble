import { TimeHandler } from "Libs/System/TimeHandler";
import {
  DynamicDrawUsage,
  InstancedMesh,
  Material,
  MathUtils,
  Matrix4,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  Texture,
  Vector2,
  Vector2Like,
  Vector3,
} from "three";

interface IRange {
  min: number;
  max: number;
}

interface IParticle {
  id: number;
  matrix: Matrix4;

  position: Vector3;
  rotation: number;
  scale: Vector3;

  velocity: Vector3;
  angularVelocity: number;
}

interface IEmitterOptions {
  count: number;
  position: Vector2Like;

  positionRange: { min: Vector2Like; max: Vector2Like };
  rotationRange: IRange;
  scaleRange: IRange;

  velocityRange: { angle: IRange; magnitude: IRange };
  angularVelocityRange: IRange;
}

interface IOptions {
  container: Object3D;
  texture: Texture;
  gravity: Vector2;
  isTimeScaled: boolean;
  emitters: IEmitterOptions[];
}

export class FXSimpleParticleSystem2D {
  private mesh: InstancedMesh;
  private particles: IParticle[] = [];
  private gravity: Vector3;
  private readonly isTimeScaled: boolean;

  public constructor(options: IOptions) {
    const width = options.texture.image.naturalWidth;
    const height = options.texture.image.naturalHeight;

    if (!width || !height) {
      throw new Error("Invalid texture dimensions");
    }

    this.gravity = new Vector3(options.gravity.x, options.gravity.y, 0);
    this.isTimeScaled = options.isTimeScaled;
    const count = options.emitters.reduce((a, e) => a + e.count, 0);

    const geometry = new PlaneGeometry(width, height);
    const material = new MeshBasicMaterial({
      map: options.texture,
      transparent: true,
    });

    this.mesh = new InstancedMesh(geometry, material, count);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    options.container.add(this.mesh);

    let fromID = 0;
    for (const emitter of options.emitters) {
      const nextID = fromID + emitter.count;
      this.buildEmitter(emitter, { min: fromID, max: nextID });
      fromID = nextID;
    }

    TimeHandler.instance.on(TimeHandler.EEvent.TICK, this.onTick, this);
  }

  public destroy() {
    TimeHandler.instance.off(TimeHandler.EEvent.TICK, this.onTick, this);
    this.mesh.geometry.dispose();
    (this.mesh.material as Material).dispose();
    this.mesh.parent?.remove(this.mesh);
  }

  private buildEmitter(emitter: IEmitterOptions, range: IRange) {
    for (let i = range.min; i < range.max; i++) {
      const velocityAngle = MathUtils.randFloat(
        emitter.velocityRange.angle.min,
        emitter.velocityRange.angle.max,
      );

      const velocityMagnitude = MathUtils.randFloat(
        emitter.velocityRange.magnitude.min,
        emitter.velocityRange.magnitude.max,
      );

      const velocity = new Vector3(
        Math.cos(velocityAngle) * velocityMagnitude,
        Math.sin(velocityAngle) * velocityMagnitude,
        0,
      );

      const angularVelocity = MathUtils.randFloat(
        emitter.angularVelocityRange.min,
        emitter.angularVelocityRange.max,
      );

      const position = new Vector3(
        emitter.position.x +
          MathUtils.randFloat(
            emitter.positionRange.min.x,
            emitter.positionRange.max.x,
          ),
        emitter.position.y +
          MathUtils.randFloat(
            emitter.positionRange.min.y,
            emitter.positionRange.max.y,
          ),
        0,
      );

      const rotation = MathUtils.randFloat(
        emitter.rotationRange.min,
        emitter.rotationRange.max,
      );

      const rndomScale = MathUtils.randFloat(
        emitter.scaleRange.min,
        emitter.scaleRange.max,
      );

      const scale = new Vector3(rndomScale, rndomScale, rndomScale);

      const particle = {
        id: i,
        matrix: new Matrix4(),

        position,
        rotation,
        scale,

        velocity,
        angularVelocity,
      };

      this.particles.push(particle);
      this.mesh.setMatrixAt(i, particle.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  private onTick(_: number) {
    const deltaTime = this.isTimeScaled
      ? TimeHandler.instance.deltaTime
      : TimeHandler.instance.rawDeltaTime;

    const axis = new Vector3(0, 0, 1);
    const quaternion = new Quaternion();

    for (const particle of this.particles) {
      particle.velocity.addScaledVector(this.gravity, deltaTime);
      particle.position.addScaledVector(particle.velocity, deltaTime);
      particle.rotation += particle.angularVelocity * deltaTime;

      quaternion.setFromAxisAngle(axis, particle.rotation);
      particle.matrix.compose(particle.position, quaternion, particle.scale);
      this.mesh.setMatrixAt(particle.id, particle.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
