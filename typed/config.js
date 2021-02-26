"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.configure = void 0;
let config = {
    apiServer: '',
    userSession: null,
};
const configure = (newConfig) => {
    config = {
        ...config,
        ...newConfig,
    };
};
exports.configure = configure;
/**
 * some info
 */
const getConfig = () => config;
exports.getConfig = getConfig;
