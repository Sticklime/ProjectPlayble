import {AssetKeeper} from "Generated/AssetKeeper";
import gsap from "gsap";
import * as THREE from "three";

import {
    UIConstraint2DBuilder,
    UIFullscreenLayer,
    UIImage,
    UIMode,
    UIResizePolicyFixedWidth,
    UIText,
} from "laymur";
import {UIAppearAnimator, UIDisappearAnimator} from "laymur-animations";

export class UIGameplayLayer extends UIFullscreenLayer {

    private readonly score: UIImage;
    private readonly scoreText: UIText;
    private readonly popUp: UIImage;
    private readonly timer: UIImage;
    private readonly timerText: UIText;
    private readonly controlLeft: UIImage;
    private readonly progressLevel1: UIImage;
    private readonly hand: UIImage;
    private readonly swipeToMove: UIImage;
    private readonly controlRight: UIImage;
    private readonly jump: UIImage;
    private readonly tapToJump: UIImage;
    private readonly countdown1: UIImage;
    private handConstraint: {h: any; v: any} | null = null;
    private progressLevel1Constraint: {h: any; v: any} | null = null;
    private controlLeftConstraint: {h: any; v: any} | null = null;
    private handRotationAnimation: gsap.core.Timeline | null = null;
    private readonly countdown2: UIImage;
    private readonly countdown3: UIImage;
    private readonly countdownGo: UIImage;
    

