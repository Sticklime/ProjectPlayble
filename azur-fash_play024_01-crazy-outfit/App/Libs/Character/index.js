import gsap from 'gsap';
import * as THREE from 'three';

export class AnimatedModelController {
    constructor(model, animations, camera, text) {
        this.model = model;
        this.camera = camera;
        this.mixer = new THREE.AnimationMixer(model);
        this.animations = new Map();
        this.currentAction = null;

        this.textLabel = null;

        this.textPoint = null;

        this.text = text

        // Инициализация анимаций
        if (animations && animations.length > 0) {
            this.baseClip = animations[0];
        }

        this.arrows = []

        this.score = {
            'bottom': 0,
            'top': 0,
            'hair': 0,
            'shoes': 0
        }

        this.createStarBg()

        this.updateMaterials()

        this.createTextLabel()
    }

    updateMaterials() {
        this.model.traverse(child => {
            // Проверяем только Mesh и SkinnedMesh
            if (child.type !== 'Mesh' && child.type !== 'SkinnedMesh') return;

            if (!child.material) return;

            child.material.vertexColor = true;
            child.material.depthWrite = true;

            // По умолчанию всё скрываем
            child.visible = false;

            // Включаем тело
            if (child.name.includes('Model_girl')) {
                child.visible = true;
            }

            // Включаем купальник (Fairy1 сет)
            if (
                child.name.includes('Fairy1Top') ||
                child.name.includes('Fairy1Accessories') ||
                child.name.includes('Fairy1Shoes')
            ) {
                child.visible = true;
            }

            // Включаем StoreHairF волосы
            if (child.name === 'StoreHairF') {
                child.visible = true;
                child.material.color = new THREE.Color(this.convertHexColor(Settings["model-2-hair-color"]));
            }

            // Цвет кожи
            if (child.name === 'Model_girl_A001_1') {
                child.material.roughness = 0.45;
                child.material.metalness = 0.1;
                child.material.color = new THREE.Color(this.convertHexColor(Settings["model-1-skin-color"]));
            }

            // Цвет губ + включаем
            if (child.name.includes('Lip')) {
                child.visible = true;
                child.material.color = new THREE.Color(this.convertHexColor(Settings["lip-color"]));
            }

            // Ресницы
            if (child.name.includes('Eyelash')) {
                child.visible = true;
            }

            if (child.name === 'SetShoes') {
                child.visible = true;
            }

            if (child.name.includes('SetTop')) {
                child.visible = true;
            }

            if (child.name.includes('SetBottom')) {
                child.visible = true;
            }

            if (child.name.includes('Fairy')) {
                child.visible = false;
            }

            if (child.name === "Model_girl_A001") {
                const texture = App.ThreeAssets["eye-texture"];
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.flipY = false;

                // Двигаем текстуру по UV
                texture.offset.set(0.5,0.5); // Подбирай значения под свою модель!

                if (Array.isArray(child.material)) {
                    child.material.forEach(m => {
                        m.map = texture;
                        m.needsUpdate = true;
                    });
                } else {
                    child.material.map = texture;
                    child.material.needsUpdate = true;
                }
                if (child.geometry && child.geometry.attributes.uv) {
                    child.geometry.attributes.uv.needsUpdate = true;
                }
            }

            if (child.name === 'Fairy1Hair_1' || child.name === 'Fairy1Hair') {
              child.material.depthWrite = false;
            }

            child.castShadow = true;
        });
    }

    configFirstBase() {
        this.model.traverse(child => {
            if (child.type !== 'Mesh' && child.type !== 'SkinnedMesh') return;

            child.visible = false;

            if (child.name.includes('Model_girl')) {
                child.visible = true;
            }

            if (child.name === 'Sport1Hair') {
                child.visible = true;
            }
            console.log(child.name);
            if (child.material?.name === 'GirlSkin') {
                child.material.color = new THREE.Color(this.convertHexColor(Settings["model-1-skin-color"]));
            }

            if (child.name.includes('Eyelash') || child.name.includes('Lip')) {
                child.visible = true;
                this.emmissiveMethod(child);
            }

            if (child.name.includes('Fairy')) {
                child.visible = false;
            }


            if (child.name === 'SetShoes') {
                child.visible = true;
            }


            if (child.name.includes('SetTop')) {
                child.visible = true;
            }

            if (child.name.includes('SetBottom')) {
                child.visible = true;
            }

            child.castShadow = true;
        });
    }


