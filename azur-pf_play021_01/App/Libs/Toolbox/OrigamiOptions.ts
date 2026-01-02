import * as THREE from 'three';
import {gsap} from 'gsap';

interface OrigamiOptions {
    model: THREE.Object3D;
    folds: string[];
    parent: THREE.Object3D;
}

const OFFSET_Y = -1;
const OFFSET_Z = -0.01;

type Axis = 'x' | 'z' | 'y';
type FoldName = 'folds_2' | 'folds_4' | 'folds_6' | 'folds_8';

interface FoldConfig {
    axis: Axis;
    sign: 1 | -1;
    neighbors: [string, Axis][];
}

export class OrigamiPaper {
    private foldStates = new Map<string, boolean>();
    private originalTransforms = new Map<string, { position: THREE.Vector3; rotation: THREE.Euler }>();
    private stack: string[] = [];
    private animating = false;

    public model: THREE.Object3D;
    public isFail: boolean = false;
    public isWin: boolean = false;
    private correctOrder: FoldName[] = ['folds_2', 'folds_6', 'folds_4', 'folds_8'];

    private foldConfig: Record<FoldName, FoldConfig> = {
        folds_2: {
            axis: 'y', sign: -1,
            neighbors: [['folds_3', 'y'], ['folds_9', 'y']]
        },
        folds_4: {
            axis: 'x', sign: 1,
            neighbors: [['folds_3', 'x'], ['folds_5', 'x']]
        },
        folds_6: {
            axis: 'y', sign: 1,
            neighbors: [['folds_5', 'y'], ['folds_7', 'y']]
        },
        folds_8: {
            axis: 'x', sign: -1,
            neighbors: [['folds_7', 'x'], ['folds_9', 'x']]
        },
    };

    constructor(private options: OrigamiOptions) {
        this.model = options.model;
        this.initFolds();
        this.options.parent.add(this.model);
    }

    private initFolds() {
        this.options.folds.forEach(name => {
            const mesh = this.model.getObjectByName(name);
            if (!mesh) return;

            this.foldStates.set(name, false);
            this.originalTransforms.set(name, {
                position: mesh.position.clone(),
                rotation: mesh.rotation.clone()
            });

            const mat = (mesh as any).material;

            if (mat) mat.transparent = true;
        });
        this.stack = [];
    }

    /** Обновляет оригинальные позиции/вращения для всех фолдов после смещения всей бумажки */
    public refreshOriginalTransforms() {
        this.options.folds.forEach(name => {
            const mesh = this.model.getObjectByName(name);
            if (!mesh) return;
            this.originalTransforms.set(name, {
                position: mesh.position.clone(),
                rotation: mesh.rotation.clone()
            });
        });
    }

    private rebuildStack() {
        this.stack = this.stack.filter(name => this.model.getObjectByName(name));
    }

    private getLayer(name: string) {
        return this.stack.indexOf(name);
    }

    private updateOffsets() {
        this.options.folds.forEach(name => {
            const mesh = this.model.getObjectByName(name);
            const original = this.originalTransforms.get(name);
            if (!mesh || !original) return;

            gsap.to(mesh.position, {
                ...original.position,
                duration: 0.4,
                ease: 'power2.inOut'
            });
            mesh.renderOrder = 0;
        });

        this.rebuildStack();

        this.stack.forEach((name, index) => {
            const mesh = this.model.getObjectByName(name);
            const original = this.originalTransforms.get(name);
            if (!mesh || !original) return;


            if (mesh.name === "folds_4") {
                gsap.to(mesh.position, {
                    x: original.position.x ,
                    y: original.position.y ,
                    z: original.position.z + (index + 1) * OFFSET_Z,
                    duration: 0.4,
                    ease: 'power2.inOut'
                });
            } else if (mesh.name === "folds_8") {
                gsap.to(mesh.position, {
                    x: original.position.x,
                    y: original.position.y ,
                    z: original.position.z + (index + 1) * OFFSET_Z,
                    duration: 0.4,
                    ease: 'power2.inOut'
                });
            }
            else {
                gsap.to(mesh.position, {
                    x: original.position.x,
                    y: original.position.y,
                    z: original.position.z + (index + 1) * OFFSET_Z,
                    duration: 0.4,
                    ease: 'power2.inOut'
                });
            }


            mesh.renderOrder = index + 1;
        });
    }

    private isFoldName(name: string): name is FoldName {
        return ['folds_2', 'folds_4', 'folds_6', 'folds_8'].includes(name);
    }

    private getFoldPaper(): THREE.Object3D[] {
        const allowedNames = ['folds_2', 'folds_4', 'folds_6', 'folds_8'];
        return Array.from(this.foldStates.entries())
            .filter(([name, folded]) => folded && allowedNames.includes(name))
            .map(([name]) => this.model.getObjectByName(name))
            .filter(Boolean) as THREE.Object3D[];
    }

