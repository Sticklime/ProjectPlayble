import type { Camera, Group, OrthographicCamera, Scene, WebGLRenderer } from "three";
declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const App: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Width: number;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Height: number;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    ThreeAssets: Record<string, unknown>;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    World: Partial<{
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Scene: Scene;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Camera: Camera;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Renderer: WebGLRenderer;

      // eslint-disable-next-line @typescript-eslint/naming-convention
      CameraGUI: OrthographicCamera;

      // eslint-disable-next-line @typescript-eslint/naming-convention
      ThreeGUI: Partial<{}>;
    }>;


    // eslint-disable-next-line @typescript-eslint/naming-convention
    Gameplay: {
      playSound(
        name: string,
        options?: Partial<{ volume: number; loop: boolean }>,
      ): void;

      [key: string]: unknown;
    };
  };

  interface Window {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    MraidSDK?: {
      interaction(): void;
      open(tag: string): void;
      on(
        event:
          | "Paused"
          | "Resumed"
          | "Play Sound"
          | "Stop Sound"
          | "Muted"
          | "Unmuted"
          | "Show Native End Screen"
          | "Hide Native End Screen"
          | "Start Game"
          | "Setting Changed"
          | "Asset Changed",
        callback: (...args: unknown[]) => void,
      ): void;
    };
  }
}

export {};
