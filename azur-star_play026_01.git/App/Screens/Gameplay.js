import Screen from 'Screen';
import {UIBasicLayer} from 'Libs/Toolbox/UIBasicLayer';
import {UICTALoseLayer} from 'Libs/Toolbox/UICTALoseLayer';
import {UICTAWinLayer} from 'Libs/Toolbox/UICTAWinLayer';
import {UIGameplayLayer} from 'Libs/Toolbox/UIGameplayLayer';
import {Object3DOperator} from 'Libs/Toolbox/CameraOperator';
import {CharacterPhysics} from 'Libs/Toolbox/CharacterPhysics';
import {BallPhysics} from 'Libs/Toolbox/BallPhysics';
import {MeshCollider} from 'Libs/Toolbox/MeshCollider';
import {GroundCollider} from 'Libs/Toolbox/GroundCollider';
import {GoalTrigger} from 'Libs/Toolbox/GoalTrigger';
import {OurAIPlayer} from 'Libs/Toolbox/OurAIPlayer';
import {EnemyAIPlayer} from 'Libs/Toolbox/EnemyAIPlayer';
import {PhysicsDebug} from 'Libs/Toolbox/PhysicsDebug';
import {AnimatedModelController} from 'Libs/Toolbox/AnimatedModelController';
import gsap from 'gsap';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

