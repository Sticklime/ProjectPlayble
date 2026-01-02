import { GraphicsController } from "Libs/Toolbox/GraphicsController";
import { TimeController } from "Libs/Toolbox/TimeController";
import type {
  Blending,
  BufferAttribute,
  Color,
  ShaderMaterial,
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
import { BillboardMaterial } from "./Material";

interface SpawnOptions {
  lifeTimeFactor: number;
  position: Vector3Like;
  rotation: number;
  velocity: Vector3Like;
  angularVelocity: number;
  scaleOverTime: number[];
  opacityOverTime: number[];
}

interface Particle {
  lifeTime: number;
  lifeTimeFactor: number;
  position: Vector3;
  rotation: number;
  scale: number;
  scaleOverTime: number[];
  opacity: number;
  opacityOverTime: number[];
  velocity: Vector3;
  angularVelocity: number;
}

interface SystemOptions {
  capacity: number;
  gravity: Vector3Like;
}

interface MaterialOptions {
  texture: Texture;
  alphaTest?: number;
  color?: Color;
  blending?: Blending;
}

export class ParticleSystem {
  private readonly mesh: Mesh;
  private readonly particles: Particle[] = [];
  private readonly material: ShaderMaterial;
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
    this.gravity = new Vector3().copy(systemOptions.gravity);

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

    this.material = new BillboardMaterial(materialOptions);

    this.mesh = new Mesh(this.instancedGeometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1024;

    const scene = App.World.Scene;
    if (!scene) {
      throw new Error("Scene not found");
    }

    scene.add(this.mesh);
    TimeController.instance.on(TimeController.Event.TICK, this.onTick, this);
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
      rotation: options.rotation,
      scale: options.scaleOverTime[0] as number,
      scaleOverTime: [...options.scaleOverTime],
      opacity: options.opacityOverTime[0] as number,
      opacityOverTime: [...options.opacityOverTime],
      velocity: new Vector3().copy(options.velocity),
      angularVelocity: options.angularVelocity,
    });
  }

  public destroy(): void {
    TimeController.instance.off(TimeController.Event.TICK, this.onTick, this);
    const scene = App.World.Scene;
    if (!scene) {
      throw new Error("Scene not found");
    }

    scene.add(this.mesh);
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

    for (const particle of this.particles) {
      particle.lifeTime += particle.lifeTimeFactor * deltaTime;

      if (particle.lifeTime > 1) {
        removed.push(particle);
        continue;
      }

      particle.velocity.addScaledVector(this.gravity, deltaTime);
      particle.position.addScaledVector(particle.velocity, deltaTime);
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
