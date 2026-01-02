import * as THREE from "three";
import { OBB } from "three/examples/jsm/math/OBB.js";
import type {BeardController} from "BeardController";

export interface RazorOptions {
    bladeName?: string;
    thickness?: number;
    maxCutsPerFrame?: number;
    active?: boolean;
}

const DEFAULT_THICKNESS = 0.01;
const DEFAULT_MAX_CUTS_PER_FRAME = 8;

export class RazorTool {
    private readonly root: THREE.Object3D;
    private readonly beard: BeardController;

    private blade: THREE.Object3D | null = null;

    private readonly bladeOBB: OBB = new OBB();
    private readonly tmpBox: THREE.Box3 = new THREE.Box3();
    private readonly tmpSphere: THREE.Sphere = new THREE.Sphere();

    private _debugBoxHelper: THREE.Box3Helper | null = null;
    private _debugHairSpheres: THREE.Mesh[] = [];

    private readonly thickness: number;
    private readonly maxCutsPerFrame: number;
    private active: boolean;

    constructor(rootTools: THREE.Object3D, beard: BeardController, opts: RazorOptions = {}) {
        this.root = rootTools;
        this.beard = beard;

        this.thickness = opts.thickness ?? DEFAULT_THICKNESS;
        this.maxCutsPerFrame = opts.maxCutsPerFrame ?? DEFAULT_MAX_CUTS_PER_FRAME;
        this.active = opts.active ?? false;

        if (opts.bladeName) {
            this.setBladeByName(opts.bladeName);
        } else {
            this.autoPickBlade();
        }
    }

    public start(): void {
        this.active = true;
    }

    public stop(): void {
        this.active = false;
    }

    public setBladeByName(name: string): void {
        const obj = this.root.getObjectByName(name);
        this.blade = obj ?? null;
    }

    public autoPickBlade(): void {
        let candidate: THREE.Object3D | null = null;
        this.root.traverse((o) => {
            if (!candidate && o.name.toLowerCase().includes("blade")) {
                candidate = o;
            }
        });
        this.blade = candidate;
    }

    public update(): void {
        if (!this.active || !this.blade) {
            return;
        }



        this.updateBladeOBB();


        let cuts = 0;
        const total = this.beard.getCount();

        for (let i = total - 1; i >= 0; i--) {
            if (cuts >= this.maxCutsPerFrame) {
                break;
            }

            const hairObj = this.beard.getHair(i);
            if (!hairObj) {
                continue;
            }

            // важно: geometry есть только у Mesh
            if (!(hairObj instanceof THREE.Mesh)) {
                continue;
            }
            const hair = hairObj; // теперь hair: THREE.Mesh

            if (!hair.geometry.boundingSphere) {
                hair.geometry.computeBoundingSphere();
            }
            const bs = hair.geometry.boundingSphere;
            if (!bs) {
                continue;
            }

            this.tmpSphere.copy(bs);
            hair.updateWorldMatrix(true, false);
            hair.localToWorld(this.tmpSphere.center);

            const maxScale = Math.max(
                Math.abs(hair.scale.x),
                Math.abs(hair.scale.y),
                Math.abs(hair.scale.z)
            );
            this.tmpSphere.radius *= maxScale / 100;

            if (this.bladeOBB.intersectsSphere(this.tmpSphere)) {
                this.beard.removeHair(i);
                this.beard.isRaze = true;
                cuts++;
            }
            else {
                this.beard.isRaze = false;
            }
        }

    }


    private updateBladeOBB(): void {
        const blade = this.blade!;
        this.tmpBox.makeEmpty();

        const topCutoff = 0.3; // Верхние 30% геометрии по Y

        blade.traverse((c) => {
            const m = c as THREE.Mesh;
            if (!m.isMesh) return;

            const g = m.geometry;
            if (!g.boundingBox) g.computeBoundingBox();
            if (!g.boundingBox) return;

            // Клонируем bbox и оставляем только верхнюю часть
            const localBox = g.boundingBox.clone();
            const boxHeight = localBox.max.y - localBox.min.y;
            localBox.min.y = localBox.max.y - boxHeight * topCutoff;

            // Уменьшаем толщину хитбокса
            localBox.min.addScalar(-this.thickness);
            localBox.max.addScalar(this.thickness);

            const pts: THREE.Vector3[] = [
                new THREE.Vector3(localBox.min.x, localBox.min.y, localBox.min.z),
                new THREE.Vector3(localBox.min.x, localBox.min.y, localBox.max.z),
                new THREE.Vector3(localBox.min.x, localBox.max.y, localBox.min.z),
                new THREE.Vector3(localBox.min.x, localBox.max.y, localBox.max.z),
                new THREE.Vector3(localBox.max.x, localBox.min.y, localBox.min.z),
                new THREE.Vector3(localBox.max.x, localBox.min.y, localBox.max.z),
                new THREE.Vector3(localBox.max.x, localBox.max.y, localBox.min.z),
                new THREE.Vector3(localBox.max.x, localBox.max.y, localBox.max.z),
            ];

            for (const p of pts) {
                p.applyMatrix4(m.matrixWorld);
                this.tmpBox.expandByPoint(p);
            }
        });

        const center = this.tmpBox.getCenter(new THREE.Vector3());
        const halfSize = this.tmpBox.getSize(new THREE.Vector3()).multiplyScalar(0.2);

        this.bladeOBB.center.copy(center);
        this.bladeOBB.halfSize.copy(halfSize);
        this.bladeOBB.rotation.setFromMatrix4(blade.matrixWorld);
    }


    public debugBladeBox(scene: THREE.Scene): void {
        this.updateBladeOBB();

        // Вывод размеров в консоль
        console.log("🔍 Blade OBB Center:", this.bladeOBB.center);
        console.log("🔍 Blade OBB Half Size:", this.bladeOBB.halfSize);
        console.log("🔍 Blade OBB Full Size:", this.bladeOBB.halfSize.clone().multiplyScalar(2));

        // Box3Helper (отображение в сцене)
        if (this._debugBoxHelper) {
            scene.remove(this._debugBoxHelper);
        }

        const boxHelper = new THREE.Box3Helper(this.tmpBox, 0xff0000);
        scene.add(boxHelper);
        this._debugBoxHelper = boxHelper;
    }
}