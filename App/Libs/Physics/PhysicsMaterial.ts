import { CannonContactMaterial, CannonMaterial } from "./cannonImport";
import { PhysicsController } from "./PhysicsController";

export class PhysicsMaterial {
  private static readonly materials = new Set<PhysicsMaterial>();
  private static readonly contactMaterials = new Map<
    PhysicsMaterial,
    Map<PhysicsMaterial, CannonContactMaterial>
  >();
  private static readonly defaultContactMaterials = new Map<
    PhysicsMaterial,
    CannonContactMaterial
  >();

  protected readonly rawCannonMaterial = new CannonMaterial();
  private frictionInternal: number;

  constructor(friction = 0.25) {
    this.frictionInternal = friction;
    PhysicsMaterial.materials.add(this);
    this.updateContactMaterials();
  }

  public destroy() {
    const innerMap = PhysicsMaterial.contactMaterials.get(this);
    if (innerMap) {
      for (const contactMaterial of innerMap.values()) {
        PhysicsController.instance.rawCannonWorld.removeContactMaterial(
          contactMaterial,
        );
      }
      PhysicsMaterial.contactMaterials.delete(this);
    }
    for (const [_, otherInnerMap] of PhysicsMaterial.contactMaterials) {
      const contactMaterial = otherInnerMap.get(this);
      if (contactMaterial) {
        PhysicsController.instance.rawCannonWorld.removeContactMaterial(
          contactMaterial,
        );
        otherInnerMap.delete(this);
      }
    }

    const defaultContact = PhysicsMaterial.defaultContactMaterials.get(this);
    if (defaultContact) {
      PhysicsController.instance.rawCannonWorld.removeContactMaterial(
        defaultContact,
      );
      PhysicsMaterial.defaultContactMaterials.delete(this);
    }

    PhysicsMaterial.materials.delete(this);
  }

  public get friction() {
    return this.frictionInternal;
  }

  public set friction(value: number) {
    this.frictionInternal = value;
    this.updateContactMaterials();
  }

  private updateContactMaterials() {
    this.ensureDefaultContactMaterial();

    for (const other of PhysicsMaterial.materials) {
      this.ensureContactMaterial(this, other);
    }
  }

  private ensureDefaultContactMaterial() {
    const defaultMaterial =
      PhysicsController.instance.rawCannonWorld.defaultMaterial;

    if (PhysicsMaterial.defaultContactMaterials.has(this)) {
      const contactMaterial =
        PhysicsMaterial.defaultContactMaterials.get(this)!;
      contactMaterial.friction = this.friction;
      return;
    }

    const contactMaterial = new CannonContactMaterial(
      defaultMaterial,
      this.rawCannonMaterial,
      {
        friction: this.friction,
        restitution: 0,
      },
    );
    PhysicsController.instance.rawCannonWorld.addContactMaterial(
      contactMaterial,
    );
    PhysicsMaterial.defaultContactMaterials.set(this, contactMaterial);
  }

  private ensureContactMaterial(a: PhysicsMaterial, b: PhysicsMaterial) {
    const innerMap =
      PhysicsMaterial.contactMaterials.get(a) ??
      new Map<PhysicsMaterial, CannonContactMaterial>();
    PhysicsMaterial.contactMaterials.set(a, innerMap);

    if (innerMap.has(b)) {
      const contactMaterial = innerMap.get(b)!;
      contactMaterial.friction = a.friction * b.friction;
      return;
    }

    const friction = a.friction * b.friction;
    const contactMaterial = new CannonContactMaterial(
      a.rawCannonMaterial,
      b.rawCannonMaterial,
      {
        friction,
        restitution: 0,
      },
    );

    PhysicsController.instance.rawCannonWorld.addContactMaterial(
      contactMaterial,
    );
    innerMap.set(b, contactMaterial);
  }
}
