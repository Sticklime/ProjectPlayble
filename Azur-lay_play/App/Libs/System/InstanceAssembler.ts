import * as THREE from "three";

type MeshInfo = {
  meshes: THREE.Mesh[];
  castShadow: boolean;
  receiveShadow: boolean;
};

export class InstanceAssembler {
  public static assemble(
    container: THREE.Object3D,
    filter: (child: THREE.Object3D) => boolean = () => true,
  ): void {
    const instances = new Map<THREE.BufferGeometry, MeshInfo>();
    const instancedMeshes: THREE.InstancedMesh[] = [];

    container.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.Material &&
        child.children.length === 0 &&
        filter(child)
      ) {
        const info = instances.get(child.geometry) || {
          meshes: [],
          castShadow: false,
          receiveShadow: false,
        };

        instances.set(child.geometry, info);
        info.meshes.push(child);

        if (child.castShadow) info.castShadow = true;
        if (child.receiveShadow) info.receiveShadow = true;
      }
    });

    instances.forEach((info, geometry) => {
      const { meshes, castShadow, receiveShadow } = info;
      if (meshes.length < 2) return;

      const sortedMeshes = meshes.sort((a, b) => a.name.localeCompare(b.name));
      const fistMesh = sortedMeshes[0];

      if (!fistMesh) {
        throw new Error("No mesh found");
      }

      fistMesh.updateMatrix();
      fistMesh.updateWorldMatrix(true, false);
      const centerPosition = fistMesh.getWorldPosition(new THREE.Vector3());

      for (const mesh of sortedMeshes) {
        mesh.position.sub(centerPosition);
        mesh.updateMatrix();
        mesh.updateWorldMatrix(true, false);
      }

      const instancedMesh = new THREE.InstancedMesh(
        geometry,
        fistMesh.material,
        sortedMeshes.length,
      );

      instancedMesh.name = fistMesh.name;
      instancedMesh.castShadow = castShadow;
      instancedMesh.receiveShadow = receiveShadow;
      instancedMesh.position.copy(centerPosition);

      for (let i = 0; i < sortedMeshes.length; i++) {
        const mesh = sortedMeshes[i];
        if (!mesh) {
          throw new Error("Mesh not found");
        }
        instancedMesh.setMatrixAt(i, mesh.matrixWorld);
      }

      instancedMeshes.push(instancedMesh);
      sortedMeshes.forEach((mesh) => mesh.parent?.remove(mesh));
    });

    container.add(...instancedMeshes);
  }
}
