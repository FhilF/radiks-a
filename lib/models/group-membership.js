"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("../model");
const user_1 = require("./user");
const user_group_1 = require("./user-group");
const helpers_1 = require("../helpers");
const signing_key_1 = require("./signing-key");
class GroupMembership extends model_1.default {
    static async fetchUserGroups() {
        const { identityAddress } = helpers_1.loadUserData();
        const memberships = await GroupMembership.fetchList({
            identityAddress,
        });
        const signingKeys = {};
        memberships.forEach(({ attrs }) => {
            signingKeys[attrs.signingKeyId] = attrs.signingKeyPrivateKey;
        });
        const fetchAll = memberships.map(membership => membership.fetchUserGroupSigningKey());
        const userGroupList = await Promise.all(fetchAll);
        const userGroups = {};
        userGroupList.forEach((userGroup) => {
            userGroups[userGroup._id] = userGroup.signingKeyId;
        });
        return { userGroups, signingKeys };
    }
    static async cacheKeys() {
        const { userGroups, signingKeys } = await this.fetchUserGroups();
        const groupKeys = helpers_1.userGroupKeys();
        const self = await user_1.default.findById(helpers_1.loadUserData().identityAddress);
        const key = await signing_key_1.default.findById(self.attrs.personalSigningKeyId);
        groupKeys.personal = key.attrs;
        groupKeys.signingKeys = signingKeys;
        groupKeys.userGroups = userGroups;
        localStorage.setItem(helpers_1.GROUP_MEMBERSHIPS_STORAGE_KEY, JSON.stringify(groupKeys));
    }
    static async clearStorage() {
        helpers_1.clearStorage();
    }
    static userGroupKeys() {
        return helpers_1.userGroupKeys();
    }
    async encryptionPublicKey() {
        const user = await user_1.default.findById(this.attrs.identityAddress, { decrypt: false });
        const { publicKey } = user.attrs;
        return publicKey;
    }
    encryptionPrivateKey() {
        return helpers_1.loadUserData().appPrivateKey;
    }
    getSigningKey() {
        const { signingKeyId, signingKeyPrivateKey } = this.attrs;
        return {
            _id: signingKeyId,
            privateKey: signingKeyPrivateKey,
        };
    }
    async fetchUserGroupSigningKey() {
        const _id = this.attrs.userGroupId;
        const userGroup = await user_group_1.default.findById(_id);
        const { signingKeyId } = userGroup.attrs;
        return {
            _id,
            signingKeyId,
        };
    }
}
exports.default = GroupMembership;
GroupMembership.className = 'GroupMembership';
GroupMembership.schema = {
    userGroupId: String,
    identityAddress: {
        type: String,
        decrypted: true,
    },
    signingKeyPrivateKey: String,
    signingKeyId: String,
};
