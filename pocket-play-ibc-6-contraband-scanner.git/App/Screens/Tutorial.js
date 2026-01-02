import Screen 			from 'Screen';

App.Tutorial = new Screen({

	Name: "Tutorial",

	Containers: [
		{name: 'TutorialContainer', scaleStrategyLandscape: ['fit-to-screen', 1920, 1080], scaleStrategyPortrait: ['fit-to-screen', 1080, 1920], childs: [

		]}
	],

	Hooks: {

		beforeBuild() {

			this.updateChildParamsByName(Settings[this.Name]);

		},

		build() {

		},

		showed() {

			this.bringToTop();

			this.showCharacter();

			if (window.MraidSDK) MraidSDK.track("Tutorial Showed", [], false);

		},

		resize() {

		}

	},

	Events: {

		'play click': function() {

			this.hideCharacter();

		}

	},

	showCharacter() {

		this.animate(0, 'TutorialContainer', {alpha: 1, d: 0.2});

		//Анимированно показываем тут элементы туториала

	},

	hideCharacter() {

		//Анимированно прячем тут элементы туториала

	},

	animateHide() {

		this.hideCharacter();

		this.animate(0, 'TutorialContainer', {alpha: 0, d: 0.2}, () => {

			this.hide();

		});

	}

});