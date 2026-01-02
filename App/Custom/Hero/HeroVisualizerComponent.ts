import type { CharacterVisualizerComponentSpeedHandler } from "Custom/CharacterVisualizerComponent";
import { CharacterVisualizerComponent } from "Custom/CharacterVisualizerComponent";
import { Shared } from "Custom/Shared";
import type { Platform } from "Libs/Platform/Platform";
import { TinyParticleEmitter } from "Libs/TinyParticleSystem/TinyEmitter";
import { safePromise } from "Libs/Toolbox/safeFunctions";
import type { Mesh } from "three";
import { MeshStandardMaterial, type Object3D } from "three";
import { SceneTraversal } from "three-zoo";

export class HeroVisualizerComponent extends CharacterVisualizerComponent {
  private sharkHat: Object3D;
  private kingClothes: Object3D;

  private readonly emitter = new TinyParticleEmitter(
    {
      playByDefault: false,
      playTime: 0.5,
      spawnRate: 80,
      system: Shared.lootboxParticleSystem,
      isLocalSpace: true,
      useRawTime: true,
    },
    {
      lifeTimeRange: { min: 0.25, max: 0.5 },
      positionRange: {
        min: { x: -1, y: 0, z: -1 },
        max: { x: 1, y: 2, z: 1 },
      },
      rotationRange: { min: -Math.PI, max: Math.PI },
      scaleOverTime: [
        { min: 0, max: 0 },
        { min: 0.1, max: 0.75 },
        { min: 0, max: 0 },
      ],
      opacityOverTime: [
        { min: 0, max: 0 },
        { min: 1, max: 1 },
        { min: 0, max: 0 },
      ],
      velocityRange: {
        theta: { min: -Math.PI, max: Math.PI },
        phi: { min: -Math.PI / 4, max: Math.PI / 4 },
        magnitude: { min: 0.25, max: 1 },
      },
      angularVelocityRange: { min: -4, max: 4 },
    },
  );

  constructor(
    platform: Platform,
    speedHandler: CharacterVisualizerComponentSpeedHandler,
  ) {
    super(platform, speedHandler);
    this.character.getObjectByName("SK_Enemy")?.removeFromParent();

    const material = SceneTraversal.cloneMaterialByName(
      this.character,
      "M_Accent",
    );

    if (material instanceof MeshStandardMaterial) {
      material.color.set(Shared.heroTeamColor);
    }

    const sharkHat = this.character.getObjectByName("SK_Shark_Hat");
    const kingClothes = this.character.getObjectByName("SK_King_Clothes");

    if (!sharkHat || !kingClothes) {
      throw new Error("Hero's hat and clothes not found");
    }

    this.sharkHat = sharkHat;
    this.kingClothes = kingClothes;

    this.sharkHat.visible = false;
    this.kingClothes.visible = false;

    this.platform.add(this.emitter);

    this.blendTree.onTimeEvent(this.forwardAction, 0.35, () =>
      MraidSDK.playSound("S_Step"),
    );
    this.blendTree.onTimeEvent(this.forwardAction, 0.85, () =>
      MraidSDK.playSound("S_Step"),
    );
  }

  public override destroy(): void {
    this.emitter.destroy();
    super.destroy();
  }

  public async showSharkHat(duration: number) {
    return safePromise<void>((resolve) => {
      this.showStars();
      this.sharkHat.visible = true;

      const material = (this.sharkHat as Mesh).material as MeshStandardMaterial;
      material.alphaHash = true;

      gsap.fromTo(
        material,
        { opacity: 0 },
        {
          opacity: 1,
          duration,
          ease: "back.out",
          onComplete: resolve,
        },
      );
    });
  }

  public async showKingClothes(duration: number) {
    return safePromise<void>((resolve) => {
      this.showStars();
      this.kingClothes.visible = true;

      {
        const material = (this.kingClothes as Mesh)
          .material as MeshStandardMaterial;
        material.alphaHash = true;

        gsap.fromTo(
          material,
          { opacity: 0 },
          {
            opacity: 1,
            duration,
            ease: "back.out",
            onComplete: resolve,
          },
        );
      }

      const oldBody = this.character.getObjectByName("SK_Body");
      if (!oldBody) {
        throw new Error("SK_Body not found!");
      }

      SceneTraversal.enumerateMaterials(oldBody, (material) => {
        material.alphaHash = true;

        gsap.to(material, {
          opacity: 0,
          duration,
          ease: "back.out",
          onComplete: () => {
            oldBody.visible = false;
          },
        });
      });
    });
  }

  public showStars() {
    this.emitter.play();
  }
}
