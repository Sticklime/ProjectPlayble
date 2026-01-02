import Screen from "Screen";

/*
 * Здесь находится старый упраздненный формат общих конечных карточек сделанных на HTML
 * Их можно было включать в любом проекте.
 * */

App.EndCard = new Screen({
  Name: "EndCard",

  Containers: [
    {
      name: "MainContainer",
      type: "dom-container",
      scaleStrategy: ["fit-to-screen", 1080, 1920],
      position: [0, 0],
      styles: { width: "0px", height: "0px", zIndex: "auto" },
      childs: [
        [
          "div",
          "content-holder-bg",
          {
            styles: {
              display: "flex",
              justifyContent: "center",
              position: "absolute",
              pointerEvents: "none",
            },
            scale: { width: "100vw", height: "100vh" },
          },
          [
            [
              "img",
              "light-0",
              {
                styles: { position: "absolute" },
                scale: { height: 594 * 4 },
              },
            ],
            [
              "img",
              "light-1",
              {
                styles: { position: "absolute" },
                scale: { height: 594 * 4 },
              },
            ],
          ],
        ],
        [
          "div",
          "content-holder",
          {
            styles: {
              display: "flex",
              justifyContent: "center",
              position: "absolute",
              fontFamily: "Arial",
              overflow: "hidden",
              WebkitOverflowScrolling: "touch",
            },
            scale: {
              background: "rgba(0, 0, 0, 0.5)",
              width: "100vw",
              height: "100vh",
            },
            event: "cta all",
          },
          [
            [
              "img",
              "logo",
              {
                styles: { position: "absolute" },
                scale: { height: 350 },
              },
            ],
            [
              "div",
              "comments-container",
              {
                styles: {
                  position: "absolute",
                  color: "#ffffff",
                  overflow: "hidden",
                },
                scale: {},
              },
              [
                [
                  "div",
                  "comments-header",
                  {
                    styles: {
                      position: "absolute",
                      textAlign: "center",
                      width: "100%",
                    },
                    scale: {},
                  },
                ],
                [
                  "div",
                  "comment-name",
                  {
                    styles: { position: "absolute" },
                    scale: {},
                  },
                ],
                [
                  "div",
                  "comment-text",
                  {
                    styles: { position: "absolute" },
                    scale: {},
                  },
                ],
              ],
            ],
            [
              "div",
              "",
              {
                styles: {
                  display: "flex",
                  width: "100%",
                  flexDirection: "column",
                  alignSelf: "center",
                },
                scale: { height: 400 },
              },
              [
                [
                  "div",
                  "cta-text-0",
                  {
                    styles: { fill: "#ffffff" },
                    scale: { fontSize: 30 },
                    noWarnings: true,
                  },
                  "NICE GAME",
                ],
                [
                  "div",
                  "cta-text-1",
                  {
                    styles: {},
                    scale: {},
                    noWarnings: true,
                  },
                  "#1 Free Game on the App Store",
                ],
                [
                  "div",
                  "",
                  {
                    styles: {
                      display: "flex",
                      width: "100%",
                      justifyContent: "center",
                    },
                    scale: { marginTop: 50 },
                  },
                  [
                    [
                      "div",
                      "end-card-download-button",
                      {
                        styles: {},
                        scale: { fontSize: 30 },
                        button: "cta",
                        noWarnings: true,
                      },
                      "DOWNLOAD",
                    ],
                  ],
                ],
                [
                  "div",
                  "cta-text-2",
                  {
                    styles: { position: "absolute" },
                    scale: {},
                    noWarnings: true,
                  },
                  "OR",
                ],
                [
                  "div",
                  "",
                  {
                    styles: {
                      position: "absolute",
                      display: "flex",
                      width: "100%",
                      justifyContent: "center",
                    },
                    scale: { marginTop: 600 },
                  },
                  [
                    [
                      "div",
                      "retry-button",
                      {
                        styles: { fill: "#ffffff" },
                        scale: { fontSize: 30 },
                        event: "try again",
                        noWarnings: true,
                      },
                      "RETRY",
                    ],
                  ],
                ],
              ],
            ],
          ],
        ],
      ],
    },
  ],

  Hooks: {
    beforeBuild() {
      this.updateChildParamsByName(Settings[this.Name]);

      this.defaultSettings = {
        "content-holder-bg": {
          styles: {
            display: "flex",
            justifyContent: "center",
            position: "absolute",
            pointerEvents: "none",
          },
          scale: { width: "100vw", height: "100vh" },
        },
        "light-0": {
          styles: { position: "absolute" },
          scale: { height: 594 * 4 },
        },
        "light-1": {
          styles: { position: "absolute" },
          scale: { height: 594 * 4 },
        },
        "content-holder": {
          styles: {
            display: "flex",
            justifyContent: "center",
            position: "absolute",
            fontFamily: "Arial",
            overflow: "hidden",
            WebkitOverflowScrolling: "touch",
          },
          scale: {
            background: "rgba(0, 0, 0, 0.5)",
            width: "100vw",
            height: "100vh",
          },
        },
        logo: {
          styles: { position: "absolute" },
          scale: { height: 350, marginTop: 300 },
        },
        "comments-container": {
          styles: {
            position: "absolute",
            color: "#ffffff",
            overflow: "hidden",
          },
          scale: {},
        },
        "comments-header": {
          styles: { position: "absolute", textAlign: "center", width: "100%" },
          scale: {},
        },
        "comment-name": {
          styles: { position: "absolute" },
          scale: {},
        },
        "comment-text": {
          styles: { position: "absolute" },
          scale: {},
        },
        "cta-text-0": {
          styles: {},
          scale: {},
        },
        "cta-text-1": {
          styles: {},
          scale: {},
        },
        "end-card-download-button": {
          styles: {},
          scale: {},
        },
        "cta-text-2": {
          styles: { position: "absolute", width: "100%", display: "inline" },
          scale: {},
        },
        "retry-button": {
          styles: {},
          scale: {},
        },
      };
    },

    build() {
      this.init();
    },

    showed(options = {}) {
      this.hideBanners();

      this.init();
    },

    update() {
      const display = MRAID.isRetryAvailable() ? "" : "none";

      if (this["MainContainer"].els["retry-button"].style.display !== display)
        this["MainContainer"].els["retry-button"].style.display = display;
      if (this["MainContainer"].els["cta-text-2"].style.display !== display)
        this["MainContainer"].els["cta-text-2"].style.display = display;
    },

    resize() {
      // this['MainContainer'].els['light-0'].style.marginLeft = (App.Width / 2 - parseInt(this['MainContainer'].els['light-0'].style.width) / 2).toString() + 'px';
      this["MainContainer"].els["light-0"].style.marginTop =
        (
          App.Height / App.PixelRatio / 2 -
          parseInt(this["MainContainer"].els["light-0"].style.height) / 2
        ).toString() + "px";
      this["MainContainer"].els["light-1"].style.marginTop =
        (
          App.Height / App.PixelRatio / 2 -
          parseInt(this["MainContainer"].els["light-1"].style.height) / 2
        ).toString() + "px";
      this["MainContainer"].els["logo"].style.marginTop =
        (
          App.Height / App.PixelRatio / 3.5 -
          parseInt(this["MainContainer"].els["logo"].style.height) / 2
        ).toString() + "px";
    },
  },

  Events: {
    "try again down": function (e) {
      e.stopPropagation();

      this.retryClickHandler();

      Broadcast.call("CallToAction try again click", [], this);
    },

    "cta click": function (e) {
      e.stopPropagation();

      Broadcast.call("CallToAction cta click", [], this);
    },

    "cta all click": function (e) {
      e.stopPropagation();

      Broadcast.call("CallToAction cta click", [], this);
    },

    "global:Setting Changed": function (setting) {
      if (!setting.match(/^end-card.*$/)) return;

      const toIntProperties = [
        "fontSize",
        "width",
        "height",
        "borderRadius",
        "lineHeight",
        "marginTop",
        "marginLeft",
        "marginBottom",
        "marginRight",
        "left",
        "right",
        "top",
        "bottom",
      ];

      if (typeof Settings[setting] === "object") {
        for (let key in Settings[setting]) {
          if (!Settings[setting].hasOwnProperty(key)) continue;

          if (toIntProperties.indexOf(key) >= 0) {
            const value = +Settings[setting][key];

            Settings[setting][key] = Number.isNaN(value)
              ? Settings[setting][key]
              : value;
          }
        }
      }

      if (App.EndCard.showed) {
        if (Settings["end-card"]) this.show();
        else {
          this.hide();

          if (App.CallToAction && App.CallToAction["BackgroundContainer"])
            App.CallToAction["BackgroundContainer"].visible = true;
          if (App.CallToAction && App.CallToAction["MainContainer"])
            App.CallToAction["MainContainer"].visible = true;

          App.CallToAction.show();
        }
      }
    },
  },

  resetElementStyles(name) {
    if (!this["MainContainer"].els[name]) return;

    if (Array.isArray(this["MainContainer"].els[name])) {
      for (let i = 0; i < this["MainContainer"].els[name].length; i++) {
        this["MainContainer"].els[name][i].removeAttribute("style");

        this["MainContainer"].els[name][i].params.styles = {};
        this["MainContainer"].els[name][i].params.scale = {};
      }
    } else {
      this["MainContainer"].els[name].removeAttribute("style");

      this["MainContainer"].els[name].params.styles = {};
      this["MainContainer"].els[name].params.scale = {};
    }
  },

  init() {
    if (Settings.Assets["cta-light.png"])
      this["MainContainer"].els["light-0"].src =
        Settings.Assets["cta-light.png"].url;
    if (Settings.Assets["cta-light.png"])
      this["MainContainer"].els["light-1"].src =
        Settings.Assets["cta-light.png"].url;
    if (Settings.Assets["logotype"])
      this["MainContainer"].els["logo"].src = Settings.Assets["logotype"].url;
    this["MainContainer"].els["light-0"].style.marginTop =
      (
        App.Height / App.PixelRatio / 2 -
        parseInt(this["MainContainer"].els["light-0"].style.height) / 2
      ).toString() + "px";
    this["MainContainer"].els["light-1"].style.marginTop =
      (
        App.Height / App.PixelRatio / 2 -
        parseInt(this["MainContainer"].els["light-1"].style.height) / 2
      ).toString() + "px";
    this["MainContainer"].els["logo"].style.marginTop =
      (
        App.Height / App.PixelRatio / 3.5 -
        parseInt(this["MainContainer"].els["logo"].style.height) / 2
      ).toString() + "px";

    this["MainContainer"].els["retry-button"].style.display = "";

    this.updateSettings();
  },

  updateSettings() {
    if (!this["MainContainer"] && !this.buildDOMContainer)
      throw new Error("To use Cta you should inject Screen.Dom.js");

    Object.keys(this.defaultSettings).forEach((name) => {
      //this.resetElementStyles(name);

      if (Array.isArray(this["MainContainer"].els[name])) {
        for (let i = 0; i < this["MainContainer"].els[name].length; i++) {
          _.extend(
            this["MainContainer"].els[name][i].params.styles,
            this.defaultSettings[name].styles,
          );
          _.extend(
            this["MainContainer"].els[name][i].params.scale,
            this.defaultSettings[name].scale,
          );
          _.extend(
            this["MainContainer"].els[name][i].style,
            this.defaultSettings[name].styles,
          );
        }
      } else {
        _.extend(
          this["MainContainer"].els[name].params.styles,
          this.defaultSettings[name].styles,
        );
        _.extend(
          this["MainContainer"].els[name].params.scale,
          this.defaultSettings[name].scale,
        );
        _.extend(
          this["MainContainer"].els[name].style,
          this.defaultSettings[name].styles,
        );
      }
    });

    this.toggleCTAButtonAnim(Settings["end-card-main-button-animation"]);
    this.toggleCTABgAnim(Settings["end-card-bg-lights-animation"]);

    _.extend(
      this["MainContainer"].els["cta-text-0"].params.scale,
      Settings["end-card-text-0-styles"],
    );
    _.extend(
      this["MainContainer"].els["cta-text-1"].params.scale,
      Settings["end-card-text-1-styles"],
    );
    _.extend(
      this["MainContainer"].els["cta-text-2"].params.scale,
      Settings["end-card-text-2-styles"],
    );
    _.extend(
      this["MainContainer"].els["end-card-download-button"].params.scale,
      Settings["end-card-main-button-styles"],
    );
    _.extend(
      this["MainContainer"].els["retry-button"].params.scale,
      Settings["end-card-try-again-button-styles"],
    );
    _.extend(
      this["MainContainer"].els["light-0"].params.scale,
      Settings["end-card-bg-lights-styles"],
    );
    _.extend(
      this["MainContainer"].els["light-1"].params.scale,
      Settings["end-card-bg-lights-styles"],
    );
    _.extend(
      this["MainContainer"].els["logo"].params.scale,
      Settings["end-card-logo-styles"],
    );
    _.extend(
      this["MainContainer"].els["comments-container"].params.scale,
      Settings["end-card-comment-styles"],
    );
    _.extend(
      this["MainContainer"].els["comments-header"].params.scale,
      Settings["end-card-comment-header-styles"],
    );
    _.extend(
      this["MainContainer"].els["comment-name"].params.scale,
      Settings["end-card-comment-name-styles"],
    );
    _.extend(
      this["MainContainer"].els["comment-text"].params.scale,
      Settings["end-card-comment-text-styles"],
    );

    if (this.commentTimeout) this.commentTimeout.kill();
    if (
      Settings[`end-card-comment-styles`] &&
      Settings[`end-card-comment-styles`].display !== "none"
    )
      this.startCommentAnim();

    this.resizeDOM();
  },

  toggleCTAButtonAnim(state) {
    if (this.CTAButtonAnimStyle && this.CTAButtonAnimStyle.parentNode)
      this.CTAButtonAnimStyle.parentNode.removeChild(this.CTAButtonAnimStyle);

    if (state) {
      const style = (this.CTAButtonAnimStyle = document.createElement("style"));
      style.innerHTML = `
                .end-card-download-button {
                    animation: endcardanim 0.4s alternate infinite ease-in-out;
                }
                @keyframes endcardanim {
                    0%   {transform: scale(1.07);}
                    100% {transform: scale(1);}
                }
            `;
      document.head.appendChild(style);
    }
  },

  toggleCTABgAnim(state) {
    if (this.CTABgAnimStyle && this.CTABgAnimStyle.parentNode)
      this.CTABgAnimStyle.parentNode.removeChild(this.CTABgAnimStyle);

    if (state) {
      const style = (this.CTABgAnimStyle = document.createElement("style"));
      style.innerHTML = `
                .light-0 {
                    -webkit-animation: spin 10s linear infinite;
                    -moz-animation: spin 10s linear infinite;
                    animation: spin 10s linear infinite;
                }
                .light-1 {
                    -webkit-animation: spinback 10s linear infinite;
                    -moz-animation: spinback 10s linear infinite;
                    animation: spinback 10s linear infinite;
                }
                @-moz-keyframes spin {
                    100% { -moz-transform: rotate(360deg); }
                }
                @-webkit-keyframes spin {
                    100% { -webkit-transform: rotate(360deg); }
                }
                @keyframes spin {
                    100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); }
                }
                @-moz-keyframes spinback {
                    100% { -moz-transform: rotate(-360deg); }
                }
                @-webkit-keyframes spinback {
                    100% { -webkit-transform: rotate(-360deg); }
                }
                @keyframes spinback {
                    100% { -webkit-transform: rotate(-360deg); transform:rotate(-360deg); }
                }
            `;
      document.head.appendChild(style);
    }
  },

  setText(element, text, params = null) {
    element.innerText = text;

    if (!params) return;

    if (params.styles) {
      _.extend(element.params.styles, params.styles);
      _.extend(element.style, params.styles);
    }

    if (params.scale) this.setStyles(element, params.scale);
  },

  retryClickHandler() {
    if (MRAID.isRetryAvailable()) {
      App.EndCard.hide();

      App.Gameplay.show({ isRetry: true });
    }
  },

  startCommentAnim(id) {
    let tweenDuration = 600;

    if (this.commentTimeout) this.commentTimeout.kill;

    if (id === undefined) {
      id = 0;

      this.setText(
        this["MainContainer"].els["comment-name"],
        Settings[`end-card-comment-${id}-name`],
      );
      this.setText(
        this["MainContainer"].els["comment-text"],
        "«" + Settings[`end-card-comment-${id}-text`] + "»",
      );

      this.commentTimeout = this.timeout(() => {
        this.startCommentAnim((id + 1) % 3);
      }, Settings[`end-card-comment-duration`]);

      return;
    }

    this.commentsTweenObj = this.commentsTweenObj || { opacity: 1 };

    this.animate(
      0,
      this.commentsTweenObj,
      {
        opacity: 0,
        d: tweenDuration / 2 / 1000,
        onUpdate: () => {
          this["MainContainer"].els["comment-name"].style.opacity =
            this.commentsTweenObj.opacity;
          this["MainContainer"].els["comment-text"].style.opacity =
            this.commentsTweenObj.opacity;
        },
      },
      () => {
        this.setText(
          this["MainContainer"].els["comment-name"],
          Settings[`end-card-comment-${id}-name`],
        );
        this.setText(
          this["MainContainer"].els["comment-text"],
          "«" + Settings[`end-card-comment-${id}-text`] + "»",
        );

        this.animate(
          0,
          this.commentsTweenObj,
          {
            opacity: 1,
            d: tweenDuration / 2 / 1000,
            onUpdate: () => {
              this["MainContainer"].els["comment-name"].style.opacity =
                this.commentsTweenObj.opacity;
              this["MainContainer"].els["comment-text"].style.opacity =
                this.commentsTweenObj.opacity;
            },
          },
          () => {
            this.commentTimeout = this.timeout(() => {
              this.startCommentAnim((id + 1) % 3);
            }, Settings[`end-card-comment-duration`]);
          },
        );
      },
    );
  },

  hideBanners() {
    if (App.TopBanner && App.TopBanner.showed) App.TopBanner.hide();
    if (App.BottomBanner && App.BottomBanner.showed) App.BottomBanner.hide();
  },
});
