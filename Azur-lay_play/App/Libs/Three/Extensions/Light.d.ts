import * as THREE from "three";

declare module "three" {
  // interface DirectionalLight {
  //   setShadowMapFromBox3(box: THREE.Box3): void;
  //   setDirectionFromHDR(texture: THREE.Texture, distance?: number): void;
  //   distance: number;
  //   elevation: number;
  //   azimuth: number;
  // }

  interface HemisphereLight {
    setFromHDR(texture: THREE.Texture, intensity?: number): void;
  }
}