    defaultBodyElements(child) {
        if (child.name === 'Eyelash' || child.material.name === 'Eye.005' || child.name.includes('Lip')) this.emmissiveMethod(child)
    }

    updateSettingCharacter() {
        this.model.traverse(child => {
            if (!child.material) return;

            if (child.name.includes('StoreHairF')) child.material = new THREE.MeshStandardMaterial({color: new THREE.Color(this.convertHexColor(Settings["model-2-hair-color"]))})

            if (child.material.name === 'Body-2.003' || child.material.name === 'GirlSkin') {
                child.material.color = new THREE.Color(this.convertHexColor(Settings["model-1-skin-color"]))
            }

            if (child.name === 'SetShoes') {
                child.material.color = new THREE.Color(this.convertHexColor(Settings["model-1-shoes-color"]))
            }

            if(child.name === 'SetTop' || child.name === 'SetBottom' || child.name === 'SetShoes') {
                if(this.text === 'YOU') {
                    if(child.name === 'SetTop'){
                        child.material.color = new THREE.Color(this.convertHexColor(Settings["model-1-top-color"]))
                    }
                    else if(child.name === 'SetBottom'){
                        child.material.color = new THREE.Color(this.convertHexColor(Settings["model-1-bottom-color"]))
                    }
                    else if(child.name === 'SetShoes'){
                        child.material.color = new THREE.Color(this.convertHexColor(Settings["model-1-shoes-color"]))
                    }
                }
                else{
                    if(child.name === 'SetTop'){
                        child.material.color = new THREE.Color(this.convertHexColor(Settings["model-2-top-color"]))
                    }
                    else if(child.name === 'SetBottom'){
                        child.material.color = new THREE.Color(this.convertHexColor(Settings["model-2-bottom-color"]))
                    }
                    else if(child.name === 'SetShoes'){
                        child.material.color = new THREE.Color(this.convertHexColor(Settings["model-2-shoes-color"]))
                    }

                }
            }

            if (child.name === 'Sport1Hair') {
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(this.convertHexColor(Settings["model-1-hair-color"]))
                });
            }

            if (child.name === 'Sport1Hair001') child.material = new THREE.MeshStandardMaterial({color: new THREE.Color(this.text === 'YOU' ? this.convertHexColor(Settings["model-3-hair-color"]) : 0x520000)})

            if (child.name === 'Eyelashes'){
                child.material.color = new THREE.Color(this.convertHexColor(Settings["eyelashe-color"]))
            }

            if (child.name.includes('Lip')) child.material.color = new THREE.Color(this.convertHexColor(Settings["lip-color"]))
        })
    }

    createLastArrows() {

        const x = this.text === 'YOU' ? 0 : 0.5

        const side = [
            new THREE.Vector3(x, 1.64, 0),
            new THREE.Vector3(x, 2, 0),
            new THREE.Vector3(x, 2.4, 0),
            new THREE.Vector3(x, 0.2, 0)
        ]

        let worldPosition = new THREE.Vector3();

        let step = null

        side.forEach((e, i) => {
            if (i === 1) {
                step = this.score['top']
                this.model.getWorldPosition(worldPosition);
            }

            if (i === 0) {
                step = this.score['bottom']
                this.model.getWorldPosition(worldPosition);
            }

            if (i === 2) {
                step = this.score['hair']
                this.model.getWorldPosition(worldPosition);
            }

            if (i === 3) {
                step = this.score['shoes']
                this.model.getWorldPosition(worldPosition);
            }

            if (step !== null) {
                const cont = App.Gameplay.createArrows(step, worldPosition.add(e), i)

                this.arrows.push({offset: e, cont})
            }

        })
    }

    changeCloth(name,scoreValue) {
        const params = name.split('-');
        const type = params[0];
        let side = params[1];

        this.score[side] = scoreValue;

        this.model.traverse(child => {
            if (!child.material) return;

            if (side === 'top') {
                if (child.name.includes('SetTop') || child.name.includes('SetBottom')) {
                    child.visible = false;
                }
            }

            if (side === 'hair') {
                if (child.name.includes('StoreHairF')) {
                    child.visible = false;
                }

                if (child.name.includes('Sport1Hair')) {
                    child.visible = false;
                }
            }

            if (side === 'shoes') {

                if (child.name === "Toilet_2_Shoes") {
                    const yellowMaterial = new THREE.MeshStandardMaterial({
                        color: new THREE.Color("#FFFF00"),
                        metalness: 0.3,
                        roughness: 0.5
                    });

                    child.material = yellowMaterial;
                }

                if (child.name === 'SetShoes') {
                    child.visible = false;
                }
            }

            if (child.name.toLowerCase().includes(type) && child.name.toLowerCase().includes(side)) {
                child.visible = true;
                this.emmissiveMethod(child);
            }

            if (side === 'top') {
                if (child.name.toLowerCase().includes(type) && child.name.toLowerCase().includes('bottom')) {
                    child.visible = true;
                    this.emmissiveMethod(child);
                }
            }
        });
    }


    // Метод для создания текстовой метки
    createTextLabel(offset = new THREE.Vector3(0, 2.4, 0)) {
        const group = new THREE.Group()

        group.position.copy(offset)

        this.model.add(group)

        this.textPoint = group

        const text = App.Gameplay.buildThreeChild(App.Gameplay['text title'], {
            type: 'three-text',
            text: 'NAME_CHARACTER'
        })

        if (this.text === 'YOU') {
            const arrow = App.Gameplay.buildThreeChild(text, {type: 'three-image', image: 'triangle'})
            arrow.position.set(0, -40, 0)
        }

        this.textLabel = text

        text.visible = true
    }

    // Метод для разделения анимации по кадрам
    createAnimationSegment(name, startFrame, endFrame, fps = 24) {
        if (!this.baseClip) return;

        const startTime = startFrame;
        const endTime = endFrame;

        const clip = THREE.AnimationUtils.subclip(
            this.baseClip,
            name,
            startTime,
            endTime,
            fps
        );

        this.animations.set(name, clip);
    }

    createStarBg() {
        const group = new THREE.Group()

        const parent = App.Gameplay['star plashka cont']

        App.Gameplay.buildThreeChild(group, {type: 'three-image', image: "star-bg"})

        const star = App.Gameplay.buildThreeChild(group, {type: 'three-image', image: "star"})

        star.position.x = -35

        const text = App.Gameplay.buildThreeChild(group, {type: 'three-text', text: "SCORE_STAR"})

        text.position.x = 20
        text.position.y = -2

        this.textStarCount = text

        group.scale.set(0, 0, 0)

        parent.add(group)

        this.starBgCont = group
    }

    animationText(sum) {
        let target = {value: 0}

        // Если sum не число, присвоить 0
        if (typeof sum !== 'number' || isNaN(sum)) sum = 0;

        gsap.timeline()
            .to(this.starBgCont.scale, {
                x: 1, y: 1, z: 1, duration: 0.2, onComplete: () => {
                    this.createExplosion(700, 60)
                }
            })
            .to(target, {
                value: sum, duration: 0.3, onUpdate: () => {
                    if (typeof target.value === 'number') {
                        this.textStarCount.text = '' + target.value.toFixed(0);
                    } else {
                        this.textStarCount.text = '0';
                    }
                }
            }, '>');
    }

    createExplosion(radius = 150, count = 30, onComplete = () => {
    }) {
        const screen = App.Gameplay

        let completed = 0;

        const parent = this.starBgCont

        for (let i = 0; i < count; i++) {
            const sprite = screen.buildThreeChild(parent, {type: 'three-image', image: 'star'})

            let x = 0
            let y = 0

            const scale = 0.5 + Math.random() * 0.5

            sprite.position.set(x, y)
            sprite.scale.set(scale, scale, scale);

            const angle = Math.random() * Math.PI * 2;
            const distance = radius * (0.5 + Math.random() * 0.5); // внутри радиуса
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            gsap.timeline()
                .to(sprite.material, {opacity: 0, duration: 0.8 + Math.random() * 0.5, ease: "power2.out"})
                .to(sprite.scale, {x: 0, y: 0, z: 0, duration: 0.8 + Math.random() * 0.5, ease: "power2.out"}, '<')
                .to(sprite.position, {
                    x: x + dx, y: y + dy, duration: 0.8 + Math.random() * 0.5, ease: "power2.out",
                    onComplete: () => {
                        sprite.removeFromParent();
                        completed++;
                        if (completed === count && typeof onComplete === 'function') {
                            onComplete()
                        }
                    }
                }, '<');
        }
    }

    // Воспроизведение анимации
    playAnimation(name, options = {}) {
        if (!this.animations.has(name)) {
            return null;
        }

        const config = {
            loop: THREE.LoopRepeat,
            clampWhenFinished: true,
            fadeIn: 0,
            fadeOut: 0,
            timeScale: 1,
            forceRestart: true,
            onFinish: null,
            ...options
        };

        const clip = this.animations.get(name);

        if (!this.actions) this.actions = new Map();
        let action = this.actions.get(name);

        if (!action) {
            action = this.mixer.clipAction(clip);
            this.actions.set(name, action);
        }

        if (this.currentAction === action && !config.forceRestart) {
            return action;
        }

        // Управление предыдущей анимацией
        if (this.currentAction && this.currentAction !== action) {
            this.currentAction.fadeOut(config.fadeOut);
        }

        // Настройка новой анимации
        action.reset()
            .setLoop(config.loop)
            .clampWhenFinished = config.clampWhenFinished;

        action.setEffectiveTimeScale(config.timeScale)
            .fadeIn(config.fadeIn)
            .play();

        // Обработка завершения
        if (config.onFinish) {
            const handleFinish = (e) => {
                if (e.action === action) {
                    action.getMixer().removeEventListener('finished', handleFinish);
                    config.onFinish();
                }
            };
            action.getMixer().addEventListener('finished', handleFinish);
        }

        this.currentAction = action;
        return action;
    }

    setAnimationSpeed(speed) {
        if (this.currentAction) {
            this.currentAction.setEffectiveTimeScale(speed);
        }
    }

    // Обновление состояний
    update(delta) {
        if (this.mixer) this.mixer.update(delta);

        if (this.textLabel) {
            const worldPosition = new THREE.Vector3();
            this.textPoint.getWorldPosition(worldPosition);

            const converted_coord = App.Gameplay.convertWorldToGUI(worldPosition, App.Gameplay);

            this.textLabel.text = this.text

            this.textLabel.position.copy(converted_coord)

            this.starBgCont.position.copy(converted_coord.add(new THREE.Vector3(0, 100, 0)))
        }

        if (this.arrows.length) {
            this.arrows.forEach((e) => {
                if (e.cont) {
                    const worldPosition = new THREE.Vector3();
                    this.model.getWorldPosition(worldPosition);

                    const converted_coord = App.Gameplay.convertWorldToGUI(worldPosition.add(e.offset), App.Gameplay);

                    e.cont.position.copy(converted_coord)
                }
            })
        }
    }

    emmissiveMethod(model) {
        model.traverse(child => {
            if (!child.material) return;

            child.material.emissive.set(0xFFFFFF);
            child.material.emissiveIntensity = 1;

            setTimeout(() => {
                child.material.emissiveIntensity = 0;
            }, 200)
        })
    }

    // Очистка ресурсов
    dispose() {
        this.mixer.stopAllAction();
    }

    sumScore() {
        let sum = 0

        for (var key in this.score) {
            sum += this.score[key]
        }

        return sum
    }

    convertHexColor(color) {
        return +("0x" + color.substring(1))
    }
}
