import { BossAnimationController } from "BossAnimationController";
import { GraphicsHandler } from "GraphicsHandler";
import { ITransform } from "ITransform";
import {
  BufferGeometry,
  Group,
  Material,
  Mesh,
  Object3D,
  Quaternion,
  Vector3,
} from "three";

interface IOptions {
  object: Object3D;
  animationController: BossAnimationController;
  joints: IJoint[];
}

interface IJoint {
  container: Group;
  morphTargetIndex: number;
  morphTargetInfluences: number[];
}

export class Boss implements ITransform {
  private object: Object3D;
  private animationController: BossAnimationController;
  private joints: IJoint[];

  protected constructor(options: IOptions) {
    this.object = options.object;
    this.animationController = options.animationController;
    this.joints = [...options.joints];

    if (this.joints.length === 0) {
      throw new Error("Boss must have at least one limb");
    }
  }

  public destroy() {
    GraphicsHandler.instance.scene.remove(this.object);
  }

  public wrapRing(geometry: BufferGeometry, material: Material) {
    const joint = this.joints.shift() as IJoint;
    this.joints.push(joint);

    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    joint.container.add(mesh);

    if (joint.morphTargetInfluences[joint.morphTargetIndex] === 0) {
      const helper = { value: 0 };
      gsap.to(helper, {
        value: 1,
        duration: 0.25,
        ease: "power1.inOut",
        onUpdate: () => {
          joint.morphTargetInfluences[joint.morphTargetIndex] = helper.value;
        },
      });
    }

    const scaleStep = 0.05;
    const scaleFactor = joint.container.children.length * scaleStep + 1;

    gsap
      .timeline()
      .to(mesh.scale, { x: 3, y: 3, z: 3, duration: 0.15 })
      .to(mesh.scale, {
        x: scaleFactor,
        y: scaleFactor,
        z: scaleFactor,
        duration: 0.25,
      });
  }

  public runHitState() {
    this.animationController.runHitState();
  }

  public runAttackState() {
    this.animationController.runAttackState();
  }

  public runDeathState() {
    this.animationController.runDeathState();
  }

  public runWinState() {
    this.animationController.runWinState();
  }

  public get rawObject3D(): Object3D {
    return this.object;
  }

  public get position(): Vector3 {
    return this.object.position;
  }

  public set position(position: Vector3) {
    this.object.position.copy(position);
  }

  public get quaternion(): Quaternion {
    return this.object.quaternion;
  }

  public set quaternion(quaternion: Quaternion) {
    this.object.quaternion.copy(quaternion);
  }

  public get scale(): Vector3 {
    return this.object.scale;
  }

  public set scale(scale: Vector3) {
    this.object.scale.copy(scale);
  }
}
