"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encryption_1 = require("@stacks/encryption");
const config_1 = require("./config");
const api_1 = require("./api");
class Central {
    static save(key, value) {
        const { identityAddress, signature } = this.makeSignature(key);
        return api_1.saveCentral({
            identityAddress,
            key,
            value,
            signature,
        });
    }
    static get(key) {
        const { identityAddress, signature } = this.makeSignature(key);
        return api_1.fetchCentral(key, identityAddress, signature);
    }
    static makeSignature(key) {
        const { userSession } = config_1.getConfig();
        const { appPrivateKey, identityAddress } = userSession.loadUserData();
        const message = `${identityAddress}-${key}`;
        const { signature } = encryption_1.signECDSA(appPrivateKey, message);
        return {
            identityAddress, signature,
        };
    }
}
exports.default = Central;
