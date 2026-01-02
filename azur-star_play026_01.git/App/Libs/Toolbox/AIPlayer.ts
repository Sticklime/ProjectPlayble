import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { AIPlayerPhysics } from './AIPlayerPhysics';

export interface AIPlayerConfig {
    /** Позиция игрока */
    position: THREE.Vector3;
    /** Направление взгляда (к центру) */
    lookDirection: THREE.Vector3;
    /** Позиция ворот противника для атаки */
    enemyGoalPosition: THREE.Vector3;
    /** Скорость движения */
    moveSpeed?: number;
    /** Радиус обнаружения мяча */
    detectionRadius?: number;
    /** Сила удара по мячу */
    kickForce?: number;
    /** Offset для коллизий (смещение центра коллизионной сферы относительно центра модели) */
    collisionOffset?: THREE.Vector3;
}

/**
 * Класс для управления AI игроком.
 */
export class AIPlayer {
    public readonly physics: AIPlayerPhysics;
    public readonly character: THREE.Object3D; // Публичный доступ для синхронизации позиций
    private readonly config: Required<AIPlayerConfig>;
    private readonly tempVec3: THREE.Vector3 = new THREE.Vector3();
    private readonly tempDirection: THREE.Vector3 = new THREE.Vector3();
    private assignedBall: THREE.Object3D | null = null;
    private wanderTarget: THREE.Vector3 | null = null;
    private wanderTimer: number = 0;
    private readonly wanderInterval: number = 2 + Math.random() * 3; // 2-5 секунд
    private readonly jumpCooldown: number = 3; // секунды
    private timeSinceLastJump: number = 999; // чтобы сразу мог прыгнуть

    constructor(
        character: THREE.Object3D,
        world: CANNON.World,
        config: AIPlayerConfig
    ) {
        this.character = character;
        // Создаем AIPlayerPhysics с явным указанием параметров
        // Используем world и collisionOffset, если они предоставлены
        this.physics = new AIPlayerPhysics(
            character, 
            1, 
            -20, 
            world || undefined,
            config.collisionOffset || undefined
        );
        
        this.config = {
            position: config.position,
            lookDirection: config.lookDirection,
            enemyGoalPosition: config.enemyGoalPosition,
            moveSpeed: config.moveSpeed ?? 5,
            detectionRadius: config.detectionRadius ?? 20,
            kickForce: config.kickForce ?? 15,
            collisionOffset: config.collisionOffset || new THREE.Vector3(-0.3, 0.2, 0)
        };

        // Устанавливаем начальную позицию
        const body = this.physics.getBody();
        if (body) {
            body.position.set(
                this.config.position.x,
                this.config.position.y,
                this.config.position.z
            );
        }

        // Поворачиваем персонажа к центру
        character.lookAt(
            character.position.x + this.config.lookDirection.x,
            character.position.y + this.config.lookDirection.y,
            character.position.z + this.config.lookDirection.z
        );
    }

    /**
     * Обновляет ИИ игрока.
     * @param deltaTime - Время с последнего кадра
     * @param balls - Массив мячей для отслеживания
     */
    public update(deltaTime: number, balls: THREE.Object3D[], ballPhysics: any, isCountdownActive: boolean = false, assignedBall: THREE.Object3D | null = null): void {
        if (!this.physics) return;

        const body = this.physics.getBody();
        if (!body) return;

        // обновляем таймер кулдауна прыжка
        this.timeSinceLastJump += deltaTime;

        // Если отсчет активен, останавливаем движение
        if (isCountdownActive) {
            this.physics.setTargetVelocity(new THREE.Vector3(0, 0, 0));
            body.velocity.x = 0;
            body.velocity.z = 0;
            this.assignedBall = null;
            this.wanderTarget = null;
            return;
        }

        // Обновляем назначенный мяч
        this.assignedBall = assignedBall;

        // Проверяем, что мячи и ballPhysics доступны
        if (!balls || balls.length === 0 || !ballPhysics) {
            this.wander(deltaTime, body);
            return;
        }

        // Если есть назначенный мяч, преследуем его
        if (this.assignedBall) {
            const ballBody = ballPhysics.getBody(this.assignedBall);
            if (ballBody) {
                const dx = ballBody.position.x - body.position.x;
                const dy = ballBody.position.y - body.position.y;
                const dz = ballBody.position.z - body.position.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (
                    this.timeSinceLastJump >= this.jumpCooldown &&
                    ballBody.position.y > body.position.y + 1.0 &&
                    Math.abs(dx) < 3 && Math.abs(dz) < 3
                ) {
                    this.physics.jump(8);
                    this.timeSinceLastJump = 0;
                }

                this.moveTowardsBall(body, ballBody);
                return;
            }
        }

        // Если нет назначенного мяча, ищем ближайший свободный мяч
        const nearestBall = this.findNearestBall(body, balls, ballPhysics);
        
        if (!nearestBall) {
            this.wander(deltaTime, body);
            return;
        }

        const ballBody = ballPhysics.getBody(nearestBall.ball);
        if (!ballBody) {
            this.wander(deltaTime, body);
            return;
        }

        const dx = ballBody.position.x - body.position.x;
        const dy = ballBody.position.y - body.position.y;
        const dz = ballBody.position.z - body.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (
            this.timeSinceLastJump >= this.jumpCooldown &&
            ballBody.position.y > body.position.y + 1.0 &&
            Math.abs(dx) < 3 && Math.abs(dz) < 3
        ) {
            this.physics.jump(8);
            this.timeSinceLastJump = 0;
        }

        this.moveTowardsBall(body, ballBody);
    }

