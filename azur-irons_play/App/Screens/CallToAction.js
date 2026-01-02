import Screen from "Screen";
import Broadcast from "Broadcast";

App.CallToAction = new Screen({
  Name: "CallToAction",

  Containers: [
    {
      name: "DownloadContainer",
      positionLandscape: [-0.99, -0.99],
      positionPortrait: [-0.99, -0.99],
      LTRBLandscape: "BL",
      LTRBPortrait: "BL",
      stickinessLandscape: [0.99, 0.99],
      stickinessPortrait: [0.99, 0.99],
      childs: [
        {
          name: "T_Download_Button",
          type: "three-image",
          image: "T_Download_Button",
          position: [200, 100],
          event: true,
        },
      ],
    },
  ],

  Hooks: {
    beforeBuild() {
      this.updateChildParamsByName(Settings[this.Name]);
    },

    build() {

    },

    showed(reason) {
      this.bringToTop();
      App.Gameplay.hide();
    },

    resize() {},
  },

  Events: {
    "cta up": function (container, e) {
      if (window.MraidSDK) MraidSDK.open("end screen button");
      else alert("Click Out: end screen button");
    },

    "cta all up": function (container, e) {
      if (window.MraidSDK) MraidSDK.open("end screen all");
      else alert("Click Out: end screen all");
    },

    "T_Download_Button click": function () {
      alert("Event: click");
      console.log("Click Out: end screen button");
      if (window.MraidSDK) MraidSDK.open("download button");
    },

    "download_button_click": function (container, e) {
      alert("Event: download_button_click");
      if (window.MraidSDK) MraidSDK.open("download button");
    },

    "try again click": function () {
      // Сообщаем в MraidSDK что хотим сделать перезапуск
      // MraidSDK проверит настройки связанные с возможностью перезапуска (Settings["try-again"] и Settings["cta-only"]) и вызовет событие Start Replay, если можно
      // Самому проверить можно ли делать возврат в игру можно через метод MraidSDK.isReplayAvailable()
      if (window.MraidSDK) MraidSDK.processReplay();
    },

    // Это событие может вызвать MraidSDK, если нужно будет произвести возврат в игру
    "global:Start Replay": function () {
      App.CallToAction.hide();
      App.Gameplay.restoreGame();
    },
  },

  animateHide() {
    this.hide();
  },
});
