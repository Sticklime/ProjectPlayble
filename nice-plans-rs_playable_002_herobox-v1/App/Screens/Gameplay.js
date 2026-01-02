/*
 Это основной файл для написания кода игры. Здесь находится логика геймплея за исключением туториала
 и конечного экрана (их код должен быть написан в Tutorial.js и CallToAction.js соответственно)
*/

import { TimeController } from 'Libs/Toolbox/TimeController';
import Stats from 'three/addons/libs/stats.module.js'
import Screen from 'Screen';
import MRAID from 'Libs/Pixi.Classes/Mraid';
import { DualFovCamera, SceneTraversal, Sun } from 'three-zoo';
import { clone } from "three/examples/jsm/utils/SkeletonUtils"
import { AnimationUtils, Box3, Box3Helper, BoxHelper, EquirectangularReflectionMapping, HemisphereLight, MathUtils, Mesh, MeshBasicMaterial, PlaneGeometry, ShadowMaterial, Vector3 } from "three";
import { CharacterAnimationEvent, CharacterFabric } from 'Custom/CharacterFabric';


App.Gameplay = new Screen({

	// Имя этого экрана - оно используется как префикс для событий (менять не нужно)
	Name: 'Gameplay',


	SpeedRoullete: 11,
	MoveRoulleteActive: true,

	JaggerRoullete: 2530,
	CalibriRoullete: 2750,
	TwinkleRoullete: 2225,

	BoxOpen: false,

	CardHero: false,

	CofSize: 0.81,

	RotateHeroStart: false,
	RotateHero: false,
	RotateHeroPos: { x: 0, y: 0 },
	HeroActive: 'twinkle',
	PlayActive: false,
	TrackerCounter: 0,
	Width: innerWidth,
	Height: innerHeight,

	ButtonPlay: false,

	HandRotateActive: false,

	// Секция Containers это дерево элементов для рендеринга - здесь нужно прописать все спрайты, тексты и другие отображаемые элементы для этого экрана,
	// за исключением динамически создаваемых и уничтожаемых элементов геймплея.
	// Весь интерфейс создаётся здесь сразу, даже если не все его элементы всегда отображаются на экране
	Containers: [
		// На первом уровне должен быть один или, обычно, несколько главных контейнеров.
		// Им прописывается свойство scaleStrategy, которое управляет скейлом всего что внутри.
		// Есть 2 основных scaleStrategy: cover-screen и fit-to-screen.
		// cover-screen покрывает весь экран содержимым и обычно используется только для фоновых изображений
		// fit-to-screen вписывает всё что у него внутри в экран не давая элементам выйти за границы экрана - обычно используется для всего остального кроме фоновых изображений

		// Все свойства которые написаны здесь будут переустанавливаться спрайтам и контейнерам каждый раз
		// при изменении размеров вьюпорта поэтому не стоит здесь писать alpha: 0 с целью скрыть элемент на старте
		// лучше сделать это в событии build
		{ name: 'MainContainer', scaleStrategyLandscape: ['fit-to-screen', 1920, 1080], scaleStrategyPortrait: ['fit-to-screen', 1080, 1920], childs: [
			//{ name: 'light_directional', type: 'three-directional-light', color: '#ffffff', intensity: 3, position: [0, 100, 0] },

			{ name: 'game container', type: 'three-group', position: [0, 0, 0], rotation: [0, 0, 0], childs: [
				{ name: 'model box', type: 'three-model-glb', data: 'hero-box', scale: [0.3, 0.3, 0.3], position: [0, -10, 0]}
			]},

			//{ name: 'fx_container', type: 'three-group', position: [0, 0, 0], rotation: [0, 0, 0], childs: [] },
		]},

		// type: 'three-ui' - это контейнер (layout) для ThreeGUI, если оно подключено в Deploy.js
		//
		// Это не обычная 3D-группа и крайне желательно использовать только ОДИН такой контейнер в сцене (т.е. в Интро свой, в Геймплее свой, на СТА - свой, но не плодить их несколько штук в геймплее)
		// 'three-ui' контенер нельзя вставлять друг в друга.
		//
		// Все новые настройки позиционирования (LTRB и stickness) будут работать только на первом уровне вложенности дочерних объектов!
		// Т.е. если внутри 'three-ui' есть круппа внутри которой расположен объект с новыми параметрами позиционирования, то они просто проигнорируются.
		//
		// Описание ThreeGUI есть в самом файле App/Libs/Three/ThreeGUI.js
		//
		// Новые параметры позиционирования:
		//
		//      LTRB - указывает к какому краю должен липнуть элемент. Может принимать значения 'L', 'T', 'R', 'B', '' (а также 'LT', 'RT' и т.д. для прилипания сразу к двум краям экрана)
		//      stickiness - указывает насколько сильно будет липнуть элемент. Может быть 0..1. Если 0 - элемент будет оставаться на своём дефолтном месте, если 1 - элемент будет липнуть к соответствующим краям на 100%
		//      position, positionPortrait, positionLandscape - дефолтные позици элементы от центра экрана. Массив из двух значений [x, y].
		//                                                      Вверх по Y идут отрицательные значения, по X всё как обычно (слева минус, справа +).
		//                                                      Если значение позиции < 1, то оно становится множителем и позиция вычисляется, как @половина_экрана * значение.
		//
		//      в position можно использовать два параметра (x, y). Третий параметр работать не будет!
		//
		// x: -ВЛЕВО, +ВПРАВО   y: +ВВЕРХ, -ВНИЗ    z: +ВПЕРЁД, -НАЗАД
		//
		//              Y+
		//               |
		//        Math.PI / 2 rad
		//               |
		// X- <-- 0 rad -+---------> X+
		//               |
		//               |
		//              Y-
		{name: 'UIContainer', type: 'three-ui', childs: [
			{name: 'background roullete', type: 'three-image', image: 'background-roullete', rotation: 0},

			{name: 'text rewards', type: 'three-text', text: 'TEXT REWARDS', LTRBPortrait: 'T', stickinessPortrait: [1, 1],  positionPortrait: [0, 0.65], LTRBLandscape: 'T', stickinessLandscape: [1, 1],  positionLandscape: [0, 0.55], childs: [
				{name: 'arrow left', type: 'three-image', image: 'arrow-left', position: [-550, 0]},
				{name: 'arrow right', type: 'three-image', image: 'arrow-right', position: [550, 0]},
				{name: 'arrow up', type: 'three-image', image: 'arrow-1', position: [0, 400]},
			]},
			{name: 'text open', type: 'three-text', text: 'TEXT OPEN', LTRBPortrait: 'B', stickinessPortrait: [1, 1], positionPortrait: [0, -0.8], LTRBLandscape: 'B', stickinessLandscape: [1, 1], positionLandscape: [0, -0.8]},

			{name: 'box', type: 'three-image', image: 'box', scale: 2, position: [0, -50, 0]},

			{name: 'hand open box', childs: [
				{name: 'circle open', type: 'three-image', image: 'circle', position: [-12, 12]},

				{name: 'hand open', type: 'three-image', image: 'hand'},
			]},

			//{name: 'hero light', type: 'three-image', image: 'hero-light', opacity: 0.5},

			{name: 'hero container', childs: [
				{name: 'hero remedy', type: 'three-image', image: 'hero-remedy', position: [0, -5500]},
				{name: 'hero jagger', type: 'three-image', image: 'hero-jagger', position: [0, -4400]},
				{name: 'hero vector', type: 'three-image', image: 'hero-vector', position: [0, -3300]},
				{name: 'hero calibri', type: 'three-image', image: 'hero-calibri', position: [0, -2200]},
				{name: 'hero ani', type: 'three-image', image: 'hero-ani', position: [0, -1100]},
				{name: 'hero khan', type: 'three-image', image: 'hero-khan', position: [0, 0]},
				{name: 'hero leo', type: 'three-image', image: 'hero-leo', position: [0, 1100]},
				{name: 'hero nova', type: 'three-image', image: 'hero-nova', position: [0, 2200]},
				{name: 'hero twinkle', type: 'three-image', image: 'hero-twinkle', position: [0, 3300]},
				{name: 'hero magnus', type: 'three-image', image: 'hero-magnus', position: [0, 4400]},
			]},

			{name: 'name container', LTRBPortrait: 'LT', stickinessPortrait: [1, 1],  positionPortrait: [-0.5, 0.65], LTRBLandscape: 'R', stickinessLandscape: [1, 1],  positionLandscape: [0.45, 0.7], childs: [
				{name: 'text hero jagger', type: 'three-text', text: 'TEXT JAGGER', position: [0, 0]},
				{name: 'text hero twinkle', type: 'three-text', text: 'TEXT TWINKLE', position: [30, 0]},
				{name: 'text hero calibri', type: 'three-text', text: 'TEXT CALIBRI', position: [0, 0]},
			]},

			{name: 'name container roullete', LTRBPortrait: 'B', stickinessPortrait: [1, 1],  positionPortrait: [0, -0.65], LTRBLandscape: 'B', stickinessLandscape: [1, 1],  positionLandscape: [0, -0.55], childs: [
				{name: 'text hero jagger roullete', type: 'three-text', text: 'TEXT JAGGER', position: [0, 0]},
				{name: 'text hero twinkle roullete', type: 'three-text', text: 'TEXT TWINKLE', position: [0, 0]},
				{name: 'text hero calibri roullete', type: 'three-text', text: 'TEXT CALIBRI', position: [0, 0]},
			]},

			{name: 'type container roullete', scale: 1.2, LTRBPortrait: 'B', stickinessPortrait: [1, 1],  positionPortrait: [-0.15, -0.8], LTRBLandscape: 'B', stickinessLandscape: [1, 1],  positionLandscape: [-0.075, -0.8], childs: [
				{name: 'star roullete', type: 'three-image', image: 'star'},
				{name: 'text hero type roullete', type: 'three-text', text: 'TEXT ARHETYPE', position: [150, 30]},
				{name: 'text hero type brawler roullete', type: 'three-text', text: 'TEXT ARHETYPE BRAWLER', position: [170, -30]},
				{name: 'text hero type assault roullete', type: 'three-text', text: 'TEXT ARHETYPE ASSAULT', position: [160, -30]},
				{name: 'text hero type sniper roullete', type: 'three-text', text: 'TEXT ARHETYPE SNIPER', position: [150, -30]},
				{name: 'button play portrait', type: 'three-image', image: 'button-play', position: [50, 0]},
			]},

			{name: 'arrows tutor', type: 'three-image', image: 'arrows-tutor', LTRBPortrait: 'B', stickinessPortrait: [1, 1],  positionPortrait: [0, -0.6], LTRBLandscape: 'LB', stickinessLandscape: [1, 1],  positionLandscape: [-0.4, -0.6], childs: [
				{name: 'hand rotate', type: 'three-image', image: 'hand'}
			]},

			{name: 'type container', LTRBPortrait: 'LT', stickinessPortrait: [1, 1],  positionPortrait: [-0.8, 0.5], LTRBLandscape: 'R', stickinessLandscape: [1, 1],  positionLandscape: [0.37, 0.4], childs: [
				{name: 'star', type: 'three-image', image: 'star'},
				{name: 'text hero type', type: 'three-text', text: 'TEXT ARHETYPE', position: [150, 30]},
				{name: 'text hero type brawler', type: 'three-text', text: 'TEXT ARHETYPE BRAWLER', position: [170, -30]},
				{name: 'text hero type assault', type: 'three-text', text: 'TEXT ARHETYPE ASSAULT', position: [160, -30]},
				{name: 'text hero type sniper', type: 'three-text', text: 'TEXT ARHETYPE SNIPER', position: [150, -30]},
				{name: 'button play landscape', type: 'three-image', image: 'button-play', position: [120, -500]},
			]},

			{name: 'ability 1', LTRBPortrait: 'R', stickinessPortrait: [1, 1],  positionPortrait: [0.75, 0.6], LTRBLandscape: 'R', stickinessLandscape: [1, 1],  positionLandscape: [0.1, 0], childs: [
				{name: 'ability 1 bg', type: 'three-image', image: 'ability-icon-bg'},
				{name: 'ability 1 jagger', childs: [
					{name: 'ability 1 jagger image', type: 'three-image', image: 'ability-icon-machinegun'},
					{name: 'ability 1 jagger text', type: 'three-text', text: 'TEXT ABILITY JAGGER 1', position: [0, -125]}
				]},
				{name: 'ability 1 twinkle', childs: [
					{name: 'ability 1 twinkle image', type: 'three-image', image: 'ability-icon-assault-rifle'},
					{name: 'ability 1 twinkle text', type: 'three-text', text: 'TEXT ABILITY TWINKLE 1', position: [0, -125]}
				]},
				{name: 'ability 1 calibri', childs: [
					{name: 'ability 1 calibri image', type: 'three-image', image: 'ability-icon-gravity-lift'},
					{name: 'ability 1 calibri text', type: 'three-text', text: 'TEXT ABILITY CALIBRI 1', position: [0, -125]}
				]},
			]},
			{name: 'ability 2', LTRBPortrait: 'R', stickinessPortrait: [1, 1],  positionPortrait: [0.75, 0.3], LTRBLandscape: 'R', stickinessLandscape: [1, 1],  positionLandscape: [0.35, 0], childs: [
				{name: 'ability 2 bg', type: 'three-image', image: 'ability-icon-bg'},
				{name: 'ability 2 jagger', childs: [
					{name: 'ability 2 jagger image', type: 'three-image', image: 'ability-icon-mine-field'},
					{name: 'ability 2 jagger text', type: 'three-text', text: 'TEXT ABILITY JAGGER 2', position: [0, -125]}
				]},
				{name: 'ability 2 twinkle', childs: [
					{name: 'ability 2 twinkle image', type: 'three-image', image: 'ability-icon-cluster-grenade'},
					{name: 'ability 2 twinkle text', type: 'three-text', text: 'TEXT ABILITY TWINKLE 2', position: [0, -125]}
				]},
				{name: 'ability 2 calibri', childs: [
					{name: 'ability 2 calibri image', type: 'three-image', image: 'ability-icon-invisibility'},
					{name: 'ability 2 calibri text', type: 'three-text', text: 'TEXT ABILITY CALIBRI 2', position: [0, -125]}
				]},
			]},
			{name: 'ability 3', LTRBPortrait: 'R', stickinessPortrait: [1, 1],  positionPortrait: [0.75, 0], LTRBLandscape: 'R', stickinessLandscape: [1, 1],  positionLandscape: [0.6, 0], childs: [
				{name: 'ability 3 bg', type: 'three-image', image: 'ability-icon-bg'},
				{name: 'ability 3 jagger', childs: [
					{name: 'ability 3 jagger image', type: 'three-image', image: 'ability-icon-roling-ball'},
					{name: 'ability 3 jagger text', type: 'three-text', text: 'TEXT ABILITY JAGGER 3', position: [0, -125]}
				]},
				{name: 'ability 3 twinkle', childs: [
					{name: 'ability 3 twinkle image', type: 'three-image', image: 'ability-icon-homing-missile'},
					{name: 'ability 3 twinkle text', type: 'three-text', text: 'TEXT ABILITY TWINKLE 3', position: [0, -125]}
				]},
				{name: 'ability 3 calibri', childs: [
					{name: 'ability 3 calibri image', type: 'three-image', image: 'ability-icon-pistol'},
					{name: 'ability 3 calibri text', type: 'three-text', text: 'TEXT ABILITY CALIBRI 3', position: [0, -125]}
				]},
			]},
			{name: 'ability 4', LTRBPortrait: 'R', stickinessPortrait: [1, 1],  positionPortrait: [0.75, -0.3], LTRBLandscape: 'R', stickinessLandscape: [1, 1],  positionLandscape: [0.85, 0], childs: [
				{name: 'ability 4 bg', type: 'three-image', image: 'ability-icon-bg'},
				{name: 'ability 4 jagger', childs: [
					{name: 'ability 4 jagger image', type: 'three-image', image: 'ability-icon-wall'},
					{name: 'ability 4 jagger text', type: 'three-text', text: 'TEXT ABILITY JAGGER 4', position: [0, -125]}
				]},
				{name: 'ability 4 twinkle', childs: [
					{name: 'ability 4 twinkle image', type: 'three-image', image: 'ability-icon-sticky-mines'},
					{name: 'ability 4 twinkle text', type: 'three-text', text: 'TEXT ABILITY TWINKLE 4', position: [0, -125]}
				]},
				{name: 'ability 4 calibri', childs: [
					{name: 'ability 4 calibri image', type: 'three-image', image: 'ability-icon-sniper'},
					{name: 'ability 4 calibri text', type: 'three-text', text: 'TEXT ABILITY CALIBRI 4', position: [0, -125]}
				]},
			]},

			// {name: 'button play', type: 'three-image', image: 'button-play'},



			{name: 'logo', type: 'three-image', image: 'logotype', LTRBPortrait: 'LT', stickinessPortrait: [1, 1],  positionPortrait: [-0.6, 0.87], LTRBLandscape: 'LT', stickinessLandscape: [1, 1],  positionLandscape: [-0.75, 0.8]},
		]},
	],

	// Секция хуков - стандартных обработчив запускаемых на разных стадиях работы экрана (Screen)
	Hooks: {
		// Срабатывает перед созданием спрайтов из секции Containers
		// Здесь можно что-то динамически изменить в Containers если нужно перед их созданием
		beforeBuild() {
			this.updateChildParamsByName(Settings[this.Name]);

			App.World.Renderer.shadowMap.enabled = true
			App.World.Renderer.shadowMap.needsUpdate = true
			App.World.Renderer.shadowMap.type = THREE.PCFSoftShadowMap
		},

		// Срабатывает сразу после создания спрайтов из секции Containers
		build() {
			App.World.Camera = new DualFovCamera(55, 45, 1, 10, 250);
			App.World.Camera.rotation.set(-0.05, 0, 0);
				
			this.buildEnvironment();
			this.buildCharacters();
		},

		// Срабатывает на изменение размеров или ориентации экрана
		resize() {
      		this.resizeSceneBackground();

			let width = innerWidth
			let height = innerHeight

			App.World.Camera.position.set(0, width > height ? 24 : 20, 100)

			let cofW =  width / height
			let cofH =  height / width

			let bgRoullete = this['background roullete']

			if (cofW <= 1) {
				this['model jagger'].scale.set(20, 20, 20)
				this['model calibri'].scale.set(20, 20, 20)
				this['model twinkle'].scale.set(20, 20, 20)
			}

			if (cofW > 1) {
				let cofHero = 20 * (1.5 / Math.sqrt(cofW))

				this['model jagger'].scale.set(cofHero, cofHero, cofHero)
				this['model calibri'].scale.set(cofHero, cofHero, cofHero)
				this['model twinkle'].scale.set(cofHero, cofHero, cofHero)
			}

			if (cofW > 1.74) {
				this['arrows tutor'].position.x = this['arrows tutor'].position.x / (cofW / 1.74)
			}

			if (this.RotateHeroStart) {
				if (width > height) {
					this['button play landscape'].visible = true
					this['button play portrait'].visible = false
				}
				else {
					this['button play portrait'].visible = true
					this['button play landscape'].visible = false
				}
			}

			if (this.CardHero) {
				if (cofW > 1) {
					this[`model jagger`].position.x = -20
					this[`model calibri`].position.x = -20
					this[`model twinkle`].position.x = -20
				}
				if (cofH >= 1) {
					this[`model jagger`].position.x = 0
					this[`model calibri`].position.x = 0
					this[`model twinkle`].position.x = 0
				}
			}

			if (cofW < 1077 / 1920) {
				gsap.to(
					bgRoullete.rotation, {z: 0, duration: 0}
				)

				let cofBg = 1077 / 1920

				bgRoullete.scale.set(1, cofBg / cofW)
			}
			else if (cofH < 1920 / 1077 && cofH > 1) {
				gsap.to(
					bgRoullete.rotation, {z: 0, duration: 0}
				)

				let cofBg = 1920 / 1077

				bgRoullete.scale.set(cofBg / cofH, 1)
			}
			else {
				gsap.to(
					bgRoullete.rotation, {z: 1.57, duration: 0}
				)

				if (cofW > 1 && cofW < 1920 / 1077) {	
					let cofBgH = 1920 / 1077
	
					bgRoullete.scale.set(cofBgH * cofH, 1)
				}

				if (cofW > 1920 / 1077) {
					let cofBgW = 1077 / 1920

					bgRoullete.scale.set(1, cofBgW * cofW)
				}
			}

			let heroType = 'hero leo'

			for (let i = 1; i <= 10; i++) {
				if (i === 1) {
					heroType = 'hero leo'
				}
				if (i === 2) {
					heroType = 'hero khan'
				}
				if (i === 3) {
					heroType = 'hero vector'
				}
				if (i === 4) {
					heroType = 'hero nova'
				}
				if (i === 5) {
					heroType = 'hero ani'
				}
				if (i === 6) {
					heroType = 'hero magnus'
				}
				if (i === 7) {
					heroType = 'hero calibri'
				}
				if (i === 8) {
					heroType = 'hero jagger'
				}
				if (i === 9) {
					heroType = 'hero twinkle'
				}
				if (i === 10) {
					heroType = 'hero remedy'
				}

				if (width < height) {
					if (this[heroType].position.x != 0) {
						this[heroType].position.y = this[heroType].position.x / 0.81
						this[heroType].position.x = 0
					}
				}

				if (width > height) {
					if (this[heroType].position.y != 0) {
						this[heroType].position.x = this[heroType].position.y * 0.81
						this[heroType].position.y = 0
					}
				}
			}
		},

		// Срабатывает во время показа экрана (есть ещё и hided - срабатывает во время скрытия экрана)
		show() {
			this.updateSettings();
			this.startGame();
		},

		// Срабатывает на каждый тик / каждую перерисовку экрана
		// Тут лучше ничего не писать, так как этот код срабатывает 60 раз в секунду или больше в зависимости от системы пользователя
		// Любой код расположенный здесь будет снижать производительность
		update() {
		},

		// Срабатывает во время скрытия этого экрана
		hide() {
		}
	},

	// Секция событий - здесь прописываются события нажатия на спрайты из секции Containers, а так же глобальные события серез префикс global:
	// Для того чтобы добавить события клика на спрайт ему нужно в секции Containers прописать events: true,
	// а в этой секции написать 'имя спрайта click' и дальше написать код срабатывающий по нажатию на этот спрайт
	Events: {
		'global:Stage Press Down': function(event, position) {
			this.checkClick(event, position)

			if (this.RotateHeroStart) {
				this.RotateHeroPos = { x: position.x, y: position.y }

				//if (this.RotateHeroPos.x > this.Width * 0.15 && this.RotateHeroPos.x < this.Width * 0.85 && this.RotateHeroPos.y > this.Height * 0.1 && this.RotateHeroPos.y < this.Height * 0.8) {
					this.RotateHero = true

					this.HandRotateActive = false

					this['arrows tutor'].visible = false
				//}
			}
		},

		'global:Stage Press Up': function(event, position) {
			if (this.RotateHeroStart) {
				this.RotateHero = false

				if (!this.ButtonPlay) {
					this.buttonPlay()
				}

				this.ButtonPlay = true
			}
		},

		'global:Stage Press Move': function(event, position) {
			if (this.RotateHeroStart && this.RotateHero) {
				this.rotateHero(event, position)
				this.PlayActive = true
			}

			if (this.HeroMoveActive) {
				this.moveHeroDrag(event, position)
			}
		},

		'global:Setting Changed': function(name, value) {
			//Здесь нужно автоматически применить изменения в настройках Settings
			//Это нужно только для Dashboard чтобы не перезагружать фрейм игры

			this.updateSettings(name, value);
		}
	},

	// Здесь нужно применить заново все настройки созданные для этого проекта
	// Сменить фон в зависимости от настройки, текстуру героя и т.д.
	// Всё что зависит от настроек переделать заново
	updateSettings(name, value) {
		this.resize();
	},

	rotateHero(event, position) {
		let rotate = (this.RotateHeroPos.x - position.x) / 75

		this.RotateHeroPos = { x: position.x, y: position.y }

		this[`model ${this.HeroActive}`].rotation.y -= rotate
	},

	moveHeroDrag(event, position) {
		this.HeroMove = true

		this['hero container'].position.x = (position.x - this.HeroMoveCurrentPos.x) * 2 + this.HeroMovePos.x

		if (this['hero container'].position.x > 1035) {
			this['hero container'].position.x = 1035
		}

		if (this['hero container'].position.x < -1035) {
			this['hero container'].position.x = -1035
		}
	},

	buttonPlay() {
		if (this.Width > this.Height) {
			this['button play landscape'].visible = true
			this.opacityAni('button play landscape', 1, 1)
		}
		else {
			if (this.CardHero) {
				this['button play portrait'].visible = true
				this.opacityAni('button play portrait', 1, 1)
			}
		}
	},

	buildEnvironment(){	
		this.hemisphereLight = new HemisphereLight(0xdbc493, 0x423336, 3);
		App.World.Scene.add(this.hemisphereLight);
			
	  this.mainDirectionalLight = new Sun(0xffffff, 6);
	  App.World.Scene.add(this.mainDirectionalLight);
		this.mainDirectionalLight.position.set(0.25, 1, 1);
		
		this.mainDirectionalLight.castShadow = true;
		this.mainDirectionalLight.shadow.mapSize.width = 512;
		this.mainDirectionalLight.shadow.mapSize.height = 1024;
		this.mainDirectionalLight.shadow.bias = -0.0035;
		this.mainDirectionalLight.shadow.normalBias = 0.0035;
		
    const shadowBoxSizeX = 55;
    const shadowBoxSizeY = 40;
    const shadowBoxSizeZ = 80;
    const shadowBoxCenter = new Vector3(0, shadowBoxSizeY / 2 - 1, -shadowBoxSizeZ / 2 + 25);
    const shadowBox = new Box3().setFromCenterAndSize(
      shadowBoxCenter,
      new Vector3(shadowBoxSizeX, shadowBoxSizeY, shadowBoxSizeZ)
    );
    this.mainDirectionalLight.configureShadowsForBoundingBox(shadowBox); 
		
    this.leftDirectionalLight = new Sun(0x32c3fc, 8);
    App.World.Scene.add(this.leftDirectionalLight);
    this.leftDirectionalLight.position.set(-1, 0, -0.75);
   
    this.rightDirectionalLight = new Sun(0xfcda5f, 8);
    App.World.Scene.add(this.rightDirectionalLight);
    this.rightDirectionalLight.position.set(1, 0, -0.75);
    
    this.shadowPlane = new Mesh(
      new PlaneGeometry(shadowBoxSizeX, shadowBoxSizeZ).rotateX(-Math.PI / 2),
      new ShadowMaterial({ color: 0x000000, opacity: 0.5 })
    );
    this.shadowPlane.position.set(shadowBoxCenter.x, 0, shadowBoxCenter.z);
    App.World.Scene.add(this.shadowPlane);
    this.shadowPlane.receiveShadow = true;
	},
	
	buildCharacters() {	
  	const calibri = CharacterFabric.build({
  		asset: App.ThreeAssets["SK_Calibri"], 
  		scale: 20,
  		weaponBoneName: "R_item",
  		weaponAsset: App.ThreeAssets["SM_Weapon_Calibri_Sniper_Rifle"],
  		weaponScale: 100,
      useAOMap: true,
      normalScale: 1,
      emissiveIntensity: 5
  	});
    App.World.Scene.add(calibri.character);
  	this["model calibri"] = calibri.character;
  	this["model calibri"].machine = calibri.machine;
  
  	const jagger = CharacterFabric.build({
  		asset: App.ThreeAssets["SK_Jagger"], 
  		scale: 20,
  		weaponBoneName: "R_item",
  		weaponAsset: App.ThreeAssets["SM_Weapon_Jagger_Machinegun"],
  		weaponScale: 100,
      useAOMap: true,
      normalScale: 1,
      emissiveIntensity: 5
  	});
    App.World.Scene.add(jagger.character);
  	this["model jagger"] = jagger.character;
  	this["model jagger"].machine = jagger.machine;
  
  	const twinkle = CharacterFabric.build({
  		asset: App.ThreeAssets["SK_Twinkle"], 
  		scale: 20,
  		weaponBoneName: "R_item",
  		weaponAsset: App.ThreeAssets["SM_Weapon_Twinkle_Rifle"],
  		weaponScale: 100,
      useAOMap: true,
      normalScale: 1,
      emissiveIntensity: 5
  	});
    App.World.Scene.add(twinkle.character);
  	this["model twinkle"] = twinkle.character;
  	this["model twinkle"].machine = twinkle.machine;
	},
	
	runCharacterAnimation(name) {
	  const newCharacter = this[name];
	  if (newCharacter === this.currentCharacter) {
      return;
		}
			
	  if (this.currentCharacter) {
      TimeController.instance.off(
        TimeController.Event.TICK,
        this.currentCharacter.machine.update,
        this.currentCharacter.machine
      );
		}
			
		this.currentCharacter = newCharacter;
    this.currentCharacter.machine.handleEvent(CharacterAnimationEvent.RESET);
    this.currentCharacter.machine.update(0.016);
		TimeController.instance.on(
      TimeController.Event.TICK,
      this.currentCharacter.machine.update,
      this.currentCharacter.machine
    );
	},

	isPointOnPlane( plane, point ) {
		const box = new THREE.Box3().setFromObject(plane);
		return box.max.x > point.x && box.min.x < point.x && box.max.y > point.y && box.min.y < point.y
	},

	checkClick(event, position) {
		const pos = App.World.ThreeGUI.convertStageTouch(event)

		if (this.isPointOnPlane(this['box'], pos) && this['box'].visible) {
			this.openBoxRed()
		}

		if (this.isPointOnPlane(this['button play landscape'], pos) && this['button play landscape'].visible) {
			if (window.MraidSDK) MraidSDK.open("end screen button")
			else alert("Click Out: end screen button")
		}

		if (this.isPointOnPlane(this['button play portrait'], pos) && this['button play portrait'].visible) {
			if (window.MraidSDK) MraidSDK.open("end screen button")
			else alert("Click Out: end screen button")
		}
	},

	heroRoulette(heroWin) {
		setTimeout(() => {
			this.playSound(`lootbox-hero-open-sound`)
		}, 500)
		// this.playSound(`lootbox-hero-open-sound`)

		this['hero container'].visible = true

		this['background roullete'].visible = true

		this.opacityAni('hero khan', 1, 0.5)
		this.opacityAni('hero ani', 1, 0.5)
		this.opacityAni('hero leo', 1, 0.5)

		let time = 0

		if (heroWin === 'hero jagger') {
			time = this.JaggerRoullete
		}

		if (heroWin === 'hero calibri') {
			time = this.CalibriRoullete
		}

		if (heroWin === 'hero twinkle') {
			time = this.TwinkleRoullete
		}

		setTimeout(() => {
			for (let i = 1; i <= 10; i++) {
				setTimeout(() => {
					this.SpeedRoullete += 10
				}, i * 100)
			}

			setTimeout(() => {
				for (let i = 1; i <= 11; i++) {
					setTimeout(() => {
						if (this.SpeedRoullete !== 0) {
							this.SpeedRoullete -= 10
						}
					}, i * 150)
				}
			}, time)

			setTimeout(() => {
				this.SpeedRoullete -= 1
			}, 1000)

			const moveInterval = setInterval(() => {
				if (this.MoveRoulleteActive) {
					let heroType = ''
					for (let i = 1; i <= 10; i++) {
						if (i === 1) {
							heroType = 'hero leo'
						}
						if (i === 2) {
							heroType = 'hero khan'
						}
						if (i === 3) {
							heroType = 'hero vector'
						}
						if (i === 4) {
							heroType = 'hero nova'
						}
						if (i === 5) {
							heroType = 'hero ani'
						}
						if (i === 6) {
							heroType = 'hero magnus'
						}
						if (i === 7) {
							heroType = 'hero calibri'
						}
						if (i === 8) {
							heroType = 'hero jagger'
						}
						if (i === 9) {
							heroType = 'hero twinkle'
						}
						if (i === 10) {
							heroType = 'hero remedy'
						}

						// if (this.SpeedRoullete === 0 && this[heroWin].position.y > 0) {
						// 	console.log('a', this[heroWin].position.y)
						// 	this.SpeedRoullete = 10
						// }

						// if ((this.SpeedRoullete === 10 || this.SpeedRoullete === 20 || this.SpeedRoullete === 30 || this.SpeedRoullete === 40) && this[heroWin].position.y < 0) {
						// 	this.SpeedRoullete = 0
						// }

						// this[heroType].position.y = this[heroType].position.y - this.SpeedRoullete

						let width = innerWidth
						let height = innerHeight

						if (width < height) {
							if (this.SpeedRoullete === 0 && this[heroWin].position.y > 0) {
								console.log('a', this[heroWin].position.y)
								this.SpeedRoullete = 10
							}
	
							if ((this.SpeedRoullete === 10 || this.SpeedRoullete === 20 || this.SpeedRoullete === 30 || this.SpeedRoullete === 40) && this[heroWin].position.y < 0) {
								this.SpeedRoullete = 0
							}

							this[heroType].position.y = this[heroType].position.y - this.SpeedRoullete

							if (this[heroType].position.y <= -5500) {
								this[heroType].position.y = 5500 + (this[heroType].position.y + 5500)
								this[heroType].position.x = 0
							}
						}

						if (width > height) {
							if (this.SpeedRoullete === 0 && this[heroWin].position.x > 0) {
								this.SpeedRoullete = 10
							}
	
							if ((this.SpeedRoullete === 10 || this.SpeedRoullete === 20 || this.SpeedRoullete === 30 || this.SpeedRoullete === 40) && this[heroWin].position.x < 0) {
								this.SpeedRoullete = 0
							}

							this[heroType].position.x = this[heroType].position.x - this.SpeedRoullete * this.CofSize

							if (this[heroType].position.x <= -5500 * this.CofSize) {
								this[heroType].position.x = 5500 * this.CofSize + (this[heroType].position.x + 5500 * this.CofSize)
								this[heroType].position.y = 0
							}
						}

						if (this.SpeedRoullete <= 20 && this[heroWin].position.y > 0 && this[heroType].position.y < 40 && heroType === heroWin) {
							//this[heroType].position.y = 0
							this.SpeedRoullete = 0
						}
					}
				}
			}, 10)
		}, 500)
	},

	createNameHero(heroWin) {
		this.RotateHeroStart = true

		this.playSound(`${heroWin}-spawn-sound`)

		this.HeroActive = heroWin

		if (heroWin === 'jagger') {
			this['text hero type brawler roullete'].material.opacity = 0
			this['text hero type brawler roullete'].visible = true

			this.opacityAni('text hero type brawler roullete', 1, 1)
		}
		if (heroWin === 'calibri') {
			this['text hero type sniper roullete'].material.opacity = 0
			this['text hero type sniper roullete'].visible = true

			this.opacityAni('text hero type sniper roullete', 1, 1)
		}
		if (heroWin === 'twinkle') {
			this['text hero type assault roullete'].material.opacity = 0
			this['text hero type assault roullete'].visible = true

			this.opacityAni('text hero type assault roullete', 1, 1)
		}

		this[`text hero ${heroWin} roullete`].visible = true

		this.opacityAni(`text hero ${heroWin} roullete`, 1, 1)
		this.opacityAni('text hero type roullete', 1, 1)
		this.opacityAni('star roullete', 1, 1)

		this['type container roullete'].visible = true

		this[`model ${heroWin}`].visible = true

		//this[`model ${heroWin}`].scale.set(30, 30, 30)

		this.runCharacterAnimation(`model ${heroWin}`)

		setTimeout(() => {
			if (heroWin === 'jagger') {
				this.opacityAni('text hero type brawler roullete', 0, 1)
			}
			if (heroWin === 'calibri') {
				this.opacityAni('text hero type sniper roullete', 0, 1)
			}
			if (heroWin === 'twinkle') {
				this.opacityAni('text hero type assault roullete', 0, 1)
			}

			this.opacityAni(`text hero ${heroWin} roullete`, 0, 1)
			this.opacityAni('text hero type roullete', 0, 1)
			this.opacityAni('star roullete', 0, 1)

			this.createCardHero(heroWin)
		}, 3000)
	},

	opacityAni(type, opacity, d) {
		if (opacity !== 0) {
			this[type].material.opacity = 0
		}

		gsap.to(
			this[type].material, {opacity: opacity, duration: d}
		)
	},

	createCardHero(heroWin) {
		this.CardHero = true

		if (!this.ButtonPlay && !this.RotateHero) {
			this['arrows tutor'].visible = true
			this.opacityAni('arrows tutor', 1, 1)

			this.handRotateTutorial()
		}

		if (innerWidth > innerHeight) {
			this[`model ${heroWin}`].position.x = -20

			//this['arrows tutor'].position.x = -200
		}

		for (let i = 1; i <= 4; i++) {
			this[`ability ${i} ${heroWin}`].visible = true
			this[`ability ${i} bg`].visible = true

			this.opacityAni(`ability ${i} ${heroWin} image`, 1, 1)
			this.opacityAni(`ability ${i} ${heroWin} text`, 1, 1)
			this.opacityAni(`ability ${i} bg`, 1, 1)
		}

		if (heroWin === 'jagger') {
			this['text hero type brawler'].visible = true
			this.opacityAni('text hero type brawler', 1, 1)
		}
		if (heroWin === 'calibri') {
			this['text hero type sniper'].visible = true
			this.opacityAni('text hero type sniper', 1, 1)
		}
		if (heroWin === 'twinkle') {
			this['text hero type assault'].visible = true
			this.opacityAni('text hero type assault', 1, 1)
		}

		this[`text hero ${heroWin}`].visible = true

		this.opacityAni(`text hero ${heroWin}`, 1, 1)

		this['type container'].visible = true

		if (this.Width <= this.Height && this.ButtonPlay) {
			this['button play portrait'].visible = true
			this.opacityAni('button play portrait', 1, 1)
		}

	},

	createModelBox() {
		let modelBox = this['model box']

		// modelBox.visible = true
		// modelBox.material.visible = true

		//console.log(modelBox)

		//let mesh = modelBox.skeleton.findSlot(`LootBox_Heroes_Cap`)

		//console.log('mesh', mesh)

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer();

		renderer.toneMapping = THREE.NoToneMapping
		renderer.toneMappingExposure = 1

		const assetBox = App.ThreeAssets['hero-box']

		// console.log(assetBox.scenes[0])

		// let lockL = assetBox.scenes[0].children[1]

		// let cloneLockL = lockL.clone()

		// console.log('a', cloneLockL)

		// cloneLockL.position.set(0, 0, 0)

		// scene.add(cloneLockL)

		// modelBox.visible = false

		// lockL.scale.set(100, 100, 100)
		// lockL.position.x = 10
		// lockL.position.y = 0
		// lockL.position.z = 0
		// lockL.renderOrder = 1
		// lockL.up.y = 10
		// lockL.material.visible = true
		// lockL.position.x = 10
		// lockL.visible = true
		// lockL.material.visible = true

		// lockL.opacity = 1
		// lockL.material.opacity = 1

		//console.log(lockL)

		//console.log(assetBox.scenes[0].children[1].name)

		let mixerBox = new THREE.AnimationMixer( modelBox )

		const clock = new THREE.Clock()
			
		let materialBox = ''

		const baseColorTextureBox = this.getThreeTexture("box-d")
		const normalTextureBox = this.getThreeTexture("box-ao")
		const pbrTextureBox = this.getThreeTexture("box-eamr")
		const aoTextureBox = this.getThreeTexture("box-e")
		const gradientTextureBox = this.getThreeTexture("box-g")

		baseColorTextureBox.flipY = false
		normalTextureBox.flipY = false
		pbrTextureBox.flipY = false
		aoTextureBox.flipY = false
		//gradientTextureBox.flipY = false

		materialBox = new THREE.MeshPhongMaterial({
			map: baseColorTextureBox,
			normalMap: normalTextureBox,
			// shininess: 30,
			// reflectivity: 1.5,
			// emissiveIntensity: 2.38,
			// specular: "#111111",
			roughnessMap: pbrTextureBox,
			aoMap: aoTextureBox,
			emissiveMap: gradientTextureBox
		});

		modelBox.traverse((child) => {
			if (child.isMesh) {
				child.material = materialBox

				// child.receiveShadow = true
				// child.castShadow = true
			}
		});

		// let lockL = assetBox.scenes[0].children[1]

		// let cloneLockL = lockL.clone()

		// console.log('a', cloneLockL)

		// console.log(modelBox)
	},

	tutorialOpen() {
		let circle = this['circle open']
		let hand = this['hand open']

		setTimeout(() => {
			if (!this.BoxOpen) {
				this['hand open box'].visible = true

				gsap.timeline().to(
					circle.material, {opacity: 0, duration: 0},
				).to(
					hand.material, {opacity: 0, duration: 0},
				)
		
				gsap.to(
					hand.material, {opacity: 1, duration: 0.5},
				)
			}
		}, 1000)

		const handInterval = setInterval(() => {
			if (!this.BoxOpen) {
				gsap.to(
					hand.scale, {x: 0.8, y: 0.8, z: 0.8, duration: 0.5},
				)
	
				setTimeout(() => {
					gsap.to(
						circle.scale, {x: 0, y: 0, z: 0, duration: 0},
					)
					gsap.to(
						circle.material, {opacity: 1, duration: 0},
					)
	
					gsap.to(
						hand.scale, {x: 1, y: 1, z: 1, duration: 0.5},
					)
					gsap.to(
						circle.scale, {x: 1, y: 1, z: 1, duration: 0.7},
					)
	
					setTimeout(() => {
						gsap.to(
							circle.material, {opacity: 0, duration: 0.7},
						)
					}, 350)
				}, 500)
			}
		}, 1000)
	},

	openBoxRed() {
		this.BoxOpen = true

		this['box'].visible = false

		this['text rewards'].visible = false

		this['text open'].visible = false

		this['hand open box'].visible = false

		let random = Math.floor(Math.random() * 3) + 1

		let heroType = 'twinkle'

		if (random === 1) {
			heroType = 'jagger'
		}
		if (random === 2) {
			heroType = 'calibri'
		}
		if (random === 3) {
			heroType = 'twinkle'
		}

		this.playSound(`lootbox-drop-sound`)

		this.heroRoulette(`hero ${heroType}`)

		let time = 0

		if (heroType === 'jagger') {
			time = this.JaggerRoullete + 3500
		}

		if (heroType === 'calibri') {
			time = this.CalibriRoullete + 3500
		}

		if (heroType === 'twinkle') {
			time = this.TwinkleRoullete + 3500
		}

		setTimeout(() => {
			// this['hero container'].visible = false

			// this['background roullete'].visible = false

			this.playSound(`lootbox-open-sound`)

			this.hideHeroIcon()

			gsap.to(
				this['background roullete'].material, {opacity: 0, duration: 0.5}
			)

			setTimeout(() => {
				this.createNameHero(heroType)
			}, 500)

			//this.createNameHero(heroType)
		}, time)
	},

	hideHeroIcon() {
		let heroType = ''

		for (let i = 1; i <= 10; i++) {
			if (i === 1) {
				heroType = 'hero leo'
			}
			if (i === 2) {
				heroType = 'hero khan'
			}
			if (i === 3) {
				heroType = 'hero vector'
			}
			if (i === 4) {
				heroType = 'hero nova'
			}
			if (i === 5) {
				heroType = 'hero ani'
			}
			if (i === 6) {
				heroType = 'hero magnus'
			}
			if (i === 7) {
				heroType = 'hero calibri'
			}
			if (i === 8) {
				heroType = 'hero jagger'
			}
			if (i === 9) {
				heroType = 'hero twinkle'
			}
			if (i === 10) {
				heroType = 'hero remedy'
			}

			gsap.to(
				this[heroType].material, {opacity: 0, duration: 0.5}
			)
		}
	},

	handRotateTutorial() {
		let hand = this['hand rotate']

		hand.material.transparent = true

		hand.material.opacity = 0

		this.HandRotateActive = true

		const handIntarvel = setInterval(() => {
			if (this.HandRotateActive) {
				hand.visible = true

				gsap.to(
					hand.material, {opacity: 1, duration: 0.3},
				)

				setTimeout(() => {
					gsap.to(
						hand.scale, {x: 0.8, y: 0.8, z: 0.8, duration: 0.3},
					)

					setTimeout(() => {
						gsap.to(
							hand.position, {x: -100, duration: 0.5},
						)

						setTimeout(() => {
							gsap.to(
								hand.position, {x: 100, duration: 1},
							)

							setTimeout(() => {
								gsap.to(
									hand.material, {opacity: 0, duration: 0.3},
								)

								gsap.to(
									hand.scale, {x: 1, y: 1, z: 1, duration: 0.3},
								)

								setTimeout(() => {
									hand.position.x = 0
								}, 300)
							}, 1000)
						}, 500)
					}, 300)
				}, 300)
			}
		}, 3000)
	},

	startWay1() {
		this['box'].visible = true

		this['text rewards'].visible = true

		this['text open'].visible = true

		this.tutorialOpen()
	},


	startGame() {
		if (window.MraidSDK) MraidSDK.track('Game Starts');

		this.playSound('bg-sound')
		
		this['hand open box'].visible = false
		this['hero container'].visible = false

		setTimeout(() => {
			// this.heroRoulette('hero twinkle')
			// this.createCardHero('twinkle')
			// this.createNameHero('twinkle')
		}, 500)

		for (let i = 1; i <= 4; i++) {
			this[`ability ${i} jagger`].visible = false
			this[`ability ${i} calibri`].visible = false
			this[`ability ${i} twinkle`].visible = false
			this[`ability ${i} bg`].visible = false
		}

		this['text hero type brawler'].visible = false
		this['text hero type sniper'].visible = false
		this['text hero type assault'].visible = false

		this['text hero jagger'].visible = false
		this['text hero calibri'].visible = false
		this['text hero twinkle'].visible = false

		this['type container'].visible = false

		this['text hero type brawler roullete'].visible = false
		this['text hero type sniper roullete'].visible = false
		this['text hero type assault roullete'].visible = false

		this['text hero jagger roullete'].visible = false
		this['text hero calibri roullete'].visible = false
		this['text hero twinkle roullete'].visible = false

		this['type container roullete'].visible = false

		this['background roullete'].visible = false

		this['box'].visible = false

		this['text rewards'].visible = false

		this['text open'].visible = false

		this['button play portrait'].visible = false
		this['button play landscape'].visible = false

		this['arrows tutor'].visible = false


		this['model box'].visible = false
		//this.createModelBox()

		//this.runCharacterAnimation("model twinkle")

		this['model jagger'].visible = false
		this['model calibri'].visible = false
		this['model twinkle'].visible = false

		this.startWay1()
	},

	// Этот метод может вызваться из конечного экрана если нужно произвести возврат в игру
	restoreGame() {
	},
	
	resizeSceneBackground() {
    const texture = App.ThreeAssets["background"];

    const screenAspect = App.Width / App.Height;
    const textureAspect = texture.image.width / texture.image.height;

    const repeatY =
      screenAspect > textureAspect ? textureAspect / screenAspect : 1;
    const repeatX =
      screenAspect > textureAspect ? 1 : screenAspect / textureAspect;

    texture.repeat.set(repeatX, repeatY);
    texture.offset.set((1 - repeatX) / 2, (1 - repeatY) / 2);

    App.World.Scene.background = texture;
  },
});