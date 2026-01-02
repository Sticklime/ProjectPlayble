import { UIFullscreenLayer, UIMode, UIResizePolicyFixedHeight } from "laymur";

export class UIGameplayLayer extends UIFullscreenLayer {
  public static get instance(): UIGameplayLayer {
    UIGameplayLayer.instanceInternal =
      UIGameplayLayer.instanceInternal ?? new UIGameplayLayer();
    return UIGameplayLayer.instanceInternal;
  }

  private static instanceInternal?: UIGameplayLayer;

  constructor() {
    super(new UIResizePolicyFixedHeight(1080, 1920));
  }

  public hide() {
    this.mode = UIMode.HIDDEN;
  }
}
