"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroyModel = exports.fetchCentral = exports.saveCentral = exports.count = exports.find = exports.sendNewGaiaUrl = void 0;
const qs_1 = require("qs");
const config_1 = require("./config");
const sendNewGaiaUrl = async (gaiaURL) => {
    const { apiServer } = config_1.getConfig();
    const url = `${apiServer}/radiks/models/crawl`;
    // console.log(url, gaiaURL);
    const data = { gaiaURL };
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: new Headers({
            'Content-Type': 'application/json',
        }),
    });
    const { success, message } = await response.json();
    if (!success) {
        throw new Error(`Error when saving model: '${message}'`);
    }
    return success;
};
exports.sendNewGaiaUrl = sendNewGaiaUrl;
const find = async (query) => {
    const { apiServer } = config_1.getConfig();
    const queryString = qs_1.stringify(query, { arrayFormat: 'brackets', encode: false });
    const url = `${apiServer}/radiks/models/find?${queryString}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
};
exports.find = find;
const count = async (query) => {
    const { apiServer } = config_1.getConfig();
    const queryString = qs_1.stringify(query, { arrayFormat: 'brackets', encode: false });
    const url = `${apiServer}/radiks/models/count?${queryString}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
};
exports.count = count;
const saveCentral = async (data) => {
    const { apiServer } = config_1.getConfig();
    const url = `${apiServer}/radiks/central`;
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: new Headers({
            'Content-Type': 'application/json',
        }),
    });
    const { success } = await response.json();
    return success;
};
exports.saveCentral = saveCentral;
const fetchCentral = async (key, username, signature) => {
    const { apiServer } = config_1.getConfig();
    const queryString = qs_1.stringify({ username, signature });
    const url = `${apiServer}/radiks/central/${key}?${queryString}`;
    const response = await fetch(url);
    const value = await response.json();
    return value;
};
exports.fetchCentral = fetchCentral;
const destroyModel = async (model) => {
    const { apiServer } = config_1.getConfig();
    const queryString = qs_1.stringify({ signature: model.attrs.radiksSignature });
    const url = `${apiServer}/radiks/models/${model._id}?${queryString}`;
    const response = await fetch(url, {
        method: 'DELETE',
    });
    const data = await response.json();
    return data.success;
};
exports.destroyModel = destroyModel;