    constructor() {
        // Используем правильные размеры для портретной и ландшафтной ориентации
        // Для ландшафта: 1920x1080, для портрета: увеличенные размеры для более крупного UI
        const isPortrait = (typeof App !== 'undefined' && App.IsPortrait) || window.innerHeight > window.innerWidth;
        super(new UIResizePolicyFixedWidth(isPortrait ? 1300 : 1920, isPortrait ? 1920 : 1080), UIMode.HIDDEN);

        this.score = new UIImage(this, AssetKeeper.I_Score, {
            x: 0,
            y: 0,
        });

        this.scoreText = new UIText(this, "0   0", {
            x: 0,
            y: 100,
            commonStyle: {
                fontSize: 48,
                fontFamily: "BalooCyrillic",
                color: "#FFFFFF",
            },
            maxWidth: 300, // Устанавливаем максимальную ширину
        });

        this.popUp = new UIImage(this, AssetKeeper.I_PopUp, {
            x: 0,
            y: 0,
        });

        this.timer = new UIImage(this, AssetKeeper.I_Timer, {
            x: 0,
            y: 0,
        });

        this.timerText = new UIText(this, "5:00", {
            x: 40,
            y: 30,
            commonStyle: {
                fontSize: 46,
                fontFamily: "BalooCyrillic",
                color: "#FFFFFF",

            },
            maxWidth: 200, // Устанавливаем максимальную ширину
        });

        this.controlLeft = new UIImage(this, AssetKeeper.I_Control, {
            x: 0,
            y: 0,
        });

        this.progressLevel1 = new UIImage(this, AssetKeeper.I_Progress_Level_1, {
            x: 0,
            y: 0,
        });

        this.hand = new UIImage(this, AssetKeeper.I_Hand, {
            x: 0,
            y: 0,
        });
        this.hand.mode = UIMode.HIDDEN;

        this.swipeToMove = new UIImage(this, AssetKeeper.I_Swipe_To_Move, {
            x: 0,
            y: 0,
        });

        this.controlRight = new UIImage(this, AssetKeeper.I_Control, {
            x: 0,
            y: 0,
        });

        this.jump = new UIImage(this, AssetKeeper.I_Jump, {
            x: 0,
            y: 0,
        });

        this.tapToJump = new UIImage(this, AssetKeeper.I_Tap_To_Jump, {
            x: 0,
            y: 0,
        });

        this.countdown1 = new UIImage(this, AssetKeeper.I_1, {
            x: 0,
            y: 0,
        });
        this.countdown1.mode = UIMode.HIDDEN;

        this.countdown2 = new UIImage(this, AssetKeeper.I_2, {
            x: 0,
            y: 0,
        });
        this.countdown2.mode = UIMode.HIDDEN;

        this.countdown3 = new UIImage(this, AssetKeeper.I_3, {
            x: 0,
            y: 0,
        });
        this.countdown3.mode = UIMode.HIDDEN;

        this.countdownGo = new UIImage(this, AssetKeeper.I_GO, {
            x: 0,
            y: 0,
        });
        this.countdownGo.mode = UIMode.HIDDEN;

        UIConstraint2DBuilder.distance(this, this.score, {
            anchorA: {h: 0.5, v: 1},
            anchorB: {h: 0.5, v: 1},
            distance: {h: 0, v: -50},
        });

        UIConstraint2DBuilder.distance(this.score, this.scoreText, {
            anchorA: {h: 0.5, v: 0.5},
            anchorB: {h: 0.5, v: 0.5},
            distance: {h: 0, v: 0},
        });

        UIConstraint2DBuilder.distance(this, this.popUp, {
            anchorA: {h: 0, v: 1},
            anchorB: {h: 0, v: 1},
            distance: {h: -50, v: -150},
        });

        UIConstraint2DBuilder.distance(this, this.timer, {
            anchorA: {h: 1, v: 1},
            anchorB: {h: 1, v: 1},
            distance: {h: 50, v: -150},
        });

        UIConstraint2DBuilder.distance(this.timer, this.timerText, {
            anchorA: {h: 0.5, v: 0.5},
            anchorB: {h: 0.5, v: 0.5},
            distance: {h: 0, v: 0},
        });

        this.controlLeftConstraint = UIConstraint2DBuilder.distance(this, this.controlLeft, {
            anchorA: {h: 0, v: 0},
            anchorB: {h: 0, v: 0},
            distance: {h: 150, v: 150},
        });

        this.progressLevel1Constraint = UIConstraint2DBuilder.distance(this.controlLeft, this.progressLevel1, {
            anchorA: {h: 0.5, v: 0.5},
            anchorB: {h: 0.5, v: 0.5},
            distance: {h: 0, v: 0},
        });

        this.handConstraint = UIConstraint2DBuilder.distance(this.controlLeft, this.hand, {
            anchorA: {h: 0.5, v: 0.5},
            anchorB: {h: 0.5, v: 0.5},
            distance: {h: 0, v: 0},
        });

        UIConstraint2DBuilder.distance(this.controlLeft, this.swipeToMove, {
            anchorA: {h: 0.5, v: 0},
            anchorB: {h: 0.5, v: 1},
            distance: {h: 0, v: -50},
        });

        UIConstraint2DBuilder.distance(this, this.controlRight, {
            anchorA: {h: 1, v: 0},
            anchorB: {h: 1, v: 0},
            distance: {h: -150, v: 150},
        });

        UIConstraint2DBuilder.distance(this.controlRight, this.jump, {
            anchorA: {h: 0.5, v: 0.5},
            anchorB: {h: 0.5, v: 0.5},
            distance: {h: 0, v: 0},
        });

        UIConstraint2DBuilder.distance(this.jump, this.tapToJump, {
            anchorA: {h: 0.5, v: 0},
            anchorB: {h: 0.5, v: 1},
            distance: {h: 0, v: -80},
        });

        UIConstraint2DBuilder.distance(this, this.countdown1, {
            anchorA: {h: 0.5, v: 0.5},
            anchorB: {h: 0.5, v: 0.5},
            distance: {h: 0, v: 0},
        });

        UIConstraint2DBuilder.distance(this, this.countdown2, {
            anchorA: {h: 0.5, v: 0.5},
            anchorB: {h: 0.5, v: 0.5},
            distance: {h: 0, v: 0},
        });

        UIConstraint2DBuilder.distance(this, this.countdown3, {
            anchorA: {h: 0.5, v: 0.5},
            anchorB: {h: 0.5, v: 0.5},
            distance: {h: 0, v: 0},
        });

        UIConstraint2DBuilder.distance(this, this.countdownGo, {
            anchorA: {h: 0.5, v: 0.5},
            anchorB: {h: 0.5, v: 0.5},
            distance: {h: 0, v: 0},
        });
        
    }

