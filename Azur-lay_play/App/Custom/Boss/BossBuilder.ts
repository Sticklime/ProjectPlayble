import { Boss } from "Boss";
import { GraphicsHandler } from "GraphicsHandler";
import { Object3DToolbox } from "Libs/System/Object3DToolbox";
import { AnimationMixer, Group, MathUtils, Mesh, Object3D } from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
import { BossAnimationController } from "./BossAnimationController";

export class BossBuilder extends Boss {
  public static build(asset: GLTF): Boss {
    const armature = asset.scene.getObjectByName("Armature");
    if (!armature) throw new Error("Invalid character object");

    const skeleton = SkeletonUtils.clone(armature);
    const container = new Object3D();
    container.add(skeleton);

    GraphicsHandler.instance.scene.add(container);
    Object3DToolbox.setShadowRecursive(skeleton);

    const findClip = (name: string) => {
      const clip = asset.animations.find((a) => a.name === name);
      if (!clip) throw new Error(`Animation clip "${name}" not found`);
      return clip;
    };

    const mixer = new AnimationMixer(skeleton);

    const idleClip = findClip("A_Idle");
    const hitClip = findClip("A_Hit");
    const attackClip = findClip("A_Attack");
    const deathClip = findClip("A_Death");
    const winClip = findClip("A_Win");

    const animationController = new BossAnimationController({
      mixer,
      idleClip,
      hitClip,
      attackClip,
      deathClip,
      winClip,
    });

    const mesh = skeleton.getObjectByName("SK_Boss");
    if (!(mesh instanceof Mesh)) {
      throw new Error("Invalid mesh");
    }

    const joints = [
      {
        bone: "head",
        morphTarget: "Head",
        position: { x: -0.093, y: 2.617, z: 0.121 },
        rotation: { x: 93, y: -1.05, z: 1.14 },
        scale: { x: 4.701, y: 4.701, z: 2.302 },
      },
      {
        bone: "spine002",
        morphTarget: "Body",
        position: { x: 0.01, y: -0.456, z: -0.01 },
        rotation: { x: 90.44, y: 0.58, z: -4.16 },
        scale: { x: 3.92, y: 3.92, z: 2.05 },
      },
      {
        bone: "forearmR",
        morphTarget: "Arm_Right",
        position: { x: -0.06, y: 0, z: 0.23 },
        rotation: { x: 98.47, y: 0.9, z: 13.53 },
        scale: { x: 1.63, y: 1.63, z: 1.63 },
      },
      {
        bone: "forearmL",
        morphTarget: "Arm_Left",
        position: { x: 0.01, y: 0.02, z: 0.25 },
        rotation: { x: -98.65, y: -1.62, z: -5.39 },
        scale: { x: 1.63, y: 1.63, z: 1.63 },
      },
      {
        bone: "shinR",
        morphTarget: "Leg_Right",
        position: { x: 0, y: 0.02, z: 0.17 },
        rotation: { x: 80.3, y: 0.99, z: -1.11 },
        scale: { x: 1.77, y: 1.77, z: 1.77 },
      },
      {
        bone: "shinL",
        morphTarget: "Leg_Left",
        position: { x: 0, y: 0.02, z: 0.18 },
        rotation: { x: 38.06, y: 1.04, z: -1.37 },
        scale: { x: 1.7, y: 1.7, z: 1.7 },
      },
    ].map(({ bone, morphTarget, position, rotation, scale }) => {
      const boneObject = skeleton.getObjectByName(bone);
      if (!boneObject) throw new Error(`Bone not found: ${bone}`);

      const dictionary = mesh.morphTargetDictionary;
      if (!dictionary) throw new Error(`Morph target dictionary not found`);

      const index = dictionary[morphTarget];
      if (index == null) {
        throw new Error(`Morph target not found: ${morphTarget}`);
      }

      const influences = mesh.morphTargetInfluences;
      if (influences == null) {
        throw new Error(`Morph target influences not found: ${morphTarget}`);
      }

      const group = new Group();
      boneObject.add(group);
      group.position.set(position.x, position.y, position.z);
      group.rotation.set(
        MathUtils.degToRad(rotation.x),
        MathUtils.degToRad(rotation.y),
        MathUtils.degToRad(rotation.z),
      );
      group.scale.set(scale.x, scale.y, scale.z);

      return {
        container: group,
        morphTargetIndex: index,
        morphTargetInfluences: influences,
      };
    });

    return new Boss({
      object: container,
      animationController,
      joints,
    });
  }
}
