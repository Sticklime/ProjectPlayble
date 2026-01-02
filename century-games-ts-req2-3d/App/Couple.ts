import { AnimationMachine, ClipState } from "animouse";
import { gsap } from "gsap";
import { TimeController } from "Libs/Toolbox/TimeController";
import type {
  AnimationAction,
  AnimationActionLoopStyles,
  AnimationClip,
} from "three";
import {
  AnimationMixer,
  AnimationUtils,
  Group,
  LoopOnce,
  LoopRepeat,
  MathUtils,
  SkinnedMesh,
} from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { clone } from "three/examples/jsm/utils/SkeletonUtils";

enum CoupleAnimationEvent {
  FRIGHT = 1,
}

export class Couple extends Group {
  private readonly guyAnimationMachine: AnimationMachine;
  private readonly girlAnimationMachine: AnimationMachine;
  private guySkinnedMesh: SkinnedMesh[] = [];
  private girlSkinnedMesh: SkinnedMesh[] = [];

  constructor() {
    super();
    {
      const asset = App.ThreeAssets["SK_Guy"] as GLTF;
      const scene = clone(asset.scene);
      this.add(scene);

      scene.traverse((child) => {
        if (child instanceof SkinnedMesh) {
          this.guySkinnedMesh.push(child);
        }
      });

      const mixer = new AnimationMixer(scene);

      const idle = new ClipState(
        Couple.buildAction(
          asset.animations.find((animation) =>
            animation.name.includes("Idle"),
          ) as AnimationClip,
          0,
          100,
          mixer,
        ),
      );

      const fright = new ClipState(
        Couple.buildAction(
          asset.animations.find((animation) =>
            animation.name.includes("Fright"),
          ) as AnimationClip,
          0,
          100,
          mixer,
          LoopOnce,
        ),
      );

      this.guyAnimationMachine = new AnimationMachine(idle, mixer);
      this.guyAnimationMachine.addEventTransition(CoupleAnimationEvent.FRIGHT, {
        duration: 0.25,
        to: fright,
      });
    }
    {
      const asset = App.ThreeAssets["SK_Girl"] as GLTF;
      const scene = clone(asset.scene);
      this.add(scene);

      scene.traverse((child) => {
        if (child instanceof SkinnedMesh) {
          this.girlSkinnedMesh.push(child);
        }
      });

      const mixer = new AnimationMixer(scene);

      const idle = new ClipState(
        Couple.buildAction(
          asset.animations.find((animation) =>
            animation.name.includes("Idle"),
          ) as AnimationClip,
          0,
          100,
          mixer,
        ),
      );

      const fright = new ClipState(
        Couple.buildAction(
          asset.animations.find((animation) =>
            animation.name.includes("Fright"),
          ) as AnimationClip,
          0,
          100,
          mixer,
          LoopOnce,
        ),
      );

      this.girlAnimationMachine = new AnimationMachine(idle, mixer);
      this.girlAnimationMachine.addEventTransition(
        CoupleAnimationEvent.FRIGHT,
        {
          duration: 0.25,
          to: fright,
        },
      );
    }

    TimeController.instance.on(TimeController.Event.TICK, this.onTick);
  }

  public runFrightState() {
    this.guyAnimationMachine.handleEvent(CoupleAnimationEvent.FRIGHT);
    this.girlAnimationMachine.handleEvent(CoupleAnimationEvent.FRIGHT);

    this.animateFrightMorphTargets();
  }

  private animateFrightMorphTargets() {
    const delay = 0.5;
    const duration = 0.25;

    if (this.guySkinnedMesh) {
      for (const mesh of this.guySkinnedMesh) {
        this.animateMorph(mesh, "Fright", delay, duration);
      }
    }
    if (this.girlSkinnedMesh) {
      for (const mesh of this.girlSkinnedMesh) {
        this.animateMorph(mesh, "Fright", delay, duration);
      }
    }
  }

  private animateMorph(
    mesh: SkinnedMesh,
    targetName: string,
    delay: number,
    duration: number,
  ) {
    const dictionary = mesh.morphTargetDictionary;
    const influences = mesh.morphTargetInfluences;
    if (!dictionary || !influences) {
      return;
    }

    const index = dictionary[targetName];
    if (index === undefined) {
      return;
    }

    const helper = { t: 0 };
    gsap.to(helper, {
      t: 1,
      delay,
      duration,
      ease: "power1.inOut",
      onUpdate: () => {
        console.log(`Updating morph target influence: ${helper.t}`);
        influences[index] = helper.t;
      },
    });
  }


  private readonly onTick = (deltaTime: number) => {
    this.guyAnimationMachine.update(deltaTime);
    this.girlAnimationMachine.update(deltaTime);
  };

  private static buildAction(
    clip: AnimationClip,
    from: number,
    to: number,
    mixer: AnimationMixer,
    loop: AnimationActionLoopStyles = LoopRepeat,
  ): AnimationAction {
    const subclip = AnimationUtils.subclip(
      clip,
      MathUtils.generateUUID(),
      from,
      to,
      24,
    );
    const action = mixer.clipAction(subclip);
    action.loop = loop;
    action.clampWhenFinished = loop === LoopOnce;
    return action;
  }
}
