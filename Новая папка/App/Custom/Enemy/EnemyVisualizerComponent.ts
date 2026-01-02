import type { CharacterVisualizerComponentSpeedHandler } from "Custom/CharacterVisualizerComponent";
import { CharacterVisualizerComponent } from "Custom/CharacterVisualizerComponent";
import { Shared } from "Custom/Shared";
import type { Platform } from "Libs/Platform/Platform";
import { MeshStandardMaterial } from "three";
import { SceneTraversal } from "three-zoo";

export class EnemyVisualizerComponent extends CharacterVisualizerComponent {
  constructor(
    platform: Platform,
    speedHandler: CharacterVisualizerComponentSpeedHandler,
  ) {
    super(platform, speedHandler);

    this.character.getObjectByName("SK_King_Clothes")?.removeFromParent();
    this.character.getObjectByName("SK_Shark_Hat")?.removeFromParent();

    const material = SceneTraversal.cloneMaterialByName(
      this.character,
      "M_Accent",
    );

    if (material instanceof MeshStandardMaterial) {
      material.color.set(Shared.enemyTeamColor);
    }
  }
}
