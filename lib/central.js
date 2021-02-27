"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encryption_1 = require("@stacks/encryption");
const config_1 = require("./config");
const api_1 = require("./api");
class Central {
    static save(key, value) {
        const { username, signature } = this.makeSignature(key);
        return api_1.saveCentral({
            username,
            key,
            value,
            signature,
        });
    }
    static get(key) {
        const { username, signature } = this.makeSignature(key);
        return api_1.fetchCentral(key, username, signature);
    }
    static makeSignature(key) {
        const { userSession } = config_1.getConfig();
        const { appPrivateKey, username } = userSession.loadUserData();
        const message = `${username}-${key}`;
        const { signature } = encryption_1.signECDSA(appPrivateKey, message);
        return {
            username, signature,
        };
    }
}
exports.default = Central;