App.Gameplay = new Screen({

    Name: 'Gameplay',

    Containers: [
        {
            name: 'BackgroundContainer',
            scaleStrategyLandscape: ['cover-screen', 1920, 1080],
            scaleStrategyPortrait: ['cover-screen', 1080, 1920],
            childs: []
        },
        {
            name: 'MainContainer',
            scaleStrategyLandscape: ['fit-to-screen', 1920, 1080],
            scaleStrategyPortrait: ['fit-to-screen', 1080, 1920],
            childs: [
                {
                    name: 'light_directional',
                    type: 'three-directional-light',
                    color: '#ffffff',
                    intensity: 0.75,
                    position: [0, 100, 0]
                },

                {
                    name: 'game container', type: 'three-group', position: [0, 0, 0], rotation: [0, 0, 0], childs: [
                        {
                            name: 'scene',
                            type: 'three-model-glb',
                            data: 'scene',
                            position: [0, 0, 0],
                            rotation: [0, 0, 0],
                            scale: [1, 1, 1]
                        },
                    ]
                },

                {name: 'fx_container', type: 'three-group', position: [0, 0, 0], rotation: [0, 0, 0], childs: []},
            ]
        },

        {
            name: 'UIContainer', type: 'three-ui', childs: []
        },
    ],

    Hooks: {

        beforeBuild() {

            this.updateChildParamsByName(Settings[this.Name]);
        },

        build() {
            this.setupUILayers();
            this.setupCamera();
            this.scene = this["game container"].getObjectByName('scene');
            if (this.scene) {
                this.scene.visible = true;
                this["game container"].visible = true;
            }
            
            // Создаем Raycaster для проверки коллизий камеры
            this.cameraRaycaster = new THREE.Raycaster();
            
            // Создаем небо из фонового изображения
            this.setupSky();
        },

        resize() {

            this.resizeSceneBackground();

        },

        show() {
            this.updateSettings();
            this.startGame();
            this.setupRenderer();
            this.setupLights();

            if (this.isCountdownActive === undefined) {
                this.isCountdownActive = true;
            }

            if (this["game container"]) {
                this["game container"].visible = true;
            }
            if (this.scene) {
                this.scene.visible = true;
            }

            this.setupBalls();
            this.spawnCharacter();
            this.setupCharacter();
            this.setupMeshColliders();
            this.setupCharacterModel();
            this.setupGroundCollider();
            this.setupBallPhysics();
            this.setupGoalTriggers();
            this.setupCameraOperator();
            this.setupAIPlayers();
            this.showBasicLayer();
        },

        update() {
            if (this.characterAnimator && App.timeOffset) {
                this.characterAnimator.update(App.timeOffset / 1000);
            }
            if (this.characterAnimator3 && App.timeOffset) {
                this.characterAnimator3.update(App.timeOffset / 1000);
            }
            if (this.characterAnimator4 && App.timeOffset) {
                this.characterAnimator4.update(App.timeOffset / 1000);
            }
            if (this.characterAnimatorModel && App.timeOffset) {
                this.characterAnimatorModel.update(App.timeOffset / 1000);
            }
            
            // Обновляем анимации противников
            if (this.enemyAnimControllers && App.timeOffset) {
                const deltaTime = App.timeOffset / 1000;
                this.enemyAnimControllers.forEach((controller) => {
                    if (controller) {
                        controller.update(deltaTime);
                    }
                });
            }
            
            // Обновляем анимации союзников
            if (this.ourAnimControllers && App.timeOffset) {
                const deltaTime = App.timeOffset / 1000;
                this.ourAnimControllers.forEach((controller) => {
                    if (controller) {
                        controller.update(deltaTime);
                    }
                });
            }
            
            // Обновляем анимации персонажей в зависимости от состояния
            this.updateCharacterAnimations();

            if (this.character && !this.isCameraAnimationActive) {
                const camera = App.World.Camera;
                const characterPos = new THREE.Vector3();
                this.character.getWorldPosition(characterPos);

                const elevationRad = THREE.MathUtils.degToRad(this.cameraElevation);
                const azimuthRad = THREE.MathUtils.degToRad(this.cameraAzimuth);

                const offset = new THREE.Vector3(
                    Math.cos(elevationRad) * Math.sin(azimuthRad) * this.cameraDistance,
                    Math.sin(elevationRad) * this.cameraDistance,
                    Math.cos(elevationRad) * Math.cos(azimuthRad) * this.cameraDistance
                );

                const targetPosition = new THREE.Vector3().addVectors(characterPos, offset);

                // Проверяем коллизии между персонажем и целевой позицией камеры
                if (this.cameraRaycaster && this.scene) {
                    const direction = new THREE.Vector3().subVectors(targetPosition, characterPos);
                    const distance = direction.length();
                    direction.normalize();

                    this.cameraRaycaster.set(characterPos, direction);
                    this.cameraRaycaster.far = distance + 1; // Немного больше, чтобы точно проверить всю дистанцию

                    // Собираем объекты для исключения (мячи и NPC)
                    const excludedObjects = new Set();
                    
                    // Исключаем мячи
                    if (this.balls && this.balls.length > 0) {
                        this.balls.forEach((ball) => {
                            if (ball) {
                                excludedObjects.add(ball);
                                // Также добавляем все дочерние объекты мяча
                                ball.traverse((child) => {
                                    if (child instanceof THREE.Mesh) {
                                        excludedObjects.add(child);
                                    }
                                });
                            }
                        });
                    }
                    
                    // Исключаем NPC (AI игроков)
                    if (this.aiPlayers && this.aiPlayers.length > 0) {
                        this.aiPlayers.forEach((aiPlayer) => {
                            if (aiPlayer && aiPlayer.character) {
                                excludedObjects.add(aiPlayer.character);
                                // Также добавляем все дочерние объекты NPC
                                aiPlayer.character.traverse((child) => {
                                    if (child instanceof THREE.Mesh) {
                                        excludedObjects.add(child);
                                    }
                                });
                            }
                        });
                    }
                    
                    // Получаем все меши из сцены для проверки коллизий
                    const collidableObjects = [];
                    this.scene.traverse((object) => {
                        if (object instanceof THREE.Mesh && object.visible) {
                            // Пропускаем персонажа, мячи и NPC
                            if (object !== this.character && 
                                object.name !== 'character' && 
                                !excludedObjects.has(object)) {
                                collidableObjects.push(object);
                            }
                        }
                    });
                    
                    // Добавляем меши из meshColliders
                    if (this.meshColliders && this.meshColliders.length > 0) {
                        this.meshColliders.forEach((collider) => {
                            if (collider.mesh && collider.mesh.visible && !excludedObjects.has(collider.mesh)) {
                                collidableObjects.push(collider.mesh);
                            }
                        });
                    }

                    const intersects = this.cameraRaycaster.intersectObjects(collidableObjects, false);
                    
                    // Ограничиваем максимальную высоту камеры относительно персонажа
                    const maxHeightOffset = 8; // Максимальная высота камеры над персонажем
                    const maxY = characterPos.y + maxHeightOffset;
                    
                    if (intersects.length > 0) {
                        // Найдена коллизия - прижимаем камеру ближе к персонажу
                        const hitPoint = intersects[0].point;
                        const hitDistance = characterPos.distanceTo(hitPoint);
                        
                        // Отступаем немного от точки столкновения (0.5 единицы)
                        const safeDistance = Math.max(0.5, hitDistance - 0.5);
                        
                        // Пересчитываем позицию с сохранением углов elevation и azimuth
                        // чтобы камера не задиралась вверх
                        const adjustedOffset = new THREE.Vector3(
                            Math.cos(elevationRad) * Math.sin(azimuthRad) * safeDistance,
                            Math.sin(elevationRad) * safeDistance,
                            Math.cos(elevationRad) * Math.cos(azimuthRad) * safeDistance
                        );
                        
                        const adjustedPosition = new THREE.Vector3().addVectors(characterPos, adjustedOffset);
                        
                        // Ограничиваем только Y координату, сохраняя X и Z (не меняем rotation)
                        if (adjustedPosition.y > maxY) {
                            adjustedPosition.y = maxY;
                        }
                        
                        targetPosition.copy(adjustedPosition);
                    } else {
                        // Даже если нет коллизий, ограничиваем максимальную высоту
                        // Ограничиваем только Y координату, сохраняя X и Z (не меняем rotation)
                        if (targetPosition.y > maxY) {
                            targetPosition.y = maxY;
                        }
                    }
                }

                const deltaTime = App.timeOffset ? App.timeOffset / 1000 : 0.016;
                const lerpSpeed = 5;
                const lerpAlpha = 1 - Math.exp(-lerpSpeed * deltaTime);
                camera.position.lerp(targetPosition, lerpAlpha);

                const lookAtPos = characterPos.clone();
                lookAtPos.y += 1.5;
                camera.up.set(0, 1, 0);
                camera.lookAt(lookAtPos);
            }

            const deltaTime = App.timeOffset ? App.timeOffset / 1000 : 0.016;

            if (this.characterMovementDirection) {
                this.updateCharacterMovement();
            }

            if (this.characterPhysics) {
                this.characterPhysics.update(deltaTime);

                if (this.aiPlayers && this.aiPlayers.length > 0) {
                    for (let i = 0; i < this.aiPlayers.length; i++) {
                        const aiPlayer = this.aiPlayers[i];
                        if (aiPlayer && aiPlayer.physics) {
                            aiPlayer.physics.updateMovement(deltaTime);
                            aiPlayer.physics.syncPositionOnly();
                        }
                    }
                }
            }

            if (this.ballPhysics) {
                this.ballPhysics.update(deltaTime);
            }

            if (this.aiPlayers && this.aiPlayers.length > 0 && this.ballPhysics && this.balls) {
                if (!this.aiUpdateCounter) this.aiUpdateCounter = 0;
                this.aiUpdateCounter++;

                const aiUpdateInterval = 3;
                if (this.aiUpdateCounter >= aiUpdateInterval) {
                    this.aiUpdateCounter = 0;
                    const isCountdown = this.isCountdownActive === true;

                    const ballAssignments = this.distributeBallsToAI(this.aiPlayers, this.balls, this.ballPhysics);

                    for (let i = 0; i < this.aiPlayers.length; i++) {
                        const aiPlayer = this.aiPlayers[i];
                        try {
                            const assignedBall = ballAssignments[i] || null;
                            aiPlayer.update(deltaTime * aiUpdateInterval, this.balls, this.ballPhysics, isCountdown, assignedBall);
                        } catch (e) {
                        }
                    }
                }
            } else if (this.isCountdownActive && this.aiPlayers && this.aiPlayers.length > 0) {
                for (let i = 0; i < this.aiPlayers.length; i++) {
                    const aiPlayer = this.aiPlayers[i];
                    if (aiPlayer && aiPlayer.physics) {
                        aiPlayer.physics.setTargetVelocity(new THREE.Vector3(0, 0, 0));
                        const body = aiPlayer.physics.getBody();
                        if (body) {
                            body.velocity.x = 0;
                            body.velocity.z = 0;
                        }
                    }
                }
            }

            if (this.goalTriggers && this.goalTriggers.length > 0 && this.ballPhysics && this.balls) {
                this.checkGoalTriggers();
            }

            if (this.gameTimerActive !== false) {
                this.updateTimer();
            }

            if (this.gameplayLayer && this.gameplayLayer.getOurScore() >= 5) {
                if (!this.gameWinShown) {
                    this.gameTimerActive = false;
                    this.gameWinShown = true;
                    this.showWinLayer();
                }
            }
            if (this.meshColliders && this.meshColliders.length > 0) {
                this.updateMeshColliders();
            }

        },

        hide() {
            if (this.cameraSwipeCleanup) {
                this.cameraSwipeCleanup();
                this.cameraSwipeCleanup = null;
            }
            if (this.cameraOperator) {
                this.cameraOperator.isActive = false;
            }
        }
    },

    Events: {

        'global:Stage Press Down': function (event, position) {
            if (window.MraidSDK) MraidSDK.interaction();

            // Проверяем попадание в область правого джойстика для прыжка
            if (this.gameplayLayer && this.gameplayLayer.isInJumpArea && this.gameplayLayer.isInJumpArea(position.x, position.y)) {
                if (this.characterPhysics && !this.isCountdownActive) {
                    this.characterPhysics.jump(8);
                    // Устанавливаем флаг прыжка для главного персонажа
                    if (this.character) {
                        this.character.__isJumping = true;
                    }
                }
                return;
            }

            if (this.gameplayLayer && this.gameplayLayer.isInJoystickArea(position.x, position.y)) {
                this.joystick = {
                    active: true,
                    start: new THREE.Vector2(position.x, position.y),
                    current: new THREE.Vector2(position.x, position.y),
                };

                const joystickMaxDistance = 100;
                this.gameplayLayer.updateJoystickPosition(
                    position.x,
                    position.y,
                    0,
                    0
                );
            }
        },

        'global:Stage Press Move': function (event, position) {
            if (!this.joystick || !this.joystick.active) return;

            this.joystick.current.set(position.x, position.y);

            const joystickMaxDistance = 100;
            const delta = new THREE.Vector2()
                .subVectors(this.joystick.current, this.joystick.start);
            const distance = Math.min(delta.length(), joystickMaxDistance);
            const movement = distance > 0 ? delta.normalize().multiplyScalar(distance / joystickMaxDistance) : new THREE.Vector2(0, 0);

            if (this.gameplayLayer && this.gameplayLayer.getProgressLevel1Constraint()) {
                const deltaX = this.joystick.current.x - this.joystick.start.x;
                const deltaY = this.joystick.current.y - this.joystick.start.y;

                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                const screenWidth = window.innerWidth || 1920;
                const scale = 1920 / screenWidth;
                const distanceLaymur = distance * scale;

                const joystickMaxRadius = 50;
                let clampedDistance = Math.min(distanceLaymur, joystickMaxRadius);

                if (clampedDistance < 5) {
                    clampedDistance = 0;
                }

                let stickX = 0;
                let stickY = 0;

                if (clampedDistance > 0) {
                    const angle = Math.atan2(deltaY, deltaX);
                    stickX = Math.cos(angle) * clampedDistance;
                    stickY = Math.sin(angle) * clampedDistance;
                }

                const constraint = this.gameplayLayer.getProgressLevel1Constraint();
                if (constraint) {
                    constraint.h.distance = stickX;
                    constraint.v.distance = -stickY;
                }

                this.gameplayLayer.updateJoystickPosition(
                    this.joystick.start.x,
                    this.joystick.start.y,
                    0,
                    0
                );
            }

            if (!this.isCountdownActive && this.characterMovementDirection) {
                this.characterMovementDirection.set(movement.x, movement.y);
            }
        },

        'global:Stage Press Up': function (event, position) {
            if (window.MraidSDK) MraidSDK.interaction();

            if (this.joystick) {
                this.joystick.active = false;
                this.joystick = null;
            }

            if (this.gameplayLayer) {
                this.gameplayLayer.resetJoystick();
            }

            if (this.characterMovementDirection) {
                this.characterMovementDirection.set(0, 0);
            }
        },

        'global:Setting Changed': function (name, value) {

            this.updateSettings(name, value);

        }

    },

    updateSettings(name, value) {

        this.resize();

    },

    startGame() {

        if (window.MraidSDK) MraidSDK.track('Game Starts');

    },

    restoreGame() {

    },

    resizeSceneBackground() {
        // Обновляем размер неба при изменении размера экрана
        if (this.skyMesh) {
            // Для тайлинга небо остается фиксированного размера
            // Можно при необходимости масштабировать, но обычно это не требуется
            const camera = App.World.Camera;
            const minRadius = 1000; // Минимальный радиус для тайлинга
            const maxRadius = (camera.far || 5000) * 0.9;
            // Используем промежуточное значение, чтобы небо было видно, но текстура тайлилась
            const skyRadius = Math.max(minRadius, Math.min(maxRadius, 2000));
            const targetScale = skyRadius / 1000; // 1000 - базовый радиус из setupSky
            this.skyMesh.scale.set(targetScale, targetScale, targetScale);
        }
    },

    showLoseLayer() {
        if (this.ctaLoseLayer) {
            this.ctaLoseLayer.show();
        }
    },

    showWinLayer() {
        if (this.ctaWinLayer) {
            this.ctaWinLayer.show();
            if (App.layers && !App.layers.includes(this.ctaWinLayer)) {
                App.layers.push(this.ctaWinLayer);
            }
        }
    },

    showGameplayLayer() {
        if (this.gameplayLayer) {
            this.gameplayLayer.show();
        }
    },

    showBasicLayer() {
        if (this.basicLayer) {
            this.basicLayer.show();
        }
    },

    playAnimation(animationName) {
        if (this.characterAnimator) {
            this.characterAnimator.playAnimation(animationName, true);
        }
    },

    setupUILayers() {
        if (!App.layers) App.layers = [];

        this.basicLayer = new UIBasicLayer();
        App.layers.push(this.basicLayer);

        this.ctaLoseLayer = new UICTALoseLayer();
        App.layers.push(this.ctaLoseLayer);

        this.ctaWinLayer = new UICTAWinLayer();
        App.layers.push(this.ctaWinLayer);

        this.gameplayLayer = new UIGameplayLayer();
        App.layers.push(this.gameplayLayer);
    },

    setupCamera() {
        this.camera = App.World.Camera;
        this.camera.position.set(-15, 25, 18);
        this.camera.lookAt(0, 0, 0);
    },

    setupSky() {
        // Проверяем, загружено ли изображение фона
        if (!App.ThreeAssets || !App.ThreeAssets['Bg']) {
            // Если еще не загружено, попробуем позже
            setTimeout(() => this.setupSky(), 100);
            return;
        }

        const texture = App.ThreeAssets['Bg'];
        
        // Проверяем, что это текстура
        if (!(texture instanceof THREE.Texture)) {
            console.warn('[Gameplay] setupSky: Bg asset is not a valid texture');
            return;
        }

        // Настраиваем текстуру для тайлинга только по горизонтали
        texture.wrapS = THREE.RepeatWrapping; // Повторение по горизонтали
        texture.wrapT = THREE.ClampToEdgeWrapping; // Без повторения по вертикали (растягиваем)
        // Тайлинг только по горизонтали (2 раза для более широких тайлов), по вертикали - без повторения (1 раз)
        texture.repeat.set(2, 1);

        // Создаем сферу для неба с меньшим радиусом для тайлинга
        // Используем меньший радиус, чтобы текстура повторялась
        const skyRadius = 1000; // Уменьшенный радиус для тайлинга
        
        const skyGeometry = new THREE.SphereGeometry(skyRadius, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide, // Разворачиваем внутрь, чтобы текстура была видна изнутри
            fog: false
        });

        this.skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        this.skyMesh.name = 'sky';
        this.skyMesh.renderOrder = -1000; // Рендерим небо первым
        
        // Добавляем небо в сцену (не в game container, чтобы оно было всегда видно)
        if (App.World && App.World.Scene) {
            App.World.Scene.add(this.skyMesh);
        } else if (this["game container"]) {
            this["game container"].add(this.skyMesh);
        }
    },

    setupRenderer() {
        App.World.Renderer.shadowMap.enabled = true;
        App.World.Renderer.shadowMap.needsUpdate = true;
        App.World.Renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        App.World.Renderer.localClippingEnabled = true;
        App.World.Renderer.sortObjects = true;
    },

    setupLights() {
        this.setupDirectionalLight();
        this.setupAmbientLight();
    },

    setupDirectionalLight() {
        this.dirLight = new THREE.DirectionalLight(
            Settings["directional-light-color"],
            Settings['directional-light-intensity']
        );
        this["game container"].add(this.dirLight);

        this.dirLight.shadow.bias = -0.0001;
        this.dirLight.shadow.normalBias = 0.005;
        this.dirLight.castShadow = true;
        this.dirLight.shadow.radius = 0;

        this.dirLight.position.set(
            Settings["directional-light-pos-x"],
            Settings["directional-light-pos-y"],
            Settings["directional-light-pos-z"]
        );
        this.dirLight.color.set(Settings["directional-light-color"]);
    },

    setupAmbientLight() {
        this["light_directional"].position.set(
            Settings["ambient-light-pos-x"],
            Settings["ambient-light-pos-y"],
            Settings["ambient-light-pos-z"]
        );
        this['light_directional'].color.set(Settings["ambient-light-color"]);
        this['light_directional'].intensity = Settings["ambient-light-intensity"];
    },

    setupBalls() {
        if (!this.scene) {
            this.scene = this["game container"].getObjectByName('scene');
        }

        let ball2 = this.scene.getObjectByName('ball2');

        if (!ball2) {
            this.scene.traverse((object) => {
                if (object.name === 'ball2' && !ball2) {
                    ball2 = object;
                }
            });
        }

        if (ball2) {
            ball2.position.z += 2;

            const ball2Clone = ball2.clone();
            ball2Clone.position.x = ball2.position.x;
            ball2Clone.position.y = ball2.position.y;
            ball2Clone.position.z = -ball2.position.z;
            ball2.parent.add(ball2Clone);

            // Создаем второй клон для второго мяча
            const ball2Clone2 = ball2.clone();
            ball2Clone2.position.x = ball2.position.x;
            ball2Clone2.position.y = ball2.position.y;
            ball2Clone2.position.z = ball2.position.z;
            ball2.parent.add(ball2Clone2);

            // Удаляем оригинальный статический мяч со сцены
            if (ball2.parent) {
                ball2.parent.remove(ball2);
            }
            ball2 = null;

            this.balls = [ball2Clone, ball2Clone2];
        } else {
            this.balls = [];
        }
    },

    setupCharacter() {
        if (!this.scene) {
            this.scene = this["game container"].getObjectByName('scene');
        }

        if (!this.scene) {
            setTimeout(() => this.setupCharacter(), 100);
            return;
        }

        let character1 = null;
        let character3 = null;
        let character4 = null;

        this.scene.traverse((object) => {
            if (object.name === 'Armature001') {
                character1 = object;
            } else if (object.name === 'Armature003') {
                character3 = object;
            } else if (object.name === 'Armature004') {
                character4 = object;
            }
        });

        const foundCharacters = [];
        if (character1) foundCharacters.push('Armature001');
        if (character3) foundCharacters.push('Armature003');
        if (character4) foundCharacters.push('Armature004');

        if (foundCharacters.length === 0) {
            this.scene.traverse((object) => {
                if (object.name && object.name.includes('Armature')) {
                }
            });
            setTimeout(() => this.setupCharacter(), 100);
            return;
        }

        if (!App.ThreeAssets || !App.ThreeAssets['scene']) {
            setTimeout(() => this.setupCharacter(), 100);
            return;
        }

        const gltf = App.ThreeAssets['scene'];

        if (gltf.animations && gltf.animations.length > 0) {

            if (character1) {
                character1.visible = true;
                if (!this.character) {
                    this.character = character1;
                }
            }

            if (character4) {
                character4.visible = true;
                this.character4 = character4;

                const idleAnimation = 'Armature.004|idle_Armature.001';
                } else {
                }
            }
    },


    spawnCharacter() {
        if (!this["game container"]) return;
        
        // Проверяем, не создан ли уже персонаж
        if (this["game container"].getObjectByName('character')) {
            return;
        }
        
        // Создаем персонажа программно
        if (App.ThreeAssets && App.ThreeAssets['character']) {
            const gltf = App.ThreeAssets['character'];
            // GLTF объект имеет scene и animations
            const characterModel = gltf.scene || gltf;
            
            // Используем cloneCharacterModelWithArmature для правильного клонирования
            // Включаем Armature004, отключаем Armature001 (как для союзников)
            const character = this.cloneCharacterModelWithArmature(characterModel, 'character', 'Armature004', 'Armature001');
            
            if (character) {
                character.position.set(-5, 3, 0);
                character.rotation.set(0, 0, 0);
                character.scale.set(1, 1, 1);
                
                this["game container"].add(character);
            }
        }
    },

    setupCharacterModel() {
        if (this._characterModelSetupInProgress) {
            return;
        }

        const activeCharacter = this["game container"].getObjectByName('character');

        if (!activeCharacter) {
            setTimeout(() => this.setupCharacterModel(), 100);
            return;
        }

        this.character = activeCharacter;

        this.character.visible = true;

        setTimeout(() => {
            if (this.character) {
                this.character.lookAt(0, this.character.position.y, 0);
            }
        }, 100);

        if (!App.ThreeAssets || !App.ThreeAssets['character']) {
            setTimeout(() => this.setupCharacterModel(), 100);
            return;
        }

        const gltf = App.ThreeAssets['character'];

        if (gltf.animations && gltf.animations.length > 0) {

            let armature001 = null;
            let otherArmature = null;

            this.character.traverse((object) => {
                if (object.name === 'Armature001') {
                    armature001 = object;
                    object.visible = false;
                } else if (object.name && object.name.includes('Armature') && object.name !== 'Armature001') {
                    if (!otherArmature) {
                        otherArmature = object;
                    }
                }
            });


            if (otherArmature) {
                otherArmature.visible = true;
            }

            // Создаем AnimatedModelController для главного персонажа
            if (this.character && gltf.animations && gltf.animations.length > 0) {
                // Находим анимацию, которую используют враги
                let enemyIdleClip = null;
                for (const clip of gltf.animations) {
                    if (clip.name === 'Armature.004|idle_Armature.008') {
                        enemyIdleClip = clip;
                        break;
                    }
                }
                
                if (enemyIdleClip) {
                    // Копируем дорожки от врагов для главного персонажа (переименовываем треки с Armature001 на Armature004)
                    const animController = new AnimatedModelController(this.character, []);
                    
                    // Копируем базовый клип с переименованием треков
                    let idleClip = animController.retargetClip(enemyIdleClip, 'Armature001', 'Armature004');
                    if (!idleClip) {
                        // Если retarget не сработал, пробуем обратное переименование
                        idleClip = animController.retargetClip(enemyIdleClip, 'Armature.001', 'Armature.004');
                    }
                    if (!idleClip) {
                        // Если и это не сработало, используем оригинальный клип
                        idleClip = enemyIdleClip;
                    }
                    
                    animController.setBaseClip(idleClip);
                    animController.animations.set('base', idleClip);
                    
                    animController.createAnimationSegment('star', 0, 120, 24, idleClip);
                    animController.createAnimationSegment('idle', 120, 150, 24, idleClip);
                    animController.createAnimationSegment('run', 120, 150, 24, idleClip);
                    animController.createAnimationSegment('jump', 150, 200, 24, idleClip);
                    animController.createAnimationSegment('win', 200, 250, 24, idleClip);
                    
                    // Ищем клип для fallen анимации и копируем дорожки
                    let enemyFallenClip = null;
                    for (const clip of gltf.animations) {
                        if (clip.name === 'Armature.004|fallen.023') {
                            enemyFallenClip = clip;
                            break;
                        }
                    }
                    
                    if (enemyFallenClip) {
                        // Копируем fallen с переименованием треков
                        let fallenClip = animController.retargetClip(enemyFallenClip, 'Armature001', 'Armature004');
                        if (!fallenClip) {
                            fallenClip = animController.retargetClip(enemyFallenClip, 'Armature.001', 'Armature.004');
                        }
                        if (!fallenClip) {
                            fallenClip = enemyFallenClip;
                        }
                        animController.animations.set('fallen', fallenClip);
                    }
                    
                    // Сохраняем контроллер для обновления
                    this.characterAnimatorModel = animController;
                    this.character.__isJumping = false;
                    this.character.__hasPlayedStart = false;
                    
                    // Запускаем начальную анимацию (star при countdown, иначе idle)
                    if (this.isCountdownActive) {
                        animController.play('star', { 
                            loop: THREE.LoopOnce,
                            onFinish: () => {
                                if (!this.isCountdownActive) {
                                    animController.play('idle', { loop: THREE.LoopRepeat });
                                }
                            }
                        });
                    } else {
                        animController.play('idle', { loop: THREE.LoopRepeat });
                    }
                }
            }

            if (this.character && !this.characterPhysics) {
                if (this.character.__characterPhysics) {
                    this.characterPhysics = this.character.__characterPhysics;
                } else {
                    this._characterModelSetupInProgress = true;
                    this.characterPhysics = new CharacterPhysics(this.character, 1, -20);
                    if (this.character && this.characterPhysics) {
                        const body = this.characterPhysics.getBody();
                        if (body) {
                            body.position.set(-5, 3, 0);
                        }
                        this.character.position.set(-5, 3, 0);
                    }
                    this.character.lookAt(0, this.character.position.y, 0);

                    if (this.meshColliders && this.meshColliders.length > 0) {
                        this.updateMeshColliders();
                    }

                    this._characterModelSetupInProgress = false;
                }
            }
        }
    },


    setupBallPhysics() {
        // Предотвращаем повторное создание
        if (this._ballPhysicsSetupInProgress) {
            return;
        }

        if (!this.balls || this.balls.length === 0) {
            setTimeout(() => this.setupBallPhysics(), 100);
            return;
        }

        if (!this.characterPhysics) {
            setTimeout(() => this.setupBallPhysics(), 100);
            return;
        }

        if (!this.ballPhysics) {
            const existingPhysics = this.balls.find(ball => ball.__ballPhysics);
            if (existingPhysics) {
                this.ballPhysics = existingPhysics.__ballPhysics;
            } else {
                this._ballPhysicsSetupInProgress = true;
                const world = this.characterPhysics.getWorld();
                this.ballPhysics = new BallPhysics(world, this.balls);
                this._ballPhysicsSetupInProgress = false;
            }
        }
    },

    setupGoalTriggers() {
        if (!this.characterPhysics) {
            setTimeout(() => this.setupGoalTriggers(), 100);
            return;
        }

        if (this.goalTriggers && this.goalTriggers.length > 0) {
            return;
        }

        const world = this.characterPhysics.getWorld();
        this.goalTriggers = [];

        let leftGoalPos = null;
        let rightGoalPos = null;

        if (this.scene) {
            const findGoal = (obj, name) => {
                if (!obj) return null;
                if (obj.name && (obj.name.toLowerCase().includes('goal') ||
                    obj.name.toLowerCase().includes('gate') ||
                    obj.name.toLowerCase().includes('ворот'))) {
                    const pos = new THREE.Vector3();
                    obj.getWorldPosition(pos);
                    return pos;
                }
                for (let child of obj.children) {
                    const result = findGoal(child, name);
                    if (result) return result;
                }
                return null;
            };

            leftGoalPos = findGoal(this.scene, 'left');
            rightGoalPos = findGoal(this.scene, 'right');
        }

        if (!leftGoalPos) {
            leftGoalPos = new THREE.Vector3(-40, -2.1, 0);
        } else {
            leftGoalPos.y = -0.5;
            leftGoalPos.x = -40;
        }
        if (!rightGoalPos) {
            rightGoalPos = new THREE.Vector3(40, -2.1, 0);
        } else {
            rightGoalPos.y = -0.5;
            rightGoalPos.x = 40;
        }

        const leftGoalTrigger = new GoalTrigger(world, {
            position: rightGoalPos,
            size: new THREE.Vector3(15.1, 5.1, 15),
            onGoal: (ballBody) => {
                this.onGoalScored(ballBody, true);
            }
        });
        this.goalTriggers.push(leftGoalTrigger);

        const rightGoalTrigger = new GoalTrigger(world, {
            position: leftGoalPos,
            size: new THREE.Vector3(15.1, 5.1, 15),
            onGoal: (ballBody) => {
                this.onGoalScored(ballBody, false);
            }
        });
        this.goalTriggers.push(rightGoalTrigger);
    },

    setupAIPlayers() {
        if (!this.characterPhysics || !this.character || !this.ballPhysics || !this.balls) {
            setTimeout(() => this.setupAIPlayers(), 100);
            return;
        }

        if (this.aiPlayers && this.aiPlayers.length > 0) {
            return;
        }

        const world = this.characterPhysics.getWorld();
        this.aiPlayers = [];

        // Используем префаб character, в котором есть обе Armature
        const characterModel = this.character;
        if (!characterModel) {
            console.warn('[Gameplay] setupAIPlayers: character model not found');
            return;
        }

        const ourGoalPos = new THREE.Vector3(-40, 0, 0);
        const enemyGoalPos = new THREE.Vector3(40, 0, 0);

        const ourTeamPositions = [
            new THREE.Vector3(-5, 1, -5),
            new THREE.Vector3(-5, 1, 5),
        ];

        const enemyTeamPositions = [
            new THREE.Vector3(5, 1, -5),
            new THREE.Vector3(5, 1, 0),
            new THREE.Vector3(5, 1, 5),
        ];

        if (!this.ourAIPlayers) this.ourAIPlayers = [];
        if (!this.enemyAIPlayers) this.enemyAIPlayers = [];

        ourTeamPositions.forEach((pos, index) => {
            try {
                // Союзники используют Armature004 (отключаем Armature001)
                const aiCharacter = this.cloneCharacterModelWithArmature(characterModel, `ourPlayer${index}`, 'Armature004', 'Armature001');
                if (!aiCharacter) return;

                this["game container"].add(aiCharacter);
                aiCharacter.position.copy(pos);
                aiCharacter.lookAt(0, pos.y, 0);

                // Создаем AnimatedModelController для союзника
                if (App.ThreeAssets && App.ThreeAssets['character'] && App.ThreeAssets['character'].animations) {
                    const gltf = App.ThreeAssets['character'];
                    const animations = gltf.animations;
                    
                    // Находим анимацию, которую используют враги
                    let enemyIdleClip = null;
                    for (const clip of animations) {
                        if (clip.name === 'Armature.004|idle_Armature.008') {
                            enemyIdleClip = clip;
                            break;
                        }
                    }
                    
                    if (enemyIdleClip) {
                        // Копируем дорожки от врагов для союзников (переименовываем треки с Armature001 на Armature004)
                        const animController = new AnimatedModelController(aiCharacter, []);
                        
                        // Копируем базовый клип с переименованием треков
                        let idleClip = animController.retargetClip(enemyIdleClip, 'Armature001', 'Armature004');
                        if (!idleClip) {
                            // Если retarget не сработал, пробуем обратное переименование
                            idleClip = animController.retargetClip(enemyIdleClip, 'Armature.001', 'Armature.004');
                        }
                        if (!idleClip) {
                            // Если и это не сработало, используем оригинальный клип
                            idleClip = enemyIdleClip;
                        }
                        
                        animController.setBaseClip(idleClip);
                        animController.animations.set('base', idleClip);

                        animController.createAnimationSegment('star', 0, 120, 24, idleClip);
                        animController.createAnimationSegment('idle', 120, 150, 24, idleClip);
                        animController.createAnimationSegment('run', 120, 150, 24, idleClip);
                        animController.createAnimationSegment('jump', 150, 200, 24, idleClip);
                        animController.createAnimationSegment('win', 200, 250, 24, idleClip);
                        
                        // Ищем клип для fallen анимации и копируем дорожки
                        let enemyFallenClip = null;
                        for (const clip of animations) {
                            if (clip.name === 'Armature.004|fallen.023') {
                                enemyFallenClip = clip;
                                break;
                            }
                        }
                        
                        if (enemyFallenClip) {
                            // Копируем fallen с переименованием треков
                            let fallenClip = animController.retargetClip(enemyFallenClip, 'Armature001', 'Armature004');
                            if (!fallenClip) {
                                fallenClip = animController.retargetClip(enemyFallenClip, 'Armature.001', 'Armature.004');
                            }
                            if (!fallenClip) {
                                fallenClip = enemyFallenClip;
                            }
                            animController.animations.set('fallen', fallenClip);
                        }

                        // Сохраняем контроллер для обновления
                        aiCharacter.__ourAnimController = animController;
                        aiCharacter.__isJumping = false;
                        aiCharacter.__hasPlayedStart = false;
                        
                        // Запускаем начальную анимацию
                        if (this.isCountdownActive) {
                            animController.play('star', { 
                                loop: THREE.LoopOnce,
                                onFinish: () => {
                                    if (!this.isCountdownActive) {
                                        animController.play('idle', { loop: THREE.LoopRepeat });
                                    }
                                }
                            });
                        } else {
                            animController.play('idle', { loop: THREE.LoopRepeat });
                        }
                        
                        // Добавляем в список для обновления
                        if (!this.ourAnimControllers) {
                            this.ourAnimControllers = [];
                        }
                        this.ourAnimControllers.push(animController);
                    }
                }

                // Назначаем разные роли для разных игроков для более хаотичного поведения
                const roles = ['aggressive', 'defender', 'passer', 'receiver', 'wanderer'];
                const role = roles[index % roles.length] || 'wanderer';

                const aiPlayer = new OurAIPlayer(aiCharacter, world, {
                    position: pos,
                    lookDirection: new THREE.Vector3(0, 0, 0).sub(pos).normalize(),
                    enemyGoalPosition: enemyGoalPos,
                    moveSpeed: 5,
                    detectionRadius: 25,
                    kickForce: 4,
                    collisionOffset: new THREE.Vector3(-0.3, 0.2, 0),
                    role: role
                });

                // Пример использования: можно изменить collisionOffset после создания
                // aiPlayer.physics.setCollisionOffset(new THREE.Vector3(-1, 1000, 0));

                // Получить текущий offset
                // const currentOffset = aiPlayer.physics.getCollisionOffset();
                // console.log('Current offset:', currentOffset);

                this.ourAIPlayers.push(aiPlayer);
                this.aiPlayers.push(aiPlayer);

                if (this.isCountdownActive) {
                    aiPlayer.physics.setTargetVelocity(new THREE.Vector3(0, 0, 0));
                    const body = aiPlayer.physics.getBody();
                    if (body) {
                        body.velocity.x = 0;
                        body.velocity.z = 0;
                    }
                }
            } catch (e) {
            }
        });

        enemyTeamPositions.forEach((pos, index) => {
            try {
                // Враги используют Armature001 (отключаем Armature004)
                const aiCharacter = this.cloneCharacterModelWithArmature(characterModel, `enemyPlayer${index}`, 'Armature001', 'Armature004');
                if (!aiCharacter) return;

                this["game container"].add(aiCharacter);
                aiCharacter.position.copy(pos);
                aiCharacter.lookAt(0, pos.y, 0);

                // Создаем AnimatedModelController для противника
                if (App.ThreeAssets && App.ThreeAssets['character'] && App.ThreeAssets['character'].animations) {
                    const gltf = App.ThreeAssets['character'];
                    const animations = gltf.animations;
                    
                    // Находим анимацию Armature.004|idle_Armature.008
                    let idleClip = null;
                    for (const clip of animations) {
                        if (clip.name === 'Armature.004|idle_Armature.008') {
                            idleClip = clip;
                            break;
                        }
                    }
                    
                    if (idleClip) {
                        const animController = new AnimatedModelController(aiCharacter, [idleClip]);
                        animController.setBaseClip(idleClip);

                        animController.createAnimationSegment('star', 0, 250, 24, idleClip);
                        animController.createAnimationSegment('idle', 120, 150, 24, idleClip);
                        animController.createAnimationSegment('run', 120, 150, 24, idleClip);
                        animController.createAnimationSegment('jump', 150, 200, 24, idleClip);
                        animController.createAnimationSegment('win', 200, 250, 24, idleClip);
                        
                        // Ищем клип для fallen анимации
                        let fallenClip = null;
                        for (const clip of animations) {
                            if (clip.name === 'Armature.004|fallen.023') {
                                fallenClip = clip;
                                break;
                            }
                        }
                        
                        if (fallenClip) {
                            // Используем весь клип fallen как анимацию
                            animController.animations.set('fallen', fallenClip);
                        }

                        // Сохраняем контроллер для обновления
                        aiCharacter.__enemyAnimController = animController;
                        aiCharacter.__isJumping = false;
                        aiCharacter.__hasPlayedStart = false;
                        
                        // Запускаем начальную анимацию
                        if (this.isCountdownActive) {
                            animController.play('star', { 
                                loop: THREE.LoopOnce,
                                onFinish: () => {
                                    if (!this.isCountdownActive) {
                                        animController.play('idle', { loop: THREE.LoopRepeat });
                                    }
                                }
                            });
                        } else {
                            animController.play('idle', { loop: THREE.LoopRepeat });
                        }
                        
                        // Добавляем в список для обновления
                        if (!this.enemyAnimControllers) {
                            this.enemyAnimControllers = [];
                        }
                        this.enemyAnimControllers.push(animController);
                    }
                }

                const aiPlayer = new EnemyAIPlayer(aiCharacter, world, {
                    position: pos,
                    lookDirection: new THREE.Vector3(0, 0, 0).sub(pos).normalize(),
                    enemyGoalPosition: ourGoalPos,
                    moveSpeed: 4.5,
                    detectionRadius: 15,
                    kickForce: 4,
                    collisionOffset: new THREE.Vector3(-0.3, 0.2, 0)
                });

                this.enemyAIPlayers.push(aiPlayer);
                this.aiPlayers.push(aiPlayer);

                if (this.isCountdownActive) {
                    aiPlayer.physics.setTargetVelocity(new THREE.Vector3(0, 0, 0));
                    const body = aiPlayer.physics.getBody();
                    if (body) {
                        body.velocity.x = 0;
                        body.velocity.z = 0;
                    }
                }
            } catch (e) {
                console.error('[Gameplay] setupAIPlayers enemy error:', e);
            }
        });
    },

    distributeBallsToAI(aiPlayers, balls, ballPhysics) {
        if (!aiPlayers || aiPlayers.length === 0 || !balls || balls.length === 0 || !ballPhysics) {
            return [];
        }

        const assignments = new Array(aiPlayers.length).fill(null);
        const usedBalls = new Set();

        for (let i = 0; i < aiPlayers.length; i++) {
            const aiPlayer = aiPlayers[i];
            if (!aiPlayer || !aiPlayer.physics) continue;

            const body = aiPlayer.physics.getBody();
            if (!body) continue;

            let bestBall = null;
            let bestDistance = Infinity;
            let bestBallIndex = -1;

            for (let j = 0; j < balls.length; j++) {
                if (usedBalls.has(j)) continue;

                const ball = balls[j];
                if (!ball) continue;

                const ballBody = ballPhysics.getBody(ball);
                if (!ballBody) continue;

                const dx = ballBody.position.x - body.position.x;
                const dy = ballBody.position.y - body.position.y;
                const dz = ballBody.position.z - body.position.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                const randomFactor = Math.random() * 0.3;
                const adjustedDistance = distance * (1 - randomFactor);

                if (adjustedDistance < bestDistance) {
                    bestDistance = adjustedDistance;
                    bestBall = ball;
                    bestBallIndex = j;
                }
            }

            if (bestBall && bestBallIndex >= 0) {
                assignments[i] = bestBall;
                usedBalls.add(bestBallIndex);
            }
        }

        return assignments;
    },

    cloneCharacterModel(original, name) {
        try {
            if (this.cloneModel && typeof this.cloneModel === 'function') {
                const clone = this.cloneModel(original);
                clone.name = name;
                return clone;
            }

            const clone = original.clone(true);
            clone.name = name;

            clone.traverse((child) => {
                if (child.isMesh) {
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(mat => mat.clone());
                        } else {
                            child.material = child.material.clone();
                        }
                    }
                }
            });

            return clone;
        } catch (e) {
            return null;
        }
    },

    cloneCharacterModelWithArmature(original, name, enableArmature, disableArmature) {
        try {
            let clone;
            if (this.cloneModel && typeof this.cloneModel === 'function') {
                clone = this.cloneModel(original);
            } else {
                clone = original.clone(true);
            }

            clone.name = name;

            // Клонируем материалы
            clone.traverse((child) => {
                if (child.isMesh) {
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(mat => mat.clone());
                        } else {
                            child.material = child.material.clone();
                        }
                    }
                }
            });

            // Отключаем одну Armature, оставляем другую включенной
            clone.traverse((object) => {
                if (object.name === disableArmature) {
                    object.visible = false;
                } else if (object.name === enableArmature) {
                    object.visible = true;
                }
            });

            return clone;
        } catch (e) {
            console.error('[Gameplay] cloneCharacterModelWithArmature error:', e);
            return null;
        }
    },

    checkGoalTriggers() {
        if (!this.ballPhysics || !this.balls || !this.goalTriggers) {
            return;
        }

        this.balls.forEach((ball) => {
            const body = this.ballPhysics.getBody(ball);
            if (!body) {
                return;
            }

            this.goalTriggers.forEach((trigger, triggerIndex) => {
                const triggered = trigger.checkBallCollision(body);
            });
        });
    },

    onGoalScored(ballBody, isOurGoal) {
        if (!ballBody) {
            return;
        }

        if (this.gameplayLayer) {
            this.gameplayLayer.updateScore(isOurGoal);
        }

        if (!this.goals) this.goals = 0;
        this.goals++;

        setTimeout(() => {
            ballBody.position.set(0, 2, 0);
            ballBody.velocity.set(0, 0, 0);
            ballBody.angularVelocity.set(0, 0, 0);
            ballBody.wakeUp();
        }, 500);
    },

    setupMeshColliders() {
        if (this._meshCollidersSetupInProgress) {
            return;
        }

        if (!this.scene) {
            setTimeout(() => this.setupMeshColliders(), 100);
            return;
        }

        if (!this.characterPhysics) {
            setTimeout(() => this.setupMeshColliders(), 100);
            return;
        }

        if (this.meshColliders && this.meshColliders.length > 0) {
            return;
        }

        this._meshCollidersSetupInProgress = true;
        const world = this.characterPhysics.getWorld();
        this.meshColliders = [];

        const meshesToCollide = [];

        this.scene.traverse((object) => {
            if (object.name && (
                object.name.includes('Armature') ||
                object.name.includes('ball') ||
                object.name.includes('character')
            )) {
                return;
            }

            if (object.__isStaticSceneObject) {
                return;
            }

            if (object instanceof THREE.Mesh && object.geometry) {
                const geometry = object.geometry;
                if (geometry.attributes && geometry.attributes.position) {
                    if (object === this.character || (object.name && object.name.includes('character'))) {
                        return;
                    }

                    const box = new THREE.Box3().setFromObject(object);
                    const size = box.getSize(new THREE.Vector3());
                    const center = box.getCenter(new THREE.Vector3());

                    const bottomY = center.y - size.y / 2;

                    const groundLevel = 0.47;
                    const tolerance = 0.15;
                    if (Math.abs(bottomY - groundLevel) < tolerance) {
                        return;
                    }

                    meshesToCollide.push(object);
                }
            }
        });

        meshesToCollide.forEach((mesh) => {
            try {
                const wallMaterial = new CANNON.Material('wall');
                wallMaterial.friction = 0.0;
                wallMaterial.restitution = 0.0;

                const collider = new MeshCollider(mesh, world, {
                    mass: 0,
                    shapeType: 'trimesh',
                    material: wallMaterial,
                });

                this.meshColliders.push(collider);
            } catch (error) {
            }
        });

        this.updateMeshColliders();

        this._meshCollidersSetupInProgress = false;
    },

    updateMeshColliders() {
        if (!this.meshColliders) return;

        this.meshColliders.forEach((collider) => {
            if (!collider.mesh || !collider.body) return;

            const mesh = collider.mesh;
            const body = collider.body;

            if (body.mass === 0) {
                const worldPosition = new THREE.Vector3();
                const worldQuaternion = new THREE.Quaternion();

                mesh.getWorldPosition(worldPosition);
                mesh.getWorldQuaternion(worldQuaternion);

                const posDiff = Math.abs(body.position.x - worldPosition.x) +
                    Math.abs(body.position.y - worldPosition.y) +
                    Math.abs(body.position.z - worldPosition.z);

                const quatDiff = Math.abs(body.quaternion.x - worldQuaternion.x) +
                    Math.abs(body.quaternion.y - worldQuaternion.y) +
                    Math.abs(body.quaternion.z - worldQuaternion.z) +
                    Math.abs(body.quaternion.w - worldQuaternion.w);

                const threshold = 0.001;
                if (posDiff > threshold || quatDiff > threshold) {
                    body.position.copy(new CANNON.Vec3(worldPosition.x, worldPosition.y, worldPosition.z));
                    body.quaternion.copy(new CANNON.Quaternion(
                        worldQuaternion.x,
                        worldQuaternion.y,
                        worldQuaternion.z,
                        worldQuaternion.w
                    ));
                }
            } else {
                const worldPosition = new THREE.Vector3();
                const worldQuaternion = new THREE.Quaternion();

                mesh.getWorldPosition(worldPosition);
                mesh.getWorldQuaternion(worldQuaternion);

                body.position.copy(new CANNON.Vec3(worldPosition.x, worldPosition.y, worldPosition.z));
                body.quaternion.copy(new CANNON.Quaternion(
                    worldQuaternion.x,
                    worldQuaternion.y,
                    worldQuaternion.z,
                    worldQuaternion.w
                ));
            }
        });
    },

    setupGroundCollider() {
        if (!this.characterPhysics) {
            setTimeout(() => this.setupGroundCollider(), 100);
            return;
        }

        if (this.groundCollider) {
            return;
        }

        const world = this.characterPhysics.getWorld();

        this.groundCollider = new GroundCollider(world, {
            position: new THREE.Vector3(0.1, 0.47, 0),
            size: new THREE.Vector3(64.3, 0, 60),
            thickness: 0.1,
        });
    },

    setupCameraOperator() {
        const characterModel = this["game container"]?.getObjectByName('character');
        if (!characterModel) {
            setTimeout(() => this.setupCameraOperator(), 100);
            return;
        }

        const camera = App.World.Camera;

        this.cameraOperator = new Object3DOperator(camera, characterModel, false);

        this.cameraAzimuth = -90;
        this.cameraElevation = 15;
        this.cameraDistance = 12;

        this.cameraOperator.elevation = this.cameraElevation;
        this.cameraOperator.azimuth = this.cameraAzimuth;
        this.cameraOperator.distance = this.cameraDistance;
        this.cameraOperator.movementSpeed = 3;
        this.cameraOperator.aimingSpeed = 20;

        this.playSceneFlyoverAnimation(camera, characterModel);
    },

    playSceneFlyoverAnimation(camera, characterModel) {
        this.isCameraAnimationActive = true;

        if (this.cameraOperator) {
            this.cameraOperator.isActive = false;
        }

        const centerX = 0;
        const centerY = 5;
        const centerZ = 0;
        const radius = 25;
        const height = 15;
        const duration = 4;

        const startAngle = 0;
        const endAngle = Math.PI; // Заканчиваем на противоположной стороне (180 градусов)
        const startX = centerX + radius * Math.cos(startAngle);
        const startZ = centerZ + radius * Math.sin(startAngle);
        const startY = height;

        camera.position.set(startX, startY, startZ);
        camera.lookAt(centerX, centerY, centerZ);

        const progress = {value: 0};

        gsap.to(progress, {
            value: 1,
            duration: duration,
            ease: "none",
            onUpdate: () => {
                const angle = startAngle + progress.value * (endAngle - startAngle);

                const x = centerX + radius * Math.cos(angle);
                const z = centerZ + radius * Math.sin(angle);
                const y = height;

                camera.position.set(x, y, z);

                camera.lookAt(centerX, centerY, centerZ);
            },
            onComplete: () => {
                this.transitionToPlayerCamera(camera, characterModel);
            }
        });
    },

    async transitionToPlayerCamera(camera, characterModel) {
        if (!characterModel) {
            this.isCameraAnimationActive = false;
            return;
        }

        // Вычисляем целевую позицию камеры для следования за персонажем
        const characterPos = new THREE.Vector3();
        characterModel.getWorldPosition(characterPos);

        const elevationRad = THREE.MathUtils.degToRad(this.cameraElevation || 15);
        const azimuthRad = THREE.MathUtils.degToRad(this.cameraAzimuth || -90);
        const distance = this.cameraDistance || 12;

        const offset = new THREE.Vector3(
            Math.cos(elevationRad) * Math.sin(azimuthRad) * distance,
            Math.sin(elevationRad) * distance,
            Math.cos(elevationRad) * Math.cos(azimuthRad) * distance
        );

        const targetPosition = new THREE.Vector3().addVectors(characterPos, offset);
        const targetLookAt = characterPos.clone();
        targetLookAt.y += 1.5;

        // Сохраняем текущую позицию камеры
        const startPosition = camera.position.clone();
        const startLookAt = new THREE.Vector3();
        camera.getWorldDirection(startLookAt);
        startLookAt.multiplyScalar(10).add(startPosition);

        // Плавный переход к целевой позиции
        const transitionProgress = { value: 0 };
        
        await new Promise((resolve) => {
            gsap.to(transitionProgress, {
                value: 1,
                duration: 1.5,
                ease: "power2.inOut",
                onUpdate: () => {
                    const t = transitionProgress.value;
                    const currentPos = new THREE.Vector3().lerpVectors(startPosition, targetPosition, t);
                    const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, targetLookAt, t);
                    
                    camera.position.copy(currentPos);
                    camera.lookAt(currentLookAt);
                    camera.up.set(0, 1, 0);
                },
                onComplete: () => {
                    resolve();
                }
            });
        });

        this.isCameraAnimationActive = false;

        if (this.cameraOperator && characterModel) {
            this.cameraOperator.isActive = false;

            const camera = App.World.Camera;
            camera.up.set(0, 1, 0);
        }

        this.setupCameraSwipeControls();
        this.basicLayer.hideScoreText();
        this.showGameplayLayer();

        if (this.gameplayLayer) {
            this.isCountdownActive = true;
            await this.gameplayLayer.playCountdownAnimation();
            this.isCountdownActive = false;
            this.startTimer();
            this.setupJoystick();
        } else {
            this.setupCameraSwipeControls();
            this.showGameplayLayer();

            if (this.gameplayLayer) {
                this.isCountdownActive = true;
                await this.gameplayLayer.playCountdownAnimation();
                this.isCountdownActive = false;
                this.startTimer();
                this.setupJoystick();
            }
        }
    },

    updateCameraPosition() {
        return;
    },

    setupCameraSwipeControls() {
        let isDragging = false;
        let lastTouchX = 0;
        let lastTouchY = 0;
        const sensitivity = 0.3;

        const onTouchStart = (e) => {
            if (this.isCountdownActive) {
                e.preventDefault();
                return;
            }
            if (this.joystick && this.joystick.active) {
                return;
            }
            const touch = e.touches ? e.touches[0] : e;
            const x = touch.clientX || touch.x || 0;
            const y = touch.clientY || touch.y || 0;

            isDragging = true;
            lastTouchX = x;
            lastTouchY = y;
            e.preventDefault();
        };

        const onTouchMove = (e) => {
            if (!isDragging || this.isCountdownActive) {
                if (this.isCountdownActive) {
                    e.preventDefault();
                }
                return;
            }
            if (this.joystick && this.joystick.active) {
                return;
            }

            const touch = e.touches ? e.touches[0] : e;
            const x = touch.clientX || touch.x || 0;
            const y = touch.clientY || touch.y || 0;

            const deltaX = (x - lastTouchX) * sensitivity;
            const deltaY = (y - lastTouchY) * sensitivity;

            this.cameraAzimuth += deltaX;

            this.cameraElevation = Math.max(5, Math.min(60, this.cameraElevation - deltaY));

            lastTouchX = x;
            lastTouchY = y;
            e.preventDefault();
        };

        const onTouchEnd = (e) => {
            isDragging = false;
            e.preventDefault();
        };

        window.addEventListener('touchstart', onTouchStart, {passive: false});
        window.addEventListener('touchmove', onTouchMove, {passive: false});
        window.addEventListener('touchend', onTouchEnd, {passive: false});
        window.addEventListener('mousedown', onTouchStart);
        window.addEventListener('mousemove', onTouchMove);
        window.addEventListener('mouseup', onTouchEnd);

        this.cameraSwipeCleanup = () => {
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('mousedown', onTouchStart);
            window.removeEventListener('mousemove', onTouchMove);
            window.removeEventListener('mouseup', onTouchEnd);
        };
    },

    setupJoystick() {
        if (!this.characterMovementDirection) {
            this.characterMovementDirection = new THREE.Vector2(0, 0);
        }
        this.characterSpeed = 8;
    },

    updateCharacterMovement() {
        if (!this.character || this.isCountdownActive) return;

        const deltaTime = App.timeOffset ? App.timeOffset / 1000 : 0.016;

        const joystickDirection = new THREE.Vector2(
            this.characterMovementDirection.x,
            this.characterMovementDirection.y
        );

        if (this.characterPhysics) {
            if (joystickDirection.length() > 0.01) {
                const camera = App.World.Camera;
                const cameraForward = new THREE.Vector3();
                camera.getWorldDirection(cameraForward);
                cameraForward.y = 0;
                cameraForward.normalize();

                const cameraRight = new THREE.Vector3();
                cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0)).normalize();

                const moveDirection = new THREE.Vector3()
                    .addScaledVector(cameraForward, -joystickDirection.y)
                    .addScaledVector(cameraRight, joystickDirection.x)
                    .normalize();

                const targetVelocity = new THREE.Vector3(
                    moveDirection.x * this.characterSpeed,
                    0,
                    moveDirection.z * this.characterSpeed
                );
                this.characterPhysics.setTargetVelocity(targetVelocity);

                const lookAtTarget = new THREE.Vector3().addVectors(
                    this.character.position,
                    moveDirection
                );
                this.character.lookAt(lookAtTarget);
            } else {
                this.characterPhysics.setTargetVelocity(new THREE.Vector3(0, 0, 0));
            }
        } else {
            if (joystickDirection.length() > 0.01) {
                const camera = App.World.Camera;
                const cameraForward = new THREE.Vector3();
                camera.getWorldDirection(cameraForward);
                cameraForward.y = 0;
                cameraForward.normalize();

                const cameraRight = new THREE.Vector3();
                cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0)).normalize();

                const moveDirection = new THREE.Vector3()
                    .addScaledVector(cameraForward, -joystickDirection.y)
                    .addScaledVector(cameraRight, joystickDirection.x)
                    .normalize();

                const moveDistance = this.characterSpeed * deltaTime;
                const moveVector = moveDirection.multiplyScalar(moveDistance);

                this.character.position.x += moveVector.x;
                this.character.position.z += moveVector.z;

                const lookAtTarget = new THREE.Vector3().addVectors(
                    this.character.position,
                    moveDirection
                );
                this.character.lookAt(lookAtTarget);
            }
        }
    },

    startTimer() {
        this.gameTimeRemaining = 300; // 5 минут = 300 секунд
        this.gameTimerActive = true;
        this.gameStartTime = Date.now();
    },

    updateTimer() {
        if (!this.gameTimerActive) return;

        const elapsed = (Date.now() - this.gameStartTime) / 1000;
        const remaining = Math.max(0, this.gameTimeRemaining - elapsed);

        if (this.gameplayLayer) {
            this.gameplayLayer.updateTimer(remaining);
        }

        if (remaining <= 0 && this.gameTimerActive) {
            this.gameTimerActive = false;
            
            // Проигрываем звук проигрыша
            if (App._playSound) {
                App._playSound('game-lost');
            }
            
            // Показываем CTA Loose
            setTimeout(() => {
                if (App.CallToAction) {
                    App.CallToAction.show('Loose');
                }
                this.showLoseLayer();
            }, 500);
        }
    },

    updateCharacterAnimations() {
        const deltaTime = App.timeOffset ? App.timeOffset / 1000 : 0.016;
        
        // Определяем победившую команду
        const ourScore = this.gameplayLayer ? this.gameplayLayer.getOurScore() : 0;
        const ourTeamWins = ourScore >= 5;
        
        // Обновляем анимацию главного персонажа
        if (this.character && this.characterAnimatorModel) {
            this.updateSingleCharacterAnimation(
                this.character,
                this.characterAnimatorModel,
                this.characterPhysics,
                this.isCountdownActive,
                ourTeamWins
            );
        }
        
        // Противники выигрывают если мы проиграли (gameWinShown = true означает что мы выиграли)
        const enemyTeamWins = !ourTeamWins && this.gameWinShown === false && this.gameTimerActive === false;
        
        // Обновляем анимации союзников
        if (this.ourAIPlayers && this.ourAIPlayers.length > 0) {
            this.ourAIPlayers.forEach((aiPlayer) => {
                if (aiPlayer && aiPlayer.character && aiPlayer.character.__ourAnimController) {
                    this.updateSingleCharacterAnimation(
                        aiPlayer.character,
                        aiPlayer.character.__ourAnimController,
                        aiPlayer.physics,
                        this.isCountdownActive,
                        ourTeamWins
                    );
                }
            });
        }
        
        // Обновляем анимации противников
        if (this.enemyAIPlayers && this.enemyAIPlayers.length > 0) {
            this.enemyAIPlayers.forEach((aiPlayer) => {
                if (aiPlayer && aiPlayer.character && aiPlayer.character.__enemyAnimController) {
                    this.updateSingleCharacterAnimation(
                        aiPlayer.character,
                        aiPlayer.character.__enemyAnimController,
                        aiPlayer.physics,
                        this.isCountdownActive,
                        enemyTeamWins
                    );
                }
            });
        }
    },

    updateSingleCharacterAnimation(character, animController, physics, isCountdownActive, isWin) {
        if (!character || !animController || !physics) return;
        
        const body = physics.getBody();
        if (!body) return;
        
        const isOnGround = physics.isOnGround ? physics.isOnGround() : false;
        const wasJumping = character.__isJumping || false;
        const hasPlayedStart = character.__hasPlayedStart || false;
        const currentAction = animController.currentAction;
        const currentClipName = currentAction ? currentAction.getClip().name : '';
        
        // Если нет текущей анимации, запускаем начальную
        if (!currentAction || !currentAction.isRunning()) {
            if (isCountdownActive && !hasPlayedStart) {
                animController.play('star', { 
                    loop: THREE.LoopOnce,
                    onFinish: () => {
                        character.__hasPlayedStart = true;
                        if (!isCountdownActive) {
                            animController.play('idle', { loop: THREE.LoopRepeat });
                        }
                    }
                });
                character.__hasPlayedStart = true;
            } else if (!isCountdownActive) {
                animController.play('idle', { loop: THREE.LoopRepeat });
            }
            return;
        }
        
        // При победе - танцуем
        if (isWin) {
            if (currentClipName !== 'win') {
                animController.play('win', { loop: THREE.LoopRepeat });
            }
            return;
        }
        
        // При старте - показываем start, после - idle
        if (isCountdownActive) {
            if (!hasPlayedStart) {
                animController.play('star', { 
                    loop: THREE.LoopOnce,
                    onFinish: () => {
                        character.__hasPlayedStart = true;
                        if (!isCountdownActive) {
                            animController.play('idle', { loop: THREE.LoopRepeat });
                        }
                    }
                });
                character.__hasPlayedStart = true;
            } else if (currentClipName === 'star' && !isCountdownActive) {
                // Если countdown закончился, переключаем на idle
                animController.play('idle', { loop: THREE.LoopRepeat });
            }
            return;
        }
        
        // Проверяем прыжок и падение
        const velocityY = body.velocity.y;
        const isFalling = velocityY < -0.1; // Падаем вниз
        const isJumpingUp = velocityY > 0.1; // Прыгаем вверх
        
        if (!isOnGround) {
            if (isJumpingUp && currentClipName !== 'jump') {
                // Начало прыжка - проигрываем jump
                character.__isJumping = true;
                animController.play('jump', { 
                    loop: THREE.LoopOnce,
                    onFinish: () => {
                        // Прыжок закончился, проверяем - если падаем, переключаем на fallen
                        const bodyAfterJump = physics.getBody();
                        if (bodyAfterJump && bodyAfterJump.velocity.y < -0.1) {
                            animController.play('fallen', { loop: THREE.LoopRepeat });
                        }
                    }
                });
            } else if (isFalling && currentClipName !== 'fallen' && currentClipName !== 'jump') {
                // Начали падать - проигрываем fallen (только если не играет jump)
                animController.play('fallen', { loop: THREE.LoopRepeat });
            } else if (isFalling && currentClipName === 'jump') {
                // Если играет jump и мы уже падаем, переключаем на fallen
                const currentAction = animController.currentAction;
                if (currentAction) {
                    // Переключаем сразу на fallen, не ждем окончания jump
                    animController.play('fallen', { loop: THREE.LoopRepeat });
                }
            }
        } else {
            // На земле
            if (wasJumping || currentClipName === 'fallen' || currentClipName === 'jump') {
                // Приземлились после прыжка/падения
                character.__isJumping = false;
                animController.play('idle', { loop: THREE.LoopRepeat });
            } else if (currentClipName !== 'idle' && currentClipName !== 'star' && currentClipName !== 'run') {
                // Стоим на земле - idle
                animController.play('idle', { loop: THREE.LoopRepeat });
            }
        }
    },
});
