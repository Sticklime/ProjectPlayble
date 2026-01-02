import { Scene, WebGLRenderer } from "three";

export namespace GraphicsHandler {
  class GraphicsHandler {
    public get renderer(): WebGLRenderer {
      //@ts-ignore
      return App.World.Renderer;
    }

    public get scene(): Scene {
      //@ts-ignore
      return App.World.Scene;
    }
  }

  export const instance: GraphicsHandler = new GraphicsHandler();
}
