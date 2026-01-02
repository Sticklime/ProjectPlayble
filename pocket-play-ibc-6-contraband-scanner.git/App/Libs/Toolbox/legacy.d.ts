import type {
  Camera,
  OrthographicCamera,
  Scene,
  Texture,
  WebGLRenderer,
} from "three";

declare global {
  const App: Partial<{
    Width: number;
    Height: number;
    Assets: Record<string, unknown>;
    ThreeAssets: Record<string, unknown>;

    World: {
      Scene: Scene;
      Camera: Camera;
      Renderer: WebGLRenderer;
      CameraGUI: OrthographicCamera;
      ThreeGUI: { [key: string]: unknown };
    };

    Gameplay: {
      [key: string]: unknown;

      playSound(
        name: string,
        options?: Partial<{ volume: number; loop: boolean }>,
      ): void;

      getThreeTexture(name: string): Texture;
    };
  }>;

  const MraidSDK: {
    isLocal: boolean;
    processSettings(): void;
    subscribers: Record<string, ((...args: any[]) => void)[]>;
    open(type: string): void;
    on(name: string, func: (...args: any[]) => void): void;
    call(name: string, params?: any[]): void;
    track(name: string): void;
    getSize(): { width: number; height: number; orientation: string };
    getLocale(): string;
    interaction(): void;
    isReplayAvailable(): boolean;
    processReplay(): void;
    showEndScreen(): void;
    hideEndScreen(): void;
    playSound(name: string): void;
    stopSound(name: string): void;
    isMuted(): boolean;
    isAutoplaySupported(): boolean;
    log(...params: any[]): void;
  };

  const Settings: {
    title: string;
    name: string;
    Localization: Record<
      string,
      Record<string, Record<string, string | boolean | number>>
    >;
    Assets: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export {};
