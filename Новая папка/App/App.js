import MRAID from "Mraid";
import Game from "Game";
import Loader from "Loader";

let App = new Game({
	World: {
		size: [1024, 1024], //Fixed Three canvas size used in Pixi+Three projects
		antialias: true,
		// Нужно ли ограничить FPS в некотором диапазоне (от 16 до 50 мс - это 60...20 fps), чтобы не возникало артефактов из-за слишком низкого или слишклм высокого App.timeOffset
		clampTimeOffset: false,
		alpha: true,
		events: true,
		camera: {
			type: "PerspectiveCamera",
			params: {near: 0.1, far: 5000, position: [50, 50, 50], fov: 45}
			// type: 'OrthographicCamera',
			// params: {near: 0.1, far: 5000, position: [50, 50, 50], top: 50, bottom: -50}
		},
		threeGUI: {
			sizeLandscape: [1920, 1080],
			sizePortrait: [1080, 1920]
		}
		// ,controls: {
		// 	type: 'OrbitControls',
		// 	params: {rotateSpeed: 0.15, enableZoom: true, enableDamping: true, dampingFactor: 0.1, enablePan: true, minOperatingState: 15}
		// }
	},

	prepare() {

		if (Settings["debug-events"] !== "none") {

		Broadcast.enableDebug({
			excludeEvents: ["Game Update", "Document Move", "Stage Press Move", "Assets Preload Progress", "Update Load Progress Hook",
				"Stage Press Down", "Document Press Down", "Interaction", "Stage Press Up", "Document Press Up", "Global Press End",
				"Server Data Received", "Document Wheel", "% Down", "% Up", "% Press", "% build", "% build child", "% update"],
			showEventArgs: false,
			logFunc: (Settings["debug-events"] === "custom") ?
				(action, name, count, color) => MRAID.log(`Broadcast - ${action} - ${name} (${count} listen)`) :
				(action, name, count, color) => console.log(`%c↑↑↑ Broadcast - ${action} - ${name} (${count} listen)`, `color: ${color}`)
		});

	}

	  // Здесь можно написать код, который выполнится перед загрузкой ассетов

	  MraidSDK.on("Start Game", () => {
		  this.startGame();
	  });
  },

	ready() {

		App.layers = [];

	},

	startGame() {

		this.injectRenderer();

		this.buildScreens();

		this.resize();

		this.startTicker();

		Loader.hideLoadProgress();

		if (Settings["video"] && App["Video"]) {

			App["Video"].show();

		} else {

			if (Settings["cta-only"] === true) {
				// В случае, если MraidSDK подключен и cta-only включено, MraidSDK покажет конечный экран самостоятельно (или родной или конечный экран из дашборда)
				if (window.MraidSDK?.isLocal) App.CallToAction.show();
			} else {
				App.Gameplay.show();
			}

			if (Settings["top-banner"] && App["TopBanner"]) App["TopBanner"].show();
			if (Settings["bottom-banner"] && App["BottomBanner"]) App["BottomBanner"].show();

		}

	}

});

// Это нужно для наблюдения за состоянием игры через консоль браузера
window.App = App;

export default App;
