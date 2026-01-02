import { Mesh, Object3D } from "three";
import { Enumerator } from "three-zoo";

export enum FragmentTypeName {
  head = "Head",
  body = "Body",
  arms = "Arms",
  legs = "Legs",
}

interface Parameters {
  container: Object3D;
  name: string;
  enabled: boolean;
}

export class FragmentCollection {
  public readonly name: string;
  private readonly fragments: Map<FragmentTypeName, Mesh> = new Map();

  public constructor(parameters: Parameters) {
    this.name = parameters.name;

    for (const fragmentTypeName of Object.values(FragmentTypeName)) {
      const fragmentName = `SK_${this.name}_${fragmentTypeName}`;
      const fragment = Enumerator.getObjectByName(
        parameters.container,
        fragmentName,
      );

      if (!(fragment instanceof Mesh)) {
        throw new Error(`Fragment "${fragmentName}" not found in the object!`);
      }

      this.fragments.set(fragmentTypeName, fragment);
    }

    if (parameters.enabled) this.enableAll();
    else this.disableAll();
  }

  private setFragmentVisibility(
    type: FragmentTypeName,
    visible: boolean,
  ): Mesh {
    const fragment = this.fragments.get(type);
    if (!fragment) throw new Error(`Fragment "${type}" not initialized!`);
    fragment.visible = visible;
    return fragment;
  }

  public enableFragment(type: FragmentTypeName): Mesh {
    return this.setFragmentVisibility(type, true);
  }

  public disableFragment(type: FragmentTypeName): Mesh {
    return this.setFragmentVisibility(type, false);
  }

  public enableAll(): void {
    const values = Object.values(FragmentTypeName) as FragmentTypeName[];
    for (const fragment of values) {
      this.setFragmentVisibility(fragment, true);
    }
  }

  public disableAll(): void {
    const values = Object.values(FragmentTypeName) as FragmentTypeName[];
    for (const fragment of values) {
      this.setFragmentVisibility(fragment, false);
    }
  }

  public getFragments(): Mesh[] {
    return Array.from(this.fragments.values());
  }
}
