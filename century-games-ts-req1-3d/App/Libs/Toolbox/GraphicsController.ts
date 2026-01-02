import type { Camera, Scene, WebGLRenderer } from "three";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const App: {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  World: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Scene?: Scene;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Camera?: Camera;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Renderer?: WebGLRenderer;
  };
};

export namespace GraphicsController {
  export const instance = new (class {
    public get scene(): Scene {
      if (!App.World.Scene) {
        throw new Error("Scene is not initialized");
      }
      return App.World.Scene;
    }

    public get camera(): Camera {
      if (!App.World.Camera) {
        throw new Error("Camera is not initialized");
      }
      return App.World.Camera;
    }

    public get renderer(): WebGLRenderer {
      if (!App.World.Renderer) {
        throw new Error("Renderer is not initialized");
      }
      return App.World.Renderer;
    }
  })();
}
