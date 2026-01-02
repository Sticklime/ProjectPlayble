import { UIImage } from "laymur";
import * as THREE from "three";

declare const Broadcast: any;

export class JoystickController {
    private readonly joystickBase: UIImage;
    private readonly joystickStick: UIImage;
    private readonly stickConstraint: { h: any; v: any };
    private readonly maxRadius: number = 50;
    private readonly deadZone: number = 5;
    
    private isActive: boolean = false;
    private startTouchPos: { x: number; y: number } | null = null;
    private currentTouchPos: { x: number; y: number } | null = null;
    
    public onMove: ((direction: THREE.Vector2) => void) | null = null;
    public onEnd: (() => void) | null = null;

    private boundOnStart: (e: any) => void;
    private boundOnMove: (e: any) => void;
    private boundOnEnd: (e: any) => void;

    constructor(joystickBase: UIImage, joystickStick: UIImage, stickConstraint: { h: any; v: any }) {
        this.joystickBase = joystickBase;
        this.joystickStick = joystickStick;
        this.stickConstraint = stickConstraint;
        
        this.boundOnStart = this.handleStart.bind(this);
        this.boundOnMove = this.handleMove.bind(this);
        this.boundOnEnd = this.handleEnd.bind(this);
        
        this.setupEventListeners();
    }

    private getTouchPosition(e: any): { x: number; y: number } | null {
        if (e && e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e && e.changedTouches && e.changedTouches.length > 0) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        if (e && e.clientX !== undefined) {
            return { x: e.clientX, y: e.clientY };
        }
        return null;
    }

    private isTouchOnJoystick(screenX: number, screenY: number): boolean {
        const baseElement = this.getDOMElement(this.joystickBase);
        if (!baseElement || !baseElement.getBoundingClientRect) {
            return false;
        }
        
        const rect = baseElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const radius = Math.max(rect.width, rect.height) / 2;
        
        const distance = Math.sqrt(
            Math.pow(screenX - centerX, 2) + 
            Math.pow(screenY - centerY, 2)
        );
        
        const isInArea = distance < radius * 2;
        
        return isInArea;
    }

    private screenToLaymur(screenX: number, screenY: number): { x: number; y: number } | null {
        const layer = (this.joystickBase as any).layer;
        if (!layer) return null;
        
        const layerElement = this.getDOMElement(layer as any);
        if (!layerElement || !layerElement.getBoundingClientRect) return null;
        
        const layerRect = layerElement.getBoundingClientRect();
        const layerWidth = (layer as any).width || 1920;
        const layerHeight = (layer as any).height || 1080;
        
        const scaleX = layerWidth / layerRect.width;
        const scaleY = layerHeight / layerRect.height;
        
        const relativeX = screenX - layerRect.left;
        const relativeY = screenY - layerRect.top;
        
        return {
            x: relativeX * scaleX,
            y: relativeY * scaleY
        };
    }

    private getJoystickCenterInLaymur(): { x: number; y: number } | null {
        const baseElement = this.getDOMElement(this.joystickBase);
        const layer = (this.joystickBase as any).layer;
        if (!baseElement || !baseElement.getBoundingClientRect || !layer) {
            return null;
        }
        
        const layerElement = this.getDOMElement(layer as any);
        if (!layerElement || !layerElement.getBoundingClientRect) {
            return null;
        }
        
        const baseRect = baseElement.getBoundingClientRect();
        const layerRect = layerElement.getBoundingClientRect();
        
        const layerWidth = (layer as any).width || 1920;
        const layerHeight = (layer as any).height || 1080;
        
        const scaleX = layerWidth / layerRect.width;
        const scaleY = layerHeight / layerRect.height;
        
        const baseCenterX = baseRect.left + baseRect.width / 2 - layerRect.left;
        const baseCenterY = baseRect.top + baseRect.height / 2 - layerRect.top;
        
        return {
            x: baseCenterX * scaleX,
            y: baseCenterY * scaleY
        };
    }

