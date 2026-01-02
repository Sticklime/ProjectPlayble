import type { Material, Object3D, Texture } from "three";
import { Mesh, MeshStandardMaterial } from "three";
import { PaintableMaterial } from "./PaintableMaterial";

export class PaintableMaterialApplier {
  static apply(
    object3d: Object3D,
    materialNames: string[],
    paintTexture: Texture,
  ): PaintableMaterial[] {
    const materialNamesSet = new Set(materialNames);
    const originalToPaintable = new Map<
      MeshStandardMaterial,
      PaintableMaterial
    >();

    object3d.traverse((mesh) => {
      if (mesh instanceof Mesh) {
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        const processedMaterials: Material[] = [];

        for (const material of materials) {
          if (!materialNamesSet.has(material.name)) {
            processedMaterials.push(material);
            continue;
          }

          if (!(material instanceof MeshStandardMaterial)) {
            throw new Error(
              `Material "${material.name}" is not a MeshStandardMaterial`,
            );
          }

          let paintableMaterial = originalToPaintable.get(material);
          if (!paintableMaterial) {
            paintableMaterial = new PaintableMaterial(paintTexture, material);
            originalToPaintable.set(material, paintableMaterial);
          }

          processedMaterials.push(paintableMaterial);
        }

        mesh.material = Array.isArray(mesh.material)
          ? processedMaterials
          : processedMaterials[0];
      }
    });

    return Array.from(originalToPaintable.values());
  }
}