    public async show(): Promise<void> {
        this.mode = UIMode.VISIBLE;
    }

    public async playCountdownAnimation(): Promise<void> {
        const duration = 0.5;
        const delay = 0.3;

        this.countdown3.mode = UIMode.VISIBLE;
        await UIAppearAnimator.appear(this.countdown3, {
            xFrom: 0,
            yFrom: 0,
            duration,
        });
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
        await UIDisappearAnimator.disappear(this.countdown3, {
            xTo: 0,
            yTo: 0,
            duration: 0.2,
        });
        this.countdown3.mode = UIMode.HIDDEN;

        this.countdown2.mode = UIMode.VISIBLE;
        await UIAppearAnimator.appear(this.countdown2, {
            xFrom: 0,
            yFrom: 0,
            duration,
        });
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
        await UIDisappearAnimator.disappear(this.countdown2, {
            xTo: 0,
            yTo: 0,
            duration: 0.2,
        });
        this.countdown2.mode = UIMode.HIDDEN;

        this.countdown1.mode = UIMode.VISIBLE;
        await UIAppearAnimator.appear(this.countdown1, {
            xFrom: 0,
            yFrom: 0,
            duration,
        });
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
        await UIDisappearAnimator.disappear(this.countdown1, {
            xTo: 0,
            yTo: 0,
            duration: 0.2,
        });
        this.countdown1.mode = UIMode.HIDDEN;

        this.countdownGo.mode = UIMode.VISIBLE;
        await UIAppearAnimator.appear(this.countdownGo, {
            xFrom: 0,
            yFrom: 0,
            duration,
        });
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
        await UIDisappearAnimator.disappear(this.countdownGo, {
            xTo: 0,
            yTo: 0,
            duration: 0.2,
        });
        this.countdownGo.mode = UIMode.HIDDEN;
    }

    public startHandRotationAnimation(): void {
        if (!this.handConstraint || !this.progressLevel1Constraint) {
            return;
        }

        this.hand.mode = UIMode.VISIBLE;

        const handRadius = 50;
        const joystickRadius = 50;

        const animationData = {
            angle: 0,
        };

        const updatePositions = () => {
            const joystickX = Math.cos(-animationData.angle) * joystickRadius;
            const joystickY = Math.sin(-animationData.angle) * joystickRadius;

            if (this.progressLevel1Constraint) {
                this.progressLevel1Constraint.h.distance = joystickX;
                this.progressLevel1Constraint.v.distance = joystickY;
            }

            const handX = Math.cos(-animationData.angle) * handRadius + 40;
            const handY = Math.sin(-animationData.angle) * handRadius - 80;

            if (this.handConstraint) {
                this.handConstraint.h.distance = handX;
                this.handConstraint.v.distance = handY;
            }
        };

        const tween = gsap.to(animationData, {
            angle: Math.PI * 2,
            duration: 2,
            repeat: -1,
            ease: "none",
            onUpdate: updatePositions,
        });

        updatePositions();

        this.handRotationAnimation = gsap.timeline();
        this.handRotationAnimation.add(tween, 0);
    }

    public stopHandRotationAnimation(): void {
        if (this.handRotationAnimation) {
            this.handRotationAnimation.kill();
            this.handRotationAnimation = null;
        }

        if (this.progressLevel1Constraint) {
            this.progressLevel1Constraint.h.distance = 0;
            this.progressLevel1Constraint.v.distance = 0;
        }

        if (this.handConstraint) {
            this.handConstraint.h.distance = 0;
            this.handConstraint.v.distance = 0;
        }

        this.hand.mode = UIMode.HIDDEN;
    }

    public getJoystickBase(): UIImage {
        return this.controlLeft;
    }

    public getJoystickStick(): UIImage {
        return this.progressLevel1;
    }

    public getProgressLevel1Constraint(): {h: any; v: any} | null {
        return this.progressLevel1Constraint;
    }

