import * as THREE from "three";

export namespace GraphicsHandler {
  class GraphicsHandler {
    public get renderer(): THREE.WebGLRenderer {
      //@ts-ignore
      return App.World.Renderer;
    }

    public get scene(): THREE.Scene {
      //@ts-ignore
      return App.World.Scene;
    }
  }

  export const instance: GraphicsHandler = new GraphicsHandler();
}
