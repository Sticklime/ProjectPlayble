import { AnimationMachine, ClipState } from "animouse";
import type { AnimationActionLoopStyles, AnimationClip, Object3D } from "three";
import {
  AnimationAction,
  AnimationMixer,
  LoopOnce,
  LoopRepeat,
  Mesh,
  MeshStandardMaterial,
} from "three";
import { SceneTraversal } from "three-zoo";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { clone } from "three/examples/jsm/utils/SkeletonUtils";

export enum CharacterAnimationEvent {
  RESET = "reset",
}

export interface CharacterFabricParameters {
  asset: GLTF;
  scale: number;
  weaponBoneName: string;
  weaponAsset: GLTF;
  weaponScale: number;
  useAOMap: boolean;
  normalScale: number;
  emissiveIntensity: number;
}

export class CharacterFabric {
  public static build(parameters: CharacterFabricParameters): {
    character: Object3D;
    weapon: Object3D;
    machine: AnimationMachine;
  } {
    const clipStart = parameters.asset.animations.find(
      (a) => a.name === "A_Start",
    );
    const clipIdle = parameters.asset.animations.find(
      (a) => a.name === "A_Idle",
    );

    if (clipStart === undefined) {
      throw new Error("No start animation found");
    }
    if (clipIdle === undefined) {
      throw new Error("No idle animation found");
    }

    const character = clone(parameters.asset.scene);
    character.scale.set(parameters.scale, parameters.scale, parameters.scale);

    const mixer = new AnimationMixer(character);
    const stateStart = new ClipState(
      this.buildAction(mixer, clipStart, LoopOnce),
    );
    const stateIdle = new ClipState(
      this.buildAction(mixer, clipIdle, LoopRepeat),
    );

    const machine = new AnimationMachine(stateStart, mixer);
    machine.addAutomaticTransition(stateStart, {
      to: stateIdle,
      duration: 0.5,
    });
    machine.addEventTransition(CharacterAnimationEvent.RESET, {
      from: stateIdle,
      to: stateStart,
      duration: 0,
    });

    const bone = SceneTraversal.getObjectByName(
      character,
      parameters.weaponBoneName,
    );

    if (!bone) {
      throw new Error(`Weapon bone not found: ${parameters.weaponBoneName}`);
    }

    const weapon = clone(parameters.weaponAsset.scene);
    bone.add(weapon);

    weapon.scale.set(
      parameters.weaponScale,
      parameters.weaponScale,
      parameters.weaponScale,
    );

    SceneTraversal.enumerateObjectsByType(character, Mesh, (mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    SceneTraversal.enumerateMaterials(character, (material) => {
      if (material instanceof MeshStandardMaterial) {
        if (parameters.useAOMap) {
          material.aoMap = material.metalnessMap ?? material.roughnessMap;
        }
        material.emissiveIntensity = parameters.emissiveIntensity;
        if (material.name === 'M_Calibri' || material.name === 'M_Twinkle' || material.name === 'M_Jagger')  material.emissive.set(0.5, 0, 0)
        material.normalScale.multiplyScalar(parameters.normalScale);
        material.needsUpdate = true;
      }
    });

    return { character, weapon, machine };
  }

  private static buildAction(
    mixer: AnimationMixer,
    clip: AnimationClip,
    wrap: AnimationActionLoopStyles,
  ): AnimationAction {
    const action = new AnimationAction(mixer, clip);
    action.loop = wrap;
    action.clampWhenFinished = wrap === LoopOnce;
    return action;
  }
}
