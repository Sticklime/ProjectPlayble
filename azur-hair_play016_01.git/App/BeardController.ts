import * as THREE from "three";

export class BeardController {
    private readonly beardHairs: THREE.Mesh[];
    private readonly root: THREE.Object3D;

    public isRaze: boolean = false;

    constructor(root: THREE.Object3D) {
        this.root = root;
        this.beardHairs = [];
        this.root.traverse((child) => {
            if (child instanceof THREE.Mesh && child.name.startsWith("Boroda")) {
                this.beardHairs.push(child);
            }
        });
    }

    public getHairCount(): number {
        return this.beardHairs.length;
    }

    public removeHair(index: number): void {
        const hair = this.beardHairs[index];
        if (!hair) return;

        this.beardHairs.splice(index, 1); // удалить из логики, но оставить в сцене

        const duration = 1 + Math.random(); // случайная длительность
        const yOffset = -0.1 - Math.random() * 0.1; // ниже пола

        // Получаем мировую позицию волоса
        const worldPos = new THREE.Vector3();
        hair.getWorldPosition(worldPos);

        // Смещаем вниз по МИРОВОЙ Y
        worldPos.y += yOffset;


        // Конвертируем в локальные координаты родителя
        const localTarget = hair.parent!.worldToLocal(worldPos.clone());
        // Анимируем позицию к нужной локальной точке
        gsap.to(hair.position, {
            x: localTarget.x,
            y: localTarget.y,
            z: localTarget.z,
            duration: duration,
            ease: "power1.in",
        });

        // Удалить после анимации
        gsap.delayedCall(duration, () => {
            hair.geometry.dispose();
            if (Array.isArray(hair.material)) {
                hair.material.forEach((m) => m.dispose());
            } else {
                hair.material.dispose();
            }
            hair.parent?.remove(hair);
        });
    }

    public destroyAll(): void {
        for (const hair of [...this.beardHairs]) {
            if (!hair) {
                continue;
            }
            this.root.remove(hair);
            hair.geometry.dispose();
            if (Array.isArray(hair.material)) {
                hair.material.forEach((m) => m.dispose());
            } else {
                hair.material.dispose();
            }
        }
        this.beardHairs.length = 0;
    }

    public getCount(): number {
        return this.beardHairs.length;
    }

    public getHair(index: number): THREE.Object3D | null {
        return this.beardHairs[index] ?? null;
    }
}
