import EventHandler from "EventHandler";
import * as THREE from "three";

export namespace GestureHandler {
  export enum IEvent {
    START = "GestureHandlerEvent:START",
    MOVE = "GestureHandlerEvent:MOVE",
    END = "GestureHandlerEvent:END",
  }

  export type IStep = {
    position: THREE.Vector2;
    timestamp: number;
  };

  export type IGesture = {
    UUID: string;
    history: IStep[];
    startPosition: THREE.Vector2;
    position: THREE.Vector2;
    startDelta: THREE.Vector2;
    delta: THREE.Vector2;
  };

  class GestureHandler extends EventHandler {
    private gestures: Map<string, IGesture> = new Map();

    public constructor() {
      super();
      this.setupEventListeners();
    }

    private setupEventListeners(): void {
      window.addEventListener("pointerdown", this.onPointerDown.bind(this));
      window.addEventListener("pointermove", this.onPointerMove.bind(this));
      window.addEventListener("pointerup", this.onPointerUp.bind(this));
      window.addEventListener("pointercancel", this.onPointerUp.bind(this));
    }

    private onPointerDown(event: PointerEvent): void {
      const position = this.normalizePosition(event);
      const uuid = THREE.MathUtils.generateUUID();

      const gesture: IGesture = {
        UUID: uuid,
        history: [
          {
            position: position.clone(),
            timestamp: performance.now(),
          },
        ],
        startPosition: position.clone(),
        position: position.clone(),
        startDelta: new THREE.Vector2(),
        delta: new THREE.Vector2(),
      };

      this.gestures.set(uuid, gesture);
      this.emit(IEvent.START, this.cloneGesture(gesture));
    }

    private onPointerMove(event: PointerEvent): void {
      const position = this.normalizePosition(event);
      const gesture = this.findClosestGesture(position);

      if (gesture) {
        gesture.history.push({
          position: position.clone(),
          timestamp: performance.now(),
        });

        gesture.delta.subVectors(position, gesture.position);
        gesture.startDelta.subVectors(position, gesture.startPosition);
        gesture.position.copy(position);

        this.emit(IEvent.MOVE, this.cloneGesture(gesture));
      }
    }

    private onPointerUp(event: PointerEvent): void {
      const position = this.normalizePosition(event);
      const gesture = this.findClosestGesture(position);

      if (gesture) {
        gesture.history.push({
          position: position.clone(),
          timestamp: performance.now(),
        });

        gesture.delta.subVectors(position, gesture.position);
        gesture.startDelta.subVectors(position, gesture.startPosition);
        gesture.position.copy(position);

        this.emit(IEvent.END, this.cloneGesture(gesture));
        this.gestures.delete(gesture.UUID);
      }
    }

    private findClosestGesture(position: THREE.Vector2): IGesture | null {
      if (this.gestures.size === 0) {
        return null;
      }
      if (this.gestures.size === 1) {
        return this.gestures.values().next().value || null;
      }

      let closestGesture: IGesture | null = null;
      let minDistance = Infinity;

      for (const gesture of this.gestures.values()) {
        const distance = gesture.position.distanceToSquared(position);
        if (distance < minDistance) {
          minDistance = distance;
          closestGesture = gesture;
        }
      }

      return closestGesture;
    }

    private normalizePosition(event: PointerEvent): THREE.Vector2 {
      const pointer = new THREE.Vector2(
        (event.pageX / window.innerWidth) * 2 - 1,
        -(event.pageY / window.innerHeight) * 2 + 1,
      );

      if (window.innerWidth < window.innerHeight) {
        pointer.y *= window.innerHeight / window.innerWidth;
      } else {
        pointer.x *= window.innerWidth / window.innerHeight;
      }

      return pointer;
    }

    private cloneGesture(gesture: IGesture): IGesture {
      return {
        UUID: gesture.UUID,
        history: gesture.history.map((p) => ({
          position: p.position.clone(),
          timestamp: p.timestamp,
        })),
        startPosition: gesture.startPosition.clone(),
        position: gesture.position.clone(),
        startDelta: gesture.startDelta.clone(),
        delta: gesture.delta.clone(),
      };
    }
  }

  export const instance: GestureHandler = new GestureHandler();
}
