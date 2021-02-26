"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keys_1 = require("blockstack/lib/keys");
const model_1 = require("../model");
const helpers_1 = require("../helpers");
class SigningKey extends model_1.default {
    constructor() {
        super(...arguments);
        this.encryptionPrivateKey = () => helpers_1.loadUserData().appPrivateKey;
    }
    static async create(attrs = {}) {
        const privateKey = keys_1.makeECPrivateKey();
        const publicKey = keys_1.getPublicKeyFromPrivate(privateKey);
        const signingKey = new SigningKey({
            ...attrs,
            publicKey,
            privateKey,
        });
        await signingKey.save.apply(signingKey);
        return signingKey;
    }
}
exports.default = SigningKey;
SigningKey.className = 'SigningKey';
SigningKey.schema = {
    publicKey: {
        type: String,
        decrypted: true,
    },
    privateKey: String,
    userGroupId: {
        type: String,
        decrypted: true,
    },
};
SigningKey.defaults = {
    updatable: false,
};
