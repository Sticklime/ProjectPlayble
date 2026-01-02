import * as THREE from 'three';

/**
 * Класс для управления анимациями персонажа через THREE.AnimationMixer
 */
export class CharacterAnimator {
    private mixer: THREE.AnimationMixer;
    private animations: THREE.AnimationClip[];
    private actions: Map<string, THREE.AnimationAction> = new Map();
    private currentAction: THREE.AnimationAction | null = null;

    constructor(character: THREE.Object3D, animations: THREE.AnimationClip[]) {
        this.mixer = new THREE.AnimationMixer(character);
        this.animations = animations || [];

        // Создаем actions для всех анимаций
        this.animations.forEach((clip) => {
            const action = this.mixer.clipAction(clip);
            this.actions.set(clip.name, action);
        });
    }

    /**
     * Получает список доступных анимаций
     */
    public getAvailableAnimations(): string[] {
        return this.animations.map((clip) => clip.name);
    }

    /**
     * Воспроизводит анимацию
     * @param animationName - имя анимации
     * @param loop - зациклить ли анимацию
     */
    public playAnimation(animationName: string, loop: boolean = false): void {
        // Останавливаем текущую анимацию
        if (this.currentAction) {
            this.currentAction.stop();
        }

        // Находим нужную анимацию
        const action = this.actions.get(animationName);
        if (action) {
            action.reset();
            action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
            action.play();
            this.currentAction = action;
        } else {
            console.warn(`[CharacterAnimator] Animation "${animationName}" not found`);
        }
    }

    /**
     * Останавливает текущую анимацию
     */
    public stop(): void {
        if (this.currentAction) {
            this.currentAction.stop();
            this.currentAction = null;
        }
    }

    /**
     * Обновляет анимацию (нужно вызывать в update цикле)
     * @param deltaTime - время в секундах
     */
    public update(deltaTime: number): void {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
}
