import { AnimationMachine, LinearBlendTree } from "animouse";
import { AssetKeeper } from "Generated/AssetKeeper";
import { Component } from "Libs/Platform/Component";
import type { Platform } from "Libs/Platform/Platform";
import { TinyParticleEmitter } from "Libs/TinyParticleSystem/TinyEmitter";
import { TinyParticleSystem } from "Libs/TinyParticleSystem/TinyParticleSystem";
import type { AnimationAction, AnimationActionLoopStyles } from "three";
import {
  AnimationMixer,
  Color,
  LoopOnce,
  LoopRepeat,
  Mesh,
  Object3D,
  Vector3,
} from "three";
import { SceneTraversal } from "three-zoo";
import { clone } from "three/examples/jsm/utils/SkeletonUtils";

export interface CharacterVisualizerComponentSpeedHandler {
  get maximumSpeed(): number;
  get currentSpeed(): number;
}

export class CharacterVisualizerComponent extends Component {
  protected readonly character: Object3D;
  protected readonly forwardAction: AnimationAction;
  protected readonly blendTree: LinearBlendTree;

  private readonly machine: AnimationMachine;

  private readonly weaponAnchorInternal: Object3D;
  private readonly progressAnchorInternal: Object3D;

  private static particleSystemInternal?: TinyParticleSystem;
  private static get particleSystem(): TinyParticleSystem {
    CharacterVisualizerComponent.particleSystemInternal =
      CharacterVisualizerComponent.particleSystemInternal ??
      new TinyParticleSystem(
        { gravity: new Vector3(0, 0, 0), capacity: 128 },
        {
          texture: AssetKeeper.T_ParticleDeath,
          color: new Color(0xbbbbbb),
          depthTest: false,
          depthWrite: false,
        },
      );

    return CharacterVisualizerComponent.particleSystemInternal;
  }

  constructor(
    platform: Platform,
    private readonly speedHandler: CharacterVisualizerComponentSpeedHandler,
  ) {
    super(platform);

    this.character = clone(AssetKeeper.Characters.scene);
    this.platform.add(this.character);

    SceneTraversal.enumerateObjectsByType(this.character, Mesh, (m: Mesh) => {
      m.castShadow = true;
      m.receiveShadow = true;
    });

    const mixer = new AnimationMixer(this.character);

    this.forwardAction = CharacterVisualizerComponent.buildAction(
      "a-forward",
      mixer,
    );

    this.blendTree = new LinearBlendTree([
      {
        action: CharacterVisualizerComponent.buildAction("a-idle-gun", mixer),
        value: 0,
      },
      {
        action: this.forwardAction,
        value: speedHandler.maximumSpeed,
      },
    ]);

    this.machine = new AnimationMachine(this.blendTree, mixer);

    const flowAnchor = this.platform.getObjectByName("mixamorigRightHand_end");
    if (!flowAnchor) {
      throw new Error("Flow anchor not found");
    }
    this.weaponAnchorInternal = flowAnchor;

    this.progressAnchorInternal = new Object3D();
    this.platform.add(this.progressAnchorInternal);
    this.progressAnchorInternal.position.set(0, 2.5, 0);
  }

  public override destroy(): void {
    const emitter = new TinyParticleEmitter(
      {
        playByDefault: true,
        playTime: 0.25,
        spawnRate: 20,
        system: CharacterVisualizerComponent.particleSystem,
        isLocalSpace: true,
      },
      {
        lifeTimeRange: { min: 1, max: 2 },
        positionRange: {
          min: { x: -1, y: -1, z: -1 },
          max: { x: 1, y: 1, z: 1 },
        },
        rotationRange: { min: -0.25, max: 0.25 },
        scaleOverTime: [
          { min: 0, max: 0 },
          { min: 0.5, max: 1.25 },
        ],
        opacityOverTime: [
          { min: 0, max: 0 },
          { min: 1, max: 1 },
          { min: 0, max: 0 },
        ],
        velocityRange: {
          theta: { min: 0, max: 0 },
          phi: { min: 0, max: 0 },
          magnitude: { min: 0.75, max: 1.25 },
        },
        angularVelocityRange: { min: 0, max: 0 },
      },
    );
    emitter.position.copy(this.platform.position);
    emitter.play();
    setTimeout(() => emitter.destroy(), 5000);
    super.destroy();
  }

  public get weaponAnchor(): Object3D {
    return this.weaponAnchorInternal;
  }

  public get progressAnchor(): Object3D {
    return this.progressAnchorInternal;
  }

  protected override onFixedTick(fixedDeltaTime: number): void {
    this.blendTree.setBlend(this.speedHandler.currentSpeed);
    this.machine.update(fixedDeltaTime);
  }

  private static buildAction(
    name: string,
    mixer: AnimationMixer,
    loop: AnimationActionLoopStyles = LoopRepeat,
  ): AnimationAction {
    const animationClip = AssetKeeper.Characters.animations.find(
      (a) => a.name === name,
    );
    if (!animationClip) {
      throw new Error(`Animation not found: ${name}`);
    }

    const action = mixer.clipAction(animationClip);
    action.loop = loop;
    action.clampWhenFinished = loop === LoopOnce;
    return action;
  }
}
