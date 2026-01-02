import { gsap } from "gsap";
import { ITransform } from "ITransform";
import { GraphicsHandler } from "Libs/System/GraphicsHandler";
import { Object3DToolbox } from "Object3DToolbox";
import {
  BufferGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  Object3D,
  Quaternion,
  Vector3,
} from "three";
import ThreeText from "ThreeText";

interface IDescriptor {
  instancedMesh: InstancedMesh;
  ringCount: number;
}

interface IRing {
  descriptor: IDescriptor;
  matrix: Matrix4;
  animation: GSAPAnimation;
}

interface IRemovingResult {
  geometry: BufferGeometry;
  material: Material;
}

export class RingCollector {
  private container: Object3D;
  private maxCount: number;
  private lastRingScale: Vector3;
  private scaleStep: Vector3;

  private descriptors: IDescriptor[] = [];
  private rings: IRing[] = [];
  private text: ThreeText;
  private ringCount: number = 0;

  public constructor(
    container: Object3D,
    defaultScale: number,
    scaleStep: number,
    maxRingCount: number = 64,
  ) {
    this.container = container;
    this.lastRingScale = new Vector3(defaultScale, defaultScale, 1);
    this.scaleStep = new Vector3(scaleStep, scaleStep, 0);
    this.maxCount = maxRingCount;

    this.text = new ThreeText("000000", {
      styles: {
        fontFamily: "LuckiestGuy-Regular",
        fontSize: 40,
        strokeColor: "#000000",
        strokeThickness: 8,
        padding: 50,
      },
    });
    this.text.material.depthWrite = false;

    const scale = 0.01;
    this.text.position.set(0, 0, 0.5);
    this.text.scale.set(scale, scale, 1);
    this.container.add(this.text);

    this.updateText();
  }

  private updateText() {
    this.text.text = String(this.ringCount);
  }

  public collect(
    transform: ITransform,
    geometry: BufferGeometry,
    material: Material,
  ) {
    const descriptor = this.getInstancedMeshDescriptor(geometry, material);

    if (descriptor.ringCount + 1 > this.maxCount) {
      throw new Error("Maximum ring count exceeded");
    }

    this.ringCount += 1;
    this.updateText();

    const matrixID = descriptor.ringCount;
    const helper = { value: 0 };

    const fromTransform = Object3DToolbox.worldTransformToLocal(
      transform.position.clone(),
      transform.quaternion.clone(),
      transform.scale.clone(),
      descriptor.instancedMesh,
    );

    const tempPosition = new Vector3();
    const tempQuaternion = new Quaternion();
    const tempScale = new Vector3();

    const toPosition = new Vector3();
    const toQuaternion = new Quaternion();
    const toScale = this.lastRingScale.add(this.scaleStep).clone();

    const localMatrix = new Matrix4().compose(
      fromTransform.position.clone(),
      fromTransform.quaternion.clone(),
      fromTransform.scale.clone(),
    );

    const animation = gsap.to(helper, {
      value: 1,
      duration: 0.15,
      ease: "power1.inOut",
      onUpdate: () => {
        tempPosition.lerpVectors(
          fromTransform.position,
          toPosition,
          helper.value,
        );
        tempQuaternion.slerpQuaternions(
          fromTransform.quaternion,
          toQuaternion,
          helper.value,
        );
        tempScale.lerpVectors(fromTransform.scale, toScale, helper.value);

        localMatrix.compose(tempPosition, tempQuaternion, tempScale);
        descriptor.instancedMesh.setMatrixAt(matrixID, localMatrix);
        descriptor.instancedMesh.instanceMatrix.needsUpdate = true;
      },
    });

    const ring = {
      descriptor: descriptor,
      matrix: localMatrix,
      animation,
    };

    this.rings.push(ring);
    this.addRingToInstancedMesh(descriptor, ring);
  }

