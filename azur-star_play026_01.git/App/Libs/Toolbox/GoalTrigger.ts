import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export interface GoalTriggerOptions {
    position: THREE.Vector3;
    size: THREE.Vector3;
    onGoal?: (ballBody: CANNON.Body) => void;
}

/**
 * Goal trigger that detects when a ball enters the goal area.
 * When triggered, calls onGoal callback and can reset ball position.
 */
export class GoalTrigger {
    public readonly body: CANNON.Body;
    private world: CANNON.World;
    private onGoalCallback?: (ballBody: CANNON.Body) => void;
    private lastTriggeredTime: number = 0;
    private cooldown: number = 2000; // 2 секунды задержка между срабатываниями

    constructor(
        world: CANNON.World,
        options: GoalTriggerOptions
    ) {
        this.world = world;
        this.onGoalCallback = options.onGoal;

        const { position, size } = options;

        // Create trigger shape (invisible sensor)
        const triggerShape = new CANNON.Box(new CANNON.Vec3(
            size.x / 2,
            size.y / 2,
            size.z / 2
        ));

        // Create trigger body (sensor - doesn't collide, only detects)
        // В CANNON.js используем collision filters чтобы триггер не коллидировал с объектами
        this.body = new CANNON.Body({
            mass: 0, // Static
            shape: triggerShape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
        });
        
        // Делаем триггер кинематическим (не влияет на другие объекты)
        this.body.type = CANNON.Body.KINEMATIC;
        
        // Настраиваем collision filters: триггер коллидирует с игроками, но пропускает мячи
        this.body.collisionFilterGroup = 0x0002; // Группа для триггеров
        this.body.collisionFilterMask = 0x0001 | 0x0004; // Коллидирует с главным игроком (0x0001) и AI игроками (0x0004), но НЕ с мячами (0x0010)
        
        this.body.material = new CANNON.Material('goalTrigger');
        this.body.material.friction = 0;
        this.body.material.restitution = 0;
        
        // Помечаем для удобной идентификации
        (this.body as any).__isGoalTrigger = true;

        world.addBody(this.body);
    }

    /**
     * Checks if a ball body is inside the trigger.
     * Should be called every frame for each ball.
     */
    public checkBallCollision(ballBody: CANNON.Body): boolean {
        if (!ballBody || !this.body) return false;

        // Проверяем кулдаун
        const currentTime = Date.now();
        if (currentTime - this.lastTriggeredTime < this.cooldown) {
            return false;
        }

        // Check if ball is inside trigger bounds
        const ballPos = ballBody.position;
        const triggerPos = this.body.position;
        
        // Получаем размеры триггера
        let triggerSize: CANNON.Vec3;
        if (this.body.shapes && this.body.shapes[0] instanceof CANNON.Box) {
            triggerSize = this.body.shapes[0].halfExtents;
        } else {
            triggerSize = new CANNON.Vec3(1, 1, 1);
        }
        
        // Получаем радиус мяча
        let ballRadius = 0.5; // По умолчанию
        if (ballBody.shapes && ballBody.shapes[0] instanceof CANNON.Sphere) {
            ballRadius = ballBody.shapes[0].radius;
        }

        // Проверяем пересечение с учетом радиуса мяча
        // Для бокса триггера проверяем, пересекается ли сфера мяча с боксом
        const dx = ballPos.x - triggerPos.x;
        const dy = ballPos.y - triggerPos.y;
        const dz = ballPos.z - triggerPos.z;
        
        // Находим ближайшую точку бокса к центру мяча
        const closestX = Math.max(-triggerSize.x, Math.min(triggerSize.x, dx));
        const closestY = Math.max(-triggerSize.y, Math.min(triggerSize.y, dy));
        const closestZ = Math.max(-triggerSize.z, Math.min(triggerSize.z, dz));
        
        // Вычисляем расстояние от ближайшей точки бокса до центра мяча
        const distanceSquared = 
            (dx - closestX) * (dx - closestX) +
            (dy - closestY) * (dy - closestY) +
            (dz - closestZ) * (dz - closestZ);
        
        const isInside = distanceSquared < (ballRadius * ballRadius);

        if (isInside && this.onGoalCallback) {
            this.lastTriggeredTime = currentTime;
            this.onGoalCallback(ballBody);
            return true;
        }

        return false;
    }

    /**
     * Sets the goal callback.
     */
    public setOnGoal(callback: (ballBody: CANNON.Body) => void): void {
        this.onGoalCallback = callback;
    }

    /**
     * Destroys the trigger.
     */
    public destroy(): void {
        if (this.body && this.body.world) {
            this.body.world.removeBody(this.body);
        }
    }
}

