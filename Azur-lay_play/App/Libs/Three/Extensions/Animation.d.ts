import * as THREE from "three";

declare module "three" {
  interface AnimationAction {
    setRandomFrame(): void;
  }

  interface AnimationMixer {
    waitActionFinish(): Promise<void>;
  }

  interface SkinnedMesh {
    calculateBoneLocalAABB(
      name: string,
      minWeight?: number,
    ): {
      center: THREE.Vector3;
      size: THREE.Vector3;
      bone: THREE.Bone;
    } | null;
  }
}
