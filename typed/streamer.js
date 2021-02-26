"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wolfy87_eventemitter_1 = require("wolfy87-eventemitter");
const config_1 = require("./config");
const EVENT_NAME = 'RADIKS_STREAM_MESSAGE';
class Streamer {
    static init() {
        if (this.initialized) {
            return this.socket;
        }
        const { apiServer } = config_1.getConfig();
        const protocol = document.location.protocol === 'http:' ? 'ws' : 'wss';
        const socket = new WebSocket(`${protocol}://${apiServer.replace(/^https?:\/\//, '')}/radiks/stream/`);
        this.emitter = new wolfy87_eventemitter_1.default();
        this.socket = socket;
        this.initialized = true;
        socket.onmessage = (event) => {
            this.emitter.emit(EVENT_NAME, [event]);
        };
        return socket;
    }
    static addListener(callback) {
        this.init();
        this.emitter.addListener(EVENT_NAME, callback);
    }
    static removeListener(callback) {
        this.init();
        this.emitter.removeListener(EVENT_NAME, callback);
    }
}
exports.default = Streamer;
