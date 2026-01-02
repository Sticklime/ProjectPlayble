import Service 		from "Service";
import Request 		from "Service.Request";
import Socket		from "Service.Socket";

let Server = new Service({

	Name: "Server",

	Libraries: [Request, Socket],

	Events: {

		"Socket Connection Established": function() {

			this.sendToSocket({
				Init: {
					query: location.search.substr(1)
				}
			});

		},

		"Socket Connection Closed": function() {

		}

	},

	Actions: {

		"*": function(data, size) {

			console.info(`%c<<< SERVER DATA << ${Math.round(size / 1000)}kb <<`, 'color: #bada55', data);

			if (!this.serverDataReady) {

				clearTimeout(this.serverDataReadyTimeout);
				this.serverDataReadyTimeout = setTimeout(() => {

					// Здесь нужно проверить наличие всех первоначальных данных которые должны быть получены с сервера
					// if (User.loaded && Metadata.Characters) {
					//if (User.loaded && Metadata.loaded) {

						//if (!User.currentUser || Game.loaded) {

							this.serverDataReady = true;

							Broadcast.call("Server Data Ready");

						//}

					//}

				}, 10);

			}

		}

	},

	init() {

		this.serverDataReady = false;

	},

	connect() {

		// Подключение к серверу
		// this.connectSocket(`wss://example.com/ws`);

	}

});

//Только для наблюдения за состоянием через консоль браузера
window.Server = Server;

export default Server;
