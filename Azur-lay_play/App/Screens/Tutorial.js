import Screen from "Screen";

App.Tutorial = new Screen({
  Name: "Tutorial",

  Containers: [
    {
      name: "TutorialContainer",
      scaleStrategyLandscape: ["fit-to-screen", 1920, 1080],
      scaleStrategyPortrait: ["fit-to-screen", 1080, 1920],
      childs: [],
    },
  ],

  Hooks: {
    beforeBuild() {
      this.updateChildParamsByName(Settings[this.Name]);
    },

    build() {},

    showed() {
      if (window.MraidSDK) MraidSDK.track("Tutorial Showed", [], false);
      this.bringToTop();
    },

    resize() {},
  },

  Events: {
    "play click": function () {
      this.hideCharacter();
    },
  },

  showCharacter() {
    //Анимированно показываем тут элементы туториала
  },

  hideCharacter() {
    //Анимированно прячем тут элементы туториала
  },

  animateHide() {},
});
