import { Emitter } from "eventail";
import {
  Box3,
  Camera,
  Group,
  Intersection,
  Object3D,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import { Fragment } from "./Fragment";
import { FragmentTypeName } from "./FragmentCollection";

const raycaster = new Raycaster();

export enum FragmentSelectorEvent {
  select = "select",
}

interface Parameters {
  camera: Camera;
  scene: Object3D;
  fragments: Fragment[];
  isActive: boolean;
}

export class FragmentSelector extends Emitter {
  private readonly camera: Camera;
  private readonly fragments: Fragment[];
  private readonly container: Group = new Group();

  private isActivePrivate: boolean = false;
  private readonly tempVector2D: Vector2 = new Vector2();

  public constructor(parameters: Parameters) {
    super();
    this.camera = parameters.camera;
    this.fragments = [...parameters.fragments];
    parameters.scene.add(this.container);

    for (const fragment of this.fragments) {
      this.container.add(fragment);
    }

    const box3 = new Box3().setFromObject(this.container);
    const center = box3.getCenter(new Vector3());
    this.container.position.copy(center);

    for (const child of this.container.children) {
      child.position.sub(center);
    }

    this.container.position.z = 3.2;

    this.isActive = parameters.isActive;
  }

  public destroy() {
    window.removeEventListener("click", this.handleScreenClick);
    window.removeEventListener("touchstart", this.handleTouchClick);
  }

  public get isActive(): boolean {
    return this.isActivePrivate;
  }

  public set isActive(value: boolean) {
    if (value === this.isActivePrivate) return;
    this.isActivePrivate = value;

    if (this.isActivePrivate) {
      window.addEventListener("click", this.handleScreenClick);
      window.addEventListener("touchstart", this.handleTouchClick, { passive: false });
    } else {
      window.removeEventListener("click", this.handleScreenClick);
      window.removeEventListener("touchstart", this.handleTouchClick);
    }
  }

  private handleScreenClick = (event: MouseEvent): void => {
    this.tempVector2D.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
    );

    raycaster.setFromCamera(this.tempVector2D, this.camera);
    const meshes = this.fragments.map((part) => part.raycastMesh);

    const intersects: Intersection[] = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const selectedObject: Object3D = (intersects[0] as Intersection).object;
      const selectedFragment = this.fragments.find(
          (part) => part.raycastMesh === selectedObject,
      );

      if (selectedFragment) {
        this.emit(FragmentSelectorEvent.select, selectedFragment);
      }
    }
  };

  private handleTouchClick = (event: TouchEvent): void => {
    if (event.touches && event.touches.length === 1) {
      const touch = event.touches[0]!;
      this.tempVector2D.set(
          (touch.clientX / window.innerWidth) * 2 - 1,
          -(touch.clientY / window.innerHeight) * 2 + 1,
      );

      raycaster.setFromCamera(this.tempVector2D, this.camera);
      const meshes = this.fragments.map((part) => part.raycastMesh);

      const intersects: Intersection[] = raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        const selectedObject: Object3D = (intersects[0] as Intersection).object;
        const selectedFragment = this.fragments.find(
            (part) => part.raycastMesh === selectedObject,
        );

        if (selectedFragment) {
          this.emit(FragmentSelectorEvent.select, selectedFragment);
          event.preventDefault();
        }
      }
    }
  };

  public getActiveFragments(): Fragment[] {
    return this.fragments;
  }

  public setFragment(type: FragmentTypeName): void {
    for (const fragment of this.fragments) {
      fragment.setFragment(type);
    }
  }

  public disableAll(): void {
    for (const fragment of this.fragments) {
      fragment.disableAll();
    }
  }
}
