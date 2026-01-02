import type { Vector3 } from "three";
import { BufferGeometry, Line, LineBasicMaterial } from "three";

export class PathVisualizer {
  private line: Line;
  private material: LineBasicMaterial;

  constructor() {
    this.material = new LineBasicMaterial({ color: Math.random() * 0xffffff });
    this.line = new Line(new BufferGeometry(), this.material);
    App.World?.Scene.add(this.line);
  }

  public setPath(points: Vector3[]): void {
    this.line.geometry.dispose();
    this.line.geometry = new BufferGeometry().setFromPoints(points);
  }

  public destroy(): void {
    App.World?.Scene.remove(this.line);
    this.line.geometry.dispose();
    this.material.dispose();
  }
}
