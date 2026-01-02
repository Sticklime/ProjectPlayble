import { TimeController } from "Libs/Toolbox/TimeController";
import type {
  Blending,
  BufferAttribute,
  Color,
  Object3D,
  Texture,
  Vector3Like,
} from "three";
import {
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  MathUtils,
  Mesh,
  PlaneGeometry,
  Vector3,
} from "three";
import { TinyParticleMaterial } from "./TinyMaterial";

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

interface Particle {
  lifeTime: number;
  lifeTimeFactor: number;
  position: Vector3;
  localSpacePosition: Vector3;
  rotation: number;
  scale: number;
  scaleOverTime: number[];
  opacity: number;
  opacityOverTime: number[];
  velocity: Vector3;
  angularVelocity: number;
  localSpaceObject?: WeakRef<Object3D>;
}

interface SystemOptions {
  capacity: number;
  gravity?: Vector3Like;
}

interface MaterialOptions {
  texture: Texture;
  depthTest?: boolean;
  depthWrite?: boolean;
  color?: Color;
  blending?: Blending;
}

export class TinyParticleSystem {
  private readonly mesh: Mesh;
  private readonly particles: Particle[] = [];
  private readonly material: TinyParticleMaterial;
  private readonly instancedGeometry: InstancedBufferGeometry;

  private readonly capacity: number;
  private readonly gravity: Vector3;

  constructor(systemOptions: SystemOptions, materialOptions: MaterialOptions) {
    const width = materialOptions.texture.image.naturalWidth;
    const height = materialOptions.texture.image.naturalHeight;

    if (!width || !height) {
      throw new Error("Invalid texture dimensions");
    }

    this.capacity = systemOptions.capacity;
    this.gravity = systemOptions.gravity
      ? new Vector3().copy(systemOptions.gravity)
      : new Vector3();

    const aspect = width / height;
    const plane = new PlaneGeometry(aspect, 1);
    this.instancedGeometry = new InstancedBufferGeometry();
    this.instancedGeometry.index = plane.index;

    this.instancedGeometry.setAttribute(
      "position",
      plane.attributes["position"] as BufferAttribute,
    );
    this.instancedGeometry.setAttribute(
      "uv",
      plane.attributes["uv"] as BufferAttribute,
    );
    plane.dispose();

    this.instancedGeometry.setAttribute(
      "instancePosition",
      new InstancedBufferAttribute(
        new Float32Array(this.capacity * 3),
        3,
      ).setUsage(DynamicDrawUsage),
    );
    this.instancedGeometry.setAttribute(
      "instanceRotation",
      new InstancedBufferAttribute(new Float32Array(this.capacity), 1).setUsage(
        DynamicDrawUsage,
      ),
    );
    this.instancedGeometry.setAttribute(
      "instanceScale",
      new InstancedBufferAttribute(new Float32Array(this.capacity), 1).setUsage(
        DynamicDrawUsage,
      ),
    );
    this.instancedGeometry.setAttribute(
      "instanceOpacity",
      new InstancedBufferAttribute(new Float32Array(this.capacity), 1).setUsage(
        DynamicDrawUsage,
      ),
    );

    this.material = new TinyParticleMaterial(materialOptions);

    this.mesh = new Mesh(this.instancedGeometry, this.material);
    this.mesh.frustumCulled = false;

    App.World?.Scene.add(this.mesh);
    TimeController.instance.on(TimeController.Event.TICK, this.onTick, this);
  }

  public setNewTexture(texture: Texture): void {
    this.material.setNewTexture(texture);
  }

  public spawnBillboard(options: SpawnOptions): void {
    if (this.particles.length >= this.capacity) {
      console.warn("Capacity exceeded");
      return;
    }

    this.particles.push({
      lifeTime: 0,
      lifeTimeFactor: options.lifeTimeFactor,
      position: new Vector3().copy(options.position),
      localSpacePosition: new Vector3().copy(options.position),
      rotation: options.rotation,
      scale: options.scaleOverTime[0] as number,
      scaleOverTime: [...options.scaleOverTime],
      opacity: options.opacityOverTime[0] as number,
      opacityOverTime: [...options.opacityOverTime],
      velocity: new Vector3().copy(options.velocity),
      angularVelocity: options.angularVelocity,
      localSpaceObject: options.localSpaceObject,
    });
  }

  public destroy(): void {
    TimeController.instance.off(TimeController.Event.TICK, this.onTick, this);
    App.World?.Scene.remove(this.mesh);
    this.instancedGeometry.dispose();
    this.material.dispose();
  }

  private updateInstanceAttributes(): void {
    const positionAttr = this.instancedGeometry.attributes[
      "instancePosition"
    ] as InstancedBufferAttribute;
    const rotationAttr = this.instancedGeometry.attributes[
      "instanceRotation"
    ] as InstancedBufferAttribute;
    const scaleAttr = this.instancedGeometry.attributes[
      "instanceScale"
    ] as InstancedBufferAttribute;
    const opacityAttr = this.instancedGeometry.attributes[
      "instanceOpacity"
    ] as InstancedBufferAttribute;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i] as Particle;
      positionAttr.setXYZ(i, p.position.x, p.position.y, p.position.z);
      rotationAttr.setX(i, p.rotation);
      scaleAttr.setX(i, p.scale);
      opacityAttr.setX(i, p.opacity);
    }

    positionAttr.needsUpdate = true;
    rotationAttr.needsUpdate = true;
    scaleAttr.needsUpdate = true;
    opacityAttr.needsUpdate = true;

    this.instancedGeometry.instanceCount = this.particles.length;
  }

  private removeBillboards(removedBillboards: Particle[]): void {
    for (const particle of removedBillboards) {
      const index = this.particles.indexOf(particle);
      if (index > -1) {
        this.particles.splice(index, 1);
      }
    }
  }

  private lerpArray(factor: number, array: number[]): number {
    const lastIndex = array.length - 1;
    const exactIndex = lastIndex * factor;
    const floorIndex = Math.floor(exactIndex);
    const ceilIndex = Math.min(floorIndex + 1, lastIndex);
    return MathUtils.lerp(
      array[floorIndex] as number,
      array[ceilIndex] as number,
      exactIndex - floorIndex,
    );
  }

  private onTick(deltaTime: number): void {
    const removed: Particle[] = [];

    const tempLocalPosition = new Vector3();

    for (const particle of this.particles) {
      particle.lifeTime += particle.lifeTimeFactor * deltaTime;

      if (particle.lifeTime > 1) {
        removed.push(particle);
        continue;
      }

      particle.velocity.addScaledVector(this.gravity, deltaTime);

      const localSpaceObject = particle.localSpaceObject?.deref();
      if (localSpaceObject) {
        localSpaceObject.getWorldPosition(tempLocalPosition);
        particle.localSpacePosition.addScaledVector(
          particle.velocity,
          deltaTime,
        );
        particle.position.addVectors(
          tempLocalPosition,
          particle.localSpacePosition,
        );
      } else {
        particle.position.addScaledVector(particle.velocity, deltaTime);
      }

      particle.rotation += particle.angularVelocity * deltaTime;
      particle.scale = this.lerpArray(
        particle.lifeTime,
        particle.scaleOverTime,
      );
      particle.opacity = this.lerpArray(
        particle.lifeTime,
        particle.opacityOverTime,
      );
    }

    this.removeBillboards(removed);
    this.updateInstanceAttributes();
  }
}