    /**
     * Находит ближайший мяч (оптимизированная версия).
     */
    private findNearestBall(
        playerBody: CANNON.Body,
        balls: THREE.Object3D[],
        ballPhysics: any
    ): { ball: THREE.Object3D; distance: number } | null {
        let nearest: { ball: THREE.Object3D; distance: number } | null = null;
        const playerX = playerBody.position.x;
        const playerY = playerBody.position.y;
        const playerZ = playerBody.position.z;

        // Ищем ближайший мяч без ограничения по радиусу обнаружения
        for (let i = 0; i < balls.length; i++) {
            const ball = balls[i];
            if (!ball) continue;
            const ballBody = ballPhysics.getBody(ball);
            if (!ballBody) continue;

            const dx = ballBody.position.x - playerX;
            const dy = ballBody.position.y - playerY;
            const dz = ballBody.position.z - playerZ;
            const distanceSq = dx * dx + dy * dy + dz * dz;
            const distance = Math.sqrt(distanceSq);

            // Всегда находим ближайший мяч, независимо от расстояния
            if (!nearest || distance < nearest.distance) {
                nearest = { ball, distance };
            }
        }

        return nearest;
    }

    /**
     * Двигается к мячу.
     */
    private moveTowardsBall(playerBody: CANNON.Body, ballBody: CANNON.Body): void {
        this.tempDirection.set(
            ballBody.position.x - playerBody.position.x,
            0, // Не двигаемся по Y
            ballBody.position.z - playerBody.position.z
        ).normalize();

        // Поворачиваем персонажа в направлении движения
        if (this.character) {
            const lookAtPos = new THREE.Vector3(
                this.character.position.x + this.tempDirection.x,
                this.character.position.y,
                this.character.position.z + this.tempDirection.z
            );
            this.character.lookAt(lookAtPos);
        }

        this.physics.setTargetVelocityFromDirection(this.tempDirection, this.config.moveSpeed);
    }

    /**
     * Пинает мяч в сторону ворот противника.
     */
    private kickBallTowardsGoal(ballBody: CANNON.Body): void {
        const playerBody = this.physics.getBody();
        if (!playerBody) return;

        // Вычисляем направление от мяча к воротам противника
        this.tempDirection.set(
            this.config.enemyGoalPosition.x - ballBody.position.x,
            0, // Не пинаем вверх
            this.config.enemyGoalPosition.z - ballBody.position.z
        ).normalize();

        this.physics.kickBall(ballBody, this.tempDirection, this.config.kickForce);
    }

    /**
     * Устанавливает мир физики (нужно для использования общего мира).
     */
    public setWorld(world: CANNON.World): void {
        // Note: это временное решение, нужно будет переработать CharacterPhysics
        // чтобы поддерживать использование внешнего мира
    }

    /**
     * Случайное блуждание по полю когда нет назначенного мяча
     */
    private wander(deltaTime: number, body: CANNON.Body): void {
        this.wanderTimer += deltaTime;

        if (!this.wanderTarget || this.wanderTimer >= this.wanderInterval) {
            const randomX = (Math.random() - 0.5) * 60;
            const randomZ = (Math.random() - 0.5) * 60;
            this.wanderTarget = new THREE.Vector3(randomX, body.position.y, randomZ);
            this.wanderTimer = 0;
        }

        this.tempDirection.set(
            this.wanderTarget.x - body.position.x,
            0,
            this.wanderTarget.z - body.position.z
        ).normalize();

        if (this.character) {
            const lookAtPos = new THREE.Vector3(
                this.character.position.x + this.tempDirection.x,
                this.character.position.y,
                this.character.position.z + this.tempDirection.z
            );
            this.character.lookAt(lookAtPos);
        }

        this.physics.setTargetVelocityFromDirection(this.tempDirection, this.config.moveSpeed * 0.5);
    }
}

