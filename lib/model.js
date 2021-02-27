"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import uuid from 'uuid/v4';
const keys_1 = require("blockstack/lib/keys");
const encryption_1 = require("blockstack/lib/encryption");
const wolfy87_eventemitter_1 = require("wolfy87-eventemitter");
const helpers_1 = require("./helpers");
const api_1 = require("./api");
const streamer_1 = require("./streamer");
const EVENT_NAME = 'MODEL_STREAM_EVENT';
/* eslint @typescript-eslint/no-var-requires: "off" */
const { v4: uuidv4 } = require('uuid');
class Model {
    constructor(attrs = {}) {
        const { schema, defaults } = this.constructor;
        const name = this.modelName();
        this.schema = schema;
        this._id = attrs._id || uuidv4().replace('-', '');
        this.attrs = {
            ...defaults,
            ...attrs,
            radiksType: name,
        };
    }
    static fromSchema(schema) {
        this.schema = schema;
        return this;
    }
    static async fetchList(_selector = {}, { decrypt = true } = {}) {
        const selector = {
            ..._selector,
            radiksType: this.modelName(),
        };
        const { results } = await api_1.find(selector);
        const Clazz = this;
        const modelDecryptions = results.map((doc) => {
            const model = new Clazz(doc);
            if (decrypt) {
                return model.decrypt();
            }
            return Promise.resolve(model);
        });
        const models = await Promise.all(modelDecryptions);
        return models;
    }
    static async findOne(_selector = {}, options = { decrypt: true }) {
        const selector = {
            ..._selector,
            limit: 1,
        };
        const results = await this.fetchList(selector, options);
        return results[0];
    }
    static async findById(_id, fetchOptions) {
        const Clazz = this;
        const model = new Clazz({ _id });
        return model.fetch(fetchOptions);
    }
    static async count(_selector = {}) {
        const selector = {
            ..._selector,
            radiksType: this.modelName(),
        };
        const data = await api_1.count(selector);
        return data.total;
    }
    /**
     * Fetch all models that are owned by the current user.
     * This only includes 'personally' owned models, and not those created
     * as part of a UserGroup
     *
     * @param {Object} _selector - A query to include when fetching models
     */
    static fetchOwnList(_selector = {}) {
        const { _id } = helpers_1.userGroupKeys().personal;
        const selector = {
            ..._selector,
            signingKeyId: _id,
        };
        return this.fetchList(selector);
    }
    async save() {
        return new Promise(async (resolve, reject) => {
            try {
                if (this.beforeSave) {
                    await this.beforeSave();
                }
                const now = new Date().getTime();
                this.attrs.createdAt = this.attrs.createdAt || now;
                this.attrs.updatedAt = now;
                await this.sign();
                const encrypted = await this.encrypted();
                const gaiaURL = await this.saveFile(encrypted);
                await api_1.sendNewGaiaUrl(gaiaURL);
                resolve(this);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    encrypted() {
        return helpers_1.encryptObject(this);
    }
    saveFile(encrypted) {
        const storage = helpers_1.requireStorage();
        return storage.putFile(this.blockstackPath(), JSON.stringify(encrypted), {
            encrypt: false,
            // dangerouslyIgnoreEtag: true,
        });
    }
    deleteFile() {
        const storage = helpers_1.requireStorage();
        return storage.deleteFile(this.blockstackPath());
    }
    blockstackPath() {
        const path = `${this.modelName()}/${this._id}`;
        return path;
    }
    async fetch({ decrypt = true } = {}) {
        const query = {
            _id: this._id,
        };
        const { results } = await api_1.find(query);
        const [attrs] = results;
        // Object not found on the server so we return undefined
        if (!attrs) {
            return undefined;
        }
        this.attrs = {
            ...this.attrs,
            ...attrs,
        };
        if (decrypt) {
            await this.decrypt();
        }
        await this.afterFetch();
        return this;
    }
    async decrypt() {
        this.attrs = await helpers_1.decryptObject(this.attrs, this);
        return this;
    }
    update(attrs) {
        this.attrs = {
            ...this.attrs,
            ...attrs,
        };
    }
    async sign() {
        if (this.attrs.updatable === false) {
            return true;
        }
        const signingKey = this.getSigningKey();
        this.attrs.signingKeyId = this.attrs.signingKeyId || signingKey._id;
        const { privateKey } = signingKey;
        const contentToSign = [this._id];
        if (this.attrs.updatedAt) {
            contentToSign.push(this.attrs.updatedAt);
        }
        const { signature } = encryption_1.signECDSA(privateKey, contentToSign.join('-'));
        this.attrs.radiksSignature = signature;
        return this;
    }
    getSigningKey() {
        if (this.attrs.userGroupId) {
            const { userGroups, signingKeys } = helpers_1.userGroupKeys();
            const _id = userGroups[this.attrs.userGroupId];
            const privateKey = signingKeys[_id];
            return {
                _id,
                privateKey,
            };
        }
        return helpers_1.userGroupKeys().personal;
    }
    async encryptionPublicKey() {
        return keys_1.getPublicKeyFromPrivate(this.encryptionPrivateKey());
    }
    encryptionPrivateKey() {
        let privateKey;
        if (this.attrs.userGroupId) {
            const { userGroups, signingKeys } = helpers_1.userGroupKeys();
            privateKey = signingKeys[userGroups[this.attrs.userGroupId]];
        }
        else {
            privateKey = helpers_1.requireUserSession().loadUserData().appPrivateKey;
        }
        return privateKey;
    }
    static modelName() {
        return this.className || this.name;
    }
    modelName() {
        const { modelName } = this.constructor;
        return modelName.apply(this.constructor);
    }
    isOwnedByUser() {
        const keys = helpers_1.userGroupKeys();
        if (this.attrs.signingKeyId === keys.personal._id) {
            return true;
        }
        if (this.attrs.userGroupId) {
            let isOwned = false;
            Object.keys(keys.userGroups).forEach((groupId) => {
                if (groupId === this.attrs.userGroupId) {
                    isOwned = true;
                }
            });
            return isOwned;
        }
        return false;
    }
    static addStreamListener(callback) {
        if (!this.emitter) {
            this.emitter = new wolfy87_eventemitter_1.default();
        }
        if (this.emitter.getListeners().length === 0) {
            streamer_1.default.addListener((args) => {
                this.onStreamEvent(this, args);
            });
        }
        this.emitter.addListener(EVENT_NAME, callback);
    }
    static removeStreamListener(callback) {
        this.emitter.removeListener(EVENT_NAME, callback);
        if (this.emitter.getListeners().length === 0) {
            streamer_1.default.removeListener(this.onStreamEvent);
        }
    }
    async destroy() {
        await this.sign();
        await this.deleteFile();
        return api_1.destroyModel(this);
    }
    // @abstract
    beforeSave() { }
    // @abstract
    afterFetch() { }
}
exports.default = Model;
Model.defaults = {};
Model.onStreamEvent = (_this, [event]) => {
    try {
        const { data } = event;
        const attrs = JSON.parse(data);
        if (attrs && attrs.radiksType === _this.modelName()) {
            const model = new _this(attrs);
            if (model.isOwnedByUser()) {
                model.decrypt().then(() => {
                    _this.emitter.emit(EVENT_NAME, model);
                });
            }
            else {
                _this.emitter.emit(EVENT_NAME, model);
            }
        }
    }
    catch (error) {
        // console.error(error.message);
    }
};
