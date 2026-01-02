const MAX_COLLISION_GROUPS = 31;

export namespace CollisionController {
  export const instance = new (class {
    private readonly collisionGroupBits = new Map<string, number>();
    private nextCollisionGroupBit = 0;

    public register(name: string): string {
      if (this.collisionGroupBits.has(name)) {
        return name;
      }

      if (this.nextCollisionGroupBit >= MAX_COLLISION_GROUPS) {
        throw new Error(
          `Too many collision groups (max ${MAX_COLLISION_GROUPS})`,
        );
      }

      this.collisionGroupBits.set(name, 1 << this.nextCollisionGroupBit++);
      return name;
    }

    public getGroup(name: string): number {
      const bit = this.collisionGroupBits.get(name);
      if (bit === undefined) {
        throw new Error(`Group "${name}" not registered`);
      }
      return bit;
    }

    public getMask(allowedNames: string[]): number {
      return allowedNames.reduce((mask, name) => {
        return mask | this.getGroup(name);
      }, 0);
    }

    public debugMatrix(): Record<string, number> {
      const out: Record<string, number> = {};
      for (const [name, bit] of this.collisionGroupBits) {
        out[name] = bit;
      }
      return out;
    }
  })();
}
