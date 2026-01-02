import {
  Box3,
  BufferAttribute,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type Mesh,
} from "three";
import { Body } from "./Body";
import type { Collision } from "./BodyOptions";
import { TrimeshBody } from "./TrimeshBody";

export class BodyBuilder {
  public static buildBoxBody(mesh: Mesh, collision?: Collision): Body {
    const meshPosition = mesh.getWorldPosition(new Vector3());
    const meshQuaternion = mesh.getWorldQuaternion(new Quaternion());
    const meshScale = mesh.getWorldScale(new Vector3());
    meshQuaternion.normalize();

    const box3 = new Box3().setFromBufferAttribute(
      (mesh.geometry as BufferGeometry).getAttribute(
        "position",
      ) as BufferAttribute,
    );

    const dimensions = box3.getSize(new Vector3()).multiply(meshScale);
    dimensions.x = Math.abs(dimensions.x);
    dimensions.y = Math.abs(dimensions.y);
    dimensions.z = Math.abs(dimensions.z);

    const body = new Body(
      {
        width: dimensions.x,
        height: dimensions.y,
        depth: dimensions.z,
      },
      { isKinematic: false, collision },
    );
    body.setTransform(meshPosition, meshQuaternion);

    return body;
  }

  public static buildFromMesh(mesh: Mesh, collision?: Collision): TrimeshBody {
    const geometry = mesh.geometry;
    if (!geometry.index) {
      throw new Error("Index not found");
    }

    const positionAttribute = geometry.getAttribute("position");
    if (!(positionAttribute instanceof BufferAttribute)) {
      throw new Error("Position attribute is not a BufferAttribute");
    }

    const position = mesh.getWorldPosition(new Vector3());
    const quaternion = mesh.getWorldQuaternion(new Quaternion());
    const scale = mesh.getWorldScale(new Vector3());

    const vertices = [];
    const indices = [];

    for (let i = 0; i < positionAttribute.count; i++) {
      vertices.push(
        positionAttribute.getX(i) * scale.x,
        positionAttribute.getY(i) * scale.y,
        positionAttribute.getZ(i) * scale.z,
      );
    }

    indices.push(...geometry.index.array);
    const body = new TrimeshBody(vertices, indices, collision);
    body.setTransform(position, quaternion);
    return body;
  }
}
