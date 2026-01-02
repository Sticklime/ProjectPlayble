import { AssetKeeper } from "Generated/AssetKeeper";
import { Mesh, Raycaster, Vector3 } from "three";
import { Pathfinding } from "three-pathfinding";
import { SceneTraversal } from "three-zoo";

export class LevelNavigator {
  private static readonly zone = "zone";
  private static pathfinding?: Pathfinding;
  private static navmesh?: Mesh;
  private static raycaster = new Raycaster();

  public static findPath(a: Vector3, b: Vector3): Vector3[] {
    const pathfinding = LevelNavigator.build();

    const pointStart = LevelNavigator.projectToNavmesh(a);
    const pointFinish = LevelNavigator.projectToNavmesh(b);

    if (!pointStart || !pointFinish) {
      return [];
    }

    const groupID = pathfinding.getGroup(LevelNavigator.zone, pointStart);
    const path = pathfinding.findPath(
      pointStart,
      pointFinish,
      LevelNavigator.zone,
      groupID,
    );

    return path ?? [];
  }

  private static projectToNavmesh(point: Vector3): Vector3 | undefined {
    if (!LevelNavigator.navmesh) {
      throw new Error("Navmesh not initialized");
    }

    const rayOrigin = point.clone();
    rayOrigin.y += 8192;

    const rayDirection = new Vector3(0, -1, 0);

    LevelNavigator.raycaster.set(rayOrigin, rayDirection);
    const intersects = LevelNavigator.raycaster.intersectObject(
      LevelNavigator.navmesh,
      false,
    );

    const intersection = intersects[0];
    if (intersection) {
      return intersection.point.clone();
    }

    return undefined;
  }

  private static build(): Pathfinding {
    if (LevelNavigator.pathfinding) {
      return LevelNavigator.pathfinding;
    }

    const asset = AssetKeeper.Navmesh_navmesh.scene;
    const navmesh = SceneTraversal.getObjectByName(asset, "Navmesh");

    if (!(navmesh instanceof Mesh)) {
      throw new Error("Navmesh not found");
    }

    LevelNavigator.navmesh = navmesh;

    const pathfinding = new Pathfinding();
    pathfinding.setZoneData(
      LevelNavigator.zone,
      Pathfinding.createZone(navmesh.geometry),
    );

    LevelNavigator.pathfinding = pathfinding;
    return LevelNavigator.pathfinding;
  }

  public static calculatePointOnPath(
    path: Vector3[],
    distanceFromStart: number,
  ): Vector3 | undefined {
    if (path.length < 1) {
      throw new Error("Needs at least 1 points");
    }

    if (path.length === 1) {
      return path[0]!.clone();
    }

    let accumulatedDistance = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const segmentStart = path[i]!;
      const segmentEnd = path[i + 1]!;
      const segmentLength = segmentStart.distanceTo(segmentEnd);

      if (accumulatedDistance + segmentLength >= distanceFromStart) {
        const remainingDistance = distanceFromStart - accumulatedDistance;
        const t = remainingDistance / segmentLength;
        return new Vector3().lerpVectors(segmentStart, segmentEnd, t);
      }

      accumulatedDistance += segmentLength;
    }

    return path[path.length - 1]!.clone();
  }

  public static calculatePathDistance(points: Vector3[]): number {
    let distance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      distance += points[i]!.distanceTo(points[i + 1]!);
    }
    return distance;
  }
}
