import Class 	from 'Class';
import Screen 	from 'Screen';

Class.mixin(Screen, {

	initialize: function() {

		this.cachedObjects = {};

	},

	addObjectsToCache(name, count, createFunc, options = {}) {

		if (this.cachedObjects[name]) throw new Error(`Cached objects with name "${name} already exists". You can remove them with "removeCachedObjects"`);

		const {
			enableFunc = this.enableCachedObject.bind(this),
			disableFunc = this.disableCachedObject.bind(this),
			removeFunc = this.removeCachedObject.bind(this)
		} = options;

		this.cachedObjects[name] = {
			objects: [],
			states: [],
			removeFunc: removeFunc
		};

		for (let i = 0; i < count; i++) {

			const element = createFunc(i);

			if (!element) throw new Error(`"createFunc" should return something`);

			if (element.cacheInfo) throw new Error(`Property "cacheInfo" already used`);

			element.cacheInfo = {
				id: i,
				name: name,
				enableFunc,
				disableFunc
			};

			this.cachedObjects[name].objects.push(element);

			this.freeCachedObject(name, i);

		}

	},

	getCachedObject(name) {

		if (!this.cachedObjects[name]) throw new Error(`Cached objects with name "${name} not found"`);

		let i = 0;

		while(this.cachedObjects[name].objects[i]) {

			if (!this.cachedObjects[name].states[i]) {

				this.cachedObjects[name].states[i] = true;

				this.cachedObjects[name].objects[i].cacheInfo.enableFunc(name, i);

				return this.cachedObjects[name].objects[i];

			}

			i++;

		}

		return null;

	},

	freeCachedObject(name, id) {

		if (!this.cachedObjects[name]) throw new Error(`Cached objects with name "${name} not found"`);

		this.cachedObjects[name].states[id] = false;

		this.cachedObjects[name].objects[id].cacheInfo.disableFunc(name, id);

	},

	freeCachedObjects(name) {

		if (!this.cachedObjects[name]) throw new Error(`Cached objects with name "${name} not found"`);

		for (let i = 0; i < this.cachedObjects[name].objects.length; i++) {

			this.freeCachedObject(name, i);

		}

	},

	removeCachedObjects(name) {

		if (!this.cachedObjects[name]) throw new Error(`Cached objects with name "${name} not found"`);

		for (let i = 0; i < this.cachedObjects[name].objects.length; i++) {

			this.cachedObjects[name].removeFunc(this.cachedObjects[name].objects[i]);

		}

		delete this.cachedObjects[name];

	},

	updateCachedObjects(name, callback) {

		if (!this.cachedObjects[name]) throw new Error(`Cached objects with name "${name} not found"`);

		for (let i = 0; i < this.cachedObjects[name].objects.length; i++) {

			callback(this.cachedObjects[name].objects[i], i, name);

		}

	},

	enableCachedObject(name, id) {

		if (!this.cachedObjects[name]) throw new Error(`Cached objects with name "${name} not found"`);

		this.cachedObjects[name].objects[id].visible = true;

	},

	disableCachedObject(name, id) {

		if (!this.cachedObjects[name]) throw new Error(`Cached objects with name "${name} not found"`);

		this.cachedObjects[name].objects[id].visible = false;

	},

	removeCachedObject(object) {

		// only for three js:
		object.parent.remove(object);

	}

});