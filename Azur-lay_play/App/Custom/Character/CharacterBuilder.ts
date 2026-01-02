import { Body } from "Body";
import { Character } from "Character";
import { CharacterAnimationController } from "CharacterAnimationController";
import { GraphicsHandler } from "GraphicsHandler";
import { IMovementController } from "Libs/System/IMovementController";
import { Object3DToolbox } from "Libs/System/Object3DToolbox";
import { AnimationMixer, Group, Vector3 } from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
import { CharacterStepHandler } from "./CharacterStepHandler";

interface IOptions {
  asset: GLTF;
  collisionGroup: number;
  collisionMask: number;
  movementController: IMovementController;
  stepHandler: CharacterStepHandler;
}

export class CharacterBuilder extends Character {
  public static build(options: IOptions): Character {
    const armature = options.asset.scene.getObjectByName("Armature");
    if (!armature) throw new Error("Invalid character object");

    const character = SkeletonUtils.clone(armature);
    const container = new Group();
    container.add(character);

    GraphicsHandler.instance.scene.add(container);
    Object3DToolbox.setShadowRecursive(container);

    const findClip = (name: string) => {
      const clip = options.asset.animations.find((a) => a.name === name);
      if (!clip) throw new Error(`Animation clip "${name}" not found`);
      return clip;
    };

    const mixer = new AnimationMixer(character);

    const idleClip = findClip("A_Idle");
    const runClip = findClip("A_Run");
    const attackClip = findClip("A_Attack");
    const deathClip = findClip("A_Death");
    const winClip = findClip("A_Win");

    const animationController = new CharacterAnimationController({
      mixer,
      idleClip,
      runClip,
      attackClip,
      deathClip,
      winClip,
      maximumSpeed: options.movementController.maximumSpeed,
    });

    const height = 1.7;
    const body = new Body(
      { width: 1, height, depth: 0.75 },
      {
        isKinematic: true,
        collisionGroup: options.collisionGroup,
        collisionMask: options.collisionMask,
      },
    );

    const bodyOffset = new Vector3(0, height / 2, 0);

    return new Character({
      object: container,
      body,
      bodyOffset,
      movementController: options.movementController,
      animationController,
      stepHandler: options.stepHandler,
    });
  }
}