    private handleStart(e: any): void {
        const touchPos = this.getTouchPosition(e);
        if (!touchPos) {
            return;
        }
        
        const isOnJoystick = this.isTouchOnJoystick(touchPos.x, touchPos.y);
        
        if (!isOnJoystick) {
            return;
        }
        
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        
        this.isActive = true;
        this.startTouchPos = touchPos;
        this.currentTouchPos = touchPos;
        
        this.updateJoystick();
    }

    private handleMove(e: any): void {
        if (!this.isActive) {
            return;
        }
        
        const touchPos = this.getTouchPosition(e);
        if (!touchPos) {
            return;
        }
        
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        
        this.currentTouchPos = touchPos;
        this.updateJoystick();
    }

    private handleEnd(e: any): void {
        if (!this.isActive) return;
        
        if (e && e.preventDefault) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        
        this.isActive = false;
        this.startTouchPos = null;
        this.currentTouchPos = null;
        
        // Reset stick position
        this.stickConstraint.h.distance = 0;
        this.stickConstraint.v.distance = 0;
        
        if (this.onEnd) {
            this.onEnd();
        }
        
        if (this.onMove) {
            this.onMove(new THREE.Vector2(0, 0));
        }
    }

    private updateJoystick(): void {
        if (!this.startTouchPos || !this.currentTouchPos) {
            return;
        }
        
        const center = this.getJoystickCenterInLaymur();
        if (!center) {
            return;
        }
        
        const currentLaymur = this.screenToLaymur(this.currentTouchPos.x, this.currentTouchPos.y);
        
        if (!currentLaymur) {
            return;
        }
        
        const deltaX = currentLaymur.x - center.x;
        const deltaY = currentLaymur.y - center.y;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        let clampedDistance = Math.min(distance, this.maxRadius);
        
        if (clampedDistance < this.deadZone) {
            clampedDistance = 0;
        }
        
        let stickX = 0;
        let stickY = 0;
        
        if (clampedDistance > 0) {
            const angle = Math.atan2(deltaY, deltaX);
            stickX = Math.cos(angle) * clampedDistance;
            stickY = Math.sin(angle) * clampedDistance;
        }
        
        this.stickConstraint.h.distance = stickX;
        this.stickConstraint.v.distance = stickY;
        
        if (this.onMove) {
            if (clampedDistance > 0) {
                const normalizedX = stickX / this.maxRadius;
                const normalizedY = -stickY / this.maxRadius;
                this.onMove(new THREE.Vector2(normalizedX, normalizedY));
            } else {
                this.onMove(new THREE.Vector2(0, 0));
            }
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

    private setupEventListeners(): void {
        document.addEventListener('touchstart', this.boundOnStart, { passive: false, capture: true });
        document.addEventListener('touchmove', this.boundOnMove, { passive: false, capture: true });
        document.addEventListener('touchend', this.boundOnEnd, { passive: false, capture: true });
        document.addEventListener('touchcancel', this.boundOnEnd, { passive: false, capture: true });
        
        document.addEventListener('mousedown', this.boundOnStart, { capture: true });
        document.addEventListener('mousemove', this.boundOnMove, { capture: true });
        document.addEventListener('mouseup', this.boundOnEnd, { capture: true });
    }

    public isInJoystickArea(screenX: number, screenY: number): boolean {
        return this.isTouchOnJoystick(screenX, screenY);
    }

    public destroy(): void {
        document.removeEventListener('touchstart', this.boundOnStart);
        document.removeEventListener('touchmove', this.boundOnMove);
        document.removeEventListener('touchend', this.boundOnEnd);
        document.removeEventListener('touchcancel', this.boundOnEnd);
        document.removeEventListener('mousedown', this.boundOnStart);
        document.removeEventListener('mousemove', this.boundOnMove);
        document.removeEventListener('mouseup', this.boundOnEnd);
        
        this.onMove = null;
        this.onEnd = null;
    }
}
