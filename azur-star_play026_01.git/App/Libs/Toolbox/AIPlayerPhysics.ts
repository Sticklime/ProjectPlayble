import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { CharacterPhysics } from './CharacterPhysics';

/**
 * Физика для AI игрока. Базируется на CharacterPhysics, но с упрощенной логикой.
 */
export class AIPlayerPhysics extends CharacterPhysics {
    /**
     * Создает физику для AI игрока.
     * @param character - Объект персонажа
     * @param mass - Масса тела (по умолчанию 1)
     * @param gravityY - Гравитация по Y (по умолчанию -20)
     * @param world - Мир физики (опционально)
     * @param collisionOffset - Смещение коллизии (опционально)
     */
    constructor(
        character: THREE.Object3D,
        mass: number = 1,
        gravityY: number = -20,
        world?: CANNON.World,
        collisionOffset?: THREE.Vector3
    ) {
        super(character, mass, gravityY, world, collisionOffset);
    }

    /**
     * Получить текущий collisionOffset
     */
    public getCollisionOffset(): THREE.Vector3 {
        return this.collisionOffset.clone();
    }

    /**
     * Установить новый collisionOffset и обновить позицию тела
     */
    public setCollisionOffset(offset: THREE.Vector3): void {
        this.collisionOffset.copy(offset);
        this.updateBodyPositionWithOffset();
    }

    /**
     * Обновить позицию тела с учетом текущего collisionOffset
     */
    private updateBodyPositionWithOffset(): void {
        const body = this.getBody();
        if (!body || !this.character) return;

        // Обновляем мировую матрицу
        this.character.updateMatrixWorld(true);

        // Получаем центр bounding box модели в мировых координатах
        const box = new THREE.Box3().setFromObject(this.character);
        const center = box.getCenter(new THREE.Vector3());
        const worldCenter = new THREE.Vector3();
        worldCenter.copy(center);
        this.character.localToWorld(worldCenter);

        // Вычисляем offset в мировых координатах на основе текущей ориентации
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        const forward = new THREE.Vector3();
        right.setFromMatrixColumn(this.character.matrixWorld, 0).normalize();
        up.setFromMatrixColumn(this.character.matrixWorld, 1).normalize();
        forward.setFromMatrixColumn(this.character.matrixWorld, 2).normalize();

        const worldOffset = new THREE.Vector3();
        worldOffset.addScaledVector(right, this.collisionOffset.x);
        worldOffset.addScaledVector(up, this.collisionOffset.y);
        worldOffset.addScaledVector(forward, this.collisionOffset.z);

        // Обновляем позицию тела с учетом нового offset
        body.position.set(
            worldCenter.x + worldOffset.x,
            worldCenter.y + worldOffset.y,
            worldCenter.z + worldOffset.z
        );

        // Синхронизируем позицию character
        this.syncPositionOnly();
    }

    /**
     * Устанавливает целевую скорость движения (для ИИ).
     * Для AI игроков применяем скорость напрямую, так как их физика обновляется через общий мир.
     */
    public setTargetVelocityFromDirection(direction: THREE.Vector3, speed: number = 8): void {
        const normalizedDirection = direction.clone().normalize();
        const targetVel = normalizedDirection.multiplyScalar(speed);
        
        // Устанавливаем целевую скорость для плавного движения
        this.setTargetVelocity(targetVel);
        
        // Также применяем скорость напрямую к телу для немедленного эффекта
        // (так как update() может не вызываться для каждого AI игрока отдельно)
        const body = this.getBody();
        if (body) {
            // Применяем только горизонтальную скорость (X и Z), Y оставляем физике
            body.velocity.x = targetVel.x;
            body.velocity.z = targetVel.z;
            // Пробуждаем тело, если оно спит
            if (body.sleepState === CANNON.Body.SLEEPING) {
                body.wakeUp();
            }
        }
    }

    /**
     * Пинает мяч (применяет силу к мячу).
     * AI игроки не пинают мяч - логика удара только для главного игрока.
     */
    public kickBall(ballBody: CANNON.Body, direction: THREE.Vector3, force: number = 4): void {
        // AI игроки не пинают мяч
        return;
    }
}
