import Screen 			from 'Screen';

App.CallToAction = new Screen({

	Name: 'CallToAction',

	Containers: [
		{name: 'CTAContainer', type: 'three-ui', childs: [
			{name: 'cta-text', type: 'three-text', text: '', styles: {
				"fontFamily": "Open Sans",
				"fontSize": 65,
				"fill": "#000000",
			}},
			{name: 'cta shading', type: 'three-image', color: '#000000', transparent: true, alpha: 0.01, size: [128, 128], scaleStrategy: 'fit-to-screen', event: 'cta all'}
		]}
	],

	Hooks: {

		beforeBuild() {

			this.updateChildParamsByName(Settings[this.Name]);

		},

		build() {

		},

		showed(reason) {

			console.log(reason);
			this['cta-text'].params.text = reason;
			this['cta-text'].text = reason;
			this.bringToTop();
			App.Gameplay.hide();

		},

		resize() {


		}

	},

	Events: {

		'cta up': function(container, e) {

			if (window.MraidSDK) MraidSDK.open('end screen button');
			else alert('Click Out: end screen button');

		},

		'cta all up': function(container, e) {

			if (window.MraidSDK) MraidSDK.open('end screen all');
			else alert('Click Out: end screen all');

		},

		'try again click': function() {

			// Сообщаем в MraidSDK что хотим сделать перезапуск
			// MraidSDK проверит настройки связанные с возможностью перезапуска (Settings["try-again"] и Settings["cta-only"]) и вызовет событие Start Replay, если можно
			// Самому проверить можно ли делать возврат в игру можно через метод MraidSDK.isReplayAvailable()
			if (window.MraidSDK) MraidSDK.processReplay();

		},

		// Это событие может вызвать MraidSDK, если нужно будет произвести возврат в игру
		'global:Start Replay': function() {

			App.CallToAction.hide();

			App.Gameplay.restoreGame();

		}

	},

	animateHide() {

		this.hide();

	}

});