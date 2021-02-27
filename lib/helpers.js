"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadUserData = exports.requireStorage = exports.requireUserSession = exports.addUserGroupKey = exports.addPersonalSigningKey = exports.userGroupKeys = exports.clearStorage = exports.encryptObject = exports.decryptObject = exports.GROUP_MEMBERSHIPS_STORAGE_KEY = void 0;
const encryption_1 = require("@stacks/encryption");
const config_1 = require("./config");
exports.GROUP_MEMBERSHIPS_STORAGE_KEY = 'GROUP_MEMBERSHIPS_STORAGE_KEY';
const crypto = require('crypto');
const valueToString = (value, clazz) => {
    if (clazz === Boolean) {
        return value ? 'true' : 'false';
    }
    if (clazz === Number) {
        return String(value);
    }
    if (clazz === Array || clazz === Object) {
        return JSON.stringify(value);
    }
    return value;
};
const stringToValue = (value, clazz) => {
    if (clazz === Boolean) {
        return value === 'true';
    }
    if (clazz === Number) {
        return parseFloat(value);
    }
    if (clazz === Array || clazz === Object) {
        return JSON.parse(value);
    }
    return value;
};
const decryptObject = async (encrypted, model) => {
    const privateKey = await model.encryptionPrivateKey();
    const decrypted = {
        ...encrypted,
    };
    const { schema } = model;
    Object.keys(encrypted).forEach((key) => {
        const value = encrypted[key];
        const schemaValue = schema[key];
        let clazz = schemaValue;
        const schemaAttribute = schema[key];
        if (schemaAttribute && schemaAttribute.type) {
            clazz = schemaAttribute.type;
        }
        if (clazz && schemaAttribute && !schemaAttribute.decrypted) {
            try {
                const decryptedValue = encryption_1.decryptECIES(privateKey, value);
                decrypted[key] = stringToValue(decryptedValue, clazz);
            }
            catch (error) {
                console.debug(`Decryption error for key: '${key}': ${error.message}`); // eslint-disable-line
                decrypted[key] = value;
            }
        }
    });
    return decrypted;
};
exports.decryptObject = decryptObject;
const encryptObject = async (model) => {
    const publicKey = await model.encryptionPublicKey();
    const object = model.attrs;
    const encrypted = {
        ...object,
        _id: model._id,
    };
    Object.keys(model.schema).forEach((key) => {
        const schemaValue = model.schema[key];
        const schemaAttribute = model.schema[key];
        const value = object[key];
        let clazz = schemaValue;
        if (typeof value === 'undefined')
            return;
        if (schemaAttribute.type) {
            clazz = schemaAttribute.type;
        }
        if (schemaAttribute.decrypted) {
            encrypted[key] = value;
            return;
        }
        const stringValue = valueToString(value, clazz);
        const keyData = {
            iv: crypto.randomBytes(16),
            key: crypto.randomBytes(32),
        };
        const cipher = crypto.createCipheriv('aes-256-cbc', keyData.key, keyData.iv);
        const cipherText = cipher.update('test.json', 'utf-8', 'hex') + cipher.final('hex');
        // @ts-ignore
        encrypted[key] = encryption_1.encryptECIES(publicKey, stringValue, true, cipherText);
        ;
    });
    return encrypted;
};
exports.encryptObject = encryptObject;
const clearStorage = () => {
    localStorage.removeItem(exports.GROUP_MEMBERSHIPS_STORAGE_KEY);
};
exports.clearStorage = clearStorage;
const userGroupKeys = () => {
    const keysString = localStorage.getItem(exports.GROUP_MEMBERSHIPS_STORAGE_KEY);
    let keys = keysString ? JSON.parse(keysString) : {};
    keys = {
        userGroups: {},
        signingKeys: {},
        personal: {},
        ...keys,
    };
    return keys;
};
exports.userGroupKeys = userGroupKeys;
const addPersonalSigningKey = (signingKey) => {
    const keys = exports.userGroupKeys();
    keys.personal = {
        _id: signingKey._id,
        ...signingKey.attrs,
    };
    localStorage.setItem(exports.GROUP_MEMBERSHIPS_STORAGE_KEY, JSON.stringify(keys));
};
exports.addPersonalSigningKey = addPersonalSigningKey;
const addUserGroupKey = (userGroup) => {
    const keys = exports.userGroupKeys();
    keys.userGroups[userGroup._id] = userGroup.attrs.signingKeyId;
    keys.signingKeys[userGroup.attrs.signingKeyId] = userGroup.privateKey;
    localStorage.setItem(exports.GROUP_MEMBERSHIPS_STORAGE_KEY, JSON.stringify(keys));
};
exports.addUserGroupKey = addUserGroupKey;
const requireUserSession = () => {
    const { userSession } = config_1.getConfig();
    if (!userSession) {
        // TODO: link to docs
        throw new Error('You have not properly configured your UserSession.');
    }
    return userSession;
};
exports.requireUserSession = requireUserSession;
const requireStorage = () => {
    const { storage } = config_1.getConfig();
    if (!storage) {
        // TODO: link to docs
        throw new Error('You have not properly configured your Storage.');
    }
    return storage;
};
exports.requireStorage = requireStorage;
const loadUserData = () => {
    const { userSession } = config_1.getConfig();
    if (userSession) {
        return userSession.loadUserData();
    }
    return null;
};
exports.loadUserData = loadUserData;