    public foldByName(name: string): void {
        if (this.animating || !this.isFoldName(name)) return;

        const {axis, sign, neighbors} = this.foldConfig[name];
        const mainMesh = this.model.getObjectByName(name);
        if (!mainMesh) return;

        const folded = this.foldStates.get(name) ?? false;
        const angle = Math.PI * sign * (folded ? -1 : 1);
        const newFoldedState = !folded;

        this.foldStates.set(name, newFoldedState);
        this.animateRotation(mainMesh.rotation, axis, angle);

        const changes: string[] = [name];

        for (const neighbor of neighbors) {
            const [neighborName, neighborAxis]: [string, Axis] = neighbor;
            const neighborMesh = this.model.getObjectByName(neighborName);
            if (!neighborMesh) continue;

            const neighborDelta = Math.PI * sign * (folded ? -1 : 1);
            this.foldStates.set(neighborName, newFoldedState);
            this.animateRotation(neighborMesh.rotation, neighborAxis, neighborDelta);
            changes.push(neighborName);
        }

        if (newFoldedState) {
            changes.forEach(c => {
                if (!this.stack.includes(c)) this.stack.push(c);
            });
        } else {
            this.stack = this.stack.filter(n => !changes.includes(n));
        }
        this.updateOffsets();
        this.animating = true;
        setTimeout(() => {
            this.checkResultAndUnfoldIfNeeded();
        }, 750);

        setTimeout(() => {
            this.animating = false;
        }, 500);
    }

    private animateRotation(rotation: THREE.Euler, axis: Axis, delta: number) {
        gsap.to(rotation, {
            [axis]: rotation[axis] + delta,
            duration: 0.7,
            ease: 'power2.inOut'
        });
    }

    private checkResultAndUnfoldIfNeeded() {
        const allCorrectFolded = this.correctOrder.every(f => this.foldStates.get(f) === true);
        if (!allCorrectFolded) {
            console.log('Не все нужные фолды сложены');
            return;
        }

        const orderedCorrectFolds = this.stack.filter(f => this.correctOrder.includes(f as FoldName));

        const correctOrderMatched =
            orderedCorrectFolds.length === this.correctOrder.length &&
            orderedCorrectFolds.every((f, i) => f === this.correctOrder[i]);

        if (!correctOrderMatched) {
            console.log('Нарушен порядок складывания:', orderedCorrectFolds);
            this.unfoldAll();
            return;
        }

        // 3. Убедимся, что нет лишних сложенных фолдов
        for (const [foldName, isFolded] of this.foldStates.entries()) {
            const isAllowed =
                this.correctOrder.includes(foldName as FoldName) ||
                /^folds_[3579]$/.test(foldName);

            if (isFolded && !isAllowed) {
                console.log('Лишний fold:', foldName, 'сложен');
                this.unfoldAll();
                return;
            }
        }

        this.isWin = true;
        console.log('Правильная сборка! Победа!');
    }

    public async unfoldAll() {
        if (this.animating) return;
        this.animating = true;

        this.isFail = true;

        const stack = [...this.stack].reverse();

        for (const name of stack) {
            await this.reverseFoldByName(name);
        }

        // После всех анимаций
        this.stack = [];

        setTimeout(() => {
            this.animating = false;
            this.updateOffsets();
        }, 50);
    }

    private async reverseFoldByName(name: string): Promise<void> {
        return new Promise(resolve => {
            if (!this.isFoldName(name)) return resolve();

            const {axis, sign, neighbors} = this.foldConfig[name];
            const mainMesh = this.model.getObjectByName(name);
            if (!mainMesh) return resolve();

            // Смотрим, если фолд уже развернут – ничего не делаем
            const folded = this.foldStates.get(name) ?? false;
            if (!folded) return resolve();

            const angle = Math.PI * sign * -1; // обратный поворот

            this.foldStates.set(name, false);

            this.animateRotation(mainMesh.rotation, axis, angle);

            // теперь соседи (строго по той же логике, только разворачиваем)
            for (const neighbor of neighbors) {
                const [neighborName, neighborAxis]: [string, Axis] = neighbor;
                const neighborMesh = this.model.getObjectByName(neighborName);
                if (!neighborMesh) continue;

                const neighborDelta = Math.PI * sign * -1; // тоже обратный поворот!
                this.foldStates.set(neighborName, false);
                this.animateRotation(neighborMesh.rotation, neighborAxis, neighborDelta);
            }

            // Не забудь плавность: onComplete – resolve
            gsap.delayedCall(0.2, resolve);
        });
    }
}