    public resetJoystick(): void {
        if (this.progressLevel1Constraint) {
            this.progressLevel1Constraint.h.distance = 0;
            this.progressLevel1Constraint.v.distance = 0;
        }
    }

    public isInJoystickArea(screenX: number, screenY: number): boolean {
        const layer = (this.controlLeft as any).layer;
        if (!layer) {
            const screenWidth = window.innerWidth || document.documentElement.clientWidth;
            return screenX < screenWidth / 2 && screenY > window.innerHeight / 2;
        }
        
        const layerElement = this.getDOMElement(layer as any);
        if (!layerElement || !layerElement.getBoundingClientRect) {
            const screenWidth = window.innerWidth || document.documentElement.clientWidth;
            return screenX < screenWidth / 2 && screenY > window.innerHeight / 2;
        }
        
        const joystickElement = this.getDOMElement(this.controlLeft);
        if (!joystickElement || !joystickElement.getBoundingClientRect) {
            const screenWidth = window.innerWidth || document.documentElement.clientWidth;
            return screenX < screenWidth / 2 && screenY > window.innerHeight / 2;
        }
        
        const joystickRect = joystickElement.getBoundingClientRect();
        const joystickCenterX = joystickRect.left + joystickRect.width / 2;
        const joystickCenterY = joystickRect.top + joystickRect.height / 2;
        const joystickRadius = Math.max(joystickRect.width, joystickRect.height) / 2;
        const touchAreaRadius = joystickRadius;
        
        const distance = Math.sqrt(
            Math.pow(screenX - joystickCenterX, 2) + 
            Math.pow(screenY - joystickCenterY, 2)
        );
        
        return distance < touchAreaRadius;
    }

    /**
     * Проверяет, находится ли точка касания в области правого джойстика (для прыжка).
     */
    public isInJumpArea(screenX: number, screenY: number): boolean {
        const layer = (this.controlRight as any).layer;
        if (!layer) {
            const screenWidth = window.innerWidth || document.documentElement.clientWidth;
            return screenX >= screenWidth / 2 && screenY > window.innerHeight / 2;
        }
        
        const layerElement = this.getDOMElement(layer as any);
        if (!layerElement || !layerElement.getBoundingClientRect) {
            const screenWidth = window.innerWidth || document.documentElement.clientWidth;
            return screenX >= screenWidth / 2 && screenY > window.innerHeight / 2;
        }
        
        const joystickElement = this.getDOMElement(this.controlRight);
        if (!joystickElement || !joystickElement.getBoundingClientRect) {
            const screenWidth = window.innerWidth || document.documentElement.clientWidth;
            return screenX >= screenWidth / 2 && screenY > window.innerHeight / 2;
        }
        
        const joystickRect = joystickElement.getBoundingClientRect();
        const joystickCenterX = joystickRect.left + joystickRect.width / 2;
        const joystickCenterY = joystickRect.top + joystickRect.height / 2;
        const joystickRadius = Math.max(joystickRect.width, joystickRect.height) / 2;
        const touchAreaRadius = joystickRadius;
        
        const distance = Math.sqrt(
            Math.pow(screenX - joystickCenterX, 2) + 
            Math.pow(screenY - joystickCenterY, 2)
        );
        
        return distance < touchAreaRadius;
    }

    public updateJoystickPosition(centerX: number, centerY: number, stickX: number, stickY: number): void {
        const layer = (this.controlLeft as any).layer;
        if (!layer) return;

        const layerElement = this.getDOMElement(layer as any);
        if (!layerElement || !layerElement.getBoundingClientRect) return;

        const layerRect = layerElement.getBoundingClientRect();
        const layerWidth = (layer as any).width || 1920;
        const layerHeight = (layer as any).height || 1080;

        const scaleX = layerWidth / layerRect.width;
        const scaleY = layerHeight / layerRect.height;

        const relativeX = centerX - layerRect.left;
        const relativeY = centerY - layerRect.top;

        const laymurX = relativeX * scaleX;
        const laymurY = relativeY * scaleY;

        if (this.controlLeftConstraint) {
            this.controlLeftConstraint.h.distance = laymurX;
            this.controlLeftConstraint.v.distance = laymurY;
        }

        if (this.progressLevel1Constraint) {
            this.progressLevel1Constraint.h.distance = stickX;
            this.progressLevel1Constraint.v.distance = stickY;
        }
    }

