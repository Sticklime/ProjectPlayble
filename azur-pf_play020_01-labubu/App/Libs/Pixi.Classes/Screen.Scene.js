Class.Mixin(Screen, {

	initialize() {

	},

	buildScene(scene_object) {

		this['BackgroundContainer'].children = [];

		if (scene_object["background"]) this.buildChild('BackgroundContainer', _.extend({}, scene_object["background"], {"type": "sprite"}));

		this['MainContainer'].children = [];

		this.buildSceneElements('MainContainer', scene_object["elements"]);

	},

	showScene(scene_object) {

		this.state = `${scene_object.name} showed`;

		this.animate(scene_object["animations"]["show"]);

	},

	buildSceneElements(parent, elements) {

		_.each(elements, params => {

			params = _.extend({}, params);

			if (!params["type"]) params["type"] = "sprite";
			if (!params["name"]) params["name"] = params.image.split('.')[0];

			let child = this.buildChild(parent, params);

			if (params.childs) this.buildSceneElements(child, params.childs);

		});

	}

});