import { InstanceAssembler } from "Libs/System/InstanceAssembler";
import { Object3DToolbox } from "Libs/System/Object3DToolbox";
import { FrontSide, Material, Mesh, Object3D } from "three";

export class SceneProcessor {
  public static process(
    asset: Object3D,
    castShadowNames: string[] = [],
    receiveShadowNames: string[] = [],
  ): Object3D {
    InstanceAssembler.assemble(asset);
    Object3DToolbox.enumerateMaterials(asset, (material: Material) => {
      material.transparent = false;
      material.side = FrontSide;
      material.forceSinglePass = true;
      material.depthTest = true;
      material.depthWrite = true;
    });

    if (castShadowNames.length > 0 || receiveShadowNames.length > 0) {
      asset.traverse((child: Object3D) => {
        if (child instanceof Mesh) {
          child.castShadow =
            castShadowNames.includes("*") ||
            castShadowNames.includes(child.name);
          child.receiveShadow =
            receiveShadowNames.includes("*") ||
            receiveShadowNames.includes(child.name);
        }
      });
    }

    return asset;
  }
}