    private getDOMElement(uiElement: UIImage | any): HTMLElement | null {
        if (!uiElement) return null;
        
        const element = (uiElement as any).element || 
                       (uiElement as any).domElement || 
                       (uiElement as any).htmlElement ||
                       (uiElement as any)._element ||
                       (uiElement as any).nativeElement;
        
        if (element && element instanceof HTMLElement) {
            return element;
        }
        
        const layer = (uiElement as any).layer;
        if (layer) {
            const layerElement = (layer as any).element || 
                                (layer as any).domElement ||
                                (layer as any).canvas ||
                                (layer as any).container;
            if (layerElement && layerElement instanceof HTMLElement) {
                return layerElement;
            }
        }
        
        const parent = (uiElement as any).parent;
        if (parent) {
            return this.getDOMElement(parent as any);
        }
        
        return null;
    }

    private opponentScore: number = 0;
    private ourScore: number = 0;
    
    /**
     * Обновляет таймер.
     * @param remainingSeconds - оставшееся время в секундах
     */
    public updateTimer(remainingSeconds: number): void {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = Math.floor(remainingSeconds % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const textElement = this.timerText as any;
        if (textElement && textElement._private_contentInternal !== undefined) {
            textElement._private_contentInternal = timeString;
            
            // Попробуем вызвать метод обновления через прототип
            const proto = Object.getPrototypeOf(textElement);
            const methods = Object.getOwnPropertyNames(proto).filter(name => 
                typeof proto[name] === 'function' && 
                (name.includes('update') || name.includes('render') || name.includes('invalidate') || name.includes('rebuild'))
            );
            
            for (const methodName of methods) {
                try {
                    textElement[methodName]();
                    break;
                } catch (e) {
                    // Игнорируем ошибки
                }
            }
        }
    }
    
    /**
     * Получает текущий счет наших голов.
     */
    public getOurScore(): number {
        return this.ourScore;
    }

    /**
     * Обновляет счет на экране.
     * @param isOurGoal - true если гол забит в наши ворота (правое число), false если в ворота противника (левое число)
     */
    public updateScore(isOurGoal: boolean): void {
        // isOurGoal: true = мы забили (наши очки), false = противник забил (очки противника)
        if (isOurGoal) {
            this.ourScore++; // Левое число - наши очки
        } else {
            this.opponentScore++; // Правое число - очки противника
        }
        
        // Формат: левое число (наши) - правое число (противники)
        const newScoreText = `${this.opponentScore}   ${this.ourScore}`;
        
        // Обновляем через _private_contentInternal
        const textElement = this.scoreText as any;
        if (textElement && textElement._private_contentInternal !== undefined) {
            textElement._private_contentInternal = newScoreText;
            
            // Попробуем вызвать метод обновления через прототип
            const proto = Object.getPrototypeOf(textElement);
            const methods = Object.getOwnPropertyNames(proto).filter(name => 
                typeof proto[name] === 'function' && 
                (name.includes('update') || name.includes('render') || name.includes('invalidate') || name.includes('rebuild'))
            );
            
            // Вызываем все найденные методы обновления
            for (const methodName of methods) {
                try {
                    textElement[methodName]();
                    break; // Достаточно одного сработавшего метода
                } catch (e) {
                    // Игнорируем ошибки
                }
            }
            
        }
    }

    /**
     * Сбрасывает счет до 0:0.
     */
    public resetScore(): void {
        this.opponentScore = 0;
        this.ourScore = 0;
        const newScoreText = "0   0";
        
        const textElement = this.scoreText as any;
        if (textElement && textElement._private_contentInternal !== undefined) {
            textElement._private_contentInternal = newScoreText;
            
            // Попробуем вызвать встроенный метод обновления UIText
        }
    }

}

