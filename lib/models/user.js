"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keys_1 = require("blockstack/lib/keys");
const encryption_1 = require("@stacks/encryption");
const model_1 = require("../model");
const signing_key_1 = require("./signing-key");
const group_membership_1 = require("./group-membership");
const helpers_1 = require("../helpers");
const decrypted = true;
class BlockstackUser extends model_1.default {
    static currentUser() {
        if (typeof window === 'undefined') {
            return null;
        }
        const userData = helpers_1.loadUserData();
        if (!userData) {
            return null;
        }
        const { identityAddress, profile, appPrivateKey } = userData;
        const publicKey = keys_1.getPublicKeyFromPrivate(appPrivateKey);
        const Clazz = this;
        const user = new Clazz({
            _id: identityAddress,
            identityAddress,
            publicKey,
            profile,
        });
        return user;
    }
    async createSigningKey() {
        const key = await signing_key_1.default.create();
        this.attrs.personalSigningKeyId = key._id;
        return key;
    }
    static createWithCurrentUser() {
        return new Promise((resolve, reject) => {
            const resolveUser = (user, _resolve) => {
                user.save().then(() => {
                    group_membership_1.default.cacheKeys().then(() => {
                        _resolve(user);
                    });
                });
            };
            try {
                const user = this.currentUser();
                user.fetch().catch(() => {
                    // console.error('caught error', e);
                }).finally(() => {
                    // console.log(user.attrs);
                    const userData = helpers_1.loadUserData();
                    const { identityAddress, profile, appPrivateKey } = userData;
                    const publicKey = keys_1.getPublicKeyFromPrivate(appPrivateKey);
                    user.update({
                        identityAddress,
                        profile,
                        publicKey,
                    });
                    if (!user.attrs.personalSigningKeyId) {
                        user.createSigningKey().then((key) => {
                            helpers_1.addPersonalSigningKey(key);
                            resolveUser(user, resolve);
                        });
                    }
                    else {
                        signing_key_1.default.findById(user.attrs.personalSigningKeyId).then((key) => {
                            helpers_1.addPersonalSigningKey(key);
                            resolveUser(user, resolve);
                        });
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async sign() {
        this.attrs.signingKeyId = 'personal';
        const { appPrivateKey } = helpers_1.loadUserData();
        const contentToSign = [this._id];
        if (this.attrs.updatedAt) {
            contentToSign.push(this.attrs.updatedAt);
        }
        const { signature } = encryption_1.signECDSA(appPrivateKey, contentToSign.join('-'));
        this.attrs.radiksSignature = signature;
        return this;
    }
}
exports.default = BlockstackUser;
BlockstackUser.className = 'BlockstackUser';
BlockstackUser.schema = {
    identityAddress: {
        type: String,
        decrypted,
    },
    publicKey: {
        type: String,
        decrypted,
    },
    profile: {
        type: String,
        decrypted,
    },
    personalSigningKeyId: String,
};
