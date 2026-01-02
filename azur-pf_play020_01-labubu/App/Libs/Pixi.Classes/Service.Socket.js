import pako from "pako";

export const Socket = {

	Name: "Service Socket",

	init() {

		this.socketOnCloseRepeat = 5000;

	},

	connectSocket(url) {

		this.socketUrl = url;

		if (this.Socket && this.Socket.readyState !== this.Socket.CLOSED) return;

		clearTimeout(this.reconnectTimeout);

		this.Socket = new WebSocket(url);

		this.Socket.onopen = _.bind(function() {

			console.log("Socket connection established. Remote address: " + url);

			this.Connected = true;

			Broadcast.call('Socket Connection Established', [this.Socket, url]);

		}, this);

		this.Socket.onclose = _.bind(function(event) {

			if (this.socketOnCloseRepeat) {

				let timeout = this.socketOnCloseRepeat < 1000 ? 1000 : this.socketOnCloseRepeat;

				console.log("Socket connection closed. Remote address: " + url);

				this.reconnectTimeout = setTimeout(_.bind(function () {

					this.connectSocket(url);

				}, this), timeout);

			}

			this.Connected = false;

			Broadcast.call('Socket Connection Closed', [this.Socket]);

		}, this);

		this.Socket.onmessage = function(event) {

			let data = JSON.parse(event.data);
			if (!data) throw new Error('Socket server data error:', event.data);

			if (data.pako) data = JSON.parse(pako.inflate(data.pako, { to: 'string' }));

			Broadcast.call("Server Data Received", [data, event.data.length]);

			if (data.Broadcast) Broadcast.call(data.Broadcast.eventName, data.Broadcast.params || []);

		};

		this.Socket.onerror = function (error) {};

	},

	disconnectSocket(next) {

		clearTimeout(this.reconnectTimeout);

		if (this.Connected) {

			if (this.Socket) this.Socket.close();

			this.Connected = false;

			let eventKey = Date.now() + '';

			Broadcast.on('Socket Connection Closed', function () {

				Broadcast.off('Socket Connection Closed', eventKey);

				if (next) next();

			}, eventKey);

		} else {

			if (next) next();

		}

	},

	sendToSocket(object) {

		if (this.Socket && this.Connected) {

			if (_.isString(object)) {

				let o = {};

				o[object] = true;

				object = o;

			}

			if (Settings["debug-events"] === "custom") MRAID.log('>>> SEND TO SERVER >>', object, 'color: #e79122');
			else console.log('%c>>> SEND TO SERVER >>', 'color: #e79122', object);

			this.Socket.send(JSON.stringify(object));

		} else {

			console.warn("Socket not connected in .sendToSocket();", object);

		}

	},

	sendToServer(object) {

		return this.sendToSocket(object);

	},

	reconnectSocket() {

		if (this.Socket && this.Connected) {

			this.Socket.close();

		}

		Broadcast.on('Socket Connection Closed', function() {

			this.connectSocket(this.socketUrl);

			Broadcast.off('Socket Connection Closed', this);

		}, this);

	}

};

export default Socket;