  public collectFromNowhere(count: number) {
    if (this.descriptors.length === 0) return;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const descriptor =
          this.descriptors[Math.floor(Math.random() * this.descriptors.length)];

        if (descriptor) {
          this.ringCount += 1;
          this.updateText();

          const position = new Vector3();
          const quaternion = new Quaternion();

          const toScale = this.lastRingScale.add(this.scaleStep).clone();
          const fromScale = toScale.clone().multiplyScalar(1.25);
          const tempScale = new Vector3();

          const matrixID = descriptor.ringCount;
          const matrix = new Matrix4().compose(position, quaternion, fromScale);

          const helper = { value: 0 };

          const animation = gsap.to(helper, {
            value: 1,
            duration: 0.15,
            ease: "back.in",
            onUpdate: () => {
              tempScale.lerpVectors(fromScale, toScale, helper.value);
              matrix.compose(position, quaternion, tempScale);
              descriptor.instancedMesh.setMatrixAt(matrixID, matrix);
              descriptor.instancedMesh.instanceMatrix.needsUpdate = true;
            },
          });

          const ring = {
            descriptor: descriptor,
            matrix: matrix,
            animation,
          };

          this.rings.push(ring);
          this.addRingToInstancedMesh(descriptor, ring);
        }
      }, i * 10);
    }
  }

  public remove(): IRemovingResult | null {
    const ring = this.rings.pop();
    if (!ring) return null;

    this.ringCount = Math.max(0, this.ringCount - 1);
    this.updateText();

    this.lastRingScale.sub(this.scaleStep);
    ring.animation.kill();
    this.removeLastRingFromInstancedMesh(ring.descriptor);

    const instancedMesh = ring.descriptor.instancedMesh;

    return {
      geometry: instancedMesh.geometry,
      material: instancedMesh.material as Material,
    };
  }

  public attack(targetPosition: Vector3): IRemovingResult | null {
    const ring = this.rings.pop();
    if (!ring) return null;

    this.ringCount = Math.max(0, this.ringCount - 1);
    this.updateText();

    this.lastRingScale.sub(this.scaleStep);
    ring.animation.kill();
    this.removeLastRingFromInstancedMesh(ring.descriptor);

    const instancedMesh = ring.descriptor.instancedMesh;

    const fromPosition = new Vector3();
    const fromQuaternion = new Quaternion();
    const fromScale = new Vector3();

    ring.matrix.decompose(fromPosition, fromQuaternion, fromScale);

    instancedMesh.getWorldPosition(fromPosition);
    instancedMesh.getWorldQuaternion(fromQuaternion);

    const mesh = new Mesh(
      instancedMesh.geometry,
      instancedMesh.material as Material,
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(fromPosition);
    mesh.quaternion.copy(fromQuaternion);
    mesh.scale.copy(fromScale);
    GraphicsHandler.instance.scene.add(mesh);

    const tempPosition = new Vector3();
    const tempQuaternion = new Quaternion();
    const tempScale = new Vector3();

    const toPosition = new Vector3().copy(targetPosition);
    const toQuaternion = new Quaternion();
    const toScale = new Vector3().copy(fromScale);

    const helper = { value: 0 };
    gsap.to(helper, {
      value: 1,
      duration: 0.5,
      ease: "power1.inOut",
      onUpdate: () => {
        tempPosition.lerpVectors(fromPosition, toPosition, helper.value);
        tempQuaternion.slerpQuaternions(
          fromQuaternion,
          toQuaternion,
          helper.value,
        );
        tempScale.lerpVectors(fromScale, toScale, helper.value);

        mesh.position.copy(tempPosition);
        mesh.quaternion.copy(tempQuaternion);
        mesh.scale.copy(tempScale);
      },
      onComplete: () => {
        GraphicsHandler.instance.scene.remove(mesh);
      },
    });

    return {
      geometry: instancedMesh.geometry,
      material: instancedMesh.material as Material,
    };
  }

  private getInstancedMeshDescriptor(
    geometry: BufferGeometry,
    material: Material,
  ): IDescriptor {
    for (const descriptor of this.descriptors) {
      if (
        descriptor.instancedMesh.geometry === geometry &&
        descriptor.instancedMesh.material === material
      ) {
        return descriptor;
      }
    }

    const instancedMesh = new InstancedMesh(geometry, material, this.maxCount);
    instancedMesh.instanceMatrix.setUsage(DynamicDrawUsage);

    const descriptor = {
      instancedMesh,
      ringCount: 0,
    };

    descriptor.instancedMesh.castShadow = true;
    descriptor.instancedMesh.receiveShadow = true;

    this.container.add(descriptor.instancedMesh);
    this.descriptors.push(descriptor);

    return descriptor;
  }

  private addRingToInstancedMesh(descriptor: IDescriptor, ring: IRing) {
    const matrixID = descriptor.ringCount;
    descriptor.ringCount = Math.min(this.maxCount, descriptor.ringCount + 1);
    descriptor.instancedMesh.count = descriptor.ringCount;
    descriptor.instancedMesh.setMatrixAt(matrixID, ring.matrix);
    descriptor.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  private removeLastRingFromInstancedMesh(descriptor: IDescriptor) {
    descriptor.ringCount = Math.max(0, descriptor.ringCount - 1);
    descriptor.instancedMesh.count = descriptor.ringCount;
    descriptor.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  public get count(): number {
    return this.descriptors.reduce((acc, d) => acc + d.ringCount, 0);
  }
}
