import {
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from "three";
import { FragmentCollection, FragmentTypeName } from "./FragmentCollection";

const geometry = new BoxGeometry(1, 1);
const material = new MeshBasicMaterial({
  wireframe: true,
  color: new Color("black"),
});

interface Parameters {
  collection: FragmentCollection;
}

export class Fragment extends Object3D {
  public readonly raycastMesh: Mesh;
  private readonly collection: FragmentCollection;

  public constructor(parameters: Parameters) {
    super();
    this.collection = parameters.collection;
    this.add(...this.collection.getFragments());
    this.raycastMesh = new Mesh(geometry, material);
    this.raycastMesh.position.set(0, 1, 0);
    this.add(this.raycastMesh);
  }

  public setFragment(type: FragmentTypeName): void {
    this.collection.disableAll();
    this.raycastMesh.visible = false;

    const fragment = this.collection.enableFragment(type);
    fragment.updateWorldMatrix(true, false);

    fragment.geometry.computeBoundingBox();
    const localBox = fragment.geometry.boundingBox?.clone();

    if (localBox) {
      const center = localBox.getCenter(new Vector3());
      const size = localBox.getSize(new Vector3());
      fragment.position.add(new Vector3(-center.x, 1 - center.y, -center.z));
      this.raycastMesh.scale.set(size.x, size.y, size.z);
    }

    fragment.updateMatrixWorld(true);
  }

  public disableAll(): void {
    this.collection.disableAll();
    this.raycastMesh.visible = false;
  }

  public get collectionName(): string {
    return this.collection.name;
  }
}
