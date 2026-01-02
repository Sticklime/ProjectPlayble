import MRAID from "Libs/Pixi.Classes/Mraid";

export interface LocalizatorTextStyle {
  color: string;

  fontFamily: string;
  fontSize: number;
  fontStyle: "normal" | "italic" | "oblique";
  fontWeight: "normal" | "bold" | "bolder" | "lighter" | number;
  lineHeight: number;

  enableShadow: boolean;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  shadowColor: string;

  enableStroke: boolean;
  strokeColor: string;
  strokeWidth: number;
}

export class Localizator {
  public static readLaymurMessage(key: string): {
    text: string;
    style: Partial<LocalizatorTextStyle>;
  } {
    const locale = MraidSDK.getLocale();
    const message =
      Settings.Localization[locale]?.[key] ??
      Settings.Localization["en"]?.[key];

    if (message && "text" in message && typeof message["text"] === "string") {
      MRAID.processDynamicProperties(message);

      const style: Partial<LocalizatorTextStyle> = {};
      style.color = (message["color"] ?? message["fill"]) as string | undefined;
      style.fontFamily = message["fontFamily"] as string | undefined;
      style.fontSize = message["fontSize"] as number | undefined;
      style.fontStyle = message["fontStyle"] as
        | "normal"
        | "italic"
        | "oblique"
        | undefined;
      style.fontWeight = message["fontWeight"] as
        | "normal"
        | "bold"
        | "bolder"
        | "lighter"
        | number
        | undefined;
      style.lineHeight = message["lineHeight"] as number | undefined;

      style.enableShadow = (message["enableShadow"] ??
        message["dropShadow"]) as boolean | undefined;
      style.shadowOffsetX = (message["shadowOffsetX"] ??
        message["shadowDistance"] ??
        message["dropShadowDistance"]) as number | undefined;
      style.shadowOffsetY = (message["shadowOffsetY"] ??
        message["shadowDistance"] ??
        message["dropShadowDistance"]) as number | undefined;
      style.shadowBlur = (message["shadowBlur"] ??
        message["dropShadowBlur"]) as number | undefined;
      style.shadowColor = (message["shadowColor"] ??
        message["dropShadowColor"]) as string | undefined;

      style.enableStroke = message["enableStroke"] as boolean | undefined;
      style.strokeColor = message["strokeColor"] as string | undefined;
      style.strokeWidth = (message["strokeWidth"] ??
        message["strokeThickness"]) as number | undefined;

      return { text: message["text"], style };
    }

    throw new Error("Invalid message format");
  }
}
